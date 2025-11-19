package com.example.ticketsservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "transfer_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    @Column(name = "from_user_id", nullable = false)
    private Long fromUserId;

    @Column(name = "from_user_email")
    private String fromUserEmail;

    @Column(name = "to_user_id", nullable = false)
    private Long toUserId;

    @Column(name = "to_user_email")
    private String toUserEmail;

    @Column(name = "ticket_type")
    private String ticketType;

    @Column(name = "transfer_date", nullable = false)
    private LocalDateTime transferDate;

    @Column(name = "status")
    private String status; // COMPLETED, CANCELLED

    @PrePersist
    protected void onCreate() {
        if (transferDate == null) {
            transferDate = LocalDateTime.now();
        }
        if (status == null) {
            status = "COMPLETED";
        }
    }
}
