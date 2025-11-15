package com.transport.urbain.userservice.controller;

import com.transport.urbain.userservice.dto.PasswordChangeRequest;
import com.transport.urbain.userservice.dto.UserUpdateRequest;
import com.transport.urbain.userservice.model.User;
import com.transport.urbain.userservice.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<User> getMyProfile() {
        User currentUser = userService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(currentUser);
    }

    @PutMapping("/me")
    public ResponseEntity<User> updateMyProfile(@Valid @RequestBody UserUpdateRequest updateRequest) {
        User updatedUser = userService.updateUserProfile(updateRequest);
        return ResponseEntity.ok(updatedUser);
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changeMyPassword(@Valid @RequestBody PasswordChangeRequest passwordRequest) {
        userService.changePassword(passwordRequest);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMyAccount() {
        userService.deleteCurrentUserAccount();
        return ResponseEntity.noContent().build();
    }
}