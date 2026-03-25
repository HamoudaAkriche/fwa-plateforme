package com.fwa.subscriptionplatform.security;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.fwa.subscriptionplatform.user.AppUser;
import com.fwa.subscriptionplatform.user.AppUserRepository;

@Configuration
public class DefaultUserInitializer {

    @Bean
    CommandLineRunner seedDefaultUser(AppUserRepository users, PasswordEncoder encoder, JdbcTemplate jdbcTemplate) {
        return args -> {
            // Ensure old databases get the role column before JPA queries include it.
            jdbcTemplate.execute("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS role VARCHAR(64)");
            jdbcTemplate.update("UPDATE app_users SET role = ? WHERE role IS NULL", AppUser.ROLE_AGENT);

            var defaultUsername = "hamouda";
            var encodedPassword = encoder.encode("1234");

            var user = users.findByUsername(defaultUsername)
                    .orElseGet(() -> AppUser.builder().username(defaultUsername).build());

            user.setPassword(encodedPassword);
            user.setRole(AppUser.ROLE_SUPER_ADMIN);
            users.save(user);
        };
    }
}