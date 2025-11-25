package com.example.ticketsservice.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/subscriptions")
@Tag(name = "Subscription Validation", description = "Proxy pour la validation des abonnements")
public class SubscriptionProxyController {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String SUBSCRIPTION_SERVICE_URL = "http://localhost:3002";

    @GetMapping("/validate-qr/{qrCode}")
    @Operation(summary = "Valider un abonnement par QR code", description = "Proxy vers le service d'abonnements pour la validation")
    public ResponseEntity<String> validateSubscriptionQrCode(@PathVariable String qrCode) {
        try {
            String url = SUBSCRIPTION_SERVICE_URL + "/api/subscriptions/validate-qr/" + qrCode;
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            return response;
        } catch (Exception e) {
            return ResponseEntity.status(503).body("{\"valid\": false, \"message\": \"Service d'abonnements non disponible\"}");
        }
    }
}
