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
import com.example.ticketsservice.dto.QrValidationResponse;
import com.example.ticketsservice.dto.TicketPurchaseRequest;
import com.example.ticketsservice.dto.TicketStatsResponse;
import com.example.ticketsservice.event.TicketPurchasedEvent;
import com.example.ticketsservice.exception.DuplicateTicketException;
import com.example.ticketsservice.exception.InsufficientFundsException;
import com.example.ticketsservice.exception.InvalidTicketException;
import com.example.ticketsservice.exception.TicketNotFoundException;
import com.example.ticketsservice.model.Ticket;
import com.example.ticketsservice.model.User;
import com.example.ticketsservice.repository.TicketRepository;
import com.example.ticketsservice.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final RabbitTemplate rabbitTemplate;

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
        newTicket.setQrCodeData(generateUniqueQrCode());

        Ticket savedTicket = ticketRepository.save(newTicket);

        try {
            TicketPurchasedEvent event = TicketPurchasedEvent.builder()
                    .userId(savedTicket.getUserId().toString())
                    .userEmail(user.getEmail())
                    .ticketId(savedTicket.getId().toString())
                    .ticketType(savedTicket.getTicketType())
                    .purchaseDate(savedTicket.getPurchaseDate().toString())
                    .qrCodeData(savedTicket.getQrCodeData())
                    .build();

            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "ticket.purchased", event);
            log.info("Événement ticket.purchased publié pour le ticket {}", savedTicket.getId());

        } catch (Exception e) {
            log.error("Échec de la publication de l'événement ticket.purchased pour le ticket {}: {}", savedTicket.getId(), e.getMessage());
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

        return ticketRepository.save(ticket);
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
            return QrValidationResponse.builder()
                    .valid(false)
                    .message("QR Code invalide - Ticket non trouvé")
                    .build();
        }

        // Check if ticket is cancelled
        if ("ANNULE".equals(ticket.getStatus())) {
            return QrValidationResponse.builder()
                    .valid(false)
                    .message("Ce ticket a été annulé")
                    .ticketType(ticket.getTicketType())
                    .status(ticket.getStatus())
                    .purchaseDate(ticket.getPurchaseDate().toString())
                    .build();
        }

        // Check if ticket is already used (for SIMPLE tickets)
        if (ticket.getValidationDate() != null && "SIMPLE".equals(ticket.getTicketType())) {
            return QrValidationResponse.builder()
                    .valid(false)
                    .message("Ce ticket a déjà été utilisé")
                    .ticketType(ticket.getTicketType())
                    .status("UTILISE")
                    .purchaseDate(ticket.getPurchaseDate().toString())
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
                    .ticketType(ticket.getTicketType())
                    .status("EXPIRE")
                    .purchaseDate(purchaseDate.toString())
                    .expirationDate(expirationDate.toString())
                    .build();
        }

        // Mark as validated for SIMPLE tickets
        if ("SIMPLE".equals(ticket.getTicketType()) && ticket.getValidationDate() == null) {
            ticket.setValidationDate(now);
            ticketRepository.save(ticket);
        }

        // Get owner name
        User user = userRepository.findById(ticket.getUserId()).orElse(null);
        String ownerName = user != null ? user.getFirstName() + " " + user.getLastName() : "Utilisateur inconnu";

        return QrValidationResponse.builder()
                .valid(true)
                .message("Ticket valide - Bon voyage!")
                .ticketType(ticket.getTicketType())
                .status(ticket.getStatus())
                .purchaseDate(purchaseDate.toString())
                .expirationDate(expirationDate.toString())
                .ownerName(ownerName)
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
}