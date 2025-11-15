package com.transport.apigateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ApigatewayApplication {

	public static void main(String[] args) {
		SpringApplication.run(ApigatewayApplication.class, args);

        System.out.println("""
                
                ╔════════════════════════════════════════════════════════╗
                ║   🚀 API GATEWAY - TRANSPORT URBAIN DÉMARRÉ            ║
                ║                                                        ║
                ║   📍 Port: 8081                                        ║
                ║   🔒 JWT Auth: ENABLED                                  ║
                ║   🛡️  Circuit Breaker: ACTIVE                          ║
                ║   📊 Actuator: http://localhost:8081/actuator          ║
                ║   🗺️  Routes: http://localhost:8081/actuator/gateway   ║
                ╚════════════════════════════════════════════════════════╝
                """);
	}

}
