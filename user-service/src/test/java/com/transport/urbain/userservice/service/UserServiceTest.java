package com.transport.urbain.userservice.service;

import com.transport.urbain.userservice.dto.UserResponse;
import com.transport.urbain.userservice.model.User;
import com.transport.urbain.userservice.model.UserRole;
import com.transport.urbain.userservice.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setPhoneNumber("0600000000");
        testUser.setRole(UserRole.PASSENGER);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should get all users")
    void getAllUsers_Success() {
        // Given
        when(userRepository.findAllByOrderByIdDesc()).thenReturn(List.of(testUser));

        // When
        List<UserResponse> result = userService.getAllUsers();

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("test@example.com", result.get(0).getEmail());
    }

    @Test
    @DisplayName("Should get users by role")
    void getUsersByRole_Success() {
        // Given
        when(userRepository.findByRole(UserRole.PASSENGER)).thenReturn(List.of(testUser));

        // When
        List<UserResponse> result = userService.getUsersByRole(UserRole.PASSENGER);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(UserRole.PASSENGER, result.get(0).getRole());
    }

    @Test
    @DisplayName("Should get user by id")
    void getUserById_Success() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // When
        UserResponse result = userService.getUserById(1L);

        // Then
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("test@example.com", result.getEmail());
    }

    @Test
    @DisplayName("Should throw exception when user not found")
    void getUserById_NotFound() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () ->
            userService.getUserById(1L)
        );
    }

    @Test
    @DisplayName("Should update user role")
    void updateUserRole_Success() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        UserResponse result = userService.updateUserRole(1L, UserRole.ADMIN);

        // Then
        assertNotNull(result);
        assertEquals(UserRole.ADMIN, result.getRole());
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should delete user")
    void deleteUser_Success() {
        // Given - Create admin user as current authenticated user
        User adminUser = new User();
        adminUser.setId(2L);
        adminUser.setEmail("admin@example.com");
        adminUser.setFirstName("Admin");
        adminUser.setLastName("User");
        adminUser.setRole(UserRole.ADMIN);

        // Set up security context
        UsernamePasswordAuthenticationToken auth =
            new UsernamePasswordAuthenticationToken("admin@example.com", null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(adminUser));
        doNothing().when(userRepository).delete(any(User.class));

        // When
        userService.deleteUser(1L);

        // Then
        verify(userRepository).delete(testUser);
    }

    @Test
    @DisplayName("Should throw exception when deleting non-existent user")
    void deleteUser_NotFound() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () ->
            userService.deleteUser(1L)
        );
    }

    @Test
    @DisplayName("Should get user stats")
    void getUserStats_Success() {
        // Given
        when(userRepository.count()).thenReturn(10L);
        when(userRepository.countByRole(UserRole.PASSENGER)).thenReturn(5L);
        when(userRepository.countByRole(UserRole.ADMIN)).thenReturn(2L);
        when(userRepository.countByRole(UserRole.CONTROLLER)).thenReturn(2L);
        when(userRepository.countByRole(UserRole.DRIVER)).thenReturn(1L);

        // When
        Map<String, Object> result = userService.getUserStats();

        // Then
        assertNotNull(result);
        assertEquals(10L, result.get("total"));
        assertEquals(5L, result.get("passengers"));
        assertEquals(2L, result.get("admins"));
        assertEquals(2L, result.get("controllers"));
        assertEquals(1L, result.get("drivers"));
    }

    @Test
    @DisplayName("Should find user by email")
    void findByEmail_Success() {
        // Given
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        // When
        Optional<User> result = userRepository.findByEmail("test@example.com");

        // Then
        assertTrue(result.isPresent());
        assertEquals("test@example.com", result.get().getEmail());
    }
}
