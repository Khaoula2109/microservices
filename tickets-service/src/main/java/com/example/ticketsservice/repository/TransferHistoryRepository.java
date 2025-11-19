package com.example.ticketsservice.repository;

import com.example.ticketsservice.model.TransferHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransferHistoryRepository extends JpaRepository<TransferHistory, Long> {

    // Find all transfers for a ticket
    List<TransferHistory> findByTicketIdOrderByTransferDateDesc(Long ticketId);

    // Find all transfers sent by a user
    List<TransferHistory> findByFromUserIdOrderByTransferDateDesc(Long fromUserId);

    // Find all transfers received by a user
    List<TransferHistory> findByToUserIdOrderByTransferDateDesc(Long toUserId);

    // Find all transfers involving a user (sent or received)
    @Query("SELECT t FROM TransferHistory t WHERE t.fromUserId = :userId OR t.toUserId = :userId ORDER BY t.transferDate DESC")
    List<TransferHistory> findAllByUserId(@Param("userId") Long userId);

    // Count transfers sent by a user
    long countByFromUserId(Long fromUserId);

    // Count transfers received by a user
    long countByToUserId(Long toUserId);
}
