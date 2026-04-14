<template>
  <div class="wfd">
    <!-- Toolbar -->
    <div class="wfd-toolbar">
      <div class="wfd-toolbar__left">
        <button class="wfd-toolbar__back" @click="goBack">
          <i class="mdi mdi-arrow-left"></i>
        </button>
        <div class="wfd-toolbar__title-group">
          <input
            v-model="title"
            class="wfd-toolbar__title"
            :placeholder="$t('WORKFLOW_TITLE_PLACEHOLDER')"
            @blur="saveTitle"
          />
          <span class="wfd-toolbar__badge" :class="{ 'wfd-toolbar__badge--active': workflow?.active }">
            {{ workflow?.active ? $t('ACTIVE') : $t('INACTIVE') }}
          </span>
        </div>
      </div>
      <div class="wfd-toolbar__right">
        <AppSelect v-model="trigger" :items="triggerItems" compact class="wfd-toolbar__trigger" @update:model-value="saveTrigger" />
        <button class="wfd-toolbar__btn wfd-toolbar__btn--save" @click="saveFlow" :disabled="saving">
          <i class="mdi mdi-content-save-outline"></i>
          {{ saving ? '...' : $t('SAVE') }}
        </button>
        <button
          v-if="trigger === 'manual'"
          class="wfd-toolbar__btn wfd-toolbar__btn--run"
          @click="runFlow"
          :disabled="running"
        >
          <i class="mdi mdi-play"></i>
          {{ running ? '...' : $t('WORKFLOW_RUN') }}
        </button>
      </div>
    </div>

    <AppWaiting v-if="loading" />

    <!-- Designer -->
    <div v-if="!loading" class="wfd-canvas">
      <!-- Node Palette -->
      <div class="wfd-palette">
        <div class="wfd-palette__title">{{ $t('WORKFLOW_NODES') }}</div>

        <div class="wfd-palette__section">{{ $t('WORKFLOW_SECTION_FLOW') }}</div>
        <div v-for="nt in flowNodes" :key="nt.type" class="wfd-palette__item" draggable="true" @dragstart="onDragStart($event, nt)">
          <i class="mdi" :class="nt.icon"></i><span>{{ nt.label }}</span>
        </div>

        <div class="wfd-palette__section">{{ $t('WORKFLOW_SECTION_TASKS') }}</div>
        <div v-for="nt in taskNodes" :key="nt.type" class="wfd-palette__item" draggable="true" @dragstart="onDragStart($event, nt)">
          <i class="mdi" :class="nt.icon"></i><span>{{ nt.label }}</span>
        </div>

        <div class="wfd-palette__section">{{ $t('WORKFLOW_SECTION_DATA') }}</div>
        <div v-for="nt in dataNodes" :key="nt.type" class="wfd-palette__item" draggable="true" @dragstart="onDragStart($event, nt)">
          <i class="mdi" :class="nt.icon"></i><span>{{ nt.label }}</span>
        </div>

        <div class="wfd-palette__section">{{ $t('WORKFLOW_SECTION_COMM') }}</div>
        <div v-for="nt in commNodes" :key="nt.type" class="wfd-palette__item" draggable="true" @dragstart="onDragStart($event, nt)">
          <i class="mdi" :class="nt.icon"></i><span>{{ nt.label }}</span>
        </div>
      </div>

      <!-- Vue Flow -->
      <div class="wfd-flow" @drop="onDrop" @dragover.prevent>
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :default-viewport="{ zoom: 1, x: 50, y: 50 }"
          :snap-to-grid="true"
          :snap-grid="[16, 16]"
          fit-view-on-init
          @connect="onConnect"
          @edge-click="onEdgeClick"
        >
          <Background />
          <Controls position="bottom-right" />
          <MiniMap position="bottom-left" />

          <template #node-custom="{ data, id }">
            <div class="wfd-node" :class="'wfd-node--' + data.nodeType">
              <Handle type="target" :position="Position.Left" class="wfd-handle wfd-handle--target" />
              <div class="wfd-node__header">
                <i class="mdi" :class="getNodeIcon(data.nodeType)"></i>
                <span class="wfd-node__label">{{ data.label }}</span>
                <button class="wfd-node__remove" @click.stop="removeNode(id)">
                  <i class="mdi mdi-close"></i>
                </button>
              </div>
              <div v-if="getNodeSummary(data)" class="wfd-node__desc">{{ getNodeSummary(data) }}</div>
              <button class="wfd-node__config" @click.stop="openNodeConfig(id)">
                <i class="mdi mdi-cog-outline"></i>
                {{ $t('WORKFLOW_CONFIGURE') }}
              </button>
              <Handle type="source" :position="Position.Right" class="wfd-handle wfd-handle--source" />
            </div>
          </template>
        </VueFlow>
      </div>
    </div>

    <AppModal
      v-model="configVisible"
      :title="configNode?.data?.label"
      :subtitle="configNodeId"
      :width="1280"
      @close="configNodeId = ''"
    >
      <template #header>
        <div class="wfp-modal-header-custom">
          <v-icon :color="getNodeColor(configNodeType)" class="mr-2">{{ getNodeIcon(configNodeType) }}</v-icon>
          <div class="wfp-modal-header-title">
            <h3>{{ configNode?.data?.label }}</h3>
            <span class="text-caption text-disabled">{{ configNodeId }}</span>
          </div>
        </div>
      </template>

      <div class="wfp-modal__panels">
        <!-- LEFT: Input (previous step output) -->
        <div class="wfp-panel wfp-panel--input">
          <div class="wfp-panel__title">
            <v-icon size="16">mdi-import</v-icon> {{ $t('WORKFLOW_TAB_INPUT') }}
          </div>
          <div class="wfp-panel__body">
            <div v-if="!previousStepNodes.length" class="wfp-panel__empty">
              <v-icon size="32">mdi-arrow-left-bold-outline</v-icon>
              <span>{{ $t('WORKFLOW_NO_INPUT_NODES') }}</span>
            </div>
            <div v-for="pNode in previousStepNodes" :key="pNode.id" class="wfp-io-node">
              <div class="wfp-io-node__header">
                <v-icon size="16">{{ getNodeIcon(pNode.type) }}</v-icon>
                <span>{{ pNode.label }}</span>
              </div>
              <div class="wfp-io-node__fields">
                <div
                  v-for="field in getNodeOutputFields(pNode.type)"
                  :key="field.key"
                  class="wfp-io-field wfp-io-field--draggable"
                  draggable="true"
                  @dragstart="onFieldDragStart($event, pNode.id, field.key)"
                >
                  <code class="wfp-io-field__expr">{<span>{</span>{{ pNode.id }}.{{ field.key }}<span>}</span>}</code>
                  <span class="wfp-io-field__label">{{ field.label }}</span>
                  <span class="wfp-io-field__type">{{ field.type || 'string' }}</span>
                  <v-icon size="14" class="wfp-io-field__drag">mdi-drag-vertical</v-icon>
                </div>
              </div>
              <div v-if="getNodeLastOutput(pNode.id)" class="wfp-io-node__data">
                <div class="wfp-io-node__data-title">{{ $t('WORKFLOW_LAST_OUTPUT') }}</div>
                <JsonTreeViewer :data="getNodeLastOutput(pNode.id)" :node-id="pNode.id" />
              </div>
            </div>
          </div>
        </div>

        <!-- CENTER: Configuration -->
        <div class="wfp-panel wfp-panel--config">
          <div class="wfp-panel__title">
            <v-icon size="16">mdi-cog-outline</v-icon> {{ $t('WORKFLOW_TAB_CONFIG') }}
          </div>
          <div class="wfp-panel__body">
            <AppInput
              v-model="configData.label"
              :label="$t('LABEL')"
              dense
              class="mb-4"
            />

            <!-- ═══════ CHANGE STATE ═══════ -->
            <template v-if="configNodeType === 'change_state'">
              <ExprField :label="$t('WORKFLOW_TASK')" v-model="configData.taskId" :context-nodes="upstreamContextNodes" :options="taskOptions" />
              <div class="wfp-field-label mt-4">{{ $t('WORKFLOW_TARGET_STATE') }}</div>
              <AppSelect v-model="configData.targetState" :items="stateItems" :placeholder="$t('SELECT')" compact />
            </template>

            <!-- ═══════ SEND NOTIFICATION ═══════ -->
            <template v-if="configNodeType === 'send_notification'">
              <ExprField :label="$t('WORKFLOW_TARGET_USER')" v-model="configData.targetUserId" :context-nodes="upstreamContextNodes" :options="memberOptions" />
              <ExprField :label="$t('MESSAGE')" v-model="configData.message" :context-nodes="upstreamContextNodes" :multiline="true" />
            </template>

            <!-- ═══════ ADD COMMENT ═══════ -->
            <template v-if="configNodeType === 'add_comment'">
              <ExprField :label="$t('WORKFLOW_TASK')" v-model="configData.taskId" :context-nodes="upstreamContextNodes" :options="taskOptions" />
              <ExprField :label="$t('COMMENT')" v-model="configData.comment" :context-nodes="upstreamContextNodes" :multiline="true" />
            </template>

            <!-- ═══════ ASSIGN MEMBER ═══════ -->
            <template v-if="configNodeType === 'assign_member'">
              <ExprField :label="$t('WORKFLOW_TASK')" v-model="configData.taskId" :context-nodes="upstreamContextNodes" :options="taskOptions" />
              <ExprField :label="$t('WORKFLOW_MEMBER')" v-model="configData.memberId" :context-nodes="upstreamContextNodes" :options="memberOptions" />
            </template>

            <!-- ═══════ MOVE TASK ═══════ -->
            <template v-if="configNodeType === 'move_task'">
              <ExprField :label="$t('WORKFLOW_TASK')" v-model="configData.taskId" :context-nodes="upstreamContextNodes" :options="taskOptions" />
              <ExprField :label="$t('WORKFLOW_TARGET_LIST')" v-model="configData.targetListId" :context-nodes="upstreamContextNodes" :options="listOptions" />
            </template>

            <!-- ═══════ CREATE TASK ═══════ -->
            <template v-if="configNodeType === 'create_task'">
              <ExprField :label="$t('WORKFLOW_TARGET_LIST')" v-model="configData.listId" :context-nodes="upstreamContextNodes" :options="listOptions" />
              <ExprField :label="$t('TITLE')" v-model="configData.taskTitle" :context-nodes="upstreamContextNodes" />
              <ExprField :label="$t('DESCRIPTION')" v-model="configData.description" :context-nodes="upstreamContextNodes" :multiline="true" />
              <div class="wfp-field-label mt-4">{{ $t('STATE') }}</div>
              <AppSelect v-model="configData.state" :items="createStateItems" :placeholder="$t('DEFAULT')" compact />
              <ExprField :label="$t('WORKFLOW_ESTIMATED_TIME')" v-model="configData.estimatedTime" :context-nodes="upstreamContextNodes" placeholder="0" input-type="number" />
              <ExprField :label="$t('WORKFLOW_DUE_DATE')" v-model="configData.dueAt" :context-nodes="upstreamContextNodes" input-type="date" />
              <ExprField :label="$t('WORKFLOW_BEGIN_DATE')" v-model="configData.beginAt" :context-nodes="upstreamContextNodes" input-type="date" />
              <ExprField :label="$t('WORKFLOW_END_DATE')" v-model="configData.endAt" :context-nodes="upstreamContextNodes" input-type="date" />
            </template>

            <!-- ═══════ SET DATE ═══════ -->
            <template v-if="configNodeType === 'set_date'">
              <ExprField :label="$t('WORKFLOW_TASK')" v-model="configData.taskId" :context-nodes="upstreamContextNodes" :options="taskOptions" />
              <div class="wfp-field-label mt-4">{{ $t('WORKFLOW_DATE_FIELD') }}</div>
              <AppSelect v-model="configData.dateField" :items="dateFieldItems" :placeholder="$t('SELECT')" compact />
              <ExprField :label="$t('VALUE')" v-model="configData.dateValue" :context-nodes="upstreamContextNodes" input-type="date" />
            </template>

            <!-- ═══════ SET CUSTOM FIELD ═══════ -->
            <template v-if="configNodeType === 'set_custom_field'">
              <ExprField :label="$t('WORKFLOW_TASK')" v-model="configData.taskId" :context-nodes="upstreamContextNodes" :options="taskOptions" />
              <ExprField :label="$t('WORKFLOW_CUSTOM_FIELD')" v-model="configData.fieldId" :context-nodes="upstreamContextNodes" :options="customFieldOptions" />
              <ExprField :label="$t('VALUE')" v-model="configData.value" :context-nodes="upstreamContextNodes" />
            </template>

            <!-- ═══════ ADD LABEL ═══════ -->
            <template v-if="configNodeType === 'add_label'">
              <ExprField :label="$t('WORKFLOW_TASK')" v-model="configData.taskId" :context-nodes="upstreamContextNodes" :options="taskOptions" />
              <ExprField :label="$t('WORKFLOW_LABEL')" v-model="configData.labelId" :context-nodes="upstreamContextNodes" :options="labelOptions" />
            </template>

            <!-- ═══════ REMOVE LABEL ═══════ -->
            <template v-if="configNodeType === 'remove_label'">
              <ExprField :label="$t('WORKFLOW_TASK')" v-model="configData.taskId" :context-nodes="upstreamContextNodes" :options="taskOptions" />
              <ExprField :label="$t('WORKFLOW_LABEL')" v-model="configData.labelId" :context-nodes="upstreamContextNodes" :options="labelOptions" />
            </template>

            <!-- ═══════ ADD BLOCKER ═══════ -->
            <template v-if="configNodeType === 'add_blocker'">
              <ExprField :label="$t('WORKFLOW_BLOCKED_TASK')" v-model="configData.blockedId" :context-nodes="upstreamContextNodes" :options="taskOptions" />
              <ExprField :label="$t('WORKFLOW_BLOCKER_TASK')" v-model="configData.blockerId" :context-nodes="upstreamContextNodes" :options="taskOptions" />
              <ExprField :label="$t('DESCRIPTION')" v-model="configData.blockerDesc" :context-nodes="upstreamContextNodes" :multiline="true" />
            </template>

            <!-- ═══════ ADD RELATION ═══════ -->
            <template v-if="configNodeType === 'add_relation'">
              <ExprField :label="$t('WORKFLOW_FROM_TASK')" v-model="configData.fromTaskId" :context-nodes="upstreamContextNodes" :options="taskOptions" />
              <ExprField :label="$t('WORKFLOW_TO_TASK')" v-model="configData.toTaskId" :context-nodes="upstreamContextNodes" :options="taskOptions" />
              <div class="wfp-field-label mt-4">{{ $t('WORKFLOW_RELATION_TYPE') }}</div>
              <AppSelect v-model="configData.relationType" :items="relationTypeItems" :placeholder="$t('SELECT')" compact />
            </template>

            <!-- ═══════ SEND EMAIL ═══════ -->
            <template v-if="configNodeType === 'send_email'">
              <ExprField :label="$t('WORKFLOW_EMAIL_TO')" v-model="configData.to" :context-nodes="upstreamContextNodes" placeholder="user@example.com" />
              <ExprField :label="$t('WORKFLOW_EMAIL_SUBJECT')" v-model="configData.subject" :context-nodes="upstreamContextNodes" />
              <ExprField :label="$t('WORKFLOW_EMAIL_BODY')" v-model="configData.body" :context-nodes="upstreamContextNodes" :multiline="true" />
            </template>

            <!-- ═══════ SEND SMS ═══════ -->
            <template v-if="configNodeType === 'send_sms'">
              <ExprField :label="$t('WORKFLOW_SMS_TO')" v-model="configData.to" :context-nodes="upstreamContextNodes" placeholder="+1234567890" />
              <ExprField :label="$t('MESSAGE')" v-model="configData.message" :context-nodes="upstreamContextNodes" :multiline="true" />
            </template>

            <!-- ═══════ CONDITION ═══════ -->
            <template v-if="configNodeType === 'condition'">
              <ExprField :label="$t('WORKFLOW_TASK')" v-model="configData.taskId" :context-nodes="upstreamContextNodes" :options="taskOptions" />
              <div class="wfp-field-label mt-4">{{ $t('WORKFLOW_CONDITION_FIELD') }}</div>
              <AppSelect v-model="configData.field" :items="conditionFieldItems" :placeholder="$t('SELECT')" compact />
              <div class="wfp-field-label mt-4">{{ $t('WORKFLOW_CONDITION_OP') }}</div>
              <AppSelect v-model="configData.operator" :items="conditionOpItems" :placeholder="$t('SELECT')" compact />
              <ExprField :label="$t('VALUE')" v-model="configData.value" :context-nodes="upstreamContextNodes" />
            </template>

            <!-- ═══════ DELAY ═══════ -->
            <template v-if="configNodeType === 'delay'">
              <AppInput
                v-model.number="configData.seconds"
                type="number"
                min="1"
                :label="$t('WORKFLOW_DELAY_SECONDS')"
                dense
              />
            </template>

            <!-- ═══════ WEBHOOK ═══════ -->
            <template v-if="configNodeType === 'webhook'">
              <ExprField :label="$t('URL')" v-model="configData.url" :context-nodes="upstreamContextNodes" placeholder="https://..." />
              <div class="wfp-field-label mt-4">{{ $t('WORKFLOW_HTTP_METHOD') }}</div>
              <AppSelect v-model="configData.method" :items="httpMethodItems" :placeholder="$t('SELECT')" compact />
            </template>
          </div>
        </div>

        <!-- RIGHT: Output (current node output) -->
        <div class="wfp-panel wfp-panel--output">
          <div class="wfp-panel__title">
            <v-icon size="16">mdi-export</v-icon> {{ $t('WORKFLOW_TAB_OUTPUT') }}
          </div>
          <div class="wfp-panel__body">
            <div class="wfp-io-node">
              <div class="wfp-io-node__fields">
                <div class="wfp-io-node__fields-title">{{ $t('WORKFLOW_OUTPUT_SCHEMA') }}</div>
                <div
                  v-for="field in getNodeOutputFields(configNodeType)"
                  :key="field.key"
                  class="wfp-io-field wfp-io-field--draggable"
                  draggable="true"
                  @dragstart="onFieldDragStart($event, configNodeId, field.key)"
                >
                  <code class="wfp-io-field__expr">{<span>{</span>{{ configNodeId }}.{{ field.key }}<span>}</span>}</code>
                  <span class="wfp-io-field__label">{{ field.label }}</span>
                  <span class="wfp-io-field__type">{{ field.type || 'string' }}</span>
                  <v-icon size="14" class="wfp-io-field__drag">mdi-drag-vertical</v-icon>
                </div>
                <div v-if="!getNodeOutputFields(configNodeType).length" class="wfp-panel__empty-sm">
                  {{ $t('WORKFLOW_NO_OUTPUT_FIELDS') }}
                </div>
              </div>
              <div v-if="getNodeLastOutput(configNodeId)" class="wfp-io-node__data">
                <div class="wfp-io-node__data-title">{{ $t('WORKFLOW_LAST_OUTPUT') }}</div>
                <JsonTreeViewer :data="getNodeLastOutput(configNodeId)" :node-id="configNodeId" />
              </div>
              <div v-else class="wfp-panel__empty-sm">
                {{ $t('WORKFLOW_NO_EXECUTION_DATA') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <v-btn variant="text" @click="configNodeId = ''">
          {{ $t('CANCEL') }}
        </v-btn>
        <v-btn
          color="primary"
          elevation="2"
          @click="applyConfig"
        >
          {{ $t('APPLY') }}
        </v-btn>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { VueFlow, Position, Handle } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import type { Node, Edge, Connection } from '@vue-flow/core';
import { OperationResultStatus, WorkflowNodeType, ActivityType } from '@asoode/shared';
import type { WorkflowViewModel, WorkflowNodeDto, WorkflowEdgeDto, WorkflowExecutionViewModel } from '@asoode/shared';
import { useWorkflowStore } from '@/stores/workflow.store';
import { useProjectStore } from '@/stores/project.store';
import { useWorkPackageStore } from '@/stores/work-package.store';
import { useSocketNotifications } from '@/composables/useSocketNotifications';
import { useViewContext } from '@/composables/useViewContext';
import { useWorkflowSocketHandlers } from '@/composables/useWorkflowSocketHandlers';
import AppWaiting from '@/components/core/AppWaiting.vue';
import AppSelect from '@/components/core/AppSelect.vue';
import ExprField from '@/components/workflow/ExprField.vue';
import JsonTreeViewer from '@/components/workflow/JsonTreeViewer.vue';
import type { ContextNode, DropdownOption } from '@/components/workflow/ExprField.vue';

import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';
import '@vue-flow/minimap/dist/style.css';

interface OutputField { key: string; label: string; type?: string; }

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const workflowStore = useWorkflowStore();
const projectStore = useProjectStore();
const workPackageStore = useWorkPackageStore();

const workflowId = route.params.id as string;
useViewContext('workflow', workflowId);

const loading = ref(true);
const saving = ref(false);
const running = ref(false);
const workflow = ref<WorkflowViewModel | null>(null);
useWorkflowSocketHandlers(workflow);
const title = ref('');
const trigger = ref('manual');
const projectId = ref('');

const nodes = ref<any[]>([]);
const edges = ref<any[]>([]);

const configNodeId = ref('');
const configVisible = computed({
  get: () => !!configNodeId.value,
  set: (v) => { if (!v) configNodeId.value = ''; }
});
const configData = reactive<Record<string, any>>({});

// Project context for dropdowns — populated once, updated via socket
const projectContext = reactive<{
  tasks: DropdownOption[];
  lists: DropdownOption[];
  members: DropdownOption[];
  labels: DropdownOption[];
  customFields: DropdownOption[];
}>({ tasks: [], lists: [], members: [], labels: [], customFields: [] });

// WP IDs we're tracking for socket updates
const trackedWpIds = ref<string[]>([]);

const lastExecution = ref<WorkflowExecutionViewModel | null>(null);

const configNode = computed(() => nodes.value.find((n: any) => n.id === configNodeId.value) as any);
const configNodeType = computed(() => configNode.value?.data?.nodeType || '');

const taskOptions = computed(() => projectContext.tasks);
const listOptions = computed(() => projectContext.lists);
const memberOptions = computed(() => projectContext.members);
const labelOptions = computed(() => projectContext.labels);
const customFieldOptions = computed(() => projectContext.customFields);

// AppSelect item arrays for native select replacements
const triggerItems = computed(() => [
  { text: t('WORKFLOW_TRIGGER_MANUAL'), value: 'manual' },
  { text: t('WORKFLOW_TRIGGER_TASK_CREATED'), value: 'task_created' },
  { text: t('WORKFLOW_TRIGGER_STATE_CHANGED'), value: 'task_state_changed' },
  { text: t('WORKFLOW_TRIGGER_TASK_ASSIGNED'), value: 'task_assigned' },
  { text: t('WORKFLOW_TRIGGER_TASK_DUE'), value: 'task_due' },
  { text: t('WORKFLOW_TRIGGER_MEMBER_ADDED'), value: 'member_added' },
  { text: t('WORKFLOW_TRIGGER_COMMENT_ADDED'), value: 'comment_added' },
]);
const stateItems = computed(() => [
  { text: t('TODO'), value: '0' },
  { text: t('IN_PROGRESS'), value: '1' },
  { text: t('DONE'), value: '2' },
  { text: t('BLOCKED'), value: '3' },
  { text: t('CANCELLED'), value: '4' },
  { text: t('PAUSED'), value: '5' },
]);
const createStateItems = computed(() => [
  { text: t('DEFAULT'), value: '' },
  ...stateItems.value.slice(0, 4),
]);
const dateFieldItems = computed(() => [
  { text: t('WORKFLOW_DUE_DATE'), value: 'dueAt' },
  { text: t('WORKFLOW_BEGIN_DATE'), value: 'beginAt' },
  { text: t('WORKFLOW_END_DATE'), value: 'endAt' },
]);
const relationTypeItems = computed(() => [
  { text: t('WORKFLOW_RELATES_TO'), value: '1' },
  { text: t('WORKFLOW_DUPLICATE_OF'), value: '2' },
  { text: t('WORKFLOW_CHILD_OF'), value: '3' },
]);
const conditionFieldItems = computed(() => [
  { text: t('STATE'), value: 'state' },
  { text: t('PRIORITY'), value: 'priority' },
  { text: t('TITLE'), value: 'title' },
  { text: t('WORKFLOW_ESTIMATED_TIME'), value: 'estimatedTime' },
  { text: t('DESCRIPTION'), value: 'description' },
]);
const conditionOpItems = computed(() => [
  { text: t('EQUALS'), value: 'equals' },
  { text: t('NOT_EQUALS'), value: 'not_equals' },
  { text: t('CONTAINS'), value: 'contains' },
  { text: t('WORKFLOW_GREATER_THAN'), value: 'greater_than' },
  { text: t('WORKFLOW_LESS_THAN'), value: 'less_than' },
]);
const httpMethodItems = [
  { text: 'POST', value: 'POST' },
  { text: 'GET', value: 'GET' },
  { text: 'PUT', value: 'PUT' },
  { text: 'DELETE', value: 'DELETE' },
];

// Upstream nodes with output schemas for IntelliSense
const upstreamContextNodes = computed<ContextNode[]>(() => {
  if (!configNodeId.value) return [];
  const visited = new Set<string>();
  const queue = [configNodeId.value];
  while (queue.length) {
    const id = queue.shift()!;
    for (const edge of edges.value) {
      if (edge.target === id && !visited.has(edge.source)) {
        visited.add(edge.source);
        queue.push(edge.source);
      }
    }
  }
  return nodes.value
    .filter((n) => visited.has(n.id))
    .map((n) => ({
      id: n.id,
      label: n.data.label,
      type: n.data.nodeType,
      outputFields: getNodeOutputFields(n.data.nodeType),
    }));
});

// Direct parent nodes for input panel
const previousStepNodes = computed(() => {
  if (!configNodeId.value) return [];
  const parentIds = edges.value.filter((e) => e.target === configNodeId.value).map((e) => e.source);
  return nodes.value
    .filter((n) => parentIds.includes(n.id))
    .map((n) => ({ id: n.id, label: n.data.label, type: n.data.nodeType }));
});

// ─── Node ID generation: human-readable like n8n ───
const nodeCounters = reactive<Record<string, number>>({});

function generateNodeId(type: string): string {
  if (!nodeCounters[type]) nodeCounters[type] = 0;
  nodeCounters[type]++;
  // Slugify the type: "create_task" → "CreateTask", append counter
  const name = type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  return `${name}${nodeCounters[type]}`;
}

function initNodeCounters() {
  // Scan existing nodes to set counters so new nodes don't collide
  for (const n of nodes.value) {
    const type = n.data.nodeType;
    const name = type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    const match = n.id.match(new RegExp(`^${name}(\\d+)$`));
    if (match) {
      const num = parseInt(match[1], 10);
      nodeCounters[type] = Math.max(nodeCounters[type] || 0, num);
    } else {
      // Old-style ID, just count it
      nodeCounters[type] = (nodeCounters[type] || 0) + 1;
    }
  }
}

// ─── Output field schemas per node type ───
function getNodeOutputFields(type: string): OutputField[] {
  const schemas: Record<string, OutputField[]> = {
    trigger: [
      { key: 'taskId', label: 'Task ID', type: 'string' },
      { key: 'taskTitle', label: 'Task Title', type: 'string' },
      { key: 'taskState', label: 'Task State', type: 'number' },
      { key: 'userId', label: 'User ID', type: 'string' },
      { key: 'listId', label: 'List ID', type: 'string' },
    ],
    create_task: [
      { key: 'taskId', label: 'Created Task ID', type: 'string' },
      { key: 'taskTitle', label: 'Task Title', type: 'string' },
      { key: 'listId', label: 'List ID', type: 'string' },
    ],
    change_state: [
      { key: 'taskId', label: 'Task ID', type: 'string' },
      { key: 'previousState', label: 'Previous State', type: 'number' },
      { key: 'newState', label: 'New State', type: 'number' },
    ],
    assign_member: [
      { key: 'taskId', label: 'Task ID', type: 'string' },
      { key: 'memberId', label: 'Member ID', type: 'string' },
    ],
    move_task: [
      { key: 'taskId', label: 'Task ID', type: 'string' },
      { key: 'targetListId', label: 'Target List ID', type: 'string' },
    ],
    add_comment: [
      { key: 'taskId', label: 'Task ID', type: 'string' },
      { key: 'commentId', label: 'Comment ID', type: 'string' },
    ],
    condition: [
      { key: 'result', label: 'Result', type: 'boolean' },
      { key: 'field', label: 'Field Checked', type: 'string' },
      { key: 'value', label: 'Actual Value', type: 'string' },
    ],
    delay: [{ key: 'waited', label: 'Seconds Waited', type: 'number' }],
    webhook: [
      { key: 'statusCode', label: 'Status Code', type: 'number' },
      { key: 'body', label: 'Response Body', type: 'object' },
    ],
    set_date: [
      { key: 'taskId', label: 'Task ID', type: 'string' },
      { key: 'field', label: 'Date Field', type: 'string' },
      { key: 'value', label: 'Date Value', type: 'string' },
    ],
    set_custom_field: [
      { key: 'taskId', label: 'Task ID', type: 'string' },
      { key: 'fieldId', label: 'Field ID', type: 'string' },
      { key: 'value', label: 'Value Set', type: 'string' },
    ],
    add_label: [
      { key: 'taskId', label: 'Task ID', type: 'string' },
      { key: 'labelId', label: 'Label ID', type: 'string' },
    ],
    remove_label: [
      { key: 'taskId', label: 'Task ID', type: 'string' },
      { key: 'labelId', label: 'Label ID', type: 'string' },
    ],
    add_blocker: [
      { key: 'blockedId', label: 'Blocked Task ID', type: 'string' },
      { key: 'blockerId', label: 'Blocker Task ID', type: 'string' },
    ],
    add_relation: [
      { key: 'fromTaskId', label: 'From Task ID', type: 'string' },
      { key: 'toTaskId', label: 'To Task ID', type: 'string' },
      { key: 'type', label: 'Relation Type', type: 'number' },
    ],
    send_email: [
      { key: 'to', label: 'Recipient', type: 'string' },
      { key: 'subject', label: 'Subject', type: 'string' },
      { key: 'sent', label: 'Sent', type: 'boolean' },
    ],
    send_sms: [
      { key: 'to', label: 'Recipient', type: 'string' },
      { key: 'sent', label: 'Sent', type: 'boolean' },
    ],
    send_notification: [
      { key: 'userId', label: 'User ID', type: 'string' },
      { key: 'message', label: 'Message', type: 'string' },
    ],
  };
  return schemas[type] || [];
}

function getNodeLastOutput(nodeId: string): Record<string, any> | null {
  if (!lastExecution.value?.logs) return null;
  const log = lastExecution.value.logs.find((l) => l.nodeId === nodeId);
  return log?.outputs || null;
}

function formatJson(data: any): string {
  try { return JSON.stringify(data, null, 2); }
  catch { return String(data); }
}

function onFieldDragStart(e: DragEvent, nodeId: string, fieldKey: string) {
  const expr = `\u007B\u007B${nodeId}.${fieldKey}\u007D\u007D`;
  e.dataTransfer?.setData('text/plain', expr);
  e.dataTransfer?.setData('application/x-workflow-expr', expr);
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
}

// ─── Node types ───
interface NodeTypeInfo { type: string; label: string; icon: string; }

const flowNodes: NodeTypeInfo[] = [
  { type: WorkflowNodeType.Trigger, label: t('WORKFLOW_NODE_TRIGGER'), icon: 'mdi-lightning-bolt' },
  { type: WorkflowNodeType.Condition, label: t('WORKFLOW_NODE_CONDITION'), icon: 'mdi-source-branch' },
  { type: WorkflowNodeType.Delay, label: t('WORKFLOW_NODE_DELAY'), icon: 'mdi-timer-sand' },
  { type: WorkflowNodeType.Webhook, label: t('WORKFLOW_NODE_WEBHOOK'), icon: 'mdi-webhook' },
];
const taskNodes: NodeTypeInfo[] = [
  { type: WorkflowNodeType.CreateTask, label: t('WORKFLOW_NODE_CREATE_TASK'), icon: 'mdi-plus-circle-outline' },
  { type: WorkflowNodeType.ChangeState, label: t('WORKFLOW_NODE_CHANGE_STATE'), icon: 'mdi-swap-horizontal' },
  { type: WorkflowNodeType.MoveTask, label: t('WORKFLOW_NODE_MOVE_TASK'), icon: 'mdi-arrow-right-bold-outline' },
  { type: WorkflowNodeType.AssignMember, label: t('WORKFLOW_NODE_ASSIGN_MEMBER'), icon: 'mdi-account-plus-outline' },
  { type: WorkflowNodeType.AddComment, label: t('WORKFLOW_NODE_ADD_COMMENT'), icon: 'mdi-comment-plus-outline' },
  { type: WorkflowNodeType.AddBlocker, label: t('WORKFLOW_NODE_ADD_BLOCKER'), icon: 'mdi-block-helper' },
  { type: WorkflowNodeType.AddRelation, label: t('WORKFLOW_NODE_ADD_RELATION'), icon: 'mdi-link-variant' },
];
const dataNodes: NodeTypeInfo[] = [
  { type: WorkflowNodeType.SetDate, label: t('WORKFLOW_NODE_SET_DATE'), icon: 'mdi-calendar-edit' },
  { type: WorkflowNodeType.SetCustomField, label: t('WORKFLOW_NODE_SET_CUSTOM_FIELD'), icon: 'mdi-form-textbox' },
  { type: WorkflowNodeType.AddLabel, label: t('WORKFLOW_NODE_ADD_LABEL'), icon: 'mdi-label-outline' },
  { type: WorkflowNodeType.RemoveLabel, label: t('WORKFLOW_NODE_REMOVE_LABEL'), icon: 'mdi-label-off-outline' },
];
const commNodes: NodeTypeInfo[] = [
  { type: WorkflowNodeType.SendNotification, label: t('WORKFLOW_NODE_SEND_NOTIFICATION'), icon: 'mdi-bell-outline' },
  { type: WorkflowNodeType.SendEmail, label: t('WORKFLOW_NODE_SEND_EMAIL'), icon: 'mdi-email-outline' },
  { type: WorkflowNodeType.SendSms, label: t('WORKFLOW_NODE_SEND_SMS'), icon: 'mdi-cellphone-message' },
];
const allNodeTypes = [...flowNodes, ...taskNodes, ...dataNodes, ...commNodes];

function getNodeIcon(type: string): string {
  return allNodeTypes.find((n) => n.type === type)?.icon || 'mdi-circle-outline';
}

function getNodeColor(type: string): string {
  const map: Record<string, string> = {
    trigger: '#ff5252',
    condition: '#2196f3',
    delay: '#ffc107',
    webhook: '#9c27b0',
    create_task: '#4caf50',
    change_state: '#8bc34a',
    move_task: '#795548',
    assign_member: '#607d8b',
    add_comment: '#ff5722',
    add_blocker: '#f44336',
    add_relation: '#3f51b5',
    set_date: '#00bcd4',
    set_custom_field: '#009688',
    add_label: '#cddc39',
    remove_label: '#ffeb3b',
    send_notification: '#ff9800',
    send_email: '#03a9f4',
    send_sms: '#00bcd4',
  };
  return map[type] || '#999';
}

function getNodeSummary(data: any): string {
  switch (data.nodeType) {
    case 'create_task': return data.taskTitle ? `"${data.taskTitle}"` : '';
    case 'change_state': return data.targetState != null ? `→ state ${data.targetState}` : '';
    case 'send_notification': return data.message ? data.message.slice(0, 40) : '';
    case 'send_email': return data.to || '';
    case 'send_sms': return data.to || '';
    case 'condition': return data.field ? `${data.field} ${data.operator} ${data.value}` : '';
    case 'delay': return data.seconds ? `${data.seconds}s` : '';
    case 'webhook': return data.url ? `${data.method || 'POST'} ${data.url.slice(0, 30)}` : '';
    case 'set_date': return data.dateField || '';
    case 'add_label': case 'remove_label': return resolveLabel(data.labelId);
    case 'set_custom_field': return resolveField(data.fieldId);
    case 'assign_member': return resolveMember(data.memberId);
    case 'move_task': return resolveList(data.targetListId);
    default: return '';
  }
}

function resolveLabel(id: string) { return projectContext.labels.find((o) => o.value === id)?.label || (id ? `${id.slice(0, 8)}...` : ''); }
function resolveField(id: string) { return projectContext.customFields.find((o) => o.value === id)?.label || (id ? `${id.slice(0, 8)}...` : ''); }
function resolveMember(id: string) { return projectContext.members.find((o) => o.value === id)?.label || (id ? `${id.slice(0, 8)}...` : ''); }
function resolveList(id: string) { const l = projectContext.lists.find((o) => o.value === id); return l ? `→ ${l.label}` : (id ? `${id.slice(0, 8)}...` : ''); }

// ─── Load context once, then let socket keep it fresh ───
async function loadProjectContext(pid: string) {
  const projectResult = await projectStore.fetchProject(pid);
  if (projectResult.status !== OperationResultStatus.Success || !projectResult.data) return;
  const project = projectResult.data;

  projectContext.members = (project.members || [])
    .filter((m) => m.member)
    .map((m) => ({ value: m.recordId, label: m.member.fullName || m.member.email, subtitle: m.member.email }));

  const wpIds: string[] = [];
  await rebuildWpContext(project.workPackages?.map((wp) => wp.id) || []);

  trackedWpIds.value = wpIds;
}

async function rebuildWpContext(wpIds: string[]) {
  const allLists: DropdownOption[] = [];
  const allLabels: DropdownOption[] = [];
  const allTasks: DropdownOption[] = [];
  const allCustomFields: DropdownOption[] = [];
  const stateLabels = ['Todo', 'In Progress', 'Done', 'Blocked', 'Cancelled'];

  for (const wpId of wpIds) {
    const wpResult = await workPackageStore.fetch(wpId);
    if (wpResult.status !== OperationResultStatus.Success || !wpResult.data) continue;
    const wp = wpResult.data;

    for (const list of wp.lists || []) {
      allLists.push({ value: list.id, label: list.title, color: list.color, subtitle: wp.title });
      for (const task of list.tasks || []) {
        allTasks.push({ value: task.id, label: task.title, subtitle: `${list.title} · ${stateLabels[task.state] || ''}` });
      }
    }
    for (const label of wp.labels || []) {
      allLabels.push({ value: label.id, label: label.title, color: label.color, subtitle: wp.title });
    }
    for (const field of wp.customFields || []) {
      allCustomFields.push({ value: field.id, label: field.title, subtitle: `${field.type} · ${wp.title}` });
    }
  }

  projectContext.lists = allLists;
  projectContext.labels = allLabels;
  projectContext.tasks = allTasks;
  projectContext.customFields = allCustomFields;
  trackedWpIds.value = wpIds;
}

// ─── Socket: listen for real-time updates ───
function handleWpChange(data: any) {
  const wpId = data?.packageId || data?.id;
  if (wpId && trackedWpIds.value.includes(wpId)) {
    // Rebuild dropdown data from socket-updated store
    rebuildWpContext(trackedWpIds.value);
  }
}

useSocketNotifications({
  // Work package structure changes
  [ActivityType.WorkPackageLabelAdd]: handleWpChange,
  [ActivityType.WorkPackageLabelRename]: handleWpChange,
  [ActivityType.WorkPackageLabelRemove]: handleWpChange,
  [ActivityType.WorkPackageMemberAdd]: handleWpChange,
  [ActivityType.WorkPackageMemberRemove]: handleWpChange,
  [ActivityType.WorkPackageListAdd]: handleWpChange,
  [ActivityType.WorkPackageListEdit]: handleWpChange,
  [ActivityType.WorkPackageListRemove]: handleWpChange,
  [ActivityType.WorkPackageListClone]: handleWpChange,
  // Task changes
  [ActivityType.WorkPackageTaskAdd]: handleWpChange,
  [ActivityType.WorkPackageTaskEdit]: handleWpChange,
  [ActivityType.WorkPackageTaskRemove]: handleWpChange,
  [ActivityType.WorkPackageTaskMove]: handleWpChange,
  [ActivityType.WorkPackageTaskBulkAdd]: handleWpChange,
  // Custom fields
  [ActivityType.WorkPackageCustomFieldAdd]: handleWpChange,
  [ActivityType.WorkPackageCustomFieldEdit]: handleWpChange,
  [ActivityType.WorkPackageCustomFieldRemove]: handleWpChange,
  // Workflow execution updates
  [ActivityType.WorkflowExecute]: (data: any) => {
    if (data?.workflowId === workflowId && data?.execution) {
      lastExecution.value = data.execution;
    }
  },
});

async function loadLastExecution() {
  const result = await workflowStore.executions(workflowId);
  if (result.status === OperationResultStatus.Success && result.data?.length) {
    lastExecution.value = result.data.sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    )[0];
  }
}

onMounted(async () => {
  const op = await workflowStore.fetch(workflowId);
  loading.value = false;
  if (op.status === OperationResultStatus.Success && op.data) {
    workflow.value = op.data;
    title.value = op.data.title;
    trigger.value = op.data.trigger;
    projectId.value = op.data.projectId || '';

    nodes.value = (op.data.nodes || []).map((n: WorkflowNodeDto) => ({
      id: n.id,
      type: 'custom',
      position: n.position,
      data: { label: n.label, nodeType: n.type, ...n.data },
    }));
    edges.value = (op.data.edges || []).map((e: WorkflowEdgeDto) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label || '',
      animated: true,
    }));

    initNodeCounters();

    // Initial context load + execution history
    if (projectId.value) loadProjectContext(projectId.value);
    loadLastExecution();
  }
});

