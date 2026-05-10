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
        // 1. Appliquer CORS
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        // 2. Désactiver CSRF (indispensable pour les APIs REST/JWT)
        .csrf(csrf -> csrf.disable()) 
        // 3. Définir les autorisations d'accès aux routes
        .authorizeHttpRequests(auth -> auth
            // AUTORISE tout le monde à accéder aux endpoints d'authentification !
            .requestMatchers("/api/**").permitAll() 
            // Si tu as d'autres endpoints publics (ex: enregistrement, public-info), ajoute-les ici :
            // .requestMatchers("/api/public/**").permitAll()
            
            // Tout le reste nécessite d'être connecté
            .anyRequest().authenticated() 
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