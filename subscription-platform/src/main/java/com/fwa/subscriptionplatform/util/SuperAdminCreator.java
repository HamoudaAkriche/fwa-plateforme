package com.fwa.subscriptionplatform.util;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import com.fwa.subscriptionplatform.user.AppUser;
import com.fwa.subscriptionplatform.user.AppUserRepository;

@Component
public class SuperAdminCreator implements CommandLineRunner {

    @Autowired
    private AppUserRepository users;

    @Autowired
    private BCryptPasswordEncoder encoder;

    @Override
    public void run(String... args) {
        String username = "superadmin";
        String password = "motdepasse";
        String role = AppUser.ROLE_SUPER_ADMIN;

        if (users.findByUsername(username).isEmpty()) {
            AppUser user = AppUser.builder()
                    .username(username)
                    .password(encoder.encode(password))
                    .role(role)
                    .build();
            users.save(user);
            System.out.println("Super admin account created: " + username);
        } else {
            System.out.println("Super admin account already exists: " + username);
        }
    }
}
