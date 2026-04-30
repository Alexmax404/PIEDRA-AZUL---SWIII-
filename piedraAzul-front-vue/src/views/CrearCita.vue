<template>
  <div>
    <div class="sec-header">
      <div class="sec-header-texto">
        <h2>Registrar nueva cita</h2>
        <p>Complete los datos del paciente y elija la franja horaria disponible</p>
      </div>
    </div>


    <!-- Buscar paciente -->
    <AppCard titulo="Buscar paciente existente" subtitulo="Si ya está registrado, sus datos se cargarán automáticamente">
      <template #icono>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M20 20l-3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </template>
      <div class="form-grid">
        <AppCampo label="Número de documento" v-model="busqueda.doc"
                  placeholder="Ej: 1061234567" @enter="buscarPaciente" />
        <div class="campo campo-botones">
          <AppButton variante="contorno" @click="buscarPaciente" :loading="busqueda.cargando" style="flex:1">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            Buscar
          </AppButton>
          <AppButton variante="peligro" :small="true" @click="limpiarPaciente">Limpiar</AppButton>
        </div>
      </div>
      <AppAlerta v-if="busqueda.alerta" :tipo="busqueda.alertaTipo" :titulo="busqueda.alertaTitulo" style="margin-top:14px;margin-bottom:0">
        {{ busqueda.alertaMsg }}
      </AppAlerta>
    </AppCard>

    <!-- Datos paciente -->
    <AppCard titulo="Datos del paciente" subtitulo="Los campos marcados con * son obligatorios">
      <template #icono>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </template>
      <div class="form-grid">
        <AppCampo label="Número de documento" v-model="pac.doc"       :requerido="true" placeholder="Número de identidad"  :errorMsg="errores.doc"       />
        <AppCampo label="Nombres"             v-model="pac.nombres"   :requerido="true" placeholder="Nombres completos"    :errorMsg="errores.nombres"   />
        <AppCampo label="Apellidos"           v-model="pac.apellidos" :requerido="true" placeholder="Apellidos completos"  :errorMsg="errores.apellidos" />
        <AppCampo label="Celular"             v-model="pac.celular"   :requerido="true" tipo="tel" placeholder="Ej: 3001234567" :errorMsg="errores.celular" />
        <AppCampo label="Género"              v-model="pac.genero"    :requerido="true" tipo="select" :errorMsg="errores.genero">
          <option value="MASCULINO">Hombre</option>
          <option value="FEMENINO">Mujer</option>
          <option value="OTRO">Otro</option>
        </AppCampo>
        <AppCampo label="Fecha de nacimiento" v-model="pac.nacimiento" tipo="date" :opcional="true" />
        <AppCampo label="Correo electrónico"  v-model="pac.correo"    tipo="email" :opcional="true" placeholder="correo@ejemplo.com" class="form-full" />
      </div>
    </AppCard>

    <!-- Datos cita -->
    <AppCard titulo="Datos de la cita" subtitulo="Seleccione el profesional, la fecha y haga clic en la franja disponible">
      <template #icono>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </template>
      <div class="form-grid">
        <AppCampo label="Médico / Terapista" tipo="select" v-model="cita.medicoId" :requerido="true" :errorMsg="errores.medico">
          <option v-for="m in medicos" :key="m.id" :value="m.id">
            {{ m.nombres }} {{ m.apellidos }} — {{ formatEsp(m.especialidad) }}
          </option>
        </AppCampo>
        <AppCampo label="Fecha de la cita" tipo="date" v-model="cita.fecha" :requerido="true" :errorMsg="errores.fecha" />

        <div class="campo form-full" :class="{ error: errores.hora }">
          <label>Hora disponible *</label>
          <FranjasHorarias
            :medicoId="cita.medicoId"
            :fecha="cita.fecha"
            :seleccionada="cita.hora"
            @seleccionar="h => cita.hora = h"
          />
          <span class="msg-error">{{ errores.hora }}</span>
        </div>

        <AppCampo label="Observaciones" v-model="cita.obs" tipo="textarea" :opcional="true"
                  placeholder="Motivo de consulta u otras observaciones..." class="form-full" />
      </div>

      <ResumenCita :nombreMedico="nombreMedicoSeleccionado" :fecha="cita.fecha" :hora="cita.hora" />

      <div class="btn-fila">
        <AppButton @click="guardar" :loading="guardando">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Guardar cita
        </AppButton>
        <AppButton variante="contorno" @click="limpiarTodo">Limpiar todo</AppButton>
      </div>
    </AppCard>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import AppCard        from '../components/molecules/AppCard.vue'
import AppCampo       from '../components/atoms/AppCampo.vue'
import AppButton      from '../components/atoms/AppButton.vue'
import AppAlerta      from '../components/atoms/AppAlerta.vue'
import FranjasHorarias from '../components/molecules/FranjasHorarias.vue'
import ResumenCita    from '../components/molecules/ResumenCita.vue'
import { useMedicos } from '../composables/useMedicos.js'
import { useToast }   from '../composables/useToast.js'
import { pacienteService, citaService } from '../services/api.js'

const emit = defineEmits(['cita-creada'])

const { medicos, formatEsp } = useMedicos()
const { toast }              = useToast()

const hoy = () => new Date().toISOString().split('T')[0]

// Estado
const pacienteId = ref(null)
const guardando  = ref(false)
const errores    = ref({})

