package com.example.ticketsservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketStatsResponse {
    private long totalPurchased;
    private long activeTickets;
    private long usedTickets;
}
