package com.transport.urbain.userservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

/**
 * Listens to events and awards loyalty points automatically
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Profile("!test")
public class LoyaltyEventListener {

    private final LoyaltyService loyaltyService;
    private final ObjectMapper objectMapper;

    /**
     * Listen to ticket purchase events and award points
     */
    @RabbitListener(queues = "#{ticketPurchasedQueue.name}")
    public void handleTicketPurchased(String message) {
        try {
            log.info("📨 Received ticket.purchased event for loyalty points");

            JsonNode event = objectMapper.readTree(message);
            Long userId = event.get("userId").asLong();

            // Award points for ticket purchase
            loyaltyService.awardPointsForTicket(userId);

            log.info("✅ Awarded {} points to user {} for ticket purchase",
                    LoyaltyService.POINTS_PER_TICKET, userId);

        } catch (Exception e) {
            log.error("❌ Error processing ticket.purchased event for loyalty: {}", e.getMessage(), e);
        }
    }

    /**
     * Listen to subscription events and award points
     */
    @RabbitListener(queues = "#{subscriptionCreatedQueue.name}")
    public void handleSubscriptionCreated(String message) {
        try {
            log.info("📨 Received subscription.created event for loyalty points");

            JsonNode event = objectMapper.readTree(message);
            Long userId = event.get("userId").asLong();

            // Award points for subscription
            loyaltyService.awardPointsForSubscription(userId);

            log.info("✅ Awarded {} points to user {} for subscription",
                    LoyaltyService.POINTS_PER_SUBSCRIPTION, userId);

        } catch (Exception e) {
            log.error("❌ Error processing subscription.created event for loyalty: {}", e.getMessage(), e);
        }
    }
}
