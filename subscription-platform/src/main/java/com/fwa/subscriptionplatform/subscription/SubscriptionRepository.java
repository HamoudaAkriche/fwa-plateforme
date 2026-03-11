package com.fwa.subscriptionplatform.subscription;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    List<Subscription> findByMsisdnContainingIgnoreCaseOrCustomerNameContainingIgnoreCaseOrOfferContainingIgnoreCase(
        String msisdn,
        String customerName,
        String offer
    );

    Page<Subscription> findByMsisdnContainingIgnoreCaseOrCustomerNameContainingIgnoreCaseOrOfferContainingIgnoreCase(
        String msisdn,
        String customerName,
        String offer,
        Pageable pageable
    );

    long countByStatus(SubscriptionStatus status);

    long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(LocalDateTime start, LocalDateTime end);

}