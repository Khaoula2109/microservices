package com.transport.urbain.userservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.amqp.RabbitAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(excludeAutoConfiguration = RabbitAutoConfiguration.class)
class UserServiceApplicationTests {

    @Test
    void contextLoads() {
    }

}