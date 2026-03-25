package com.fwa.subscriptionplatform.security;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.fwa.subscriptionplatform.user.AppUser;
import com.fwa.subscriptionplatform.user.AppUserRepository;

@RestController
@RequestMapping("/api/admin")
public class AdminUserController {

    private final AppUserRepository users;
    private final org.springframework.security.crypto.password.PasswordEncoder encoder;

    public AdminUserController(AppUserRepository users,
                               org.springframework.security.crypto.password.PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    public record CreateAgentRequest(String username, String password) {}
    public record UserResponse(String username, String role) {}

    @PostMapping("/agents")
    public UserResponse createAgent(@RequestBody CreateAgentRequest req) {
        if (req.username() == null || req.username().isBlank() || req.password() == null || req.password().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username and password are required");
        }

        String username = req.username().trim();
        if (users.findByUsername(username).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }

        var user = AppUser.builder()
                .username(username)
                .password(encoder.encode(req.password()))
                .role(AppUser.ROLE_AGENT)
                .build();

        users.save(user);
        return new UserResponse(user.getUsername(), user.getRole());
    }
}