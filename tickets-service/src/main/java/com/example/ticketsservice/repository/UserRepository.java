package com.example.ticketsservice.repository;

import com.example.ticketsservice.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
}