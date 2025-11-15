package com.transport.urbain.userservice.service;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.transport.urbain.userservice.config.JwtService;
import com.transport.urbain.userservice.dto.AuthResponse;
import com.transport.urbain.userservice.dto.LoginRequest;
import com.transport.urbain.userservice.dto.RegisterRequest;
import com.transport.urbain.userservice.event.UserRegisteredEvent;
import com.transport.urbain.userservice.exception.DuplicateResourceException;
import com.transport.urbain.userservice.model.User;
import com.transport.urbain.userservice.model.UserRole;
import com.transport.urbain.userservice.repository.UserRepository; 

import lombok.RequiredArgsConstructor; 

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RabbitTemplate rabbitTemplate;

    private static final String EXCHANGE_NAME = "transport_events";
    private static final String ROUTING_KEY_USER_REGISTERED = "user.registered";

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new DuplicateResourceException("Un compte avec cet email existe déjà.");
        }
        UserRole role = (request.getRole() != null) 
            ? UserRole.valueOf(request.getRole().toUpperCase())
            : UserRole.PASSENGER;
        var user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        User savedUser = userRepository.save(user);

        var jwtToken = jwtService.generateToken(user);

        UserRegisteredEvent event = new UserRegisteredEvent(
                savedUser.getId().toString(),
                savedUser.getEmail(),
                savedUser.getFirstName(),
                savedUser.getLastName()
        );
        rabbitTemplate.convertAndSend(EXCHANGE_NAME, ROUTING_KEY_USER_REGISTERED, event);
        System.out.println("UserRegisteredEvent publié pour: " + savedUser.getEmail());

        return AuthResponse.builder()
                .token(jwtToken)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();

        var jwtToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(jwtToken)
                .build();
    }
}