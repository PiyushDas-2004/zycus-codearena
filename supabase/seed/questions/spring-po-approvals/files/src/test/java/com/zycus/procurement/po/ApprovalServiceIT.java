package com.zycus.procurement.po;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.zycus.procurement.po.Dtos.BatchResult;
import com.zycus.procurement.po.Dtos.InvoiceLine;
import com.zycus.procurement.po.Dtos.InvoiceRequest;
import com.zycus.procurement.po.Dtos.PurchaseOrderDto;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.stream.IntStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.Page;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Runs against a real PostgreSQL (Testcontainers): {@code mvn verify}. The schema is generated from
 * the entities, and Hibernate is told to fail instead of paging a collection fetch in memory.
 */
@Testcontainers
@SpringBootTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.query.fail_on_pagination_over_collection_fetch=true"})
@Import(ApprovalServiceIT.Fakes.class)
class ApprovalServiceIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:16-alpine");

    @TestConfiguration
    static class Fakes {
        @Bean
        TestBudget budgetService() {
            return new TestBudget();
        }
    }

    /**
     * Like the finance module's implementation, a reservation only exists once the transaction that
     * made it commits. Refuses the POs in {@link #refused}; {@link #delay} widens race windows.
     */
    static class TestBudget implements BudgetService {
        final Set<Long> refused = ConcurrentHashMap.newKeySet();
        final List<Long> reserved = new CopyOnWriteArrayList<>();
        volatile Duration delay = Duration.ZERO;

        @Override
        public void reserve(long purchaseOrderId, BigDecimal amount) throws BudgetExceededException {
            sleep(delay);
            if (refused.contains(purchaseOrderId)) {
                throw new BudgetExceededException("Cost centre is out of budget");
            }
            if (!TransactionSynchronizationManager.isSynchronizationActive()) {
                reserved.add(purchaseOrderId);
                return;
            }
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    reserved.add(purchaseOrderId);
                }
            });
        }

        long reservationsFor(long id) {
            return reserved.stream().filter(r -> r == id).count();
        }
    }

    @Autowired ApprovalService service;
    @Autowired PurchaseOrderController controller;
    @Autowired PurchaseOrderRepository orders;
    @Autowired IdempotencyRecordRepository idempotency;
    @Autowired TestBudget budget;
    @Autowired TransactionTemplate tx;

    @BeforeEach
    void reset() {
        idempotency.deleteAll();
        orders.deleteAll();
        budget.refused.clear();
        budget.reserved.clear();
        budget.delay = Duration.ZERO;
    }

    // ---- transactions -------------------------------------------------------------------------

    @Test
    @DisplayName("a rejection is saved")
    void rejectionIsSaved() {
        long id = po("PO-1", "5000.00");

        service.reject(id, "asha", "Wrong vendor");

        PurchaseOrder saved = reload(id);
        assertThat(saved.getStatus()).isEqualTo(PoStatus.REJECTED);
        assertThat(saved.getRejectionReason()).isEqualTo("Wrong vendor");
    }

    @Test
    @DisplayName("an approval the budget refuses changes nothing, and can be retried later")
    void refusedApprovalIsRolledBack() throws Exception {
        long id = po("PO-2", "5000.00");
        budget.refused.add(id);

        assertThatThrownBy(() -> service.approve(id, "asha", "key-1")).isInstanceOf(BudgetExceededException.class);

        assertThat(reload(id).getStatus()).isEqualTo(PoStatus.PENDING);
        assertThat(reload(id).getApprovalsReceived()).isZero();

        budget.refused.clear();
        assertThat(service.approve(id, "asha", "key-1").status()).isEqualTo(PoStatus.APPROVED);
        assertThat(budget.reservationsFor(id)).isEqualTo(1);
    }

    // ---- idempotency ----------------------------------------------------------------------------

    @Test
    @DisplayName("a retried request (same key) is applied once")
    void retryIsAppliedOnce() throws Exception {
        long id = po("PO-3", "2500000.00");

        service.approve(id, "asha", "key-1");
        PurchaseOrderDto retry = service.approve(id, "asha", "key-1");

        assertThat(retry.approvalsReceived()).isEqualTo(1);
        assertThat(reload(id).getApprovalsReceived()).isEqualTo(1);
    }

    @Test
    @DisplayName("retries that arrive at the same time are applied once, and each gets a response")
    void concurrentRetriesAreAppliedOnce() throws Exception {
        long id = po("PO-4", "5000.00");
        budget.delay = Duration.ofMillis(300);

        List<Throwable> outcomes = race(Collections.nCopies(8, () -> service.approve(id, "asha", "key-1")));

        assertThat(outcomes).containsOnlyNulls();
        assertThat(reload(id).getStatus()).isEqualTo(PoStatus.APPROVED);
        assertThat(budget.reservationsFor(id)).isEqualTo(1);
    }

    @Test
    @DisplayName("an idempotency key belongs to one approver (keys are only unique per user)")
    void keysAreScopedToTheApprover() throws Exception {
        long id = po("PO-5", "2500000.00");

        service.approve(id, "asha", "1");
        PurchaseOrderDto second = service.approve(id, "ravi", "1");

        assertThat(second.status()).isEqualTo(PoStatus.APPROVED);
        assertThat(reload(id).getApprovalsReceived()).isEqualTo(2);
    }

    @Test
    @DisplayName("reusing a key for a different PO is refused, not answered with the other PO")
    void keyReuseIsRefused() throws Exception {
        long first = po("PO-6", "5000.00");
        long other = po("PO-7", "5000.00");
        service.approve(first, "asha", "key-1");

        assertThatThrownBy(() -> service.approve(other, "asha", "key-1")).isInstanceOf(RuntimeException.class);

        assertThat(reload(other).getStatus()).isEqualTo(PoStatus.PENDING);
    }

    // ---- two-person rule and concurrent approvers ------------------------------------------------

    @Test
    @DisplayName("a high-value PO is approved by two different people")
    void twoApprovers() throws Exception {
        long id = po("PO-8", "2500000.00");

        assertThat(service.approve(id, "asha", "a-1").status()).isEqualTo(PoStatus.PENDING);
        assertThat(service.approve(id, "ravi", "r-1").status()).isEqualTo(PoStatus.APPROVED);
        assertThat(budget.reservationsFor(id)).isEqualTo(1);
    }

    @Test
    @DisplayName("the same person can't give both approvals of a high-value PO")
    void sameApproverTwice() throws Exception {
        long id = po("PO-9", "2500000.00");
        service.approve(id, "asha", "a-1");

        assertThatThrownBy(() -> service.approve(id, "asha", "a-2")).isInstanceOf(IllegalStateException.class);

        assertThat(reload(id).getStatus()).isEqualTo(PoStatus.PENDING);
        assertThat(reload(id).getApprovalsReceived()).isEqualTo(1);
    }

    @Test
    @DisplayName("two people racing for the final approval: one wins, the other is told to refresh")
    void racingApprovers() throws Exception {
        long id = po("PO-10", "2500000.00");
        service.approve(id, "asha", "a-1");
        budget.delay = Duration.ofMillis(300);

        List<Throwable> outcomes = race(List.of(
                () -> service.approve(id, "ravi", "r-1"),
                () -> service.approve(id, "meera", "m-1")));

        assertThat(outcomes).filteredOn(o -> o == null).hasSize(1);
        assertThat(outcomes).filteredOn(o -> o != null).singleElement()
                .isInstanceOfAny(OptimisticLockingFailureException.class, IllegalStateException.class);
        assertThat(reload(id).getStatus()).isEqualTo(PoStatus.APPROVED);
        assertThat(reload(id).getApprovalsReceived()).isEqualTo(2);
        assertThat(budget.reservationsFor(id)).isEqualTo(1);
    }

    // ---- batch approval -------------------------------------------------------------------------

    @Test
    @DisplayName("batch: a PO the budget refuses stays pending; the others are approved")
    void batchIsolatesBudgetFailures() {
        long a = po("PO-11", "100.00");
        long b = po("PO-12", "200.00");
        long c = po("PO-13", "300.00");
        budget.refused.add(b);

        BatchResult result = service.approveBatch(List.of(a, b, c), "asha");

        assertThat(result.getApproved()).containsExactly(a, c);
        assertThat(result.getFailures()).singleElement().asString().startsWith(b + ":");
        assertThat(reload(a).getStatus()).isEqualTo(PoStatus.APPROVED);
        assertThat(reload(b).getStatus()).isEqualTo(PoStatus.PENDING);
        assertThat(reload(c).getStatus()).isEqualTo(PoStatus.APPROVED);
        assertThat(budget.reserved).containsExactlyInAnyOrder(a, c);
    }

    @Test
    @DisplayName("batch: an id that can't be approved doesn't stop the others")
    void batchSurvivesBadIds() throws Exception {
        long ok = po("PO-14", "100.00");
        long done = po("PO-15", "100.00");
        service.approve(done, "ravi", "r-1");
        long missing = done + 1000;

        BatchResult result = service.approveBatch(List.of(done, ok, missing), "asha");

        assertThat(result.getApproved()).containsExactly(ok);
        assertThat(result.getFailures()).hasSize(2);
        assertThat(reload(ok).getStatus()).isEqualTo(PoStatus.APPROVED);
    }

    // ---- invoice matching and the inbox -----------------------------------------------------------

    @Test
    @DisplayName("matching an invoice works (open-in-view is off)")
    void matchInvoiceLoadsLines() {
        long id = po("PO-16", "1500.00", new PurchaseOrderLine("SKU-1", 10, new BigDecimal("150.00")));
        InvoiceRequest invoice = new InvoiceRequest("INV-1", new BigDecimal("1500.00"),
                List.of(new InvoiceLine("SKU-1", 10, new BigDecimal("150.00"))));

        assertThat(controller.matchInvoice(id, invoice).matched()).isTrue();
    }

    @Test
    @DisplayName("inbox: page 1 holds the newest POs and pages don't overlap")
    void inboxPaging() {
        List<Long> ids = new ArrayList<>();
        for (int i = 1; i <= 25; i++) {
            ids.add(po("PO-" + (100 + i), "100.00",
                    new PurchaseOrderLine("SKU-1", 1, new BigDecimal("50.00")),
                    new PurchaseOrderLine("SKU-2", 1, new BigDecimal("50.00"))));
        }
        Collections.reverse(ids);

        Page<PurchaseOrderDto> first = controller.list(1, 10);
        Page<PurchaseOrderDto> second = controller.list(2, 10);
        Page<PurchaseOrderDto> last = controller.list(3, 10);

        assertThat(first.getContent()).extracting(PurchaseOrderDto::id).containsExactlyElementsOf(ids.subList(0, 10));
        assertThat(second.getContent()).extracting(PurchaseOrderDto::id).containsExactlyElementsOf(ids.subList(10, 20));
        assertThat(last.getContent()).extracting(PurchaseOrderDto::id).containsExactlyElementsOf(ids.subList(20, 25));
        assertThat(first.getTotalElements()).isEqualTo(25);
        assertThat(first.getContent()).allSatisfy(dto -> assertThat(dto.lineCount()).isEqualTo(2));
    }

    @Test
    @DisplayName("inbox: page 0 is a bad request")
    void inboxRejectsPageZero() {
        assertThatThrownBy(() -> controller.list(0, 10)).isInstanceOf(IllegalArgumentException.class);
    }

    // ---- helpers --------------------------------------------------------------------------------

    private long po(String number, String total, PurchaseOrderLine... lines) {
        PurchaseOrder po = new PurchaseOrder(number, new BigDecimal(total));
        for (PurchaseOrderLine line : lines) {
            po.addLine(line);
        }
        return orders.save(po).getId();
    }

    private PurchaseOrder reload(long id) {
        return tx.execute(status -> orders.findById(id).orElseThrow());
    }

    /** Starts every call at the same moment, each on its own thread. An outcome is null on success. */
    private static List<Throwable> race(List<Callable<?>> calls) throws InterruptedException {
        ExecutorService pool = Executors.newFixedThreadPool(calls.size());
        try {
            CountDownLatch start = new CountDownLatch(1);
            List<Future<?>> futures = IntStream.range(0, calls.size())
                    .<Future<?>>mapToObj(i -> pool.submit(() -> {
                        start.await();
                        return calls.get(i).call();
                    }))
                    .toList();
            start.countDown();
            List<Throwable> outcomes = new ArrayList<>();
            for (Future<?> future : futures) {
                try {
                    future.get(30, TimeUnit.SECONDS);
                    outcomes.add(null);
                } catch (ExecutionException e) {
                    outcomes.add(e.getCause());
                } catch (TimeoutException e) {
                    throw new AssertionError("a call did not finish within 30 s", e);
                }
            }
            return outcomes;
        } finally {
            pool.shutdownNow();
        }
    }

    private static void sleep(Duration duration) {
        if (duration.isZero()) {
            return;
        }
        try {
            Thread.sleep(duration);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
