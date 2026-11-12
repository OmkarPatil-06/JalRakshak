package com.jalrakshak.backend.service;

import com.jalrakshak.backend.model.User;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthSessionService {
    private static final int TOKEN_BYTES = 32;
    private static final long SESSION_HOURS = 8;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, SessionUser> sessions = new ConcurrentHashMap<>();

    public String create(User user) {
        byte[] bytes = new byte[TOKEN_BYTES];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        sessions.put(token, new SessionUser(user.getUserId(), user.getFullName(), user.getEmail(), normalize(user.getRole()), LocalDateTime.now().plusHours(SESSION_HOURS)));
        return token;
    }

    public SessionUser authenticate(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) return null;
        String token = authorization.substring(7).trim();
        SessionUser user = sessions.get(token);
        if (user == null) return null;
        if (user.expiresAt().isBefore(LocalDateTime.now())) {
            sessions.remove(token);
            return null;
        }
        return user;
    }

    public void revoke(String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) sessions.remove(authorization.substring(7).trim());
    }

    public void revokeUserSessions(Long userId) {
        sessions.entrySet().removeIf(entry -> entry.getValue().userId().equals(userId));
    }

    public static String normalize(String role) {
        return role == null ? "" : role.trim().toUpperCase(java.util.Locale.ROOT);
    }

    public record SessionUser(Long userId, String fullName, String email, String role, LocalDateTime expiresAt) {
        public boolean canVerify() { return role.equals("ADMIN") || role.equals("ADMINISTRATOR") || role.equals("DATA_VERIFIER"); }
        public boolean isAdmin() { return role.equals("ADMIN") || role.equals("ADMINISTRATOR"); }
    }
}
