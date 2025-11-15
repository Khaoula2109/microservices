package com.transport.apigateway.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@Order(-2)
public class GlobalExceptionHandler implements ErrorWebExceptionHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        log.error("❌ Erreur capturée par GlobalExceptionHandler: {}", ex.getMessage(), ex);

        HttpStatusCode status = determineHttpStatus(ex);

        Map<String, Object> errorResponse = buildErrorResponse(status, ex, exchange);

        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(errorResponse);
        } catch (JsonProcessingException e) {
            log.error("Erreur lors de la sérialisation JSON: {}", e.getMessage());
            bytes = "{}".getBytes(StandardCharsets.UTF_8);
        }

        DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(bytes);
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    private HttpStatusCode determineHttpStatus(Throwable ex) {
        if (ex instanceof ResponseStatusException) {
            return ((ResponseStatusException) ex).getStatusCode();
        }

        if (ex.getMessage() != null && ex.getMessage().contains("Connection refused")) {
            return HttpStatus.SERVICE_UNAVAILABLE;
        }

        if (ex instanceof java.util.concurrent.TimeoutException) {
            return HttpStatus.GATEWAY_TIMEOUT;
        }

        return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    private Map<String, Object> buildErrorResponse(HttpStatusCode status, Throwable ex, ServerWebExchange exchange) {
        Map<String, Object> response = new HashMap<>();

        response.put("timestamp", LocalDateTime.now().toString());
        response.put("status", status.value());

        if (status instanceof HttpStatus) {
            response.put("error", ((HttpStatus) status).getReasonPhrase());
        } else {
            response.put("error", "Error");
        }

        response.put("message", extractErrorMessage(ex));
        response.put("path", exchange.getRequest().getPath().toString());

        return response;
    }

    private String extractErrorMessage(Throwable ex) {
        if (ex instanceof ResponseStatusException) {
            String reason = ((ResponseStatusException) ex).getReason();
            return reason != null ? reason : "Une erreur est survenue";
        }

        String message = ex.getMessage();

        if (message != null && message.contains("Connection refused")) {
            return "Le service est temporairement indisponible. Veuillez réessayer.";
        }

        if (ex instanceof java.util.concurrent.TimeoutException) {
            return "La requête a expiré. Le service met trop de temps à répondre.";
        }

        return message != null ? message : "Une erreur interne est survenue";
    }
}