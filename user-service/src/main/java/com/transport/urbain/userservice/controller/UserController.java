package com.transport.urbain.userservice.controller;

import com.transport.urbain.userservice.dto.PasswordChangeRequest;
import com.transport.urbain.userservice.dto.UserUpdateRequest;
import com.transport.urbain.userservice.dto.UserResponse;
import com.transport.urbain.userservice.dto.RoleChangeRequest;
import com.transport.urbain.userservice.model.User;
import com.transport.urbain.userservice.model.UserRole;
import com.transport.urbain.userservice.service.UserService;
import com.transport.urbain.userservice.service.LoyaltyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final LoyaltyService loyaltyService;

    @GetMapping("/me")
    public ResponseEntity<User> getMyProfile() {
        User currentUser = userService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(currentUser);
    }

    @PutMapping("/me")
    public ResponseEntity<User> updateMyProfile(@Valid @RequestBody UserUpdateRequest updateRequest) {
        User updatedUser = userService.updateUserProfile(updateRequest);
        return ResponseEntity.ok(updatedUser);
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changeMyPassword(@Valid @RequestBody PasswordChangeRequest passwordRequest) {
        userService.changePassword(passwordRequest);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMyAccount() {
        userService.deleteCurrentUserAccount();
        return ResponseEntity.noContent().build();
    }

    // Admin endpoints

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(
            @RequestParam(required = false) String role) {
        if (role != null && !role.isEmpty()) {
            try {
                UserRole userRole = UserRole.valueOf(role.toUpperCase());
                return ResponseEntity.ok(userService.getUsersByRole(userRole));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getUserStats() {
        return ResponseEntity.ok(userService.getUserStats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody RoleChangeRequest roleChangeRequest) {
        return ResponseEntity.ok(userService.updateUserRole(id, roleChangeRequest.getRole()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // Loyalty Program endpoints

    @GetMapping("/me/loyalty")
    public ResponseEntity<Map<String, Object>> getMyLoyaltyInfo() {
        User currentUser = userService.getCurrentAuthenticatedUser();
        int points = loyaltyService.getUserPoints(currentUser.getId());
        int availableDiscount = loyaltyService.calculateAvailableDiscount(points);

        Map<String, Object> loyaltyInfo = new HashMap<>();
        loyaltyInfo.put("points", points);
        loyaltyInfo.put("availableDiscount", availableDiscount);
        loyaltyInfo.put("tiers", Map.of(
            "tier1", Map.of("points", LoyaltyService.TIER_1_POINTS, "discount", 5),
            "tier2", Map.of("points", LoyaltyService.TIER_2_POINTS, "discount", 10),
            "tier3", Map.of("points", LoyaltyService.TIER_3_POINTS, "discount", 15)
        ));

        return ResponseEntity.ok(loyaltyInfo);
    }

    @PostMapping("/me/loyalty/redeem")
    public ResponseEntity<Map<String, Object>> redeemLoyaltyPoints(@RequestBody Map<String, Integer> request) {
        User currentUser = userService.getCurrentAuthenticatedUser();
        Integer pointsToRedeem = request.get("points");

        if (pointsToRedeem == null || pointsToRedeem <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid points amount"));
        }

        try {
            int discount = loyaltyService.redeemPointsForDiscount(currentUser.getId(), pointsToRedeem);
            int remainingPoints = loyaltyService.getUserPoints(currentUser.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("discount", discount);
            response.put("remainingPoints", remainingPoints);
            response.put("pointsRedeemed", pointsToRedeem);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{userId}/loyalty/award")
    public ResponseEntity<Map<String, Object>> awardLoyaltyPoints(
            @PathVariable Long userId,
            @RequestBody Map<String, Integer> request) {

        Integer pointsToAward = request.get("points");

        if (pointsToAward == null || pointsToAward <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid points amount"));
        }

        try {
            loyaltyService.awardPoints(userId, pointsToAward);
            int newBalance = loyaltyService.getUserPoints(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("pointsAwarded", pointsToAward);
            response.put("newBalance", newBalance);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}