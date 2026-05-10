package com.fwa.subscriptionplatform.security;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 1. On active explicitement la configuration CORS gérée par le bean corsConfigurationSource()
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // On désactive CSRF si tu utilises des JWT (très classique)
            .csrf(csrf -> csrf.disable()) 
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll() // Ou tes règles de sécurité habituelles
            );
            
        return http.build();
    }

    // 2. C'est CE Bean qui va dicter les règles CORS à tout Spring Security ET Spring MVC
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        
        // Autorise explicitement ton origine No-IP et localhost
        config.setAllowedOriginPatterns(List.of(
            "http://localhost:30080",
            "http://fwasubscription.myvnc.com",
            "http://197.3.69.200:30080"
        ));
        
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}