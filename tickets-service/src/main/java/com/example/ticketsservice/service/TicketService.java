package com.example.ticketsservice.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.ticketsservice.config.RabbitMQConfig;
import com.example.ticketsservice.controller.NotificationController;
import com.example.ticketsservice.dto.QrValidationResponse;
import com.example.ticketsservice.dto.TicketPurchaseRequest;
import com.example.ticketsservice.dto.TicketStatsResponse;
import com.example.ticketsservice.dto.ValidationStatsResponse;
import com.example.ticketsservice.event.TicketPurchasedEvent;
import com.example.ticketsservice.exception.DuplicateTicketException;
import com.example.ticketsservice.exception.InsufficientFundsException;
import com.example.ticketsservice.exception.InvalidTicketException;
import com.example.ticketsservice.exception.TicketNotFoundException;
import com.example.ticketsservice.model.Refund;
import com.example.ticketsservice.model.Ticket;
import com.example.ticketsservice.model.TransferHistory;
import com.example.ticketsservice.model.User;
import com.example.ticketsservice.repository.RefundRepository;
import com.example.ticketsservice.repository.TicketRepository;
import com.example.ticketsservice.repository.TransferHistoryRepository;
import com.example.ticketsservice.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final TransferHistoryRepository transferHistoryRepository;
    private final RefundRepository refundRepository;
    private final RabbitTemplate rabbitTemplate;
    private final NotificationController notificationController;
    private final BarcodeService barcodeService;

    private static final Logger log = LoggerFactory.getLogger(TicketService.class);

    @Transactional
    public Ticket purchaseTicket(TicketPurchaseRequest request) {
        validatePurchaseRequest(request);
        checkForDuplicateValidTicket(request.getUserId(), request.getTicketType());
        validatePayment(request);

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new TicketNotFoundException("Utilisateur non trouvé avec l'ID : " + request.getUserId()));

        Ticket newTicket = new Ticket();
        newTicket.setUserId(request.getUserId());
        newTicket.setTicketType(request.getTicketType());
        newTicket.setStatus("VALIDE");
        newTicket.setPurchaseDate(LocalDateTime.now());

        // Generate unique code first
        String uniqueCode = UUID.randomUUID().toString();

        // Save ticket to get the ID
        Ticket savedTicket = ticketRepository.save(newTicket);

        // Generate QR code data with all ticket information
        String qrCodeData = barcodeService.generateQrCodeData(
            savedTicket.getId(),
            savedTicket.getUserId(),
            savedTicket.getTicketType(),
            savedTicket.getPurchaseDate(),
            uniqueCode
        );

        // Generate QR code image
        String qrCodeImage = null;
        try {
            qrCodeImage = barcodeService.generateQrCodeImageBase64(qrCodeData);
        } catch (Exception e) {
            log.error("Error generating QR code image: {}", e.getMessage());
        }

        // Update ticket with QR code data and image
        savedTicket.setQrCodeData(qrCodeData);
        savedTicket.setQrCodeImage(qrCodeImage);
        savedTicket = ticketRepository.save(savedTicket);

        try {
            TicketPurchasedEvent event = TicketPurchasedEvent.builder()
                    .userId(savedTicket.getUserId().toString())
                    .userEmail(user.getEmail())
                    .ticketId(savedTicket.getId().toString())
                    .ticketType(savedTicket.getTicketType())
                    .purchaseDate(savedTicket.getPurchaseDate().toString())
                    .qrCodeData(savedTicket.getQrCodeData())
                    .qrCodeImage(savedTicket.getQrCodeImage())
                    .build();

            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "ticket.purchased", event);
            log.info("Événement ticket.purchased publié pour le ticket {}", savedTicket.getId());

        } catch (Exception e) {
            log.error("Échec de la publication de l'événement ticket.purchased pour le ticket {}: {}", savedTicket.getId(), e.getMessage());
        }

        // Send WebSocket notification
        try {
            notificationController.notifyTicketPurchased(savedTicket.getUserId(), savedTicket.getId(), savedTicket.getTicketType());
        } catch (Exception e) {
            log.error("Échec de l'envoi de la notification pour le ticket {}: {}", savedTicket.getId(), e.getMessage());
        }

        return savedTicket;
    }

    public List<Ticket> getTicketHistory(Long userId) {
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("L'ID utilisateur est invalide");
        }

        List<Ticket> tickets = ticketRepository.findByUserId(userId);
        if (tickets.isEmpty()) {
            throw new TicketNotFoundException("Aucun ticket trouvé pour l'utilisateur avec l'ID : " + userId);
        }

        return tickets;
    }

    public TicketStatsResponse getTicketStats(Long userId) {
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("L'ID utilisateur est invalide");
        }

        List<Ticket> tickets = ticketRepository.findByUserId(userId);

        long totalPurchased = tickets.size();
        long activeTickets = tickets.stream()
                .filter(t -> "VALIDE".equals(t.getStatus()) && t.getValidationDate() == null)
                .count();
        long usedTickets = tickets.stream()
                .filter(t -> t.getValidationDate() != null)
                .count();

        return new TicketStatsResponse(totalPurchased, activeTickets, usedTickets);
    }

    public Ticket getTicketById(Long ticketId) {
        if (ticketId == null || ticketId <= 0) {
            throw new IllegalArgumentException("L'ID du ticket est invalide");
        }

        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket non trouvé avec l'id : " + ticketId));
    }

    @Transactional
    public Ticket validateTicket(Long ticketId) {
        Ticket ticket = getTicketById(ticketId);

        if (!"VALIDE".equals(ticket.getStatus())) {
            throw new InvalidTicketException("Le ticket n'est plus valide");
        }

        if (ticket.getValidationDate() != null) {
            throw new InvalidTicketException("Le ticket a déjà été validé");
        }

        ticket.setValidationDate(LocalDateTime.now());

        Ticket savedTicket = ticketRepository.save(ticket);

        // Send WebSocket notification
        try {
            notificationController.notifyTicketValidated(savedTicket.getUserId(), savedTicket.getId());
        } catch (Exception e) {
            log.error("Échec de l'envoi de la notification de validation pour le ticket {}: {}", savedTicket.getId(), e.getMessage());
        }

        return savedTicket;
    }

    @Transactional
    public Ticket cancelTicket(Long ticketId) {
        Ticket ticket = getTicketById(ticketId);

        if (!"VALIDE".equals(ticket.getStatus())) {
            throw new InvalidTicketException("Seuls les tickets valides peuvent être annulés");
        }

        if (ticket.getValidationDate() != null) {
            throw new InvalidTicketException("Impossible d'annuler un ticket déjà validé");
        }

        ticket.setStatus("ANNULE");
        return ticketRepository.save(ticket);
    }

    @Transactional
    public QrValidationResponse validateByQrCode(String qrCode) {
        // Find ticket by QR code
        Ticket ticket = ticketRepository.findByQrCodeData(qrCode)
                .orElse(null);

        if (ticket == null) {
            // Try to decode QR code data in case it's JSON formatted
            try {
                var qrData = barcodeService.decodeQrCodeData(qrCode);
                String ticketId = (String) qrData.get("ticketId");
                if (ticketId != null) {
                    ticket = ticketRepository.findById(Long.parseLong(ticketId)).orElse(null);
                }
            } catch (Exception e) {
                log.error("Error decoding QR code: {}", e.getMessage());
            }
        }

        if (ticket == null) {
            return QrValidationResponse.builder()
                    .valid(false)
                    .message("QR Code invalide - Ticket non trouvé")
                    .build();
        }

        // Get owner information
        User user = userRepository.findById(ticket.getUserId()).orElse(null);
        String ownerName = user != null ? user.getFirstName() + " " + user.getLastName() : "Utilisateur inconnu";
        String ownerEmail = user != null ? user.getEmail() : null;

        // Check if ticket is cancelled
        if ("ANNULE".equals(ticket.getStatus())) {
            return QrValidationResponse.builder()
                    .valid(false)
                    .message("Ce ticket a été annulé")
                    .ticketId(ticket.getId())
                    .userId(ticket.getUserId())
                    .ticketType(ticket.getTicketType())
                    .status(ticket.getStatus())
                    .purchaseDate(ticket.getPurchaseDate().toString())
                    .validationDate(ticket.getValidationDate() != null ? ticket.getValidationDate().toString() : null)
                    .ownerName(ownerName)
                    .ownerEmail(ownerEmail)
                    .qrCodeImage(ticket.getQrCodeImage())
                    .build();
        }

        // Check if ticket is already used (for SIMPLE tickets)
        if (ticket.getValidationDate() != null && "SIMPLE".equals(ticket.getTicketType())) {
            return QrValidationResponse.builder()
                    .valid(false)
                    .message("Ce ticket a déjà été utilisé")
                    .ticketId(ticket.getId())
                    .userId(ticket.getUserId())
                    .ticketType(ticket.getTicketType())
                    .status("UTILISE")
                    .purchaseDate(ticket.getPurchaseDate().toString())
                    .validationDate(ticket.getValidationDate().toString())
                    .ownerName(ownerName)
                    .ownerEmail(ownerEmail)
                    .qrCodeImage(ticket.getQrCodeImage())
                    .build();
        }

        // Check expiration based on ticket type
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime purchaseDate = ticket.getPurchaseDate();
        LocalDateTime expirationDate;
        boolean isExpired = false;

        switch (ticket.getTicketType().toUpperCase()) {
            case "SIMPLE":
                // Valid for 2 hours after purchase
                expirationDate = purchaseDate.plusHours(2);
                isExpired = now.isAfter(expirationDate);
                break;
            case "JOURNEE":
                // Valid until end of purchase day
                expirationDate = purchaseDate.toLocalDate().atTime(23, 59, 59);
                isExpired = now.isAfter(expirationDate);
                break;
            case "HEBDO":
                // Valid for 7 days
                expirationDate = purchaseDate.plusDays(7);
                isExpired = now.isAfter(expirationDate);
                break;
            case "MENSUEL":
                // Valid for 30 days
                expirationDate = purchaseDate.plusDays(30);
                isExpired = now.isAfter(expirationDate);
                break;
            default:
                expirationDate = purchaseDate.plusDays(1);
                isExpired = now.isAfter(expirationDate);
        }

        if (isExpired) {
            ticket.setStatus("EXPIRE");
            ticketRepository.save(ticket);

            return QrValidationResponse.builder()
                    .valid(false)
                    .message("Ce ticket a expiré")
                    .ticketId(ticket.getId())
                    .userId(ticket.getUserId())
                    .ticketType(ticket.getTicketType())
                    .status("EXPIRE")
                    .purchaseDate(purchaseDate.toString())
                    .validationDate(ticket.getValidationDate() != null ? ticket.getValidationDate().toString() : null)
                    .expirationDate(expirationDate.toString())
                    .ownerName(ownerName)
                    .ownerEmail(ownerEmail)
                    .qrCodeImage(ticket.getQrCodeImage())
                    .build();
        }

        // Mark as validated for SIMPLE tickets
        if ("SIMPLE".equals(ticket.getTicketType()) && ticket.getValidationDate() == null) {
            ticket.setValidationDate(now);
            ticketRepository.save(ticket);
        }

        return QrValidationResponse.builder()
                .valid(true)
                .message("Ticket valide - Bon voyage!")
                .ticketId(ticket.getId())
                .userId(ticket.getUserId())
                .ticketType(ticket.getTicketType())
                .status(ticket.getStatus())
                .purchaseDate(purchaseDate.toString())
                .validationDate(ticket.getValidationDate() != null ? ticket.getValidationDate().toString() : null)
                .expirationDate(expirationDate.toString())
                .ownerName(ownerName)
                .ownerEmail(ownerEmail)
                .ownerPhone(ownerPhone)
                .qrCodeImage(ticket.getQrCodeImage())
                .build();
    }

    private void validatePurchaseRequest(TicketPurchaseRequest request) {
        if (request.getUserId() == null || request.getUserId() <= 0) {
            throw new IllegalArgumentException("L'ID utilisateur est requis et doit être positif");
        }

        if (request.getTicketType() == null || request.getTicketType().trim().isEmpty()) {
            throw new IllegalArgumentException("Le type de ticket est requis");
        }

        List<String> validTicketTypes = List.of("SIMPLE", "JOURNEE", "HEBDO", "MENSUEL");
        if (!validTicketTypes.contains(request.getTicketType().toUpperCase())) {
            throw new InvalidTicketException("Type de ticket non valide. Types autorisés: " + validTicketTypes);
        }
    }

    private void checkForDuplicateValidTicket(Long userId, String ticketType) {
        List<Ticket> userTickets = ticketRepository.findByUserIdAndTicketType(userId, ticketType);

        boolean hasValidTicket = userTickets.stream()
                .anyMatch(ticket -> "VALIDE".equals(ticket.getStatus()) && ticket.getValidationDate() == null);

        if (hasValidTicket) {
            throw new DuplicateTicketException(
                    "L'utilisateur possède déjà un ticket valide de type: " + ticketType
            );
        }
    }

    private void validatePayment(TicketPurchaseRequest request) {
        double ticketPrice = calculateTicketPrice(request.getTicketType());
        double userBalance = getUserBalance(request.getUserId());

        if (userBalance < ticketPrice) {
            throw new InsufficientFundsException(
                    "Solde insuffisant. Prix du ticket: " + ticketPrice + ", Solde disponible: " + userBalance
            );
        }
    }

    private double calculateTicketPrice(String ticketType) {
        return switch (ticketType.toUpperCase()) {
            case "SIMPLE" -> 2.0;
            case "JOURNEE" -> 5.0;
            case "HEBDO" -> 15.0;
            case "MENSUEL" -> 50.0;
            default -> throw new InvalidTicketException("Type de ticket non supporté: " + ticketType);
        };
    }

    private double getUserBalance(Long userId) {
        return 100.0;
    }

    private String generateUniqueQrCode() {
        String qrCode;
        boolean isUnique;

        do {
            qrCode = "TICKET-" + UUID.randomUUID().toString();
            Optional<Ticket> existingTicket = ticketRepository.findByQrCodeData(qrCode);
            isUnique = existingTicket.isEmpty();
        } while (!isUnique);

        return qrCode;
    }

    // Controller dashboard methods

    public ValidationStatsResponse getValidationStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        LocalDateTime startOfWeek = now.minusDays(7);
        LocalDateTime startOfMonth = now.minusDays(30);

        // Count tickets that have been validated (have a validationDate)
        long validationsToday = ticketRepository.countByStatusAndValidationDateAfter("VALIDE", startOfDay);
        long validationsThisWeek = ticketRepository.countByStatusAndValidationDateAfter("VALIDE", startOfWeek);
        long validationsThisMonth = ticketRepository.countByStatusAndValidationDateAfter("VALIDE", startOfMonth);

        // Also count tickets with validationDate set (used tickets)
        List<Ticket> allTickets = ticketRepository.findAll();
        long totalValidated = allTickets.stream()
                .filter(t -> t.getValidationDate() != null)
                .count();

        long validTickets = allTickets.stream()
                .filter(t -> "VALIDE".equals(t.getStatus()))
                .count();

        long invalidTickets = allTickets.stream()
                .filter(t -> "ANNULE".equals(t.getStatus()) || "EXPIRE".equals(t.getStatus()))
                .count();

        return ValidationStatsResponse.builder()
                .validationsToday(validationsToday)
                .validationsThisWeek(validationsThisWeek)
                .validationsThisMonth(validationsThisMonth)
                .totalValidations(totalValidated)
                .validTickets(validTickets)
                .invalidTickets(invalidTickets)
                .build();
    }

    public List<Ticket> getValidationHistory() {
        // Get all tickets that have been validated, ordered by validation date
        return ticketRepository.findAll().stream()
                .filter(t -> t.getValidationDate() != null)
                .sorted((a, b) -> b.getValidationDate().compareTo(a.getValidationDate()))
                .limit(100)
                .toList();
    }

    @Transactional
    public Ticket transferTicket(Long ticketId, Long fromUserId, String recipientEmail) {
        // Find the ticket
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket non trouvé avec l'ID: " + ticketId));

        // Verify ownership
        if (!ticket.getUserId().equals(fromUserId)) {
            throw new InvalidTicketException("Vous n'êtes pas propriétaire de ce ticket");
        }

        // Check if ticket is valid for transfer
        if (!"VALIDE".equals(ticket.getStatus())) {
            throw new InvalidTicketException("Seuls les tickets valides peuvent être transférés");
        }

        if (ticket.getValidationDate() != null) {
            throw new InvalidTicketException("Les tickets déjà utilisés ne peuvent pas être transférés");
        }

        // Find recipient user
        User recipient = userRepository.findByEmail(recipientEmail)
                .orElseThrow(() -> new TicketNotFoundException("Aucun utilisateur trouvé avec l'email: " + recipientEmail));

        // Check not transferring to self
        if (recipient.getId().equals(fromUserId)) {
            throw new InvalidTicketException("Vous ne pouvez pas transférer un ticket à vous-même");
        }

        // Get sender info
        User sender = userRepository.findById(fromUserId)
                .orElseThrow(() -> new TicketNotFoundException("Expéditeur non trouvé"));

        // Perform transfer
        log.info("Transfert du ticket {} de l'utilisateur {} vers {}", ticketId, fromUserId, recipientEmail);
        ticket.setUserId(recipient.getId());
        Ticket savedTicket = ticketRepository.save(ticket);

        // Save transfer history
        TransferHistory history = TransferHistory.builder()
                .ticketId(ticketId)
                .fromUserId(fromUserId)
                .fromUserEmail(sender.getEmail())
                .toUserId(recipient.getId())
                .toUserEmail(recipientEmail)
                .ticketType(ticket.getTicketType())
                .transferDate(LocalDateTime.now())
                .status("COMPLETED")
                .build();
        transferHistoryRepository.save(history);

        log.info("Historique de transfert enregistré pour le ticket {}", ticketId);

        // Send WebSocket notifications
        try {
            notificationController.notifyTicketTransferred(fromUserId, recipient.getId(), ticketId, ticket.getTicketType());
        } catch (Exception e) {
            log.error("Échec de l'envoi des notifications de transfert pour le ticket {}: {}", ticketId, e.getMessage());
        }

        return savedTicket;
    }

    // Transfer history methods

    public List<TransferHistory> getTransferHistoryByUser(Long userId) {
        return transferHistoryRepository.findAllByUserId(userId);
    }

    public List<TransferHistory> getTransferHistorySent(Long userId) {
        return transferHistoryRepository.findByFromUserIdOrderByTransferDateDesc(userId);
    }

    public List<TransferHistory> getTransferHistoryReceived(Long userId) {
        return transferHistoryRepository.findByToUserIdOrderByTransferDateDesc(userId);
    }

    public List<TransferHistory> getTransferHistoryByTicket(Long ticketId) {
        return transferHistoryRepository.findByTicketIdOrderByTransferDateDesc(ticketId);
    }

    // Refund methods

    @Transactional
    public Refund requestRefund(Long ticketId, Long userId, String reason) {
        // Find the ticket
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket non trouvé avec l'ID: " + ticketId));

        // Verify ownership
        if (!ticket.getUserId().equals(userId)) {
            throw new InvalidTicketException("Vous n'êtes pas propriétaire de ce ticket");
        }

        // Check if already refunded or pending
        if (refundRepository.existsByTicketIdAndStatusIn(ticketId, List.of("PENDING", "APPROVED", "COMPLETED"))) {
            throw new InvalidTicketException("Une demande de remboursement existe déjà pour ce ticket");
        }

        // Check if ticket can be refunded (not used)
        if (ticket.getValidationDate() != null) {
            throw new InvalidTicketException("Les tickets déjà utilisés ne peuvent pas être remboursés");
        }

        // Calculate refund amount (full refund if not used)
        double originalAmount = calculateTicketPrice(ticket.getTicketType());
        double refundAmount = originalAmount; // 100% refund for unused tickets

        // Create refund request
        Refund refund = Refund.builder()
                .ticketId(ticketId)
                .userId(userId)
                .ticketType(ticket.getTicketType())
                .originalAmount(originalAmount)
                .refundAmount(refundAmount)
                .reason(reason)
                .status("PENDING")
                .requestDate(LocalDateTime.now())
                .build();

        Refund savedRefund = refundRepository.save(refund);

        // Mark ticket as cancelled
        ticket.setStatus("ANNULE");
        ticketRepository.save(ticket);

        log.info("Demande de remboursement créée pour le ticket {}", ticketId);

        return savedRefund;
    }

    public List<Refund> getRefundsByUser(Long userId) {
        return refundRepository.findByUserIdOrderByRequestDateDesc(userId);
    }

    public List<Refund> getPendingRefunds() {
        return refundRepository.findByStatusOrderByRequestDateDesc("PENDING");
    }

    @Transactional
    public Refund processRefund(Long refundId, boolean approved, String adminNotes) {
        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new TicketNotFoundException("Demande de remboursement non trouvée"));

        if (!"PENDING".equals(refund.getStatus())) {
            throw new InvalidTicketException("Cette demande a déjà été traitée");
        }

        refund.setStatus(approved ? "COMPLETED" : "REJECTED");
        refund.setProcessedDate(LocalDateTime.now());
        refund.setAdminNotes(adminNotes);

        if (!approved) {
            // Restore ticket if rejected
            Ticket ticket = ticketRepository.findById(refund.getTicketId()).orElse(null);
            if (ticket != null) {
                ticket.setStatus("VALIDE");
                ticketRepository.save(ticket);
            }
        }

        log.info("Remboursement {} - Statut: {}", refundId, refund.getStatus());

        Refund savedRefund = refundRepository.save(refund);

        // Send WebSocket notification
        try {
            String message = approved
                ? "Votre remboursement de " + refund.getRefundAmount() + "€ a été approuvé"
                : "Votre demande de remboursement a été refusée. " + (adminNotes != null ? adminNotes : "");
            notificationController.notifyRefundStatus(refund.getUserId(), refund.getTicketId(), refund.getStatus(), message);
        } catch (Exception e) {
            log.error("Échec de l'envoi de la notification de remboursement {}: {}", refundId, e.getMessage());
        }

        return savedRefund;
    }
}