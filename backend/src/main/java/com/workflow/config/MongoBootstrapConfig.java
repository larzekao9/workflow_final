package com.workflow.config;

import com.workflow.model.User;
import com.workflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class MongoBootstrapConfig {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public ApplicationRunner seedSuperAdmin() {
        return args -> {
            String email = "superadmin@viva.com";
            if (!userRepository.existsByEmail(email)) {
                User superAdmin = new User();
                superAdmin.setName("Super Admin");
                superAdmin.setEmail(email);
                superAdmin.setPassword(passwordEncoder.encode("12345"));
                superAdmin.setRole(User.Role.SUPERADMIN);
                userRepository.save(superAdmin);
            }

            String adminEmail = "admin@viva.com";
            if (!userRepository.existsByEmail(adminEmail)) {
                User admin = new User();
                admin.setName("Admin Viva");
                admin.setEmail(adminEmail);
                admin.setPassword(passwordEncoder.encode("12345"));
                admin.setRole(User.Role.ADMIN);
                userRepository.save(admin);
            }
        };
    }
}
