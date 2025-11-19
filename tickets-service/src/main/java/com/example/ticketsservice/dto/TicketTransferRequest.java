package com.example.ticketsservice.dto;

import lombok.Data;

@Data
public class TicketTransferRequest {
    private String recipientEmail;
}
