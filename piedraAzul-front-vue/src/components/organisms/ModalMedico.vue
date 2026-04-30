<template>
  <div :class="['modal-bg', { abierto: visible }]" @click.self="$emit('cerrar')">
    <div class="modal">
      <div class="modal-header">
        <h2>Nuevo profesional</h2>
        <p>Complete los datos del médico o terapista</p>
      </div>

      <div class="form-grid">
        <AppCampo v-model="form.username"   label="Username"    tipo="text"     :requerido="true" placeholder="usuario.sistema" />
        <AppCampo v-model="form.password"   label="Contraseña"  tipo="password" :requerido="true" placeholder="Contraseña inicial" />
        <AppCampo v-model="form.nombres"    label="Nombres"     tipo="text"     :requerido="true" placeholder="Nombres" />
        <AppCampo v-model="form.apellidos"  label="Apellidos"   tipo="text"     :requerido="true" placeholder="Apellidos" />

        <AppCampo v-model="form.especialidad" label="Especialidad" tipo="select" :requerido="true">
          <option value="FISIOTERAPIA">Fisioterapia</option>
          <option value="TERAPIA_NEURAL">Terapia Neural</option>
          <option value="QUIROPRAXIA">Quiropraxia</option>
        </AppCampo>

        <AppCampo v-model="form.intervaloCitas" label="Intervalo (min)" tipo="number" :requerido="true" />
        <AppCampo v-model="form.horaInicio"     label="Hora inicio"     tipo="time"   :requerido="true" />
        <AppCampo v-model="form.horaFin"        label="Hora fin"        tipo="time"   :requerido="true" />

        <div class="campo form-full">
          <label>Días de atención *</label>
          <DiasSelector v-model="form.diasAtencion" />
        </div>
      </div>

      <div class="modal-footer">
        <AppButton @click="guardar" :loading="guardando">Guardar profesional</AppButton>
        <AppButton variante="contorno" @click="$emit('cerrar')">Cancelar</AppButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import AppCampo     from '../atoms/AppCampo.vue'
import AppButton    from '../atoms/AppButton.vue'
import DiasSelector from '../molecules/DiasSelector.vue'
import { medicoService } from '../../services/api.js'
import { useToast } from '../../composables/useToast.js'

defineProps({ visible: { type: Boolean, default: false } })
const emit = defineEmits(['cerrar', 'guardado'])

const { toast } = useToast()
const guardando  = ref(false)

const form = reactive({
  username: '', password: '', nombres: '', apellidos: '',
  especialidad: '', intervaloCitas: 30,
  horaInicio: '08:00', horaFin: '17:00',
  diasAtencion: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'FRIDAY'],
})

async function guardar() {
  if (!form.username || !form.password || !form.nombres || !form.apellidos
      || !form.especialidad || !form.diasAtencion.length) {
    toast('Complete todos los campos obligatorios', 'err'); return
  }
  guardando.value = true
  try {
    await medicoService.create({ ...form, intervaloCitas: parseInt(form.intervaloCitas) || 30 })
    toast('Profesional registrado correctamente')
    emit('guardado')
    emit('cerrar')
  } catch (e) {
    toast('Error: ' + e.message, 'err')
  } finally {
    guardando.value = false
  }
}
</script>

<style scoped>
.modal-bg {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(20,30,25,.45);
  backdrop-filter: blur(2px);
  z-index: 300;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.modal-bg.abierto { display: flex; }
.modal {
  background: var(--blanco);
  border-radius: var(--radio-xl);
  padding: 32px;
  width: 100%;
  max-width: 540px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,.20);
  animation: modalIn .22s ease;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(.95) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header { margin-bottom: 20px; }
.modal-header h2 {
  font-family: 'DM Serif Display', serif;
  font-size: 22px;
  font-weight: 400;
  color: var(--verde-oscuro);
}
.modal-header p { font-size: 13px; color: var(--texto-tenue); margin-top: 4px; }

/* ── Footer: botones que se apilan en móvil ── */
.modal-footer {
  display: flex;
  flex-wrap: wrap;          /* ✦ permite que bajen a la siguiente línea */
  gap: 12px;
  margin-top: 24px;
}

@media (max-width: 480px) {
  .modal { padding: 24px 18px; }

  /* cada botón ocupa el ancho completo */
  .modal-footer { flex-direction: column; }
  .modal-footer > * { width: 100%; }

  /* padding del modal-bg más justo */
  .modal-bg { padding: 16px; }
}
</style>