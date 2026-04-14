# Real-Time Event System - Comprehensive Tracker

This document tracks every place that needs updating across backend and frontend
to achieve a fully real-time, socket-driven application with no polling.

---

## Architecture Overview

```
Service Method
  └─> domainEvent.emit(event)          ← single call replaces logActivity + signalService.notify
        └─> DomainEventListener (async, non-blocking)
              ├─> RabbitMQ "socket" queue  ─> Socket Server ─> socket.emit('push-notification') ─> Frontend
              ├─> RabbitMQ "push" queue    ─> Socket Server ─> Web Push API (with smart suppression)
              ├─> RabbitMQ "activity" queue ─> Worker ─> ActivityLog table (async, no API delay)
              └─> RabbitMQ "email"/"sms"   ─> Worker ─> Email/SMS (existing)
```

---

## PHASE 1: Backend Event Bus + Activity Worker

### 1.1 New Files to Create

- [ ] `packages/shared/src/models/core/domain-event.ts` — DomainEvent interface
- [ ] `apps/backend/src/common/services/domain-event.service.ts` — Emitter service (replaces signalService + logActivity)
- [ ] `apps/backend/src/common/listeners/domain-event.listener.ts` — Async listener (socket + push + activity queue)
- [ ] `apps/worker/src/consumers/activity.consumer.ts` — Activity log writer (consumes from "activity" queue)

### 1.2 Files to Modify

- [ ] `apps/backend/src/app.module.ts` — Add EventEmitterModule.forRoot(), register DomainEventService + Listener
- [ ] `apps/backend/src/common/services/queue-publisher.service.ts` — Add `emitActivity()` method + assert "activity" queue
- [ ] `packages/shared/src/index.ts` — Export DomainEvent interface
- [ ] `apps/worker/src/app.module.ts` — Register ActivityConsumer

---

## PHASE 2: Migrate Backend Services to DomainEventService

### 2.1 tasks.service.ts (36 signal calls, 26 logActivity calls)

File: `apps/backend/src/modules/tasks/tasks.service.ts`

| # | Method | ActivityType | Has Signal | Has Log | Action Needed |
|---|--------|-------------|-----------|---------|---------------|
| 1 | `create()` | WorkPackageTaskAdd (600) | YES | YES | Migrate to domainEvent.emit |
| 2 | `changeTitle()` | WorkPackageTaskEdit (601) | YES | YES | Migrate |
| 3 | `changeDescription()` | WorkPackageTaskEdit (601) | YES | YES | Migrate |
| 4 | `changeState()` | WorkPackageTaskEdit (601) | YES | YES | Migrate |
| 5 | `reposition()` | WorkPackageTaskReposition (604) | YES | YES | Migrate |
| 6 | `move()` | WorkPackageTaskMove (605) | YES | YES | Migrate |
| 7 | `setDate()` | WorkPackageTaskEdit (601) | YES | YES | Migrate |
| 8 | `location()` | WorkPackageTaskEdit (601) | YES | YES | Migrate |
| 9 | `addMember()` | WorkPackageTaskMemberAdd (611) | YES | YES | Migrate |
| 10 | `removeMember()` | WorkPackageTaskMemberRemove (610) | YES | YES | Migrate |
| 11 | `addLabel()` | WorkPackageTaskLabelAdd (613) | YES | YES | Migrate |
| 12 | `removeLabel()` | WorkPackageTaskLabelRemove (612) | YES | YES | Migrate |
| 13 | `renameAttachment()` | WorkPackageTaskEdit (601) | YES | **NO** | Migrate + ADD log |
| 14 | `removeAttachment()` | WorkPackageTaskAttachmentRemove (614) | YES | **NO** | Migrate + ADD log |
| 15 | `toggleAttachmentCover()` | WorkPackageTaskAttachmentCover (616) | YES | **NO** | Migrate + ADD log |
| 16 | `bulkAttach()` | WorkPackageTaskAttachmentBulkAdd (625) | YES | **NO** | Migrate + ADD log |
| 17 | `attach()` | WorkPackageTaskAttachmentAdd (615) | YES | YES | Migrate |
| 18 | `addComment()` | WorkPackageTaskComment (608) | YES | YES | Migrate |
| 19 | `vote()` | WorkPackageTaskVote (620) | YES | YES | Migrate |
| 20 | `watch()` | WorkPackageTaskWatch (618) | YES | YES | Migrate |
| 21 | `estimated()` | WorkPackageTaskEdit (601) | YES | YES | Migrate |
| 22 | `spendTime()` | WorkPackageTaskTime (619) | YES | YES | Migrate |
| 23 | `setCustomFieldValue()` | WorkPackageCustomFieldValueSet (713) | YES | YES | Migrate |
| 24 | `archive()` | WorkPackageTaskArchive (606) | YES | **NO** | Migrate + ADD log |

