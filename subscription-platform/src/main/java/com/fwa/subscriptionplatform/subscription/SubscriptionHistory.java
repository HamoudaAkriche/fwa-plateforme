package com.fwa.subscriptionplatform.subscription;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "subscription_history")
public class SubscriptionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long subscriptionId;

    private String action;      // CREATE, ACTIVATE, SUSPEND, TERMINATE, DELETE
    private String performedBy; // username (agent)
    private LocalDateTime actionDate;

    public SubscriptionHistory() {}

    public SubscriptionHistory(Long subscriptionId, String action, String performedBy) {
        this.subscriptionId = subscriptionId;
        this.action = action;
        this.performedBy = performedBy;
        this.actionDate = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getSubscriptionId() { return subscriptionId; }
    public void setSubscriptionId(Long subscriptionId) { this.subscriptionId = subscriptionId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }

    public LocalDateTime getActionDate() { return actionDate; }
    public void setActionDate(LocalDateTime actionDate) { this.actionDate = actionDate; }
}