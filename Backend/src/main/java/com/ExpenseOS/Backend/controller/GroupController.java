package com.ExpenseOS.Backend.controller;

import com.ExpenseOS.Backend.dto.groups.AddMemberRequest;
import com.ExpenseOS.Backend.dto.groups.CreateGroupRequest;
import com.ExpenseOS.Backend.dto.groups.GroupResponse;
import com.ExpenseOS.Backend.dto.groups.MemberResponse;
import com.ExpenseOS.Backend.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/groups")
@RequiredArgsConstructor
public class GroupController {
        private final GroupService groupService;

        @PostMapping
        public GroupResponse createGroup(@RequestBody @Valid CreateGroupRequest request, Authentication authentication){
            return groupService.createGroup(
                    request,
                    authentication.getName()
            );
        }

        @GetMapping
        public List<GroupResponse> listGroups(Authentication authentication){
            return groupService.listGroups(
                    authentication.getName()
            );
        }

        @GetMapping("/{groupId}")
        public GroupResponse getGroupById(@PathVariable Long groupId){
            return groupService.getGroupById(groupId);
        }

        @DeleteMapping("/{groupId}")
        public ResponseEntity<Void> deleteGroup(@PathVariable Long groupId,Authentication authentication){
            groupService.deleteGroup(groupId,authentication.getName());
            return ResponseEntity.noContent().build();
        }

        @PostMapping("/{groupId}/members")
        public MemberResponse addMember(
                @PathVariable Long groupId,
                @Valid @RequestBody AddMemberRequest request,
                Authentication authentication
        ){
            return groupService.addMember(groupId,request, authentication.getName());
        }
        @GetMapping("/{groupId}/members")
        public List<MemberResponse>getMember(
                @PathVariable Long groupId
        ){
            return groupService.getMember(groupId);
        }

        @DeleteMapping("/{groupId}/members/{userId}")
        public ResponseEntity<Void> removeMember(
                @PathVariable Long groupId,
                @PathVariable Long userId,
                Authentication authentication
        ){
            groupService.removeMember(groupId, userId, authentication.getName());
            return ResponseEntity.noContent().build();
        }
}
