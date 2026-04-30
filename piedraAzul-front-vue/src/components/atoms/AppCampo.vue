<template>
  <div :class="['campo', { error: !!errorMsg }]">
    <label v-if="label">
      {{ label }}
      <span v-if="requerido"> *</span>
      <span v-if="opcional" style="font-weight:400;color:var(--texto-tenue);"> (opcional)</span>
    </label>
    <span v-if="ayuda" class="ayuda">{{ ayuda }}</span>

    <textarea
      v-if="tipo === 'textarea'"
      v-model="modelo"
      :placeholder="placeholder"
    />
    <select v-else-if="tipo === 'select'" v-model="modelo">
      <option value="">— Seleccione —</option>
      <slot />
    </select>
    <input
      v-else
      v-model="modelo"
      :type="tipo"
      :placeholder="placeholder"
      @keydown.enter="$emit('enter')"
    />

    <span class="msg-error">{{ errorMsg }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue:  { default: '' },
  label:       { type: String, default: '' },
  ayuda:       { type: String, default: '' },
  placeholder: { type: String, default: '' },
  tipo:        { type: String, default: 'text' },
  errorMsg:    { type: String, default: '' },
  requerido:   { type: Boolean, default: false },
  opcional:    { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'enter'])

const modelo = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>

<style scoped>
.campo { display: flex; flex-direction: column; gap: 5px; }

.campo label {
  font-size: 13px;
  font-weight: 600;
  color: var(--texto);
  letter-spacing: .01em;
}
.ayuda {
  font-size: 12px;
  color: var(--texto-tenue);
  margin-top: -3px;
}
.campo input,
.campo select,
.campo textarea {
  padding: 11px 14px;
  font-size: 15px;
  border: 1.5px solid var(--borde);
  border-radius: var(--radio-md);
  background: var(--blanco);
  color: var(--texto);
  transition: border-color var(--trans), box-shadow var(--trans);
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  width: 100%;        /* ← esto es lo que falta */
  min-width: 0;       /* ← evita que el input ignore su contenedor en grid */
}
.campo select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%234A5550' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 36px;
}
.campo input:focus,
.campo select:focus,
.campo textarea:focus {
  border-color: var(--verde-medio);
  box-shadow: 0 0 0 3px rgba(26,155,111,.14);
}
.campo input::placeholder,
.campo textarea::placeholder { color: var(--texto-tenue); font-weight: 300; }
.campo textarea { resize: vertical; min-height: 80px; line-height: 1.6; }

.campo.error input,
.campo.error select,
.campo.error textarea {
  border-color: #D06060;
  box-shadow: 0 0 0 3px rgba(176,48,48,.10);
}
.msg-error {
  font-size: 12px;
  color: var(--rojo);
  font-weight: 500;
  display: none;
}
.campo.error .msg-error { display: block; }
</style>
