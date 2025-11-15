package com.transport.apigateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import reactor.core.publisher.Mono;

@Configuration
public class RateLimiterConfig {
    @Bean
    @Primary
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            String clientIp = exchange.getRequest().getRemoteAddress() != null
                    ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                    : "unknown";

            return Mono.just(clientIp);
        };
    }

    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> {
            String userEmail = exchange.getRequest().getHeaders().getFirst("X-User-Email");
            return Mono.just(userEmail != null ? userEmail : "anonymous");
        };
    }
}