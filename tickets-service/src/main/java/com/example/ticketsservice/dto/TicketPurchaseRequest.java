package com.example.ticketsservice.dto;

import lombok.Data;

@Data
public class TicketPurchaseRequest {
    private Long userId; 
    private String ticketType;
    
    public TicketPurchaseRequest() {}
    
    public TicketPurchaseRequest(Long userId, String ticketType) {
        this.userId = userId;
        this.ticketType = ticketType;
    }
}