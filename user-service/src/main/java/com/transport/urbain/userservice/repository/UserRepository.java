package com.transport.urbain.userservice.repository;

import com.transport.urbain.userservice.model.User;
import com.transport.urbain.userservice.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByRole(UserRole role);
    List<User> findAllByOrderByIdDesc();
    long countByRole(UserRole role);
}