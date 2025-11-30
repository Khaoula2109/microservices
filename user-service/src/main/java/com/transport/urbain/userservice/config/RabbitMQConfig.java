package com.transport.urbain.userservice.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
@Configuration
@Profile("!test")
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "transport_events";
    public static final String TICKET_PURCHASED_QUEUE = "loyalty.ticket.purchased";
    public static final String SUBSCRIPTION_CREATED_QUEUE = "loyalty.subscription.created";

    @Bean
    public Exchange transportExchange() {
        return new TopicExchange(EXCHANGE_NAME, true, false);
    }

    // Loyalty Points Queues
    @Bean
    public Queue ticketPurchasedQueue() {
        return new Queue(TICKET_PURCHASED_QUEUE, true);
    }

    @Bean
    public Queue subscriptionCreatedQueue() {
        return new Queue(SUBSCRIPTION_CREATED_QUEUE, true);
    }

    @Bean
    public Binding ticketPurchasedBinding(Queue ticketPurchasedQueue, TopicExchange transportExchange) {
        return BindingBuilder.bind(ticketPurchasedQueue)
                .to(transportExchange)
                .with("ticket.purchased");
    }

    @Bean
    public Binding subscriptionCreatedBinding(Queue subscriptionCreatedQueue, TopicExchange transportExchange) {
        return BindingBuilder.bind(subscriptionCreatedQueue)
                .to(transportExchange)
                .with("subscription.created");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        ObjectMapper objectMapper = new ObjectMapper();
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        final RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }
}