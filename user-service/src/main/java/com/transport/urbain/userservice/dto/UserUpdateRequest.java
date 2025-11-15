package com.transport.urbain.userservice.dto;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserUpdateRequest {

    @NotBlank(message = "Le prénom ne peut pas être vide.")
    private String firstName;

    @NotBlank(message = "Le nom de famille ne peut pas être vide.")
    private String lastName;

    @Size(min = 10, max = 15, message = "Le numéro de téléphone doit contenir entre 10 et 15 caractères")
    private String phoneNumber;
}