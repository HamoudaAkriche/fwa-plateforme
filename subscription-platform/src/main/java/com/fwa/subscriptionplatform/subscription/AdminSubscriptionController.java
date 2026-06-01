package com.fwa.subscriptionplatform.subscription;

import java.security.Principal;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/subscriptions")
public class AdminSubscriptionController {

    private final SubscriptionImportService importService;
    private final SubscriptionHistoryRepository historyRepository;

    public AdminSubscriptionController(SubscriptionImportService importService,
                                       SubscriptionHistoryRepository historyRepository) {
        this.importService = importService;
        this.historyRepository = historyRepository;
    }

    public record ImportResponse(int imported, int skipped, java.util.List<String> errors) {}

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportResponse importSubscriptions(@RequestParam("file") MultipartFile file, Principal principal) {
        var result = importService.importFile(file);
        String actor = principal == null ? "anonymous" : principal.getName();

        for (Subscription subscription : result.imported()) {
            historyRepository.save(new SubscriptionHistory(subscription.getId(), "CREATE", actor));
        }

        return new ImportResponse(result.imported().size(), result.skipped(), result.errors());
    }
}