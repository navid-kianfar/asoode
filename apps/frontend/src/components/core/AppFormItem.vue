<template>
  <div :class="field.cssClass || 'mb-3'">
    <!-- Input -->
    <AppInput
      v-if="field.type === FormElementType.Input"
      v-model="field.value"
      :label="field.label ? $t(field.label) : undefined"
      :disabled="field.disabled || waiting"
      :errors="field.errors"
      :max-length="field.maxLength"
      :placeholder="field.placeholder ? $t(field.placeholder) : undefined"
      :dense="field.dense"
      :text-area="field.params?.textArea"
    />

    <!-- Dropdown -->
    <AppDropdown
      v-else-if="field.type === FormElementType.DropDown"
      v-model="field.value"
      :label="field.label ? $t(field.label) : undefined"
      :items="field.items"
      :multiple="field.multiSelect"
      :disabled="field.disabled || waiting"
      :errors="field.errors"
      :dense="field.dense"
    />

    <!-- Switch -->
    <AppSwitch
      v-else-if="field.type === FormElementType.Switch"
      v-model="field.value"
      :label="field.label ? $t(field.label) : undefined"
      :disabled="field.disabled || waiting"
    />

    <!-- Checkbox -->
    <AppCheckbox
      v-else-if="field.type === FormElementType.Checkbox"
      v-model="field.value"
      :label="field.label ? $t(field.label) : undefined"
      :disabled="field.disabled || waiting"
    />

    <!-- Radio -->
    <AppRadio
      v-else-if="field.type === FormElementType.Radio"
      v-model="field.value"
      :label="field.label ? $t(field.label) : undefined"
      :items="field.items"
      :disabled="field.disabled || waiting"
    />

    <!-- DatePicker -->
    <AppDatePicker
      v-else-if="field.type === FormElementType.DatePicker"
      v-model="field.value"
      :label="field.label ? $t(field.label) : undefined"
      :disabled="field.disabled || waiting"
      :errors="field.errors"
    />

    <!-- TimePicker -->
    <AppTimePicker
      v-else-if="field.type === FormElementType.TimePicker"
      v-model="field.value"
      :label="field.label ? $t(field.label) : undefined"
      :disabled="field.disabled || waiting"
    />

    <!-- Number -->
    <AppNumber
      v-else-if="field.type === FormElementType.Number"
      v-model="field.value"
      :label="field.label ? $t(field.label) : undefined"
      :min="field.min"
      :max="field.max"
      :disabled="field.disabled || waiting"
    />

    <!-- ColorPicker -->
    <AppColorPicker
      v-else-if="field.type === FormElementType.ColorPicker"
      v-model="field.value"
      :label="field.label ? $t(field.label) : undefined"
    />

    <!-- Editor -->
    <AppEditor
      v-else-if="field.type === FormElementType.Editor"
      v-model="field.value"
      :label="field.label ? $t(field.label) : undefined"
      :placeholder="field.placeholder ? $t(field.placeholder) : undefined"
    />

    <!-- File -->
    <AppFile
      v-else-if="field.type === FormElementType.File"
      v-model="field.value"
      :label="field.label ? $t(field.label) : undefined"
      :file-type="field.fileType"
      :multiple="field.multiSelect"
      :disabled="field.disabled || waiting"
      :errors="field.errors"
    />

    <!-- AutoComplete -->
    <AppAutoComplete
      v-else-if="field.type === FormElementType.AutoComplete"
      v-model="field.value"
      :label="field.label ? $t(field.label) : undefined"
      :items="field.items"
      :multiple="field.multiSelect"
      :disabled="field.disabled || waiting"
      :errors="field.errors"
    />

    <!-- Captcha -->
    <AppCaptcha
      v-else-if="field.type === FormElementType.Captcha"
      :code="field.value"
      @update:code="field.value = $event"
      @update:token="field.params = { ...field.params, token: $event }"
    />

    <!-- CountryPicker -->
    <AppCountryPicker
      v-else-if="field.type === FormElementType.CountryPicker"
      v-model="field.value"
      :label="field.label ? $t(field.label) : undefined"
      :disabled="field.disabled || waiting"
    />

    <!-- ZonePicker -->
    <AppZonePicker
      v-else-if="field.type === FormElementType.ZonePicker"
      v-model="field.value"
      :label="field.label ? $t(field.label) : undefined"
      :disabled="field.disabled || waiting"
    />

    <!-- EmojiPicker -->
    <AppEmojiPicker
      v-else-if="field.type === FormElementType.EmojiPicker"
      :on-select="(e: string) => (field.value = (field.value || '') + e)"
    />

    <!-- LocationPicker -->
    <AppLocationPicker
      v-else-if="field.type === FormElementType.LocationPicker"
      v-model="field.value"
      :label="field.label ? $t(field.label) : undefined"
    />

    <!-- Tag -->
    <AppTag
      v-else-if="field.type === FormElementType.Tag"
      v-model="field.value"
      :label="field.label ? $t(field.label) : undefined"
      :items="field.items"
      :disabled="field.disabled || waiting"
    />

    <!-- Label (display only) -->
    <div v-else-if="field.type === FormElementType.Label" class="text-body-2">
      {{ field.label ? $t(field.label) : '' }}
    </div>

    <!-- Recursive Elements (Nested Groups/Rows) -->
    <div v-else-if="field.elements" class="row">
      <div v-for="(subField, idx) in field.elements" :key="idx" :class="subField.cssClass || 'col'">
        <AppFormItem :field="subField" :waiting="waiting" />
      </div>
    </div>

    <!-- Button -->
    <AppButton
      v-else-if="field.type === FormElementType.Button"
      :label="field.label ? $t(field.label) : undefined"
      :icon="field.icon"
      :waiting="field.waiting || waiting"
      :disabled="field.disabled || waiting"
      @click="field.buttonAction?.()"
    />
  </div>
</template>

<script setup lang="ts">
import { FormElementType, type FormViewModel } from '@asoode/shared';
import AppInput from './AppInput.vue';
import AppDropdown from './AppDropdown.vue';
import AppSwitch from './AppSwitch.vue';
import AppCheckbox from './AppCheckbox.vue';
import AppRadio from './AppRadio.vue';
import AppDatePicker from './AppDatePicker.vue';
import AppTimePicker from './AppTimePicker.vue';
import AppNumber from './AppNumber.vue';
import AppColorPicker from './AppColorPicker.vue';
import AppEditor from './AppEditor.vue';
import AppFile from './AppFile.vue';
import AppAutoComplete from './AppAutoComplete.vue';
import AppCaptcha from './AppCaptcha.vue';
import AppCountryPicker from './AppCountryPicker.vue';
import AppZonePicker from './AppZonePicker.vue';
import AppEmojiPicker from './AppEmojiPicker.vue';
import AppLocationPicker from './AppLocationPicker.vue';
import AppTag from './AppTag.vue';
import AppButton from './AppButton.vue';

defineProps<{
  field: FormViewModel;
  waiting?: boolean;
}>();
</script>