### 2.2 work-packages.service.ts (30 signal calls)

File: `apps/backend/src/modules/work-packages/work-packages.service.ts`

| # | Method | ActivityType | Has Signal | Has Log | Action Needed |
|---|--------|-------------|-----------|---------|---------------|
| 1 | `create()` | WorkPackageAdd (400) | YES | YES | Migrate |
| 2 | `edit()` | WorkPackageEdit (401) | YES | YES | Migrate |
| 3 | `archive()` | WorkPackageArchive (407) | YES | YES | Migrate |
| 4 | `merge()` | WorkPackageMerge (416) | YES | YES | Migrate |
| 5 | `createList()` | WorkPackageListAdd (500) | YES | YES | Migrate |
| 6 | `editList()` | WorkPackageListEdit (501) | YES | YES | Migrate |
| 7 | `orderList()` | WorkPackageListOrder (508) | YES | YES | Migrate |
| 8 | `cloneList()` | WorkPackageListClone (512) | YES | YES | Migrate |
| 9 | `deleteList()` | WorkPackageListRemove (502) | YES | YES | Migrate |
| 10 | `archiveListTasks()` | WorkPackageListTasksArchive (511) | YES | YES | Migrate |
| 11 | `deleteListTasks()` | WorkPackageListTasksDelete (513) | YES | YES | Migrate |
| 12 | `createLabel()` | WorkPackageLabelAdd (411) | YES | YES | Migrate |
| 13 | `renameLabel()` | WorkPackageLabelRename (409) | YES | YES | Migrate |
| 14 | `removeLabel()` | WorkPackageLabelRemove (410) | YES | YES | Migrate |
| 15 | `createCustomField()` | WorkPackageCustomFieldAdd (710) | YES | YES | Migrate |
| 16 | `editCustomField()` | WorkPackageCustomFieldEdit (711) | YES | YES | Migrate |
| 17 | `removeCustomField()` | WorkPackageCustomFieldRemove (712) | YES | YES | Migrate |
| 18 | `createObjective()` | WorkPackageObjectiveAdd (700) | YES | YES | Migrate |
| 19 | `editObjective()` | WorkPackageObjectiveEdit (701) | YES | YES | Migrate |
| 20 | `removeObjective()` | WorkPackageObjectiveRemove (702) | YES | YES | Migrate |
| 21 | `addMember()` | WorkPackageMemberAdd (404) | YES | YES | Migrate |
| 22 | `changeMemberAccess()` | WorkPackageMemberPermission (406) | YES | YES | Migrate |
| 23 | `removeMember()` | WorkPackageMemberRemove (405) | YES | YES | Migrate |
| 24 | `editUserSetting()` | WorkPackageUserSetting (412) | YES | YES | Migrate |
| 25 | `editSetting()` | WorkPackageSetting (413) | YES | YES | Migrate |
| 26 | `connect()` | WorkPackageConnect (415) | YES | YES | Migrate |

### 2.3 projects.service.ts (15 signal calls)

File: `apps/backend/src/modules/projects/projects.service.ts`

| # | Method | ActivityType | Has Signal | Has Log | Action Needed |
|---|--------|-------------|-----------|---------|---------------|
| 1 | `create()` | ProjectAdd (300) | YES | YES | Migrate |
| 2 | `edit()` | ProjectEdit (301) | YES | YES | Migrate |
| 3 | `remove()` | ProjectRemove (302) | YES | YES | Migrate |
| 4 | `archive()` | ProjectArchive (312) / ProjectRestore (313) | YES | YES | Migrate |
| 5 | `createSubProject()` | ProjectSubAdd (306) | YES | YES | Migrate |
| 6 | `editSubProject()` | ProjectSubEdit (307) | YES | YES | Migrate |
| 7 | `removeSubProject()` | ProjectSubRemove (308) | YES | YES | Migrate |
| 8 | `orderSubProject()` | ProjectSubEdit (307) | YES | YES | Migrate |
| 9 | `createSeason()` | ProjectSeasonAdd (309) | YES | YES | Migrate |
| 10 | `editSeason()` | ProjectSeasonEdit (310) | YES | YES | Migrate |
| 11 | `removeSeason()` | ProjectSeasonRemove (311) | YES | YES | Migrate |
| 12 | `addAccess()` | ProjectMemberAdd (303) | YES | YES | Migrate |
| 13 | `changeAccess()` | ProjectMemberPermission (305) | YES | YES | Migrate |
| 14 | `removeAccess()` | ProjectMemberRemove (304) | YES | YES | Migrate |
| 15 | `changePendingAccess()` | — | **NO** | **NO** | **ADD signal + log** |
| 16 | `removePendingAccess()` | — | **NO** | **NO** | **ADD signal + log** |

