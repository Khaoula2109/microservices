package com.example.ticketsservice.repository;

import com.example.ticketsservice.model.Refund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefundRepository extends JpaRepository<Refund, Long> {

    List<Refund> findByUserIdOrderByRequestDateDesc(Long userId);

    List<Refund> findByStatusOrderByRequestDateDesc(String status);

    Optional<Refund> findByTicketId(Long ticketId);

    boolean existsByTicketIdAndStatusIn(Long ticketId, List<String> statuses);

    long countByStatus(String status);
}
