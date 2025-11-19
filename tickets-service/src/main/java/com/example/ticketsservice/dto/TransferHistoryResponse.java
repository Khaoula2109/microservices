package com.example.ticketsservice.dto;

import com.example.ticketsservice.model.TransferHistory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferHistoryResponse {
    private Long id;
    private Long ticketId;
    private Long fromUserId;
    private String fromUserEmail;
    private Long toUserId;
    private String toUserEmail;
    private String ticketType;
    private LocalDateTime transferDate;
    private String status;
    private String direction; // SENT or RECEIVED

    public static TransferHistoryResponse fromEntity(TransferHistory entity, Long currentUserId) {
        String direction = entity.getFromUserId().equals(currentUserId) ? "SENT" : "RECEIVED";

        return TransferHistoryResponse.builder()
                .id(entity.getId())
                .ticketId(entity.getTicketId())
                .fromUserId(entity.getFromUserId())
                .fromUserEmail(entity.getFromUserEmail())
                .toUserId(entity.getToUserId())
                .toUserEmail(entity.getToUserEmail())
                .ticketType(entity.getTicketType())
                .transferDate(entity.getTransferDate())
                .status(entity.getStatus())
                .direction(direction)
                .build();
    }
}