### 2.4 groups.service.ts (13 signal calls)

File: `apps/backend/src/modules/groups/groups.service.ts`

| # | Method | ActivityType | Has Signal | Has Log | Action Needed |
|---|--------|-------------|-----------|---------|---------------|
| 1 | `create()` | GroupAdd (200) | YES | YES | Migrate |
| 2 | `edit()` | GroupEdit (201) | YES | YES | Migrate |
| 3 | `remove()` | GroupRemove (202) | YES | YES | Migrate |
| 4 | `archive()` | GroupArchive (209) | YES | YES | Migrate |
| 5 | `restore()` | GroupRestore (210) | YES | YES | Migrate |
| 6 | `addAccess()` | GroupMemberAdd (206) | YES | YES | Migrate |
| 7 | `changeAccess()` | GroupMemberPermission (208) | YES | YES | Migrate |
| 8 | `removeAccess()` | GroupMemberRemove (207) | YES | YES | Migrate |
| 9 | `toggleEntry()` | GroupWorkEntry (203) | YES | YES | Migrate |
| 10 | `requestTimeOff()` | GroupTimeOffAdd (204) | YES | YES | Migrate |
| 11 | `approveTimeOff()` | GroupTimeOffResponse (205) | YES | YES | Migrate |
| 12 | `declineTimeOff()` | GroupTimeOffResponse (205) | YES | YES | Migrate |
| 13 | `connect()` | GroupEdit (201) | YES | YES | Migrate |
| 14 | `removeEntry()` | GroupWorkEntry (203) | **NO** | YES | **ADD signal** |
| 15 | `editEntry()` | GroupWorkEntry (203) | **NO** | YES | **ADD signal** |
| 16 | `manualEntry()` | GroupWorkEntry (203) | **NO** | YES | **ADD signal** |
| 17 | `createShift()` | — | **NO** | **NO** | **ADD signal + log** |
| 18 | `editShift()` | — | **NO** | **NO** | **ADD signal + log** |
| 19 | `removeShift()` | — | **NO** | **NO** | **ADD signal + log** |
| 20 | `deleteTimeOff()` | GroupTimeOffResponse (205) | **NO** | YES | **ADD signal** |
| 21 | `changePendingAccess()` | — | **NO** | **NO** | **ADD signal + log** |
| 22 | `removePendingAccess()` | — | **NO** | **NO** | **ADD signal + log** |

### 2.5 messenger.service.ts (2 signal calls)

File: `apps/backend/src/modules/messenger/messenger.service.ts`

| # | Method | ActivityType | Has Signal | Has Log | Action Needed |
|---|--------|-------------|-----------|---------|---------------|
| 1 | `send()` | ChannelMessage (800) | YES | YES | Migrate |
| 2 | `attach()` | ChannelUpload (801) | YES | YES | Migrate |
| 3 | `createEntityChannel()` | — | **NO** | **NO** | **ADD signal + log** |

### 2.6 files.service.ts (0 signal calls!) -- CRITICAL GAP

File: `apps/backend/src/modules/files/files.service.ts`

| # | Method | ActivityType | Has Signal | Has Log | Action Needed |
|---|--------|-------------|-----------|---------|---------------|
| 1 | `newFolder()` | FolderCreate (903) | **NO** | YES | **ADD signal** |
| 2 | `rename()` | FileRename (902) | **NO** | YES | **ADD signal** |
| 3 | `delete()` | FileDelete (901) | **NO** | YES | **ADD signal** |
| 4 | `upload()` | FileUpload (900) | **NO** | YES | **ADD signal** |

### 2.7 workflows.service.ts (1 signal call) -- MAJOR GAP

File: `apps/backend/src/modules/workflows/workflows.service.ts`

