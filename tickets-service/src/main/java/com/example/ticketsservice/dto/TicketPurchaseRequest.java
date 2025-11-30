package com.example.ticketsservice.dto;

import lombok.Data;

@Data
public class TicketPurchaseRequest {
    private Long userId;
    private String ticketType;
    private Integer loyaltyDiscount; // Loyalty discount percentage (0-15)

    public TicketPurchaseRequest() {}

    public TicketPurchaseRequest(Long userId, String ticketType) {
        this.userId = userId;
        this.ticketType = ticketType;
        this.loyaltyDiscount = 0;
    }

    public TicketPurchaseRequest(Long userId, String ticketType, Integer loyaltyDiscount) {
        this.userId = userId;
        this.ticketType = ticketType;
        this.loyaltyDiscount = loyaltyDiscount != null ? loyaltyDiscount : 0;
    }
}