package com.example.ticketsservice.controller;

import com.example.ticketsservice.dto.NotificationMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.UUID;

@Controller
public class NotificationController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Send notification to a specific user
     */
    public void sendUserNotification(Long userId, NotificationMessage notification) {
        notification.setId(UUID.randomUUID().toString());
        notification.setTimestamp(LocalDateTime.now());
        notification.setUserId(userId);
        notification.setRead(false);

        messagingTemplate.convertAndSend("/topic/user/" + userId, notification);
    }

    /**
     * Send notification to all connected users
     */
    public void sendBroadcastNotification(NotificationMessage notification) {
        notification.setId(UUID.randomUUID().toString());
        notification.setTimestamp(LocalDateTime.now());
        notification.setRead(false);

        messagingTemplate.convertAndSend("/topic/broadcast", notification);
    }

    /**
     * Handle incoming messages from clients
     */
    @MessageMapping("/notification.send")
    public void handleNotification(@Payload NotificationMessage notification) {
        // Process incoming notification from client if needed
        if (notification.getUserId() != null) {
            sendUserNotification(notification.getUserId(), notification);
        } else {
            sendBroadcastNotification(notification);
        }
    }

    /**
     * Helper methods to create specific notification types
     */
    public void notifyTicketPurchased(Long userId, Long ticketId, String ticketType) {
        NotificationMessage notification = NotificationMessage.builder()
                .type("TICKET_PURCHASED")
                .title("Ticket acheté")
                .message("Votre ticket " + ticketType + " a été acheté avec succès")
                .ticketId(ticketId)
                .build();
        sendUserNotification(userId, notification);
    }

    public void notifyTicketValidated(Long userId, Long ticketId) {
        NotificationMessage notification = NotificationMessage.builder()
                .type("TICKET_VALIDATED")
                .title("Ticket validé")
                .message("Votre ticket a été validé")
                .ticketId(ticketId)
                .build();
        sendUserNotification(userId, notification);
    }

    public void notifyTicketTransferred(Long fromUserId, Long toUserId, Long ticketId, String ticketType) {
        // Notify sender
        NotificationMessage senderNotif = NotificationMessage.builder()
                .type("TICKET_TRANSFERRED")
                .title("Ticket transféré")
                .message("Votre ticket " + ticketType + " a été transféré avec succès")
                .ticketId(ticketId)
                .build();
        sendUserNotification(fromUserId, senderNotif);

        // Notify recipient
        NotificationMessage recipientNotif = NotificationMessage.builder()
                .type("TICKET_RECEIVED")
                .title("Ticket reçu")
                .message("Vous avez reçu un ticket " + ticketType)
                .ticketId(ticketId)
                .build();
        sendUserNotification(toUserId, recipientNotif);
    }

    public void notifyRefundStatus(Long userId, Long ticketId, String status, String message) {
        String title = status.equals("COMPLETED") ? "Remboursement approuvé" : "Remboursement refusé";
        NotificationMessage notification = NotificationMessage.builder()
                .type("REFUND_STATUS")
                .title(title)
                .message(message)
                .ticketId(ticketId)
                .build();
        sendUserNotification(userId, notification);
    }

    public void notifySystemMessage(String title, String message) {
        NotificationMessage notification = NotificationMessage.builder()
                .type("SYSTEM")
                .title(title)
                .message(message)
                .build();
        sendBroadcastNotification(notification);
    }
}
