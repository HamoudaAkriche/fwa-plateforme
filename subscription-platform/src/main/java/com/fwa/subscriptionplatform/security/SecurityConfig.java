package com.fwa.subscriptionplatform.security;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter) throws Exception {
    http
        // 1. Appliquer CORS
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        // 2. Désactiver CSRF (indispensable pour les APIs REST/JWT)
        .csrf(csrf -> csrf.disable()) 
        // 3. Définir les autorisations d'accès aux routes
        .authorizeHttpRequests(auth -> auth
            // Allow CORS preflight requests
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
            // Allow unauthenticated access to authentication endpoints
            .requestMatchers("/api/auth/**").permitAll()
            // Admin endpoints require SUPER_ADMIN role
            .requestMatchers("/api/admin/**").hasRole("SUPER_ADMIN")
            // All other API endpoints require authentication
            .requestMatchers("/api/**").authenticated()
            // Everything else requires authentication
            .anyRequest().authenticated()
        )
        // Register the JWT authentication filter so it populates SecurityContext
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        
    return http.build();
}

    // 2. C'est CE Bean qui va dicter les règles CORS à tout Spring Security ET Spring MVC
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        
        // Autorise explicitement ton origine No-IP et localhost
        config.setAllowedOriginPatterns(List.of(
            "*"
        ));
        
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}