package com.fwa.subscriptionplatform.admin;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fwa.subscriptionplatform.subscription.SubscriptionRepository;
import com.fwa.subscriptionplatform.subscription.SubscriptionStatus;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final SubscriptionRepository repository;

    public AdminDashboardController(SubscriptionRepository repository) {
        this.repository = repository;
    }

    public record AdminKpiResponse(
            long totalSubscriptions,
            long active,
            long suspended,
            long terminated,
            long createdToday) {}

    @GetMapping("/kpis")
    public AdminKpiResponse getKpis() {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime startOfTomorrow = startOfToday.plusDays(1);

        return new AdminKpiResponse(
                repository.count(),
                repository.countByStatus(SubscriptionStatus.ACTIVE),
                repository.countByStatus(SubscriptionStatus.SUSPENDED),
                repository.countByStatus(SubscriptionStatus.TERMINATED),
                repository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(startOfToday, startOfTomorrow)
        );
    }
}