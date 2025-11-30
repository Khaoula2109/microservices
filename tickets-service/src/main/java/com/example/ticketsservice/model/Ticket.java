package com.example.ticketsservice.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tickets")
@Data
@NoArgsConstructor
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(name = "ticket_type", nullable = false)
    private String ticketType;

    @Column(nullable = false)
    private String status;

    @Column(name = "purchase_date", nullable = false)
    private LocalDateTime purchaseDate;

    @Column(name = "validation_date")
    private LocalDateTime validationDate;

    @Column(name = "qr_code_data", unique = true)
    private String qrCodeData;

    @Column(name = "qr_code_image", columnDefinition = "LONGTEXT")
    private String qrCodeImage; // Base64 encoded QR code image

    @Column(name = "original_price")
    private Double originalPrice; // Prix original du ticket

    @Column(name = "discount_applied")
    private Integer discountApplied; // Pourcentage de réduction appliqué (0-15)

    @Column(name = "final_price")
    private Double finalPrice; // Prix final après réduction
}