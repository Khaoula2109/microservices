package com.transport.urbain.userservice.service;

import com.transport.urbain.userservice.dto.PasswordChangeRequest;
import com.transport.urbain.userservice.dto.UserUpdateRequest;
import com.transport.urbain.userservice.dto.UserResponse;
import com.transport.urbain.userservice.exception.DuplicateResourceException;
import com.transport.urbain.userservice.model.User;
import com.transport.urbain.userservice.model.UserRole;
import com.transport.urbain.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    public User getCurrentAuthenticatedUser() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String userEmail = request.getHeader("X-User-Email");

            if (userEmail != null) {
                log.debug("📧 Utilisateur récupéré via Gateway: {}", userEmail);
                return userRepository.findByEmail(userEmail)
                        .orElseThrow(() -> new IllegalStateException("Utilisateur non trouvé: " + userEmail));
            }
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        log.debug("📧 Utilisateur récupéré via JWT: {}", email);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Utilisateur non trouvé: " + email));
    }

    @Transactional
    public User updateUserProfile(UserUpdateRequest updateRequest) {
        User user = getCurrentAuthenticatedUser();

        if (updateRequest.getFirstName() != null) {
            user.setFirstName(updateRequest.getFirstName());
        }
        if (updateRequest.getLastName() != null) {
            user.setLastName(updateRequest.getLastName());
        }
        if (updateRequest.getPhoneNumber() != null) {
            user.setPhoneNumber(updateRequest.getPhoneNumber());
        }

        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(PasswordChangeRequest passwordRequest) {
        User user = getCurrentAuthenticatedUser();

        if (!passwordEncoder.matches(passwordRequest.getCurrentPassword(), user.getPassword())) {
            throw new IllegalStateException("Le mot de passe actuel est incorrect");
        }

        user.setPassword(passwordEncoder.encode(passwordRequest.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void deleteCurrentUserAccount() {
        User user = getCurrentAuthenticatedUser();
        userRepository.delete(user);
    }

    // Admin methods

    public List<UserResponse> getAllUsers() {
        return userRepository.findAllByOrderByIdDesc().stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());
    }

    public List<UserResponse> getUsersByRole(UserRole role) {
        return userRepository.findByRole(role).stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Utilisateur non trouvé avec l'ID: " + id));
        return UserResponse.fromUser(user);
    }

    @Transactional
    public UserResponse updateUserRole(Long userId, UserRole newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Utilisateur non trouvé avec l'ID: " + userId));

        log.info("Changement de rôle pour l'utilisateur {}: {} -> {}", userId, user.getRole(), newRole);
        user.setRole(newRole);
        User savedUser = userRepository.save(user);
        return UserResponse.fromUser(savedUser);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Utilisateur non trouvé avec l'ID: " + userId));

        User currentUser = getCurrentAuthenticatedUser();
        if (currentUser.getId().equals(userId)) {
            throw new IllegalStateException("Vous ne pouvez pas supprimer votre propre compte via cette méthode");
        }

        log.info("Suppression de l'utilisateur {}: {}", userId, user.getEmail());
        userRepository.delete(user);
    }

    public Map<String, Object> getUserStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", userRepository.count());
        stats.put("passengers", userRepository.countByRole(UserRole.PASSENGER));
        stats.put("admins", userRepository.countByRole(UserRole.ADMIN));
        stats.put("controllers", userRepository.countByRole(UserRole.CONTROLLER));
        stats.put("drivers", userRepository.countByRole(UserRole.DRIVER));
        return stats;
    }
}