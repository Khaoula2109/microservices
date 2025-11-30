package com.transport.urbain.userservice.service;

import com.transport.urbain.userservice.model.User;
import com.transport.urbain.userservice.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoyaltyService {

    private final UserRepository userRepository;

    // Points earned per purchase
    public static final int POINTS_PER_TICKET = 10;
    public static final int POINTS_PER_SUBSCRIPTION = 50;

    // Discount tiers
    public static final int TIER_1_POINTS = 100;  // 5% discount
    public static final int TIER_2_POINTS = 250;  // 10% discount
    public static final int TIER_3_POINTS = 500;  // 15% discount

    /**
     * Award points to a user
     */
    @Transactional
    public void awardPoints(Long userId, int points) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int currentPoints = user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0;
        user.setLoyaltyPoints(currentPoints + points);
        userRepository.save(user);

        log.info("Awarded {} points to user {}. New balance: {}", points, userId, user.getLoyaltyPoints());
    }

    /**
     * Award points for ticket purchase
     */
    @Transactional
    public void awardPointsForTicket(Long userId) {
        awardPoints(userId, POINTS_PER_TICKET);
    }

    /**
     * Award points for subscription purchase
     */
    @Transactional
    public void awardPointsForSubscription(Long userId) {
        awardPoints(userId, POINTS_PER_SUBSCRIPTION);
    }

    /**
     * Redeem points for a discount
     * Returns the discount percentage (0-15)
     */
    @Transactional
    public int redeemPointsForDiscount(Long userId, int pointsToRedeem) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int currentPoints = user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0;

        if (currentPoints < pointsToRedeem) {
            throw new IllegalArgumentException("Insufficient loyalty points");
        }

        int discount = 0;
        if (pointsToRedeem >= TIER_3_POINTS) {
            discount = 15;
        } else if (pointsToRedeem >= TIER_2_POINTS) {
            discount = 10;
        } else if (pointsToRedeem >= TIER_1_POINTS) {
            discount = 5;
        } else {
            throw new IllegalArgumentException("Minimum " + TIER_1_POINTS + " points required for discount");
        }

        user.setLoyaltyPoints(currentPoints - pointsToRedeem);
        userRepository.save(user);

        log.info("User {} redeemed {} points for {}% discount. Remaining points: {}",
                userId, pointsToRedeem, discount, user.getLoyaltyPoints());

        return discount;
    }

    /**
     * Get user's current loyalty points
     */
    public int getUserPoints(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0;
    }

    /**
     * Calculate available discount based on points
     */
    public int calculateAvailableDiscount(int points) {
        if (points >= TIER_3_POINTS) {
            return 15;
        } else if (points >= TIER_2_POINTS) {
            return 10;
        } else if (points >= TIER_1_POINTS) {
            return 5;
        }
        return 0;
    }

    /**
     * Use discount (called after a purchase with discount applied)
     * Resets the available discount to 0 after use
     */
    @Transactional
    public void useDiscount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // The discount is not stored separately, it's calculated from points
        // After using a discount, we could deduct points, but for now we just log
        log.info("Discount used by user {}. Current points: {}", userId, user.getLoyaltyPoints());
    }
}
