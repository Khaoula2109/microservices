package com.example.ticketsservice.consumer;

import com.example.ticketsservice.event.UserRegisteredEvent;
import com.example.ticketsservice.model.User;
import com.example.ticketsservice.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserEventConsumer {

    private final UserRepository userRepository;
    private static final Logger log = LoggerFactory.getLogger(UserEventConsumer.class);

    @RabbitListener(queues = {"tickets_user_registered_queue"})
    public void handleUserRegistered(UserRegisteredEvent event) {
        log.info("Événement user.registered reçu pour l'email : {}", event.getEmail());

        try {
            User user = User.builder()
                    .id(Long.parseLong(event.getUserId()))
                    .email(event.getEmail())
                    .firstName(event.getFirstName())
                    .lastName(event.getLastName())
                    .build();

            userRepository.save(user);
            log.info("Utilisateur {} sauvegardé dans la base de données tickets.", user.getId());

        } catch (NumberFormatException e) {
            log.error("Échec de la conversion de l'ID utilisateur '{}' en Long.", event.getUserId(), e);
            throw new RuntimeException("Format d'ID utilisateur invalide", e);
        } catch (Exception e) {
            log.error("Échec de la sauvegarde de l'utilisateur {}: {}", event.getEmail(), e.getMessage());
            throw e;
        }
    }
}