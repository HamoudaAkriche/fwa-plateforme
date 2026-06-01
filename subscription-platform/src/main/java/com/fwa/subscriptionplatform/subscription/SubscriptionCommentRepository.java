package com.fwa.subscriptionplatform.subscription;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionCommentRepository extends JpaRepository<SubscriptionComment, Long> {

    List<SubscriptionComment> findBySubscriptionIdOrderByCreatedAtDesc(Long subscriptionId);
}