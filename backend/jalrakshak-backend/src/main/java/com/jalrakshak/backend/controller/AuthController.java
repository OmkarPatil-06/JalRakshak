package com.jalrakshak.backend.controller;

import com.jalrakshak.backend.model.User;
import com.jalrakshak.backend.repository.UserRepository;
import com.jalrakshak.backend.service.AuthSessionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository userRepository;
    private final AuthSessionService sessions;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    public AuthController(UserRepository userRepository, AuthSessionService sessions) { this.userRepository=userRepository; this.sessions=sessions; }
    public record LoginRequest(String email, String password, String role) {}
    public record LoginResponse(boolean success, String message, Long userId, String fullName, String email, String role, String token) {}

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody(required=false) LoginRequest request) {
        if(request==null || blank(request.email()) || blank(request.password()) || blank(request.role())) return ResponseEntity.badRequest().body(failure("Email, password and role are required."));
        String selected=AuthSessionService.normalize(request.role());
        if(!selected.equals("ADMINISTRATOR") && !selected.equals("DATA_VERIFIER") && !selected.equals("USER")) return unauthorized();
        Optional<User> match=userRepository.findByEmail(request.email().trim());
        if(match.isEmpty()) return unauthorized();
        User user=match.get(); String dbRole=AuthSessionService.normalize(user.getRole());
        boolean roleMatches = selected.equals("ADMINISTRATOR") ? dbRole.equals("ADMINISTRATOR")||dbRole.equals("ADMIN")
                : selected.equals("DATA_VERIFIER") ? dbRole.equals("DATA_VERIFIER")
                : dbRole.equals("USER")||dbRole.equals("OFFICER")||dbRole.equals("CITIZEN");
        String hash=user.getPassword();
        if(!roleMatches || hash==null || !(hash.startsWith("$2a$")||hash.startsWith("$2b$")||hash.startsWith("$2y$"))) return unauthorized();
        boolean valid; try { valid=passwordEncoder.matches(request.password(),hash); } catch(IllegalArgumentException ex){valid=false;}
        if(!valid) return unauthorized();
        String token=sessions.create(user);
        return ResponseEntity.ok(new LoginResponse(true,"Credentials verified.",user.getUserId(),user.getFullName(),user.getEmail(),selected,token));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value="Authorization",required=false) String authorization){ sessions.revoke(authorization); return ResponseEntity.ok(java.util.Map.of("success",true,"message","Session closed.")); }
    private boolean blank(String v){return v==null||v.isBlank();}
    private LoginResponse failure(String m){return new LoginResponse(false,m,null,null,null,null,null);}
    private ResponseEntity<LoginResponse> unauthorized(){return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(failure("Invalid email, password or selected role."));}
}
