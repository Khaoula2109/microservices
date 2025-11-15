package com.example.ticketsservice.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.ticketsservice.model.Ticket;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByUserId(Long userId);
    List<Ticket> findByUserIdAndTicketType(Long userId, String ticketType);
    
    Optional<Ticket> findByQrCodeData(String qrCodeData);
    
    List<Ticket> findByUserIdAndStatus(Long userId, String status);
}