package com.example.ticketsservice.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ControllerScannerController {

    @GetMapping("/scanner")
    public String scannerPage() {
        return "forward:/controller-scanner.html";
    }

    @GetMapping("/")
    public String homePage() {
        return "forward:/controller-scanner.html";
    }
}
