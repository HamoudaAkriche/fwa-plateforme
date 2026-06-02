package com.fwa.subscriptionplatform.subscription;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionHistoryRepository extends JpaRepository<SubscriptionHistory, Long> {
    List<SubscriptionHistory> findBySubscriptionIdOrderByActionDateDesc(Long subscriptionId);
    List<SubscriptionHistory> findTop10ByPerformedByOrderByActionDateDesc(String performedBy);
    long countByPerformedBy(String performedBy);
    long countByPerformedByAndAction(String performedBy, String action);
    long countByPerformedByAndActionDateBetween(String performedBy, java.time.LocalDateTime start, java.time.LocalDateTime end);
}