function goBack() { router.push('/workflows'); }

function onConnect(connection: Connection) {
  const id = `e-${connection.source}-${connection.target}`;
  edges.value.push({ id, source: connection.source!, target: connection.target!, animated: true } as Edge);
}

function onEdgeClick(event: any) {
  const edge = event.edge ?? event;
  if (edge?.id) edges.value = edges.value.filter((e) => e.id !== edge.id);
}

let dragType = '';
function onDragStart(event: DragEvent, nt: NodeTypeInfo) {
  dragType = nt.type;
  event.dataTransfer!.effectAllowed = 'move';
}

function onDrop(event: DragEvent) {
  if (!dragType) return;
  const flowEl = (event.currentTarget as HTMLElement).querySelector('.vue-flow__viewport');
  if (!flowEl) return;
  const bounds = flowEl.getBoundingClientRect();
  const x = event.clientX - bounds.left;
  const y = event.clientY - bounds.top;

  const id = generateNodeId(dragType);
  const info = allNodeTypes.find((n) => n.type === dragType);
  nodes.value.push({
    id,
    type: 'custom',
    position: { x, y },
    data: { label: info?.label || dragType, nodeType: dragType },
  } as Node);
  dragType = '';
}

function removeNode(id: string) {
  nodes.value = nodes.value.filter((n) => n.id !== id);
  edges.value = edges.value.filter((e) => e.source !== id && e.target !== id);
}

