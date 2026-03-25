package com.fwa.subscriptionplatform.user;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/setup")
public class UserController {

    private final AppUserRepository repository;
    private final PasswordEncoder encoder;

    public UserController(AppUserRepository repository, PasswordEncoder encoder) {
        this.repository = repository;
        this.encoder = encoder;
    }

    @PostMapping("/create-user")
    public String createUser(@RequestParam String username,
                             @RequestParam String password) {

        AppUser user = AppUser.builder()
                .username(username)
                .password(encoder.encode(password))
            .role(AppUser.ROLE_AGENT)
                .build();

        repository.save(user);
        return "User created";
    }
}