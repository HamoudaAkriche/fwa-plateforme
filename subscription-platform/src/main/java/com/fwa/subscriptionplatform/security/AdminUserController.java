package com.fwa.subscriptionplatform.security;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
    private final BCryptPasswordEncoder encoder;

    public AdminUserController(AppUserRepository users,
                               BCryptPasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    public record CreateAccountRequest(String username, String password, String role) {}
    public record UserResponse(Long id, String username, String role) {}

    @PostMapping("/agents")
    public UserResponse createAgent(@RequestBody CreateAccountRequest req) {
        if (req.username() == null || req.username().isBlank() || req.password() == null || req.password().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username and password are required");
        }

        String username = req.username().trim();
        if (users.findByUsername(username).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }

        String role = (req.role() != null && !req.role().isBlank()) ? req.role().trim() : AppUser.ROLE_AGENT;
        if (!role.equals(AppUser.ROLE_AGENT) && !role.equals(AppUser.ROLE_SUPER_ADMIN)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role");
        }

        var user = AppUser.builder()
                .username(username)
                .password(encoder.encode(req.password()))
                .role(role)
                .build();

        users.save(user);
        return new UserResponse(user.getId(), user.getUsername(), user.getRole());
    }

    @GetMapping("/users")
    public List<UserResponse> listUsers() {
        return users.findAll().stream()
                .map(user -> new UserResponse(user.getId(), user.getUsername(), user.getRole()))
                .toList();
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Long id, Principal principal) {
        var user = users.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (principal != null && principal.getName() != null && principal.getName().equals(user.getUsername())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot delete your own account");
        }

        if (AppUser.ROLE_SUPER_ADMIN.equals(user.getRole()) && users.countByRole(AppUser.ROLE_SUPER_ADMIN) <= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one super admin must remain");
        }

        users.delete(user);
    }
}