function openNodeConfig(id: string) {
  const node = nodes.value.find((n) => n.id === id);
  if (!node) return;
  configNodeId.value = id;
  Object.keys(configData).forEach((k) => delete configData[k]);
  Object.assign(configData, { label: node.data.label, ...node.data });
}

function applyConfig() {
  const node = nodes.value.find((n) => n.id === configNodeId.value);
  if (!node) return;
  const { label, ...rest } = configData;
  node.data = { ...node.data, ...rest, label };
  configNodeId.value = '';
}

function toDto(): { nodes: WorkflowNodeDto[]; edges: WorkflowEdgeDto[] } {
  return {
    nodes: nodes.value.map((n) => ({
      id: n.id, type: n.data.nodeType, label: n.data.label, position: n.position,
      data: (() => { const { label: _l, nodeType: _t, ...rest } = n.data; return rest; })(),
    })),
    edges: edges.value.map((e) => ({
      id: e.id, source: e.source, target: e.target, label: typeof e.label === 'string' ? e.label : '',
    })),
  };
}

async function saveTitle() {
  if (!title.value.trim() || !workflow.value) return;
  await workflowStore.edit(workflowId, { title: title.value.trim() });
}

async function saveTrigger() {
  if (!workflow.value) return;
  await workflowStore.edit(workflowId, { trigger: trigger.value });
}

