package com.ExpenseOS.Backend.service;

import com.ExpenseOS.Backend.dto.groups.AddMemberRequest;
import com.ExpenseOS.Backend.dto.groups.CreateGroupRequest;
import com.ExpenseOS.Backend.dto.groups.GroupResponse;
import com.ExpenseOS.Backend.dto.groups.MemberResponse;
import com.ExpenseOS.Backend.entity.Group;
import com.ExpenseOS.Backend.entity.GroupMember;
import com.ExpenseOS.Backend.entity.User;
import com.ExpenseOS.Backend.exception.ForbiddenOperationException;
import com.ExpenseOS.Backend.exception.InvalidOperationException;
import com.ExpenseOS.Backend.exception.ResourceNotFoundException;
import com.ExpenseOS.Backend.repository.GroupMemberRepository;
import com.ExpenseOS.Backend.repository.GroupRepository;
import com.ExpenseOS.Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupService {
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User Not Found"));
    }

    private void assertActiveGroupOwner(Group group, String email) {
        User requester = getUserByEmail(email);

        if (!group.getCreatedBy().getId().equals(requester.getId())) {
            throw new ForbiddenOperationException("Not group owner");
        }

        if (!groupMemberRepository.existsByGroupAndUser(group, requester)) {
            throw new ForbiddenOperationException("You are no longer a member of this group");
        }
    }

    private GroupResponse mapToResponse(Group group) {
        return GroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .createdBy(group.getCreatedBy().getEmail())
                .build();
    }

    public GroupResponse createGroup(CreateGroupRequest request,String email){
        User user = getUserByEmail(email);
        Group group = Group.builder().name(request.getName()).description(request.getDescription()).createdBy(user).build();
        Group savedGroup = groupRepository.save(group);
        GroupMember ownerMember = GroupMember.builder()
                .group(savedGroup)
                .user(user)
                .build();
        groupMemberRepository.save(ownerMember);
        return mapToResponse(group);
    }

    public List<GroupResponse>listGroups(String email){
        User user = getUserByEmail(email);
        return groupRepository.findByCreatedBy(user).stream().map(this :: mapToResponse).toList();
    }

    public GroupResponse getGroupById(long groupId){
        Group group = groupRepository.findById(groupId).orElseThrow(()->new ResourceNotFoundException("Group Not Found"));
        return mapToResponse(group);
    }

    @Transactional
    public void deleteGroup(long groupId,String email){
        Group group = groupRepository.findById(groupId).orElseThrow(()->new ResourceNotFoundException("Group Not Found"));
        assertActiveGroupOwner(group, email);
        groupMemberRepository.deleteByGroup(group);
        groupMemberRepository.flush();
        groupRepository.delete(group);
    }

    public MemberResponse addMember(Long groupId, AddMemberRequest request,String currentUserEmail){
        Group group = groupRepository.findById(groupId).orElseThrow(()->new ResourceNotFoundException("Group Not Found"));
        assertActiveGroupOwner(group, currentUserEmail);
        User user = getUserByEmail(request.getEmail());
        if(groupMemberRepository.existsByGroupAndUser(group,user)){
            throw new InvalidOperationException("User already exists in the group");
        }
        GroupMember member = GroupMember.builder().group(group).user(user).build();
        groupMemberRepository.save(member);
        return MemberResponse.builder().id(user.getId()).name(user.getName()).email(user.getEmail()).build();
    }

    public List<MemberResponse> getMember(Long groupId) {
        Group group = groupRepository.findById(groupId).orElseThrow(()->new ResourceNotFoundException("Group Not Found"));
        return groupMemberRepository.findByGroup(group).stream().map(member-> MemberResponse.builder().id(member.getUser().getId()).name(member.getUser().getName()).email(member.getUser().getEmail()).build()).toList();
    }

    @Transactional
    public void removeMember(
            Long groupId,
            Long userId,
            String currentUserEmail
    ){

        Group group = groupRepository.findById(groupId).orElseThrow(() -> new ResourceNotFoundException("Group not found"));
        assertActiveGroupOwner(group, currentUserEmail);

        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (group.getCreatedBy().getId().equals(user.getId())) {
            throw new ForbiddenOperationException("You cannot remove the group owner");
        }
        groupMemberRepository.deleteByGroupAndUser(group,user);
    }
}
