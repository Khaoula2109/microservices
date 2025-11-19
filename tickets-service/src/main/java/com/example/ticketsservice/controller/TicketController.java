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

import com.example.ticketsservice.dto.TicketPurchaseRequest;
import com.example.ticketsservice.dto.TicketStatsResponse;
import com.example.ticketsservice.model.Ticket;
import com.example.ticketsservice.service.TicketService;

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
        
        System.out.println("🎫 Achat de ticket - User ID: " + userIdHeader + ", Email: " + userEmail);
        
        
        if (userIdHeader != null && !userIdHeader.equals("me")) {
            try {
                request.setUserId(Long.parseLong(userIdHeader));
            } catch (NumberFormatException e) {
                System.out.println("⚠️ ID utilisateur invalide: " + userIdHeader);
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
}