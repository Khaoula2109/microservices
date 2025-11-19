package com.example.ticketsservice.service;

import com.example.ticketsservice.dto.TicketPurchaseRequest;
import com.example.ticketsservice.exception.InvalidTicketException;
import com.example.ticketsservice.exception.TicketNotFoundException;
import com.example.ticketsservice.model.Refund;
import com.example.ticketsservice.model.Ticket;
import com.example.ticketsservice.model.TransferHistory;
import com.example.ticketsservice.model.User;
import com.example.ticketsservice.repository.RefundRepository;
import com.example.ticketsservice.repository.TicketRepository;
import com.example.ticketsservice.repository.TransferHistoryRepository;
import com.example.ticketsservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TransferHistoryRepository transferHistoryRepository;

    @Mock
    private RefundRepository refundRepository;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private TicketService ticketService;

    private User testUser;
    private Ticket testTicket;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setFirstName("Test");
        testUser.setLastName("User");

        testTicket = new Ticket();
        testTicket.setId(1L);
        testTicket.setUserId(1L);
        testTicket.setTicketType("SIMPLE");
        testTicket.setStatus("VALIDE");
        testTicket.setPurchaseDate(LocalDateTime.now());
        testTicket.setQrCodeData("TICKET-test-123");
    }

    @Test
    @DisplayName("Should purchase ticket successfully")
    void purchaseTicket_Success() {
        // Given
        TicketPurchaseRequest request = new TicketPurchaseRequest();
        request.setUserId(1L);
        request.setTicketType("SIMPLE");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(ticketRepository.findByUserIdAndTicketType(1L, "SIMPLE")).thenReturn(List.of());
        when(ticketRepository.findByQrCodeData(any())).thenReturn(Optional.empty());
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(i -> {
            Ticket t = i.getArgument(0);
            t.setId(1L);
            return t;
        });

        // When
        Ticket result = ticketService.purchaseTicket(request);

        // Then
        assertNotNull(result);
        assertEquals("SIMPLE", result.getTicketType());
        assertEquals("VALIDE", result.getStatus());
        assertEquals(1L, result.getUserId());
        verify(ticketRepository).save(any(Ticket.class));
    }

    @Test
    @DisplayName("Should throw exception for invalid ticket type")
    void purchaseTicket_InvalidType() {
        // Given
        TicketPurchaseRequest request = new TicketPurchaseRequest();
        request.setUserId(1L);
        request.setTicketType("INVALID");

        // When & Then
        assertThrows(InvalidTicketException.class, () ->
            ticketService.purchaseTicket(request)
        );
    }

    @Test
    @DisplayName("Should get ticket history for user")
    void getTicketHistory_Success() {
        // Given
        when(ticketRepository.findByUserId(1L)).thenReturn(List.of(testTicket));

        // When
        List<Ticket> result = ticketService.getTicketHistory(1L);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testTicket.getId(), result.get(0).getId());
    }

    @Test
    @DisplayName("Should throw exception when no tickets found")
    void getTicketHistory_NoTickets() {
        // Given
        when(ticketRepository.findByUserId(1L)).thenReturn(List.of());

        // When & Then
        assertThrows(TicketNotFoundException.class, () ->
            ticketService.getTicketHistory(1L)
        );
    }

    @Test
    @DisplayName("Should validate ticket successfully")
    void validateTicket_Success() {
        // Given
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(testTicket);

        // When
        Ticket result = ticketService.validateTicket(1L);

        // Then
        assertNotNull(result);
        assertNotNull(result.getValidationDate());
        verify(ticketRepository).save(any(Ticket.class));
    }

    @Test
    @DisplayName("Should throw exception when validating already validated ticket")
    void validateTicket_AlreadyValidated() {
        // Given
        testTicket.setValidationDate(LocalDateTime.now());
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));

        // When & Then
        assertThrows(InvalidTicketException.class, () ->
            ticketService.validateTicket(1L)
        );
    }

    @Test
    @DisplayName("Should transfer ticket successfully")
    void transferTicket_Success() {
        // Given
        User recipient = new User();
        recipient.setId(2L);
        recipient.setEmail("recipient@example.com");

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        when(userRepository.findByEmail("recipient@example.com")).thenReturn(Optional.of(recipient));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(testTicket);
        when(transferHistoryRepository.save(any(TransferHistory.class))).thenReturn(new TransferHistory());

        // When
        Ticket result = ticketService.transferTicket(1L, 1L, "recipient@example.com");

        // Then
        assertNotNull(result);
        assertEquals(2L, result.getUserId());
        verify(transferHistoryRepository).save(any(TransferHistory.class));
    }

    @Test
    @DisplayName("Should throw exception when transferring to self")
    void transferTicket_ToSelf() {
        // Given
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        // When & Then
        assertThrows(InvalidTicketException.class, () ->
            ticketService.transferTicket(1L, 1L, "test@example.com")
        );
    }

    @Test
    @DisplayName("Should throw exception when not owner of ticket")
    void transferTicket_NotOwner() {
        // Given
        testTicket.setUserId(2L); // Different owner
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));

        // When & Then
        assertThrows(InvalidTicketException.class, () ->
            ticketService.transferTicket(1L, 1L, "recipient@example.com")
        );
    }

    @Test
    @DisplayName("Should request refund successfully")
    void requestRefund_Success() {
        // Given
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        when(refundRepository.existsByTicketIdAndStatusIn(anyLong(), any())).thenReturn(false);
        when(refundRepository.save(any(Refund.class))).thenAnswer(i -> {
            Refund r = i.getArgument(0);
            r.setId(1L);
            return r;
        });
        when(ticketRepository.save(any(Ticket.class))).thenReturn(testTicket);

        // When
        Refund result = ticketService.requestRefund(1L, 1L, "Test reason");

        // Then
        assertNotNull(result);
        assertEquals("PENDING", result.getStatus());
        assertEquals(2.0, result.getRefundAmount()); // SIMPLE ticket price
        verify(ticketRepository).save(any(Ticket.class)); // Ticket marked as cancelled
    }

    @Test
    @DisplayName("Should throw exception when refund already exists")
    void requestRefund_AlreadyExists() {
        // Given
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        when(refundRepository.existsByTicketIdAndStatusIn(anyLong(), any())).thenReturn(true);

        // When & Then
        assertThrows(InvalidTicketException.class, () ->
            ticketService.requestRefund(1L, 1L, "Test reason")
        );
    }

    @Test
    @DisplayName("Should process refund approval")
    void processRefund_Approve() {
        // Given
        Refund refund = Refund.builder()
                .id(1L)
                .ticketId(1L)
                .userId(1L)
                .status("PENDING")
                .build();

        when(refundRepository.findById(1L)).thenReturn(Optional.of(refund));
        when(refundRepository.save(any(Refund.class))).thenReturn(refund);

        // When
        Refund result = ticketService.processRefund(1L, true, "Approved");

        // Then
        assertEquals("COMPLETED", result.getStatus());
        assertNotNull(result.getProcessedDate());
        assertEquals("Approved", result.getAdminNotes());
    }

    @Test
    @DisplayName("Should process refund rejection and restore ticket")
    void processRefund_Reject() {
        // Given
        Refund refund = Refund.builder()
                .id(1L)
                .ticketId(1L)
                .userId(1L)
                .status("PENDING")
                .build();

        when(refundRepository.findById(1L)).thenReturn(Optional.of(refund));
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        when(refundRepository.save(any(Refund.class))).thenReturn(refund);
        when(ticketRepository.save(any(Ticket.class))).thenReturn(testTicket);

        // When
        Refund result = ticketService.processRefund(1L, false, "Rejected");

        // Then
        assertEquals("REJECTED", result.getStatus());
        verify(ticketRepository).save(any(Ticket.class)); // Ticket restored
    }

    @Test
    @DisplayName("Should get ticket stats correctly")
    void getTicketStats_Success() {
        // Given
        Ticket usedTicket = new Ticket();
        usedTicket.setStatus("VALIDE");
        usedTicket.setValidationDate(LocalDateTime.now());

        when(ticketRepository.findByUserId(1L)).thenReturn(List.of(testTicket, usedTicket));

        // When
        var result = ticketService.getTicketStats(1L);

        // Then
        assertEquals(2, result.getTotalPurchased());
        assertEquals(1, result.getActiveTickets());
        assertEquals(1, result.getUsedTickets());
    }
}
