package com.example.ticketsservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "refunds")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Refund {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "ticket_type")
    private String ticketType;

    @Column(name = "original_amount", nullable = false)
    private Double originalAmount;

    @Column(name = "refund_amount", nullable = false)
    private Double refundAmount;

    @Column(name = "reason")
    private String reason;

    @Column(name = "status", nullable = false)
    private String status; // PENDING, APPROVED, REJECTED, COMPLETED

    @Column(name = "request_date", nullable = false)
    private LocalDateTime requestDate;

    @Column(name = "processed_date")
    private LocalDateTime processedDate;

    @Column(name = "admin_notes")
    private String adminNotes;

    @PrePersist
    protected void onCreate() {
        if (requestDate == null) {
            requestDate = LocalDateTime.now();
        }
        if (status == null) {
            status = "PENDING";
        }
    }
}
