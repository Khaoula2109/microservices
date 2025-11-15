package com.transport.apigateway.util;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String SECRET_KEY;

    public JwtUtil() {
        log.info("🔐 JwtUtil initialisé - Compatible avec user-service");
    }

    
    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    
    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        Claims claims = extractClaims(token);
        Object rolesObj = claims.get("roles");
        
        if (rolesObj instanceof List) {
            return (List<String>) rolesObj;
        }
        
        return List.of();
    }

    
    public boolean validateToken(String token) {
        try {
            Claims claims = extractClaims(token);
            boolean isValid = !isTokenExpired(claims);
            
            if (isValid) {
                log.debug("✅ Token valide pour: {}", claims.getSubject());
                log.debug("   Roles: {}", claims.get("roles"));
                log.debug("   Émis le: {}", claims.getIssuedAt());
                log.debug("   Expire le: {}", claims.getExpiration());
            } else {
                log.warn("❌ Token expiré pour: {}", claims.getSubject());
                log.warn("   Expiré le: {}", claims.getExpiration());
            }
            
            return isValid;
            
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            log.error("❌ Token expiré: {}", e.getMessage());
            return false;
        } catch (io.jsonwebtoken.SignatureException e) {
            log.error("❌ Signature invalide (JWT_SECRET différent ?): {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("❌ Validation JWT échouée: {} - {}", e.getClass().getSimpleName(), e.getMessage());
            return false;
        }
    }

    
    private Claims extractClaims(String token) {
        return Jwts.parser()
                .setSigningKey(SECRET_KEY)
                .parseClaimsJws(token)
                .getBody();
    }

    
    private boolean isTokenExpired(Claims claims) {
        Date expiration = claims.getExpiration();
        return expiration.before(new Date());
    }
    public String extractUserId(String token) {
        try {
            Claims claims = extractClaims(token);
            
            log.debug("🔍 Extraction userId - Claims disponibles: {}", claims.keySet());
            
            
            Object userIdObj = claims.get("userId");
            if (userIdObj != null) {
                String userId = userIdObj.toString();
                log.debug("✅ UserId trouvé avec clé 'userId': {}", userId);
                return userId;
            }
            
            userIdObj = claims.get("id");
            if (userIdObj != null) {
                String userId = userIdObj.toString();
                log.debug("✅ UserId trouvé avec clé 'id': {}", userId);
                return userId;
            }
            
            userIdObj = claims.get("user_id");
            if (userIdObj != null) {
                String userId = userIdObj.toString();
                log.debug("✅ UserId trouvé avec clé 'user_id': {}", userId);
                return userId;
            }
            
            userIdObj = claims.get("sub_id");
            if (userIdObj != null) {
                String userId = userIdObj.toString();
                log.debug("✅ UserId trouvé avec clé 'sub_id': {}", userId);
                return userId;
            }
            
            
            String subject = claims.getSubject();
            if (subject != null && subject.matches("\\d+")) {
                log.debug("✅ UserId trouvé dans le subject: {}", subject);
                return subject;
            }
            
            log.warn("⚠️ Aucune clé userId trouvée dans le token. Subject: {}", subject);
            log.debug("🔍 Toutes les clés du token: {}", claims.keySet());
            
            return null;
            
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'extraction de l'userId: {}", e.getMessage());
            return null;
        }
    }
}