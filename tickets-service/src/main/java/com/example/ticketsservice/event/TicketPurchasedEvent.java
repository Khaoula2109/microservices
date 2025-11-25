package com.example.ticketsservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketPurchasedEvent implements Serializable {
    private String userId;
    private String userEmail;
    private String ticketId;
    private String ticketType;
    private String purchaseDate;
    private String qrCodeData;
    private String qrCodeImage; // Base64 encoded QR code image
}