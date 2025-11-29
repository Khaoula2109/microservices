package com.example.ticketsservice.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.ticketsservice.dto.QrValidationResponse;
import com.example.ticketsservice.dto.TicketPurchaseRequest;
import com.example.ticketsservice.dto.TicketStatsResponse;
import com.example.ticketsservice.dto.TicketTransferRequest;
import com.example.ticketsservice.dto.RefundRequest;
import com.example.ticketsservice.dto.TransferHistoryResponse;
import com.example.ticketsservice.dto.ValidationStatsResponse;
import com.example.ticketsservice.model.Refund;
import com.example.ticketsservice.model.Ticket;
import com.example.ticketsservice.model.TransferHistory;
import com.example.ticketsservice.service.TicketService;

import java.util.Map;
import java.util.stream.Collectors;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    @Autowired
    private TicketService ticketService;

    @PostMapping("/purchase")
    public ResponseEntity<Ticket> purchaseTicket(@RequestBody TicketPurchaseRequest request, HttpServletRequest httpRequest) {

        String userIdHeader = httpRequest.getHeader("X-User-Id");
        String userEmail = httpRequest.getHeader("X-User-Email");
        String userIdParam = httpRequest.getParameter("userId");

        System.out.println("🎫 Achat de ticket - User ID Header: " + userIdHeader + ", Param: " + userIdParam + ", Email: " + userEmail);

        // Priority: 1) Request body userId, 2) Query parameter userId, 3) Header X-User-Id
        if (request.getUserId() == null) {
            if (userIdParam != null) {
                try {
                    request.setUserId(Long.parseLong(userIdParam));
                    System.out.println("✓ userId défini depuis le paramètre de requête: " + userIdParam);
                } catch (NumberFormatException e) {
                    System.out.println("⚠️ ID utilisateur invalide dans le paramètre: " + userIdParam);
                }
            } else if (userIdHeader != null && !userIdHeader.equals("me")) {
                try {
                    request.setUserId(Long.parseLong(userIdHeader));
                    System.out.println("✓ userId défini depuis le header: " + userIdHeader);
                } catch (NumberFormatException e) {
                    System.out.println("⚠️ ID utilisateur invalide dans le header: " + userIdHeader);
                }
            }
        }

        Ticket purchasedTicket = ticketService.purchaseTicket(request);
        return ResponseEntity.ok(purchasedTicket);
    }

    
    @GetMapping("/history/me")
    public ResponseEntity<List<Ticket>> getMyTickets(HttpServletRequest request) {
        try {
            String userIdHeader = request.getHeader("X-User-Id");
            String userEmail = request.getHeader("X-User-Email");
            
            System.out.println("📋 Historique tickets - User ID: " + userIdHeader + ", Email: " + userEmail);
            
            Long userId;
            if (userIdHeader != null && !userIdHeader.equals("me")) {
                userId = Long.parseLong(userIdHeader);
            } else {
                
                userId = 1L; 
                System.out.println("ℹ️ Utilisation de l'ID par défaut: " + userId);
            }
            
            List<Ticket> tickets = ticketService.getTicketHistory(userId);
            return ResponseEntity.ok(tickets);
            
        } catch (Exception e) {
            System.out.println("❌ Erreur dans getMyTickets: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

   
    @GetMapping("/history/{userId}")
    public ResponseEntity<List<Ticket>> getHistory(@PathVariable Long userId) {
        List<Ticket> tickets = ticketService.getTicketHistory(userId);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<Ticket> getTicketDetails(@PathVariable Long ticketId) {
        Ticket ticket = ticketService.getTicketById(ticketId);
        return ResponseEntity.ok(ticket);
    }

    @PostMapping("/{ticketId}/validate")
    public ResponseEntity<Ticket> validateTicket(@PathVariable Long ticketId) {
        Ticket validatedTicket = ticketService.validateTicket(ticketId);
        return ResponseEntity.ok(validatedTicket);
    }

    @PostMapping("/{ticketId}/cancel")
    public ResponseEntity<Ticket> cancelTicket(@PathVariable Long ticketId) {
        Ticket cancelledTicket = ticketService.cancelTicket(ticketId);
        return ResponseEntity.ok(cancelledTicket);
    }

    @GetMapping("/stats/me")
    public ResponseEntity<TicketStatsResponse> getMyStats(HttpServletRequest request) {
        try {
            String userIdHeader = request.getHeader("X-User-Id");

            System.out.println("📊 Statistiques tickets - User ID: " + userIdHeader);

            Long userId;
            if (userIdHeader != null && !userIdHeader.equals("me")) {
                userId = Long.parseLong(userIdHeader);
            } else {
                userId = 1L;
                System.out.println("ℹ️ Utilisation de l'ID par défaut: " + userId);
            }

            TicketStatsResponse stats = ticketService.getTicketStats(userId);
            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            System.out.println("❌ Erreur dans getMyStats: " + e.getMessage());
            // Return zeros if no tickets found
            return ResponseEntity.ok(new TicketStatsResponse(0, 0, 0));
        }
    }

    @GetMapping("/validate-qr/{qrCode}")
    public ResponseEntity<QrValidationResponse> validateByQrCode(@PathVariable String qrCode) {
        System.out.println("🔍 Validation QR Code: " + qrCode);

        QrValidationResponse response = ticketService.validateByQrCode(qrCode);

        if (response.isValid()) {
            System.out.println("✅ Ticket valide - " + response.getTicketType() + " - " + response.getOwnerName());
        } else {
            System.out.println("❌ Ticket invalide - " + response.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    // Controller dashboard endpoints

    @GetMapping("/validation-stats")
    public ResponseEntity<ValidationStatsResponse> getValidationStats() {
        System.out.println("📊 Récupération des statistiques de validation");

        ValidationStatsResponse stats = ticketService.getValidationStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/validation-history")
    public ResponseEntity<List<Ticket>> getValidationHistory() {
        System.out.println("📋 Récupération de l'historique de validation");

        List<Ticket> history = ticketService.getValidationHistory();
        return ResponseEntity.ok(history);
    }

    @PostMapping("/{ticketId}/transfer")
    public ResponseEntity<?> transferTicket(
            @PathVariable Long ticketId,
            @RequestBody TicketTransferRequest request,
            HttpServletRequest httpRequest) {
        try {
            String userIdHeader = httpRequest.getHeader("X-User-Id");

            System.out.println("🔄 Transfert de ticket - Ticket ID: " + ticketId + ", User ID: " + userIdHeader);

            if (userIdHeader == null || userIdHeader.equals("me")) {
                return ResponseEntity.badRequest().body(Map.of("error", "User ID requis"));
            }

            Long userId = Long.parseLong(userIdHeader);
            Ticket transferredTicket = ticketService.transferTicket(ticketId, userId, request.getRecipientEmail());

            System.out.println("✅ Ticket transféré avec succès vers " + request.getRecipientEmail());
            return ResponseEntity.ok(transferredTicket);

        } catch (Exception e) {
            System.out.println("❌ Erreur de transfert: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/transfer-history")
    public ResponseEntity<List<TransferHistoryResponse>> getTransferHistory(HttpServletRequest httpRequest) {
        String userIdHeader = httpRequest.getHeader("X-User-Id");

        System.out.println("📜 Récupération de l'historique de transfert - User ID: " + userIdHeader);

        if (userIdHeader == null || userIdHeader.equals("me")) {
            return ResponseEntity.badRequest().build();
        }

        try {
            Long userId = Long.parseLong(userIdHeader);
            List<TransferHistory> history = ticketService.getTransferHistoryByUser(userId);

            List<TransferHistoryResponse> response = history.stream()
                    .map(h -> TransferHistoryResponse.fromEntity(h, userId))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("❌ Erreur historique de transfert: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/transfer-history/sent")
    public ResponseEntity<List<TransferHistoryResponse>> getTransferHistorySent(HttpServletRequest httpRequest) {
        String userIdHeader = httpRequest.getHeader("X-User-Id");

        if (userIdHeader == null || userIdHeader.equals("me")) {
            return ResponseEntity.badRequest().build();
        }

        try {
            Long userId = Long.parseLong(userIdHeader);
            List<TransferHistory> history = ticketService.getTransferHistorySent(userId);

            List<TransferHistoryResponse> response = history.stream()
                    .map(h -> TransferHistoryResponse.fromEntity(h, userId))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/transfer-history/received")
    public ResponseEntity<List<TransferHistoryResponse>> getTransferHistoryReceived(HttpServletRequest httpRequest) {
        String userIdHeader = httpRequest.getHeader("X-User-Id");

        if (userIdHeader == null || userIdHeader.equals("me")) {
            return ResponseEntity.badRequest().build();
        }

        try {
            Long userId = Long.parseLong(userIdHeader);
            List<TransferHistory> history = ticketService.getTransferHistoryReceived(userId);

            List<TransferHistoryResponse> response = history.stream()
                    .map(h -> TransferHistoryResponse.fromEntity(h, userId))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Refund endpoints

    @PostMapping("/refund")
    public ResponseEntity<?> requestRefund(
            @RequestBody RefundRequest request,
            HttpServletRequest httpRequest) {
        try {
            String userIdHeader = httpRequest.getHeader("X-User-Id");

            System.out.println("💰 Demande de remboursement - Ticket ID: " + request.getTicketId() + ", User ID: " + userIdHeader);

            if (userIdHeader == null || userIdHeader.equals("me")) {
                return ResponseEntity.badRequest().body(Map.of("error", "User ID requis"));
            }

            Long userId = Long.parseLong(userIdHeader);
            Refund refund = ticketService.requestRefund(request.getTicketId(), userId, request.getReason());

            System.out.println("✅ Demande de remboursement créée: " + refund.getId());
            return ResponseEntity.ok(refund);

        } catch (Exception e) {
            System.out.println("❌ Erreur de remboursement: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/refunds")
    public ResponseEntity<List<Refund>> getMyRefunds(HttpServletRequest httpRequest) {
        String userIdHeader = httpRequest.getHeader("X-User-Id");

        if (userIdHeader == null || userIdHeader.equals("me")) {
            return ResponseEntity.badRequest().build();
        }

        try {
            Long userId = Long.parseLong(userIdHeader);
            List<Refund> refunds = ticketService.getRefundsByUser(userId);
            return ResponseEntity.ok(refunds);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/refunds/pending")
    public ResponseEntity<List<Refund>> getPendingRefunds() {
        List<Refund> refunds = ticketService.getPendingRefunds();
        return ResponseEntity.ok(refunds);
    }

    @PostMapping("/refunds/{refundId}/process")
    public ResponseEntity<?> processRefund(
            @PathVariable Long refundId,
            @RequestBody Map<String, Object> body) {
        try {
            boolean approved = (Boolean) body.get("approved");
            String adminNotes = (String) body.getOrDefault("adminNotes", "");

            Refund refund = ticketService.processRefund(refundId, approved, adminNotes);

            System.out.println("✅ Remboursement traité: " + refundId + " - " + (approved ? "APPROUVÉ" : "REJETÉ"));
            return ResponseEntity.ok(refund);

        } catch (Exception e) {
            System.out.println("❌ Erreur traitement remboursement: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}