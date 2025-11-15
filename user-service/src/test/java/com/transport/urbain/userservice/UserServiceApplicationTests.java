package com.transport.urbain.userservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(exclude = {RabbitAutoConfiguration.class})
class UserServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}
