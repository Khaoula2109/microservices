package com.example.ticketsservice.dto;

import com.example.ticketsservice.model.Ticket;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QrValidationResponse {
    private boolean valid;
    private String message;
    private Long ticketId;
    private Long userId;
    private String ticketType;
    private String status;
    private String purchaseDate;
    private String validationDate;
    private String expirationDate;
    private String ownerName;
    private String ownerEmail;
    private String ownerPhone;
    private String qrCodeImage; // Base64 encoded image for display
}
