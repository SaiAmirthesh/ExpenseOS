package com.ExpenseOS.Backend.service;

import com.ExpenseOS.Backend.dto.expenses.CreateExpenseRequest;
import com.ExpenseOS.Backend.dto.expenses.ExpenseResponse;
import com.ExpenseOS.Backend.dto.expenses.SplitRequest;
import com.ExpenseOS.Backend.entity.Expense;
import com.ExpenseOS.Backend.entity.ExpenseCategory;
import com.ExpenseOS.Backend.entity.ExpenseSplit;
import com.ExpenseOS.Backend.entity.Group;
import com.ExpenseOS.Backend.entity.GroupMember;
import com.ExpenseOS.Backend.entity.SplitType;
import com.ExpenseOS.Backend.entity.User;
import com.ExpenseOS.Backend.exception.InvalidOperationException;
import com.ExpenseOS.Backend.mapper.ExpenseMapper;
import com.ExpenseOS.Backend.repository.ExpenseRepository;
import com.ExpenseOS.Backend.repository.ExpenseSplitRepository;
import com.ExpenseOS.Backend.repository.GroupMemberRepository;
import com.ExpenseOS.Backend.repository.GroupRepository;
import com.ExpenseOS.Backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private GroupRepository groupRepository;
    @Mock private GroupMemberRepository groupMemberRepository;
    @Mock private ExpenseRepository expenseRepository;
    @Mock private ExpenseSplitRepository expenseSplitRepository;
    @Spy private ExpenseMapper expenseMapper = new ExpenseMapper();

    @InjectMocks private ExpenseService expenseService;

    @Test
    void equalSplitPreservesExistingBehavior() {
        User payer = user(1L, "Sai", "sai@example.com");
        Group group = group(10L, payer);
        List<GroupMember> members = List.of(
                member(group, payer),
                member(group, user(2L, "Arun", "arun@example.com")),
                member(group, user(3L, "Rahul", "rahul@example.com"))
        );

        CreateExpenseRequest request = baseRequest("6000", SplitType.EQUAL, null);

        prepareCommonMocks(payer, group, members, request.getAmount());

        ExpenseResponse response = expenseService.createExpense(request, "sai@example.com");

        ArgumentCaptor<List<ExpenseSplit>> captor = ArgumentCaptor.forClass(List.class);
        verify(expenseSplitRepository).saveAll(captor.capture());
        List<ExpenseSplit> splits = captor.getValue();

        assertEquals(3, splits.size());
        assertEquals(bd("2000"), splits.get(0).getAmount());
        assertEquals(bd("2000"), splits.get(1).getAmount());
        assertEquals(bd("2000"), splits.get(2).getAmount());
        assertEquals(SplitType.EQUAL, response.getSplitType());
    }

    @Test
    void exactSplitValid() {
        User payer = user(1L, "Sai", "sai@example.com");
        Group group = group(10L, payer);
        List<GroupMember> members = List.of(
                member(group, payer),
                member(group, user(2L, "Arun", "arun@example.com")),
                member(group, user(3L, "Rahul", "rahul@example.com"))
        );

        CreateExpenseRequest request = baseRequest("6000", SplitType.EXACT, List.of(
                split(1L, "3000", null),
                split(2L, "2000", null),
                split(3L, "1000", null)
        ));

        prepareCommonMocks(payer, group, members, request.getAmount());

        expenseService.createExpense(request, "sai@example.com");

        ArgumentCaptor<List<ExpenseSplit>> captor = ArgumentCaptor.forClass(List.class);
        verify(expenseSplitRepository).saveAll(captor.capture());
        List<ExpenseSplit> splits = captor.getValue();

        assertEquals(bd("3000"), splits.get(0).getAmount());
        assertEquals(bd("2000"), splits.get(1).getAmount());
        assertEquals(bd("1000"), splits.get(2).getAmount());
    }

    @Test
    void exactSplitInvalidWhenTotalsDoNotMatch() {
        User payer = user(1L, "Sai", "sai@example.com");
        Group group = group(10L, payer);
        List<GroupMember> members = List.of(
                member(group, payer),
                member(group, user(2L, "Arun", "arun@example.com")),
                member(group, user(3L, "Rahul", "rahul@example.com"))
        );

        CreateExpenseRequest request = baseRequest("6000", SplitType.EXACT, List.of(
                split(1L, "3000", null),
                split(2L, "2000", null),
                split(3L, "500", null)
        ));

        prepareCommonMocks(payer, group, members, request.getAmount());

        assertThrows(InvalidOperationException.class,
                () -> expenseService.createExpense(request, "sai@example.com"));
    }

    @Test
    void percentageSplitValid() {
        User payer = user(1L, "Sai", "sai@example.com");
        Group group = group(10L, payer);
        List<GroupMember> members = List.of(
                member(group, payer),
                member(group, user(2L, "Arun", "arun@example.com")),
                member(group, user(3L, "Rahul", "rahul@example.com"))
        );

        CreateExpenseRequest request = baseRequest("10000", SplitType.PERCENTAGE, List.of(
                split(1L, null, "50"),
                split(2L, null, "30"),
                split(3L, null, "20")
        ));

        prepareCommonMocks(payer, group, members, request.getAmount());

        expenseService.createExpense(request, "sai@example.com");

        ArgumentCaptor<List<ExpenseSplit>> captor = ArgumentCaptor.forClass(List.class);
        verify(expenseSplitRepository).saveAll(captor.capture());
        List<ExpenseSplit> splits = captor.getValue();

        assertEquals(bd("5000"), splits.get(0).getAmount());
        assertEquals(bd("3000"), splits.get(1).getAmount());
        assertEquals(bd("2000"), splits.get(2).getAmount());
    }

    @Test
    void percentageSplitInvalidWhenTotalsDoNotMatch() {
        User payer = user(1L, "Sai", "sai@example.com");
        Group group = group(10L, payer);
        List<GroupMember> members = List.of(
                member(group, payer),
                member(group, user(2L, "Arun", "arun@example.com")),
                member(group, user(3L, "Rahul", "rahul@example.com"))
        );

        CreateExpenseRequest request = baseRequest("10000", SplitType.PERCENTAGE, List.of(
                split(1L, null, "50"),
                split(2L, null, "25"),
                split(3L, null, "20")
        ));

        prepareCommonMocks(payer, group, members, request.getAmount());

        assertThrows(InvalidOperationException.class,
                () -> expenseService.createExpense(request, "sai@example.com"));
    }

    @Test
    void duplicateUserIsRejected() {
        User payer = user(1L, "Sai", "sai@example.com");
        Group group = group(10L, payer);
        List<GroupMember> members = List.of(
                member(group, payer),
                member(group, user(2L, "Arun", "arun@example.com")),
                member(group, user(3L, "Rahul", "rahul@example.com"))
        );

        CreateExpenseRequest request = baseRequest("6000", SplitType.EXACT, List.of(
                split(1L, "3000", null),
                split(1L, "2000", null),
                split(3L, "1000", null)
        ));

        prepareCommonMocks(payer, group, members, request.getAmount());

        assertThrows(InvalidOperationException.class,
                () -> expenseService.createExpense(request, "sai@example.com"));
    }

    @Test
    void nonMemberUserIsRejected() {
        User payer = user(1L, "Sai", "sai@example.com");
        Group group = group(10L, payer);
        List<GroupMember> members = List.of(
                member(group, payer),
                member(group, user(2L, "Arun", "arun@example.com")),
                member(group, user(3L, "Rahul", "rahul@example.com"))
        );

        CreateExpenseRequest request = baseRequest("6000", SplitType.EXACT, List.of(
                split(1L, "3000", null),
                split(2L, "2000", null),
                split(99L, "1000", null)
        ));

        prepareCommonMocks(payer, group, members, request.getAmount());

        assertThrows(InvalidOperationException.class,
                () -> expenseService.createExpense(request, "sai@example.com"));
    }

    @Test
    void balanceCompatibilityForGeneratedSplits() {
        User payer = user(1L, "Sai", "sai@example.com");
        Group group = group(10L, payer);
        List<GroupMember> members = List.of(
                member(group, payer),
                member(group, user(2L, "Arun", "arun@example.com")),
                member(group, user(3L, "Rahul", "rahul@example.com"))
        );

        CreateExpenseRequest request = baseRequest("10000", SplitType.PERCENTAGE, List.of(
                split(1L, null, "50"),
                split(2L, null, "30"),
                split(3L, null, "20")
        ));

        prepareCommonMocks(payer, group, members, request.getAmount());

        expenseService.createExpense(request, "sai@example.com");

        ArgumentCaptor<List<ExpenseSplit>> captor = ArgumentCaptor.forClass(List.class);
        verify(expenseSplitRepository).saveAll(captor.capture());
        BigDecimal total = captor.getValue().stream()
                .map(ExpenseSplit::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertEquals(bd("10000"), total);
    }

    private void prepareCommonMocks(User payer, Group group, List<GroupMember> members, BigDecimal amount) {
        when(userRepository.findByEmail("sai@example.com")).thenReturn(Optional.of(payer));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.existsByGroupAndUser(group, payer)).thenReturn(true);
        when(groupMemberRepository.findByGroup(group)).thenReturn(members);
        lenient().when(expenseRepository.save(any())).thenAnswer(invocation -> {
            Expense expense = invocation.getArgument(0);
            expense.setId(100L);
            return expense;
        });
        lenient().when(expenseSplitRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private static CreateExpenseRequest baseRequest(String amount, SplitType splitType, List<SplitRequest> splits) {
        CreateExpenseRequest request = new CreateExpenseRequest();
        request.setGroupId(10L);
        request.setTitle("Hotel");
        request.setDescription("Trip stay");
        request.setAmount(bd(amount));
        request.setCategory(ExpenseCategory.TRAVEL);
        request.setSplitType(splitType);
        request.setSplits(splits);
        return request;
    }

    private static SplitRequest split(Long userId, String amount, String percentage) {
        SplitRequest request = new SplitRequest();
        request.setUserId(userId);
        if (amount != null) {
            request.setAmount(bd(amount));
        }
        if (percentage != null) {
            request.setPercentage(bd(percentage));
        }
        return request;
    }

    private static User user(Long id, String name, String email) {
        User user = User.builder().name(name).email(email).password("x").enabled(true).build();
        user.setId(id);
        return user;
    }

    private static Group group(Long id, User createdBy) {
        Group group = Group.builder().name("Trip").description("desc").createdBy(createdBy).build();
        group.setId(id);
        return group;
    }

    private static GroupMember member(Group group, User user) {
        return GroupMember.builder().group(group).user(user).build();
    }

    private static BigDecimal bd(String value) {
        return new BigDecimal(value).setScale(2);
    }
}
