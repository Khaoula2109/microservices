package com.transport.apigateway.filter;

import java.util.List;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;

import com.transport.apigateway.util.JwtUtil;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private final JwtUtil jwtUtil;
    private final AntPathMatcher pathMatcher;

    private static final List<String> PUBLIC_ROUTES = List.of(
            "/api/auth/register",
            "/api/auth/login",
            "/api/subscriptions/webhook",
            "/api/subscriptions/success",
            "/api/subscriptions/cancel",
            "/health",
            "/actuator/**"
    );

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
        this.pathMatcher = new AntPathMatcher();
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().toString();

        log.debug("🔍 Requête reçue: {} {}", request.getMethod(), path);

        if (isPublicRoute(path)) {
            log.debug("✅ Route publique autorisée: {}", path);
            return chain.filter(exchange);
        }

        String authHeader = request.getHeaders().getFirst("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("❌ Token JWT manquant pour: {}", path);
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);

        try {
            if (!jwtUtil.validateToken(token)) {
                log.warn("❌ Token JWT invalide ou expiré");
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            String userEmail = jwtUtil.extractUsername(token);
            List<String> roles = jwtUtil.extractRoles(token);
            
            
            String userId = jwtUtil.extractUserId(token);
            
            log.debug("✅ Token valide pour: {} (ID: {}, Rôles: {})", userEmail, userId, roles);

            if (path.startsWith("/api/admin/")) {
                if (roles == null || !roles.contains("ROLE_ADMIN")) {
                    log.warn("❌ Accès ADMIN REFUSÉ pour: {} (Route: {})", userEmail, path);
                    exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                    return exchange.getResponse().setComplete();
                }
            }

            
            ServerHttpRequest.Builder requestBuilder = request.mutate()
                    .header("X-User-Email", userEmail)
                    .header("X-Auth-Token", token)
                    .header("X-User-Roles", String.join(",", roles));
            
            
            if (userId != null) {
                requestBuilder.header("X-User-Id", userId);
                log.debug("✅ Header X-User-Id ajouté: {}", userId);
            } else {
                log.warn("⚠️ Impossible d'extraire l'userId du token");
            }

            ServerHttpRequest modifiedRequest = requestBuilder.build();

            return chain.filter(exchange.mutate().request(modifiedRequest).build());

        } catch (Exception e) {
            log.error("❌ Erreur lors de la validation du JWT: {}", e.getMessage());
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }

    private boolean isPublicRoute(String path) {
        return PUBLIC_ROUTES.stream().anyMatch(route -> pathMatcher.match(route, path));
    }

    @Override
    public int getOrder() {
        return -100;
    }
}