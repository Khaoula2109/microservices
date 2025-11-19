package com.example.ticketsservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationMessage {
    private String id;
    private String type; // TICKET_PURCHASED, TICKET_VALIDATED, TICKET_TRANSFERRED, REFUND_STATUS, SYSTEM
    private String title;
    private String message;
    private Long userId;
    private Long ticketId;
    private LocalDateTime timestamp;
    private boolean read;
    private Object data; // Additional data payload
}
