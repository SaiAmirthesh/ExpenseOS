package com.ExpenseOS.Backend.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-expiration}")
    private long accessTokenExpiration;

    private SecretKey getSigningKey(){
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateAccessToken(String email, Long tokenVersion) {
        return buildToken(email, tokenVersion, accessTokenExpiration);
    }

    private String buildToken(String email, Long tokenVersion, long expiration) {
        return Jwts.builder()
                .subject(email)
                .claim("tokenVersion", tokenVersion == null ? 0L : tokenVersion)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractEmail(String token){
        return extractClaim(token, Claims::getSubject);
    }

    public Long extractTokenVersion(String token) {
        Number version = extractClaim(token, claims -> claims.get("tokenVersion", Number.class));
        return version == null ? 0L : version.longValue();
    }

    public <T> T extractClaim(
            String token,
            Function<Claims, T> resolver
    ) {

        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return resolver.apply(claims);
    }

    public boolean isTokenValid(String token, String email) {
        return isTokenValid(token, email, 0L);
    }

    public boolean isTokenValid(String token, String email, Long tokenVersion){
        return email.equals(extractEmail(token))
                && extractTokenVersion(token).equals(tokenVersion == null ? 0L : tokenVersion)
                && !isTokenExpired(token);
    }

    public boolean isTokenExpired(String token){
        Date expiration = extractClaim(token,Claims::getExpiration);
        return expiration.before(new Date());
    }
}