const busqueda = reactive({
  doc: '', cargando: false, alerta: false,
  alertaTipo: 'info', alertaTitulo: '', alertaMsg: '',
})

const pac = reactive({
  doc: '', nombres: '', apellidos: '', celular: '',
  genero: '', nacimiento: '', correo: '',
})

const cita = reactive({ medicoId: '', fecha: hoy(), hora: null, obs: '' })

const nombreMedicoSeleccionado = computed(() => {
  const m = medicos.value.find(m => String(m.id) === String(cita.medicoId))
  return m ? `${m.nombres} ${m.apellidos}` : ''
})

// Buscar paciente
async function buscarPaciente() {
  if (!busqueda.doc) { toast('Ingrese el número de documento', 'err'); return }
  busqueda.cargando = true
  busqueda.alerta   = false
  try {
    const p = await pacienteService.getByDocumento(busqueda.doc)
    cargarDatosPaciente(p)
  } catch (e) {
    busqueda.alerta      = true
    busqueda.alertaTipo  = 'aviso'
    busqueda.alertaTitulo = 'Paciente no encontrado'
    busqueda.alertaMsg   = 'Complete los datos manualmente para registrarlo como nuevo paciente'
  } finally {
    busqueda.cargando = false
  }
}

function cargarDatosPaciente(p) {
  pacienteId.value = p.id
  pac.doc = p.numeroDocumento; pac.nombres = p.nombres; pac.apellidos = p.apellidos
  pac.celular = p.celular; pac.genero = p.genero
  pac.nacimiento = p.fechaNacimiento || ''; pac.correo = p.correoElectronico || ''
  busqueda.alerta      = true
  busqueda.alertaTipo  = 'info'
  busqueda.alertaTitulo = 'Paciente encontrado y cargado'
  busqueda.alertaMsg   = `${p.nombres} ${p.apellidos} — Doc: ${p.numeroDocumento}`
  toast('Datos del paciente cargados')
}

function limpiarPaciente() {
  pacienteId.value = null
  Object.assign(pac, { doc:'', nombres:'', apellidos:'', celular:'', genero:'', nacimiento:'', correo:'' })
  busqueda.doc = ''; busqueda.alerta = false
  errores.value = {}
}

// Guardar cita
async function guardar() {
  errores.value = {}
  let ok = true
  if (!cita.medicoId) { errores.value.medico    = 'Seleccione un profesional'; ok = false }
  if (!cita.fecha)    { errores.value.fecha      = 'Seleccione la fecha';       ok = false }
  if (!cita.hora)     { errores.value.hora       = 'Seleccione una franja';     ok = false }
  if (!pac.doc)       { errores.value.doc        = 'Campo obligatorio';         ok = false }
  if (!pac.nombres)   { errores.value.nombres    = 'Campo obligatorio';         ok = false }
  if (!pac.apellidos) { errores.value.apellidos  = 'Campo obligatorio';         ok = false }
  if (!pac.celular)   { errores.value.celular    = 'Campo obligatorio';         ok = false }
  if (!pac.genero)    { errores.value.genero     = 'Seleccione el género';      ok = false }
  if (!ok) return

  guardando.value = true
  try {
    let pId = pacienteId.value
    if (!pId) {
      try {
        const p = await pacienteService.create({
          numeroDocumento: pac.doc, nombres: pac.nombres, apellidos: pac.apellidos,
          celular: pac.celular, genero: pac.genero,
          fechaNacimiento: pac.nacimiento || null, correoElectronico: pac.correo || null,
        })
        pId = p.id
      } catch {
        const existente = await pacienteService.getByDocumento(pac.doc)
        pId = existente.id
      }
    }

    await citaService.create({
      medicoId:   parseInt(cita.medicoId),
      pacienteId: pId,
      fecha:      cita.fecha,
      hora:       cita.hora,
      observacion: cita.obs || null,
    })

    toast('¡Cita registrada exitosamente!')
    emit('cita-creada', { medicoId: parseInt(cita.medicoId), fecha: cita.fecha })
    limpiarTodo()

  } catch (e) {
    toast('Error al guardar: ' + e.message, 'err')
  } finally {
    guardando.value = false
  }
}

function limpiarTodo() {
  limpiarPaciente()
  cita.medicoId = ''; cita.fecha = hoy(); cita.hora = null; cita.obs = ''
  errores.value = {}
}
</script>

<style scoped>
.sec-header { margin-bottom: 28px; display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.sec-header-texto h2 { font-family: 'DM Serif Display', serif; font-size: 28px; font-weight: 400; color: var(--texto); line-height: 1.2; }
.sec-header-texto p  { font-size: 14px; color: var(--texto-tenue); margin-top: 4px; }
.btn-fila { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 22px; }
.campo { display: flex; flex-direction: column; gap: 5px; }
.campo-botones { flex-direction: row; align-items: flex-end; gap: 10px; }
.campo.error .msg-error { display: block; }
.msg-error { font-size: 12px; color: var(--rojo); font-weight: 500; display: none; }
/* ── Responsive ── */
@media (max-width: 480px) {
  .sec-header-texto h2 { font-size: 22px; }
  .btn-fila { flex-direction: column; }
  .btn-fila > * { width: 100%; }
  .campo-botones { flex-direction: column; align-items: stretch; }
  .campo-botones > * { width: 100%; }
}
</style>
