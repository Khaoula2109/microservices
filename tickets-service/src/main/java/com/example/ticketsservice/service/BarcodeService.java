package com.example.ticketsservice.service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import javax.imageio.ImageIO;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

@Service
public class BarcodeService {

    private static final Logger log = LoggerFactory.getLogger(BarcodeService.class);
    private static final int QR_CODE_WIDTH = 300;
    private static final int QR_CODE_HEIGHT = 300;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Generate a QR code data string containing all ticket information
     */
    public String generateQrCodeData(Long ticketId, Long userId, String ticketType, LocalDateTime purchaseDate, String uniqueCode) {
        try {
            Map<String, Object> qrData = new HashMap<>();
            qrData.put("ticketId", ticketId.toString());
            qrData.put("userId", userId.toString());
            qrData.put("ticketType", ticketType);
            qrData.put("purchaseDate", purchaseDate.toString());
            qrData.put("uniqueCode", uniqueCode);
            qrData.put("type", "TICKET");

            return objectMapper.writeValueAsString(qrData);
        } catch (Exception e) {
            log.error("Error generating QR code data: {}", e.getMessage());
            // Fallback to simple format
            return String.format("TICKET-%s-%s", ticketId, uniqueCode);
        }
    }

    /**
     * Generate a QR code data string for subscriptions
     */
    public String generateSubscriptionQrCodeData(Long subscriptionId, Long userId, String planName, LocalDateTime endDate, String uniqueCode) {
        try {
            Map<String, Object> qrData = new HashMap<>();
            qrData.put("subscriptionId", subscriptionId.toString());
            qrData.put("userId", userId.toString());
            qrData.put("planName", planName);
            qrData.put("endDate", endDate.toString());
            qrData.put("uniqueCode", uniqueCode);
            qrData.put("type", "SUBSCRIPTION");

            return objectMapper.writeValueAsString(qrData);
        } catch (Exception e) {
            log.error("Error generating subscription QR code data: {}", e.getMessage());
            return String.format("SUB-%s-%s", subscriptionId, uniqueCode);
        }
    }

    /**
     * Generate QR code image and return as Base64 encoded string
     */
    public String generateQrCodeImageBase64(String qrCodeData) throws WriterException, IOException {
        BufferedImage qrImage = generateQrCodeImage(qrCodeData);
        return encodeImageToBase64(qrImage);
    }

    /**
     * Generate QR code BufferedImage
     */
    public BufferedImage generateQrCodeImage(String qrCodeData) throws WriterException {
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H);
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
        hints.put(EncodeHintType.MARGIN, 1);

        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(qrCodeData, BarcodeFormat.QR_CODE, QR_CODE_WIDTH, QR_CODE_HEIGHT, hints);

        return MatrixToImageWriter.toBufferedImage(bitMatrix);
    }

    /**
     * Encode BufferedImage to Base64 string
     */
    public String encodeImageToBase64(BufferedImage image) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "png", baos);
        byte[] imageBytes = baos.toByteArray();
        return Base64.getEncoder().encodeToString(imageBytes);
    }

    /**
     * Decode QR code data from JSON string
     */
    public Map<String, Object> decodeQrCodeData(String qrCodeData) {
        try {
            return objectMapper.readValue(qrCodeData, Map.class);
        } catch (Exception e) {
            log.error("Error decoding QR code data: {}", e.getMessage());
            // Return a simple map with the raw data
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("rawData", qrCodeData);
            return fallback;
        }
    }
}
