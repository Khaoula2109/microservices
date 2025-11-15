package com.transport.urbain.userservice.service;

import com.transport.urbain.userservice.dto.PasswordChangeRequest;
import com.transport.urbain.userservice.dto.UserUpdateRequest;
import com.transport.urbain.userservice.exception.DuplicateResourceException;
import com.transport.urbain.userservice.model.User;
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
}