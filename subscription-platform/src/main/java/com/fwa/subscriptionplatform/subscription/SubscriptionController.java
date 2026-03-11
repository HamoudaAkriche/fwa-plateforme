package com.fwa.subscriptionplatform.subscription;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionRepository repository;
    private final SubscriptionHistoryRepository historyRepository;

    public SubscriptionController(SubscriptionRepository repository,
                              SubscriptionHistoryRepository historyRepository) {
    this.repository = repository;
    this.historyRepository = historyRepository;
}

    @PostMapping
    public Subscription create(@RequestBody Subscription subscription, Principal principal) {

        subscription.setCreatedAt(LocalDateTime.now());
        subscription.setStatus(SubscriptionStatus.CREATED);

        Subscription saved = repository.save(subscription);

        historyRepository.save(
            new SubscriptionHistory(
                saved.getId(),
        "CREATE",
                principal.getName()
            )
        );

        return saved;
    }

    @GetMapping
    public Page<Subscription> getAll(
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {

        Pageable pageable = PageRequest.of(page, size);

        if (q == null || q.trim().isEmpty()) {
            return repository.findAll(pageable);
        }

        String s = q.trim();

        return repository
            .findByMsisdnContainingIgnoreCaseOrCustomerNameContainingIgnoreCaseOrOfferContainingIgnoreCase(s, s, s, pageable);
    }

    @GetMapping("/stats")
    public SubscriptionStatsResponse getStats() {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime startOfTomorrow = startOfToday.plusDays(1);

        return new SubscriptionStatsResponse(
            repository.count(),
            repository.countByStatus(SubscriptionStatus.ACTIVE),
            repository.countByStatus(SubscriptionStatus.SUSPENDED),
            repository.countByStatus(SubscriptionStatus.TERMINATED),
            repository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(startOfToday, startOfTomorrow)
        );
    }

    public record SubscriptionStatsResponse(
        long totalSubscriptions,
        long active,
        long suspended,
        long terminated,
        long createdToday
    ) {
    }

        @PutMapping("/{id}/activate")
        public Subscription activate(@PathVariable Long id, Principal principal) {

            Subscription sub = repository.findById(id).orElseThrow();
            sub.setStatus(SubscriptionStatus.ACTIVE);
            Subscription saved = repository.save(sub);

            historyRepository.save(new SubscriptionHistory(
            id,
        "ACTIVATE",
            principal.getName()
        ));

        return saved;
    }

    @PutMapping("/{id}/suspend")
    public Subscription suspend(@PathVariable Long id, Principal principal) {

        Subscription sub = repository.findById(id).orElseThrow();
        sub.setStatus(SubscriptionStatus.SUSPENDED);
        Subscription saved = repository.save(sub);

        historyRepository.save(new SubscriptionHistory(
            id,
            "SUSPEND",
            principal.getName()
        ));

        return saved;
    }

    @PutMapping("/{id}/terminate")
    public Subscription terminate(@PathVariable Long id, Principal principal) {

        Subscription sub = repository.findById(id).orElseThrow();
        sub.setStatus(SubscriptionStatus.TERMINATED);
        Subscription saved = repository.save(sub);

        historyRepository.save(new SubscriptionHistory(
            id,
            "TERMINATE",
            principal.getName()
        ));

        return saved;
    }
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id, Principal principal) {

        repository.deleteById(id);

        historyRepository.save(new SubscriptionHistory(
            id,
            "DELETE",
            principal.getName()
        ));
    }
    @GetMapping("/{id}/history")
    public List<SubscriptionHistory> history(@PathVariable Long id) {
        return historyRepository.findBySubscriptionIdOrderByActionDateDesc(id);
    }
}