| # | Method | ActivityType | Has Signal | Has Log | Action Needed |
|---|--------|-------------|-----------|---------|---------------|
| 1 | `create()` | WorkflowAdd (1100) | **NO** | YES | **ADD signal** |
| 2 | `edit()` | WorkflowEdit (1101) | **NO** | YES | **ADD signal** |
| 3 | `remove()` | WorkflowRemove (1102) | **NO** | YES | **ADD signal** |
| 4 | `toggle()` | WorkflowToggle (1103) | **NO** | YES | **ADD signal** |
| 5 | `execute()` | WorkflowExecute (1104) | **NO** | YES | **ADD signal** |
| 6 | execute: `send_notification` | WorkflowExecute (1104) | YES | — | Migrate |
| 7 | execute: `change_state` | WorkPackageTaskEdit (601) | **NO** | — | **ADD signal** |
| 8 | execute: `add_comment` | WorkPackageTaskComment (608) | **NO** | — | **ADD signal** |
| 9 | execute: `assign_member` | WorkPackageTaskMemberAdd (611) | **NO** | — | **ADD signal** |
| 10 | execute: `move_task` | WorkPackageTaskMove (605) | **NO** | — | **ADD signal** |
| 11 | execute: `create_task` | WorkPackageTaskAdd (600) | **NO** | — | **ADD signal** |
| 12 | execute: `set_date` | WorkPackageTaskEdit (601) | **NO** | — | **ADD signal** |
| 13 | execute: `set_custom_field` | WorkPackageCustomFieldValueSet (713) | **NO** | — | **ADD signal** |
| 14 | execute: `add_label` | WorkPackageTaskLabelAdd (613) | **NO** | — | **ADD signal** |
| 15 | execute: `remove_label` | WorkPackageTaskLabelRemove (612) | **NO** | — | **ADD signal** |
| 16 | execute: `add_blocker` | WorkPackageTaskBlocked (623) | **NO** | — | **ADD signal** |
| 17 | execute: `add_relation` | WorkPackageTaskBlocked (623) | **NO** | — | **ADD signal** |

---

## PHASE 3: Smart Push Notification Suppression

### 3.1 New Files to Create

- [ ] `apps/frontend/src/composables/useViewContext.ts` — Emits focus:set / focus:clear over socket

### 3.2 Files to Modify

- [ ] `apps/socket/src/app/gateways/main.gateway.ts` — Add @SubscribeMessage('focus:set') and @SubscribeMessage('focus:clear')
- [ ] `apps/socket/src/app/services/notification.service.ts` — Add focusMap: Map<userId, { contextType, contextId }>
- [ ] `apps/socket/src/app/services/message-handler.service.ts` — Check focus context before sending push

### 3.3 Focus Context Types

| Context Type | Trigger | Suppresses Push For |
|---|---|---|
| `work-package` | Navigate to WP page | Events with matching packageId |
| `channel` | Open a chat channel | Events with matching channelId |
| `task-modal` | Open task detail modal | Events with matching taskId |
| `files` | Navigate to files page | File CRUD events for same project |
| `workflow` | Navigate to workflow page | Workflow events for same project |

### 3.4 Pages That Need useViewContext Integration

- [ ] `apps/frontend/src/components/pages/WorkPackagePage.vue` — focus:set on mount, clear on unmount
- [ ] `apps/frontend/src/components/pages/MessengerPage.vue` — focus:set when channel selected
- [ ] `apps/frontend/src/components/modals/TaskModal.vue` — focus:set on open, clear on close
- [ ] `apps/frontend/src/components/pages/FilesPage.vue` — focus:set on mount
- [ ] `apps/frontend/src/components/pages/WorkflowDesignerPage.vue` — focus:set on mount

---

## PHASE 4: Frontend Socket Handlers

### 4.1 Fix Existing Global Handlers

File: `apps/frontend/src/composables/useGlobalSocketHandlers.ts`

Currently all WP/task events call `refetchIfCurrentWP(data)` which refetches the ENTIRE work package.

Changes needed:
- [ ] `WorkPackageTaskAdd` — Push task to correct list in `wpStore.current` instead of refetch
- [ ] `WorkPackageTaskEdit` — Find task by ID, Object.assign updated fields
- [ ] `WorkPackageTaskDone` — Update task state in-place
- [ ] `WorkPackageTaskRemove` — Filter task out of list
- [ ] `WorkPackageTaskMove` — Remove from old list, add to new list
- [ ] `WorkPackageTaskReposition` — Update order field
- [ ] `WorkPackageTaskMemberAdd/Remove` — Update task.members array
- [ ] `WorkPackageTaskLabelAdd/Remove` — Update task.labels array
- [ ] `WorkPackageTaskAttachmentAdd/Remove` — Update task.attachments array
- [ ] `WorkPackageTaskComment` — Update task.commentsCount
- [ ] `WorkPackageListAdd` — Push new list to `wpStore.current.lists`
- [ ] `WorkPackageListEdit` — Find list by ID, Object.assign
- [ ] `WorkPackageListRemove` — Filter list out
- [ ] `WorkPackageListOrder` — Reorder lists array
- [ ] Keep `refetchIfCurrentWP` as fallback for: merge, clone, bulk operations

