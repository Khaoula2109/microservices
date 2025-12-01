package com.transport.urbain.userservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Listens to events and awards loyalty points automatically
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Profile("!test")
public class LoyaltyEventListener {

    private final LoyaltyService loyaltyService;

    /**
     * Listen to ticket purchase events and award points
     */
    @RabbitListener(queues = "loyalty.ticket.purchased")
    public void handleTicketPurchased(Map<String, Object> event) {
        try {
            log.info("📨 Received ticket.purchased event for loyalty points: {}", event);

            // Extract userId from the event
            String userIdStr = (String) event.get("userId");
            if (userIdStr == null) {
                log.error("❌ userId is null in ticket.purchased event");
                return;
            }

            Long userId = Long.parseLong(userIdStr);

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
    @RabbitListener(queues = "loyalty.subscription.created")
    public void handleSubscriptionCreated(Map<String, Object> event) {
        try {
            log.info("📨 Received subscription.created event for loyalty points: {}", event);

            // Extract userId from the event
            String userIdStr = (String) event.get("userId");
            if (userIdStr == null) {
                log.error("❌ userId is null in subscription.created event");
                return;
            }

            Long userId = Long.parseLong(userIdStr);

            // Award points for subscription
            loyaltyService.awardPointsForSubscription(userId);

            log.info("✅ Awarded {} points to user {} for subscription",
                    LoyaltyService.POINTS_PER_SUBSCRIPTION, userId);

        } catch (Exception e) {
            log.error("❌ Error processing subscription.created event for loyalty: {}", e.getMessage(), e);
        }
    }
}
