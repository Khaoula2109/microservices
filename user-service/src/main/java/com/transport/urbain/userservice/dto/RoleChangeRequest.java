package com.transport.urbain.userservice.dto;

import com.transport.urbain.userservice.model.UserRole;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RoleChangeRequest {
    @NotNull(message = "Le rôle est requis")
    private UserRole role;
}