async function saveFlow() {
  saving.value = true;
  const dto = toDto();
  await workflowStore.edit(workflowId, { title: title.value.trim(), trigger: trigger.value, nodes: dto.nodes, edges: dto.edges });
  saving.value = false;
}

async function runFlow() {
  running.value = true;
  const result = await workflowStore.execute(workflowId);
  if (result.status === OperationResultStatus.Success && result.data) {
    lastExecution.value = result.data;
  }
  running.value = false;
}
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.wfd { display: flex; flex-direction: column; height: 100vh; background: $background; }

.wfd-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px; background: $surface; border-bottom: 1px solid $divider;
  gap: 12px; z-index: 10; flex-shrink: 0;

  &__left, &__right { display: flex; align-items: center; gap: 10px; }
  &__back { background: none; border: none; cursor: pointer; font-size: 1.2rem; color: $text-secondary; padding: 4px; border-radius: 4px; &:hover { background: rgba(0,0,0,0.05); } }
  &__title-group { display: flex; align-items: center; gap: 10px; }
  &__title { border: none; outline: none; font-size: 0.95rem; font-weight: 600; color: $text-primary; background: transparent; min-width: 120px; &:focus { border-bottom: 2px solid $primary; } }
  &__badge { font-size: 0.65rem; font-weight: 600; padding: 2px 8px; border-radius: 10px; background: rgba(0,0,0,0.06); color: $text-disabled; &--active { background: rgba($success, 0.12); color: $success; } }
  &__trigger { border: 1px solid $divider; border-radius: 4px; padding: 5px 8px; font-size: 0.78rem; outline: none; background: transparent; color: $text-primary; }
  &__btn {
    display: flex; align-items: center; gap: 5px; border: none; border-radius: 6px; padding: 6px 14px; font-size: 0.78rem; font-weight: 500; cursor: pointer;
    &--save { background: $primary; color: #fff; &:hover { opacity: 0.9; } }
    &--run { background: $success; color: #fff; &:hover { opacity: 0.9; } }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
    i { font-size: 0.95rem; }
  }
}

.wfd-canvas { flex: 1; display: flex; overflow: hidden; }

.wfd-palette {
  width: 220px; background: $surface; border-inline-end: 1px solid $divider; padding: 12px; overflow-y: auto; flex-shrink: 0;
  &__title { font-size: 0.72rem; font-weight: 600; color: $text-secondary; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
  &__section { font-size: 0.65rem; font-weight: 700; color: $text-disabled; text-transform: uppercase; letter-spacing: 0.8px; margin: 14px 0 6px; padding-bottom: 4px; border-bottom: 1px solid $divider; }
  &__item {
    display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 6px;
    font-size: 0.75rem; color: $text-primary; cursor: grab; margin-bottom: 2px;
    border: 1px solid transparent; transition: $transition-fast;
    &:hover { background: rgba($primary, 0.06); border-color: rgba($primary, 0.2); }
    &:active { cursor: grabbing; }
    i { font-size: 0.95rem; color: $primary; }
  }
}

.wfd-flow { flex: 1; }

.wfd-handle {
  width: 14px !important; height: 14px !important; border-radius: 50% !important;
  border: 2px solid $primary !important; background: $surface !important; transition: all 0.15s ease;
  &:hover { width: 18px !important; height: 18px !important; background: $primary !important; border-color: $primary !important; }
  &--target { border-color: $info !important; &:hover { background: $info !important; border-color: $info !important; } }
  &--source { border-color: $success !important; &:hover { background: $success !important; border-color: $success !important; } }
}

.wfd-node {
  background: $surface; border: 2px solid $divider; border-radius: 10px;
  min-width: 180px; max-width: 260px; box-shadow: $shadow-1;
  &--trigger { border-color: $accent; } &--condition { border-color: $info; }
  &--change_state { border-color: $success; }
  &--send_notification, &--send_email, &--send_sms { border-color: #ff9800; }
  &--delay { border-color: $color-warning; } &--webhook { border-color: #9c27b0; }
  &--set_date, &--set_custom_field { border-color: #00bcd4; }
  &--add_label, &--remove_label { border-color: #8bc34a; }
  &--add_blocker { border-color: #f44336; } &--add_relation { border-color: #3f51b5; }
  &--create_task { border-color: #4caf50; } &--move_task { border-color: #795548; }
  &--assign_member { border-color: #607d8b; } &--add_comment { border-color: #ff5722; }

  &__header { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-bottom: 1px solid $divider; i { font-size: 1rem; color: $primary; } }
  &__label { flex: 1; font-size: 0.78rem; font-weight: 600; color: $text-primary; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &__remove { background: none; border: none; cursor: pointer; color: $text-disabled; padding: 2px; border-radius: 4px; font-size: 0.85rem; line-height: 1; &:hover { color: $warn; background: rgba($warn, 0.1); } }
  &__desc { padding: 4px 10px; font-size: 0.68rem; color: $text-secondary; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &__config {
    display: flex; align-items: center; gap: 4px; margin: 4px 10px 8px; background: none;
    border: 1px dashed $divider; border-radius: 4px; padding: 4px 8px; font-size: 0.68rem;
    color: $text-secondary; cursor: pointer; width: calc(100% - 20px);
    &:hover { border-color: $primary; color: $primary; }
    i { font-size: 0.8rem; }
  }
}

.wfp-modal-header-custom {
  display: flex;
  align-items: center;
}

.wfp-modal-header-title {
  display: flex;
  flex-direction: column;
  h3 { margin: 0; font-size: 1.1rem; font-weight: 700; line-height: 1.2; }
}

.wfp-modal__panels {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 500px;
}

.wfp-field-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.wfp-panel {
  display: flex; flex-direction: column; overflow: hidden;
  border-inline-end: 1px solid $divider;
  &:last-child { border-inline-end: none; }

  &--input { width: 320px; flex-shrink: 0; background: rgba(var(--v-theme-on-surface), 0.02); }
  &--config { flex: 1; min-width: 400px; }
  &--output { width: 340px; flex-shrink: 0; background: rgba(var(--v-theme-on-surface), 0.02); }

  &__title {
    display: flex; align-items: center; gap: 6px; padding: 10px $spacing-md;
    font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    color: rgba(var(--v-theme-on-surface), 0.4); border-bottom: 1px solid $divider;
    i { font-size: 0.9rem; }
  }

  &__body { padding: $spacing-md; overflow-y: auto; flex: 1; }
  &__empty-sm { padding: 12px; text-align: center; font-size: 0.72rem; color: $text-disabled; }
}

// I/O node display
.wfp-io-node {
  border: 1px solid $divider; border-radius: $border-radius-md; margin-bottom: 10px; overflow: hidden;

  &__header {
    display: flex; align-items: center; gap: 6px; padding: 8px 10px;
    background: rgba(0,0,0,0.02); border-bottom: 1px solid $divider;
    font-size: 0.78rem; font-weight: 600; color: $text-primary;
    i { font-size: 0.9rem; color: $primary; }
  }

  &__fields { padding: 8px 10px; }
  &__fields-title { font-size: 0.6rem; font-weight: 600; color: $text-disabled; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }

  &__data { padding: 8px 10px; border-top: 1px solid $divider; }
  &__data-title { font-size: 0.6rem; font-weight: 600; color: $text-disabled; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
}

.wfp-io-field {
  display: flex; align-items: center; gap: 6px; padding: 3px 0; font-size: 0.72rem;
  &--draggable {
    cursor: grab; border-radius: 3px; padding: 3px 4px; margin: 0 -4px;
    transition: background 0.15s;
    &:hover { background: rgba($primary, 0.06); }
    &:active { cursor: grabbing; }
  }
  &__drag { font-size: 0.8rem; color: $text-disabled; opacity: 0; margin-left: auto; transition: opacity 0.15s; }
  &--draggable:hover &__drag { opacity: 1; }
}
.wfp-io-field__expr {
  font-family: monospace; font-size: 0.62rem; color: #ff9800;
  background: rgba(#ff9800, 0.08); padding: 2px 5px; border-radius: 3px; white-space: nowrap;
}
.wfp-io-field__label { flex: 1; color: $text-primary; }
.wfp-io-field__type { font-size: 0.58rem; color: $text-disabled; font-family: monospace; background: rgba(0,0,0,0.04); padding: 1px 4px; border-radius: 2px; }

.wfp-io-json {
  font-family: monospace; font-size: 0.65rem; color: $text-secondary;
  background: rgba(0,0,0,0.03); border-radius: 4px; padding: 6px 8px;
  overflow-x: auto; max-height: 160px; margin: 0; white-space: pre-wrap; word-break: break-all;
}

.wfp-field {
  display: flex; flex-direction: column; gap: 6px; margin-bottom: $spacing-md;
  > span { font-size: 0.78rem; font-weight: 500; color: $text-primary; }
  input, textarea, select {
    border: 1px solid $divider; border-radius: $border-radius-md; padding: 9px 12px;
    font-size: 0.82rem; outline: none; background: transparent; color: $text-primary;
    transition: border-color 0.2s, box-shadow 0.2s;
    &:focus { border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.1); }
  }
}

.wfp-btn {
  border: none; border-radius: $border-radius-md; padding: 8px 20px; font-size: 0.82rem; font-weight: 500; cursor: pointer;
  &--primary { background: $primary; color: #fff; &:hover { opacity: 0.9; } }
  &--secondary { background: transparent; color: $text-secondary; &:hover { background: rgba(0,0,0,0.04); } }
}
</style>

<!-- Dark mode -->
<style lang="scss">
@use '@/styles/variables' as *;
body.dark-mode {
  .wfd { background: $dark-background; }
  .wfd-toolbar { background: $dark-card; border-color: $dark-border; &__title { color: $dark-text-bright; } &__trigger { border-color: $dark-border; color: $dark-text-bright; background: $dark-card-inner; } &__back { color: #aaa; &:hover { background: rgba(255,255,255,0.06); } } &__badge { background: rgba(255,255,255,0.06); color: #888; } }
  .wfd-palette { background: $dark-card; border-color: $dark-border; &__title { color: $dark-text-muted; } &__section { color: #555; border-color: $dark-border; } &__item { color: $dark-text-bright; &:hover { background: rgba($primary-light, 0.1); border-color: rgba($primary-light, 0.2); } i { color: $primary-light; } } }
  .wfd-handle { background: $dark-card !important; &:hover { background: $primary-light !important; } }
  .wfd-node { background: $dark-card; border-color: $dark-border; &__header { border-color: $dark-border; i { color: $primary-light; } } &__label { color: $dark-text-bright; } &__desc { color: $dark-text-muted; } &__config { border-color: $dark-border; color: $dark-text-muted; &:hover { border-color: $primary-light; color: $primary-light; } } }
  .vue-flow__background { background: $dark-background; }
  .vue-flow__edge { cursor: pointer; &:hover { .vue-flow__edge-path { stroke-width: 3; } } }
  .wfp-modal { background: $dark-card; &__header { border-color: $dark-border; color: $dark-text-bright; span i { color: $primary-light; } } &__footer { border-color: $dark-border; } }
  .wfp-panel { border-color: $dark-border; &--input, &--output { background: rgba(255,255,255,0.02); } &__title { color: #555; border-color: $dark-border; } &__empty { color: #555; } &__empty-sm { color: #555; } }
  .wfp-io-node { border-color: $dark-border; &__header { background: rgba(255,255,255,0.03); border-color: $dark-border; color: $dark-text-bright; i { color: $primary-light; } } &__data { border-color: $dark-border; } &__data-title { color: #555; } &__fields-title { color: #555; } }
  .wfp-io-field__label { color: $dark-text-bright; }
  .wfp-io-field__type { background: rgba(255,255,255,0.06); color: #666; }
  .wfp-io-field__expr { background: rgba(#ff9800, 0.12); }
  .wfp-io-json { background: rgba(255,255,255,0.03); color: $dark-text-muted; }
  .wfp-field { > span { color: $dark-text-bright; } input, textarea, select { border-color: $dark-border; color: $dark-text-bright; background: $dark-card-inner; &:focus { box-shadow: 0 0 0 3px rgba($primary-light, 0.15); } } }
}
</style>

<!-- Edge click cursor (global) -->
<style lang="scss">
.vue-flow__edge { cursor: pointer; &:hover { .vue-flow__edge-path { stroke-width: 3; } } }
</style>
