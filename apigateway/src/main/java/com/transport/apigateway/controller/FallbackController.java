package com.transport.apigateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> generalFallback() {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("status", HttpStatus.SERVICE_UNAVAILABLE.value());
        response.put("error", "Service Unavailable");
        response.put("message", "Le service demandé est temporairement indisponible. Veuillez réessayer dans quelques instants.");
        response.put("suggestion", "Vérifiez l'état des services sur /actuator/health");

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @GetMapping("/user-service")
    public ResponseEntity<Map<String, Object>> userServiceFallback() {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("status", HttpStatus.SERVICE_UNAVAILABLE.value());
        response.put("error", "User Service Unavailable");
        response.put("message", "Le service d'authentification est temporairement indisponible.");
        response.put("suggestion", "Veuillez réessayer dans quelques instants. Si le problème persiste, contactez le support.");
        response.put("affectedRoutes", new String[]{
                "/api/auth/register",
                "/api/auth/login",
                "/api/users/me"
        });

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @GetMapping("/subscription-service")
    public ResponseEntity<Map<String, Object>> subscriptionServiceFallback() {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("status", HttpStatus.SERVICE_UNAVAILABLE.value());
        response.put("error", "Subscription Service Unavailable");
        response.put("message", "Le service d'abonnements est temporairement indisponible.");
        response.put("suggestion", "Les paiements en cours sont sécurisés. Vous pouvez réessayer dans quelques minutes.");
        response.put("affectedRoutes", new String[]{
                "/api/subscriptions/create-checkout-session",
                "/api/subscriptions/webhook"
        });

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @GetMapping("/tickets-service")
    public ResponseEntity<Map<String, Object>> ticketsServiceFallback() {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("status", HttpStatus.SERVICE_UNAVAILABLE.value());
        response.put("error", "Tickets Service Unavailable");
        response.put("message", "Le service d'achat de tickets est temporairement indisponible.");
        response.put("suggestion", "Si vous avez acheté un ticket récemment, il reste valide. Vous pouvez réessayer l'achat dans quelques minutes.");
        response.put("affectedRoutes", new String[]{
                "/api/tickets/purchase",
                "/api/tickets/history/{userId}",
                "/api/tickets/{ticketId}/validate"
        });

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @GetMapping("/routes-service")
    public ResponseEntity<Map<String, Object>> routesServiceFallback() {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("status", HttpStatus.SERVICE_UNAVAILABLE.value());
        response.put("error", "Routes Service Unavailable");
        response.put("message", "Le service des trajets et horaires est temporairement indisponible.");
        response.put("suggestion", "Les horaires et itinéraires seront de nouveau disponibles sous peu.");
        response.put("affectedRoutes", new String[]{
                "/api/schedules/routes",
                "/api/schedules/routes/{routeId}/stops",
                "/api/schedules/routes/{routeId}/stops/{stopId}/schedule"
        });

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @GetMapping("/geolocation-service")
    public ResponseEntity<Map<String, Object>> geolocationServiceFallback() {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("status", HttpStatus.SERVICE_UNAVAILABLE.value());
        response.put("error", "Geolocation Service Unavailable");
        response.put("message", "Le service de géolocalisation des bus est temporairement indisponible.");
        response.put("suggestion", "Le tracking en temps réel sera bientôt rétabli. Consultez les horaires prévus en attendant.");
        response.put("affectedRoutes", new String[]{
                "/api/geolocation/bus/{bus_number}"
        });

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testFallback() {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("status", HttpStatus.OK.value());
        response.put("message", "Ceci est un endpoint de test pour le fallback. Le Circuit Breaker fonctionne correctement.");
        response.put("warning", "Cet endpoint doit être désactivé en production.");

        return ResponseEntity.ok(response);
    }
}