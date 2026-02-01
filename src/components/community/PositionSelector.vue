<template>
  <div class="position-selector">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="position-btn"
      :class="{ active: modelValue === option.value }"
      :disabled="disabled"
      @click="$emit('update:modelValue', option.value)"
    >
      <span class="pos-icon">{{ option.icon }}</span>
      <span class="pos-label">{{ option.label }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue'])

const options = [
  { label: '개미(개인)', value: 'ANT', icon: '🐜' },
  { label: '전문가', value: 'EXPERT', icon: '👤' },
]
</script>

<style scoped>
.position-selector { display: flex; gap: 12px; }
.position-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.position-btn:hover { border-color: rgba(0,0,0,0.06); background: var(--bg); }
.position-btn.active {
  border-color: var(--brand-deep-blue);
  background: #eff6ff;
  color: var(--brand-deep-blue);
  box-shadow: 0 4px 6px -1px rgba(45, 114, 237, 0.1);
}
.position-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.pos-icon { font-size: 18px; }
</style>
