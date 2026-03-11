package com.fwa.subscriptionplatform.security;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.fwa.subscriptionplatform.user.AppUser;
import com.fwa.subscriptionplatform.user.AppUserRepository;

@Configuration
public class DefaultUserInitializer {

    @Bean
    CommandLineRunner seedDefaultUser(AppUserRepository users, PasswordEncoder encoder) {
        return args -> {
            var defaultUsername = "hamouda";
            var encodedPassword = encoder.encode("1234");

            var user = users.findByUsername(defaultUsername)
                    .orElseGet(() -> AppUser.builder().username(defaultUsername).build());

            user.setPassword(encodedPassword);
            users.save(user);
        };
    }
}