**IMPORTANT**: This requires the backend to send richer event data payloads (full entity data, not just IDs).

### 4.2 New Page-Scoped Socket Handlers

#### Messenger (CRITICAL - chat has NO real-time!)

- [ ] Create `apps/frontend/src/composables/useMessengerSocketHandlers.ts`
  - Listen: `ChannelMessage` (800), `ChannelUpload` (801)
  - If channel matches currently open channel → append message to conversation list
  - If channel not visible → increment unread counter on channel in sidebar
  - Update `messengerStore.channels` last message preview

- [ ] Modify `apps/frontend/src/components/pages/MessengerPage.vue` — Call useMessengerSocketHandlers()
- [ ] Modify `apps/frontend/src/stores/messenger.store.ts` — Add `unreadCounts` state + `appendMessage()` action

#### Files

- [ ] Create `apps/frontend/src/composables/useFilesSocketHandlers.ts`
  - Listen: `FileUpload` (900), `FileDelete` (901), `FileRename` (902), `FolderCreate` (903)
  - Refetch current directory listing on any file event

- [ ] Modify `apps/frontend/src/components/pages/FilesPage.vue` — Call useFilesSocketHandlers()

#### Workflows

- [ ] Create `apps/frontend/src/composables/useWorkflowSocketHandlers.ts`
  - Listen: `WorkflowAdd` (1100), `WorkflowEdit` (1101), `WorkflowRemove` (1102), `WorkflowToggle` (1103), `WorkflowExecute` (1104)
  - Update `workflowStore.workflows` array in-place

- [ ] Modify `apps/frontend/src/components/pages/WorkflowsPage.vue` — Call useWorkflowSocketHandlers()

#### Task Modal

- [ ] Create `apps/frontend/src/composables/useTaskModalSocketHandlers.ts`
  - Listen: `WorkPackageTaskEdit`, `WorkPackageTaskComment`, `WorkPackageTaskMemberAdd/Remove`, `WorkPackageTaskLabelAdd/Remove`, `WorkPackageTaskAttachmentAdd/Remove`, `WorkPackageTaskVote`, `WorkPackageTaskTime`, `WorkPackageTaskBlocked/UnBlock`
  - Only act when event taskId matches currently open modal
  - Update local task state in-place

- [ ] Modify `apps/frontend/src/components/modals/TaskModal.vue` — Call useTaskModalSocketHandlers()

#### Dashboard

- [ ] Create `apps/frontend/src/composables/useDashboardSocketHandlers.ts`
  - Listen: Task-level events that affect the current user's assigned tasks
  - Lightweight refetch of dashboard data

- [ ] Modify `apps/frontend/src/components/pages/DashboardPage.vue` — Call useDashboardSocketHandlers()

#### Groups (work entries, shifts, time-off)

- [ ] Add handlers in `useGlobalSocketHandlers.ts` for:
  - `GroupWorkEntry` (203) — Refresh group detail if viewing
  - `GroupTimeOffAdd` (204) / `GroupTimeOffResponse` (205) — Refresh time-off list

---

## PHASE 5: Notification Center UI

### 5.1 New Files

- [ ] `apps/frontend/src/stores/notification.store.ts` — notifications array, unreadCount, markRead()
- [ ] `apps/frontend/src/components/core/NotificationCenter.vue` — Bell icon + dropdown panel
- [ ] `apps/frontend/src/composables/useNotificationHandler.ts` — Intercepts all push-notification events, appends to notification store

### 5.2 Files to Modify

- [ ] `apps/frontend/src/components/core/AppHeader.vue` (or equivalent) — Add NotificationCenter component
- [ ] `apps/frontend/src/App.vue` — Initialize useNotificationHandler()

---

## PHASE 6: Enrich Backend Event Payloads

For granular frontend updates to work, the backend must send complete entity data in events, not just IDs.

### Current Problem
Many signal calls send minimal data like `{ packageId }` or `{ id, title }`, forcing the frontend to refetch.

