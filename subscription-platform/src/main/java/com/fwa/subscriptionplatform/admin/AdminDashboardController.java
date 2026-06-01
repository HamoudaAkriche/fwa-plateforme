package com.fwa.subscriptionplatform.admin;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fwa.subscriptionplatform.subscription.SubscriptionCommentRepository;
import com.fwa.subscriptionplatform.subscription.SubscriptionHistoryRepository;
import com.fwa.subscriptionplatform.subscription.SubscriptionRepository;
import com.fwa.subscriptionplatform.subscription.SubscriptionStatus;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final SubscriptionRepository repository;
    private final SubscriptionCommentRepository commentRepository;
    private final SubscriptionHistoryRepository historyRepository;

    public AdminDashboardController(SubscriptionRepository repository,
                                    SubscriptionCommentRepository commentRepository,
                                    SubscriptionHistoryRepository historyRepository) {
        this.repository = repository;
        this.commentRepository = commentRepository;
        this.historyRepository = historyRepository;
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

    // KPIs for a specific user (by username)
    @GetMapping("/kpis/{username}")
    public UserKpiResponse getKpisForUser(@PathVariable String username) {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime startOfTomorrow = startOfToday.plusDays(1);

        long comments = commentRepository.countByCreatedBy(username);
        long actions = historyRepository.countByPerformedBy(username);
        long createdToday = historyRepository.countByPerformedByAndActionDateBetween(username, startOfToday, startOfTomorrow);
        long createsToday = historyRepository.countByPerformedByAndAction(username, "CREATE");

        return new UserKpiResponse(username, comments, actions, createsToday, createdToday);
    }

    public record UserKpiResponse(String username, long commentsCount, long totalActions, long creates, long actionsToday) {}
}