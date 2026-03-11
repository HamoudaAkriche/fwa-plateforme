package com.fwa.subscriptionplatform.subscription;

import java.time.LocalDateTime;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/web")
public class WebController {

    private final SubscriptionRepository repository;

    public WebController(SubscriptionRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/subscriptions")
    public String viewSubscriptions(@RequestParam(value = "q", required = false) String q,
                                    Model model) {
         if (q == null || q.isEmpty()) {
            model.addAttribute("subscriptions", repository.findAll());
        } else {    
            model.addAttribute("subscriptions", repository.findByMsisdnContainingIgnoreCaseOrCustomerNameContainingIgnoreCaseOrOfferContainingIgnoreCase(q, q, q));
        }
        model.addAttribute("q", q);
        return "subscriptions";
    }


    @PostMapping("/add")
    public String add(String msisdn, String customerName, String offer) {
        Subscription sub = new Subscription();
        sub.setMsisdn(msisdn);
        sub.setCustomerName(customerName);
        sub.setOffer(offer);
        sub.setStatus(SubscriptionStatus.CREATED);
        sub.setCreatedAt(LocalDateTime.now());

        repository.save(sub);
        return "redirect:/web/subscriptions";
    }

    @GetMapping("/delete/{id}")
    public String delete(@PathVariable Long id) {
        repository.deleteById(id);
        return "redirect:/web/subscriptions";
    }

    @GetMapping("/activate/{id}")
    public String activate(@PathVariable Long id) {
        Subscription sub = repository.findById(id).orElseThrow();
        sub.setStatus(SubscriptionStatus.ACTIVE);
        repository.save(sub);
        return "redirect:/web/subscriptions";
    }

    @GetMapping("/suspend/{id}")
    public String suspend(@PathVariable Long id) {
        Subscription sub = repository.findById(id).orElseThrow();
        sub.setStatus(SubscriptionStatus.SUSPENDED);
        repository.save(sub);
        return "redirect:/web/subscriptions";
    }

    @GetMapping("/terminate/{id}")
    public String terminate(@PathVariable Long id) {
        Subscription sub = repository.findById(id).orElseThrow();
        sub.setStatus(SubscriptionStatus.TERMINATED);
        repository.save(sub);
        return "redirect:/web/subscriptions";
    }
    
}