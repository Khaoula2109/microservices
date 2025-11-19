package com.example.ticketsservice.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.ticketsservice.model.Ticket;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByUserId(Long userId);
    List<Ticket> findByUserIdAndTicketType(Long userId, String ticketType);

    Optional<Ticket> findByQrCodeData(String qrCodeData);

    List<Ticket> findByUserIdAndStatus(Long userId, String status);

    // Count methods for statistics
    long countByUserId(Long userId);
    long countByUserIdAndStatus(Long userId, String status);

    // Validation statistics methods
    long countByStatus(String status);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status = :status AND t.validationDate >= :startDate")
    long countByStatusAndValidationDateAfter(@Param("status") String status, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status = :status AND t.validationDate >= :startDate AND t.validationDate <= :endDate")
    long countByStatusAndValidationDateBetween(@Param("status") String status, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // Get validated tickets for history
    List<Ticket> findByStatusOrderByValidationDateDesc(String status);

    @Query("SELECT t FROM Ticket t WHERE t.status = :status ORDER BY t.validationDate DESC")
    List<Ticket> findValidatedTicketsOrderByDateDesc(@Param("status") String status);
}