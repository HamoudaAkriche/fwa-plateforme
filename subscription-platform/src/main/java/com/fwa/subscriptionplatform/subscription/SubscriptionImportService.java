package com.fwa.subscriptionplatform.subscription;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.Reader;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SubscriptionImportService {

    private final SubscriptionRepository repository;

    public SubscriptionImportService(SubscriptionRepository repository) {
        this.repository = repository;
    }

    public record ImportResult(List<Subscription> imported, int skipped, List<String> errors) {}

    private record ParsedRow(int lineNumber, Map<String, String> values) {}

    public ImportResult importFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is required");
        }

        try {
            byte[] bytes = file.getBytes();
            List<ParsedRow> rows = readRows(file.getOriginalFilename(), file.getContentType(), bytes);
            List<Subscription> toSave = new ArrayList<>();
            List<String> errors = new ArrayList<>();

            for (ParsedRow row : rows) {
                Subscription subscription = toSubscription(row, errors);
                if (subscription != null) {
                    toSave.add(subscription);
                }
            }

            List<Subscription> imported = toSave.isEmpty() ? List.of() : repository.saveAll(toSave);
            return new ImportResult(imported, errors.size(), errors);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to read import file", ex);
        }
    }

    private List<ParsedRow> readRows(String originalFilename, String contentType, byte[] bytes) throws IOException {
        String fileName = originalFilename == null ? "" : originalFilename.toLowerCase(Locale.ROOT);
        String mediaType = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);

        if (fileName.endsWith(".csv") || mediaType.contains("csv")) {
            return readCsvRows(bytes);
        }

        if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || mediaType.contains("sheet")) {
            return readExcelRows(bytes);
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only CSV or Excel files are supported");
    }

    private List<ParsedRow> readCsvRows(byte[] bytes) throws IOException {
        String content = new String(bytes, StandardCharsets.UTF_8);
        char delimiter = detectDelimiter(content);

        try (Reader reader = new StringReader(content);
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setDelimiter(delimiter)
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setTrim(true)
                     .setIgnoreEmptyLines(true)
                     .build()
                     .parse(reader)) {

            List<ParsedRow> rows = new ArrayList<>();
            for (CSVRecord record : parser) {
                rows.add(new ParsedRow((int) record.getRecordNumber() + 1, new LinkedHashMap<>(record.toMap())));
            }
            return rows;
        }
    }

    private List<ParsedRow> readExcelRows(byte[] bytes) throws IOException {
        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null) {
                return List.of();
            }

            DataFormatter formatter = new DataFormatter(Locale.US);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                return List.of();
            }

            Map<Integer, String> headers = new LinkedHashMap<>();
            headerRow.forEach(cell -> {
                String header = normalizeKey(formatter.formatCellValue(cell));
                if (!header.isBlank()) {
                    headers.put(cell.getColumnIndex(), header);
                }
            });

            List<ParsedRow> rows = new ArrayList<>();
            for (int rowIndex = 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null || isBlankRow(row, formatter)) {
                    continue;
                }

                Map<String, String> values = new LinkedHashMap<>();
                for (Map.Entry<Integer, String> header : headers.entrySet()) {
                    String value = row.getCell(header.getKey()) == null ? "" : formatter.formatCellValue(row.getCell(header.getKey()));
                    values.put(header.getValue(), value);
                }
                rows.add(new ParsedRow(rowIndex + 1, values));
            }

            return rows;
        }
    }

    private boolean isBlankRow(Row row, DataFormatter formatter) {
        for (int cellIndex = row.getFirstCellNum(); cellIndex < row.getLastCellNum(); cellIndex++) {
            if (cellIndex >= 0 && row.getCell(cellIndex) != null && !formatter.formatCellValue(row.getCell(cellIndex)).isBlank()) {
                return false;
            }
        }
        return true;
    }

    private Subscription toSubscription(ParsedRow row, List<String> errors) {
        String msisdn = readValue(row.values(), "msisdn", "phone", "phoneNumber");
        String customerName = readValue(row.values(), "customername", "customer_name", "customer", "name");
        String offer = readValue(row.values(), "offer", "plan", "subscriptionoffer");
        Double latitude = parseDouble(readValue(row.values(), "latitude", "lat"));
        Double longitude = parseDouble(readValue(row.values(), "longitude", "lng", "lon"));

        if (msisdn == null || msisdn.isBlank() || customerName == null || customerName.isBlank() || offer == null || offer.isBlank()) {
            errors.add("Row " + row.lineNumber() + ": msisdn, customerName and offer are required");
            return null;
        }

        return Subscription.builder()
                .msisdn(msisdn.trim())
                .customerName(customerName.trim())
                .offer(offer.trim())
                .latitude(latitude)
                .longitude(longitude)
                .status(SubscriptionStatus.CREATED)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private String readValue(Map<String, String> values, String... aliases) {
        for (Map.Entry<String, String> entry : values.entrySet()) {
            String key = normalizeKey(entry.getKey());
            for (String alias : aliases) {
                if (key.equals(normalizeKey(alias))) {
                    return entry.getValue();
                }
            }
        }
        return null;
    }

    private Double parseDouble(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return null;
        }

        try {
            return Double.valueOf(rawValue.trim().replace(',', '.'));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private char detectDelimiter(String content) {
        String firstLine = content.lines().findFirst().orElse("");
        return firstLine.contains(";") && !firstLine.contains(",") ? ';' : ',';
    }

    private String normalizeKey(String value) {
        if (value == null) {
            return "";
        }

        return value.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }
}