### Required Changes (per service)

#### tasks.service.ts
- [ ] `create()` — Send full task object (id, title, listId, state, order, members, etc.)
- [ ] `changeTitle()` — Send `{ id, packageId, title }`
- [ ] `changeState()` — Send `{ id, packageId, state, listId }`
- [ ] `move()` — Send `{ id, packageId, fromListId, toListId, order }`
- [ ] `addMember()` — Send `{ id, packageId, member: { userId, fullName, avatar } }`
- [ ] `removeMember()` — Send `{ id, packageId, memberId }`
- [ ] `addLabel()` — Send `{ id, packageId, label: { id, title, color } }`
- [ ] `removeLabel()` — Send `{ id, packageId, labelId }`
- [ ] `addComment()` — Send `{ id, packageId, comment: { id, body, userId, createdAt } }`
- [ ] `attach()` — Send `{ id, packageId, attachment: { id, title, path, type } }`

#### work-packages.service.ts
- [ ] `createList()` — Send full list object
- [ ] `editList()` — Send `{ id, packageId, ...updatedFields }`
- [ ] `orderList()` — Send `{ packageId, listOrders: [{ id, order }] }`

#### messenger.service.ts
- [ ] `send()` — Send full conversation object + channelId
- [ ] `attach()` — Send full conversation object + channelId

---

## Summary Statistics

| Category | Count |
|---|---|
| Backend methods to migrate (existing signals) | ~87 |
| Backend methods needing NEW signals | ~22 |
| New backend files to create | 4 |
| New frontend composables to create | 7 |
| New frontend components to create | 1 (NotificationCenter) |
| New frontend stores to create | 1 (notification.store) |
| Frontend pages needing socket integration | 6 |
| Total ActivityType events covered | 112 |

---

## PHASE 7: Subtask Bug Fixes

### Bug #1: Backend create() returns boolean instead of task object
- **File:** `apps/backend/src/modules/tasks/tasks.service.ts` (line ~385)
- **Problem:** `create()` returns `OperationResult.Success(true)` — a boolean
- **Frontend expects:** `OperationResult<WorkPackageTaskViewModel>` (task.store.ts line 13)
- **Impact:** After subtask creation, `result.data` is `true`, not a task object → empty space in UI
- [ ] Fix: Return the full created task object from `create()`

### Bug #2: Socket signal missing parentId
- **File:** `apps/backend/src/modules/tasks/tasks.service.ts` (line ~422)
- **Problem:** Signal data is `{ id, listId, packageId, title }` — no `parentId`
- **Frontend expects:** `data.parentId` in TaskModal socket handler (TaskModalMain.vue line ~523)
- **Impact:** Other users don't see subtask added in real-time; subtask also incorrectly triggers board refetch
- [ ] Fix: Include `parentId` in signal data

### Bug #3: Subtask appearing in main board list
- **Backend filtering is correct** (`parentId: null` in WP fetch query)
- **Problem:** The `WorkPackageTaskAdd` socket handler in `useGlobalSocketHandlers.ts` calls `refetchIfCurrentWP(data)` for ALL task additions, including subtasks
- **Impact:** After subtask creation, board refetches and subtask shouldn't appear (backend filters), but the refetch is unnecessary
- [ ] Fix: In socket handler, skip `refetchIfCurrentWP` when `data.parentId` is set

### Feature: Convert subtask to normal task
- **Backend:** Need new endpoint or modify existing — set `parentId = null` on a subtask
- **Frontend:** Add action button in subtask list (TaskModalMain.vue) to call conversion API
- [ ] Add `convertToTask()` method in tasks.service.ts (backend)
- [ ] Add `convertToTask()` action in task.store.ts (frontend)
- [ ] Add UI button in TaskModalMain.vue subtask list

---

## New ActivityType Enums Needed

These activities exist in the codebase but have no enum values:

| Activity | Suggested Enum | Value |
|---|---|---|
| GroupShiftAdd | GroupShiftAdd | 211 |
| GroupShiftEdit | GroupShiftEdit | 212 |
| GroupShiftRemove | GroupShiftRemove | 213 |
| ProjectPendingAccessChange | ProjectPendingAccessChange | 314 |
| ProjectPendingAccessRemove | ProjectPendingAccessRemove | 315 |
| GroupPendingAccessChange | GroupPendingAccessChange | 214 |
| GroupPendingAccessRemove | GroupPendingAccessRemove | 215 |
| ChannelCreate | ChannelCreate | 802 |
