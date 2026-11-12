package com.jalrakshak.backend.controller;

import com.jalrakshak.backend.model.User;
import com.jalrakshak.backend.repository.UserRepository;
import com.jalrakshak.backend.service.AuthSessionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository userRepository;
    private final AuthSessionService sessions;
    public UserController(UserRepository userRepository, AuthSessionService sessions) { this.userRepository=userRepository; this.sessions=sessions; }

    @GetMapping
    public List<User> getAllUsers() { return userRepository.findAll(); }

    @GetMapping("/verification-roles")
    public ResponseEntity<?> getVerificationRoles(@RequestHeader(value="Authorization",required=false) String authorization){
        AuthSessionService.SessionUser actor=sessions.authenticate(authorization);
        if(actor==null)return denied();
        if(!actor.isAdmin())return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message","Only administrators can manage verifier assignments."));
        List<Map<String,Object>> users=new ArrayList<>();
        for(User u:userRepository.findAll()){
            if(AuthSessionService.normalize(u.getRole()).equals("ADMIN")||AuthSessionService.normalize(u.getRole()).equals("ADMINISTRATOR"))continue;
            users.add(Map.of("userId",u.getUserId(),"fullName",u.getFullName()==null?"":u.getFullName(),"email",u.getEmail()==null?"":u.getEmail(),"role",u.getRole()==null?"USER":u.getRole()));
        }
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{id}/verification-role")
    public ResponseEntity<?> updateVerificationRole(@PathVariable Long id,@RequestBody Map<String,String> body,@RequestHeader(value="Authorization",required=false) String authorization){
        AuthSessionService.SessionUser actor=sessions.authenticate(authorization);
        if(actor==null)return denied();
        if(!actor.isAdmin())return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message","Only administrators can assign Data Verifier access."));
        User user=userRepository.findById(id).orElse(null); if(user==null)return ResponseEntity.notFound().build();
        String role=AuthSessionService.normalize(body==null?null:body.get("role"));
        if(!role.equals("DATA_VERIFIER")&&!role.equals("USER"))return ResponseEntity.badRequest().body(Map.of("message","Role must be DATA_VERIFIER or USER."));
        if(AuthSessionService.normalize(user.getRole()).equals("ADMIN")||AuthSessionService.normalize(user.getRole()).equals("ADMINISTRATOR"))return ResponseEntity.badRequest().body(Map.of("message","Administrator roles cannot be changed here."));
        user.setRole(role); userRepository.save(user);
        // Role changes take effect immediately by invalidating any old sessions.
        sessions.revokeUserSessions(user.getUserId());
        return ResponseEntity.ok(Map.of("message",role.equals("DATA_VERIFIER")?"Data Verifier access assigned.":"Data Verifier access removed.","userId",user.getUserId(),"role",role));
    }
    private ResponseEntity<?> denied(){return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message","A valid signed-in session is required."));}
}
