package com.example.ticketsservice.dto;

import lombok.Data;

@Data
public class RefundRequest {
    private Long ticketId;
    private String reason;
}
