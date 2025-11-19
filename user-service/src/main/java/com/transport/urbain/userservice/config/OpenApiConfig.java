package com.transport.urbain.userservice.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("KowihanTransit - User Service API")
                        .version("1.0.0")
                        .description("API de gestion des utilisateurs et authentification pour KowihanTransit. " +
                                "Ce service gère l'inscription, la connexion, les profils utilisateurs et les rôles.")
                        .contact(new Contact()
                                .name("KowihanTransit Team")
                                .email("support@kowihantransit.ma")
                                .url("https://kowihantransit.ma"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server().url("http://localhost:8082").description("Serveur de développement"),
                        new Server().url("http://localhost:8081").description("Via API Gateway")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Token JWT pour l'authentification")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}
