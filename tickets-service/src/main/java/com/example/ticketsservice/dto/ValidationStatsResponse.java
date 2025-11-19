package com.example.ticketsservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidationStatsResponse {
    private long validationsToday;
    private long validationsThisWeek;
    private long validationsThisMonth;
    private long totalValidations;
    private long validTickets;
    private long invalidTickets;
}
