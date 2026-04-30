<template>
  <div>
    <div class="sec-header">
      <div class="sec-header-texto">
        <h2>Consultar citas del día</h2>
        <p>Busque las citas de un profesional en una fecha específica</p>
      </div>
    </div>

    <!-- Filtros -->
    <AppCard titulo="Parámetros de búsqueda" subtitulo="Seleccione el profesional y la fecha para ver las citas agendadas">
      <template #icono>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M20 20l-3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </template>

      <div class="form-grid-3">
        <AppCampo label="Médico / Terapista" tipo="select" v-model="medicoId"
                  ayuda="Seleccione el profesional a consultar"
                  :errorMsg="errores.medico">
          <option v-for="m in medicos" :key="m.id" :value="m.id">
            {{ m.nombres }} {{ m.apellidos }} — {{ formatEsp(m.especialidad) }}
          </option>
        </AppCampo>

        <AppCampo label="Fecha" tipo="date" v-model="fecha" ayuda="Día que desea consultar" />

        <!-- ✦ clase campo-boton agregada -->
        <div class="campo campo-boton">
          <label>&nbsp;</label>
          <AppButton @click="buscar" :loading="cargando">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="white" stroke-width="2"/><path d="M20 20l-3-3" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
            Buscar citas
          </AppButton>
        </div>
      </div>
    </AppCard>

    <!-- Resultados -->
    <div v-if="estado === 'cargando'" class="estado-centro">
      <AppSpinner :verde="true" :size="32" :border-w="3" />
      <p>Consultando citas...</p>
    </div>

    <AppAlerta v-else-if="estado === 'error'" tipo="error" titulo="Error al consultar">
      {{ mensajeError }}
    </AppAlerta>

    <template v-else-if="estado === 'ok'">
      <!-- Sin resultados -->
      <AppCard v-if="!citas.length">
        <div class="empty-state">
          <div class="e-icon">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="3" stroke="#0D6B4E" stroke-width="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="#0D6B4E" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <h3>Sin citas para este día</h3>
          <p>No hay citas activas para el profesional y fecha seleccionados</p>
        </div>
      </AppCard>

      <!-- Tabla de citas -->
      <template v-else>
        <div class="acciones">
          <div class="contador">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="white" stroke-width="2"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="white" stroke-width="2"/></svg>
            {{ citas.length }} cita{{ citas.length !== 1 ? 's' : '' }} encontrada{{ citas.length !== 1 ? 's' : '' }}
          </div>
          <AppButton variante="contorno" :small="true" :loading="exportando" @click="exportarCSV">
            Exportar CSV
          </AppButton>
        </div>
        <div class="tabla-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Hora</th><th>Paciente</th><th>Documento</th>
                <th>Celular</th><th>Estado</th><th>Registrado por</th><th>Observación</th><th>Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(c, i) in citas" :key="c.id">
                <td class="num">{{ i + 1 }}</td>
                <td><strong class="hora">{{ c.hora }}</strong></td>
                <td>{{ c.nombrePaciente }}</td>
                <td class="mono">{{ c.numeroDocumentoPaciente }}</td>
                <td class="sm">{{ c.celularPaciente }}</td>
                <td><AppBadge :estado="c.estado" :texto="c.estado" /></td>
                <td class="tenue">{{ c.registradoPor || '—' }}</td>
                <td class="obs">{{ c.observacion || '—' }}</td>
                <td>
                  <AppButton v-if="c.estado !== 'CANCELADA'" variante="peligro" :small="true"
                    @click="cancelar(c.id)">Cancelar</AppButton>
                  <span v-else class="cancelada">Cancelada</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppCard    from '../components/molecules/AppCard.vue'
import AppCampo   from '../components/atoms/AppCampo.vue'
import AppButton  from '../components/atoms/AppButton.vue'
import AppBadge   from '../components/atoms/AppBadge.vue'
import AppAlerta  from '../components/atoms/AppAlerta.vue'
import AppSpinner from '../components/atoms/AppSpinner.vue'
import { useMedicos }  from '../composables/useMedicos.js'
import { useToast }    from '../composables/useToast.js'
import { citaService } from '../services/api.js'

const { medicos, formatEsp } = useMedicos()
const { toast }              = useToast()

const medicoId     = ref('')
const fecha        = ref(new Date().toISOString().split('T')[0])
const citas        = ref([])
const estado       = ref('')        // '' | 'cargando' | 'ok' | 'error'
const mensajeError = ref('')
const cargando     = ref(false)
const exportando   = ref(false)
const errores      = ref({})

async function buscar() {
  errores.value = {}
  if (!medicoId.value) { errores.value.medico = 'Seleccione un profesional'; return }
  if (!fecha.value)    { toast('Seleccione una fecha', 'err'); return }

  estado.value   = 'cargando'
  cargando.value = true
  try {
    citas.value  = await citaService.getByMedicoFecha(medicoId.value, fecha.value)
    estado.value = 'ok'
  } catch (e) {
    estado.value       = 'error'
    mensajeError.value = e.message
  } finally {
    cargando.value = false
  }
}

async function cancelar(id) {
  if (!confirm('¿Está seguro de cancelar esta cita?')) return
  try {
    await citaService.cancel(id)
    toast('Cita cancelada correctamente')
    buscar()
  } catch (e) {
    toast('Error al cancelar: ' + e.message, 'err')
  }
}

async function exportarCSV() {
  if (!medicoId.value || !fecha.value) {
    toast('Seleccione medico y fecha', 'err')
    return
  }

  exportando.value = true
  try {
    const { blob, filename } = await citaService.exportCsvByMedicoFecha(medicoId.value, fecha.value)
    const finalName = filename || `citas_medico${medicoId.value}_${fecha.value}.csv`
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = finalName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast('CSV descargado')
  } catch (e) {
    toast('Error al exportar CSV: ' + e.message, 'err')
  } finally {
    exportando.value = false
  }
}

// Permite que App.vue dispare una búsqueda con parámetros predefinidos
defineExpose({ medicoId, fecha, buscar })
</script>

<style scoped>
.sec-header { margin-bottom: 28px; display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.sec-header-texto h2 { font-family: 'DM Serif Display', serif; font-size: 28px; font-weight: 400; color: var(--texto); line-height: 1.2; }
.sec-header-texto p  { font-size: 14px; color: var(--texto-tenue); margin-top: 4px; }

.estado-centro { text-align: center; padding: 48px; }
.estado-centro p { margin-top: 12px; color: var(--texto-tenue); font-size: 14px; }

.acciones { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
.contador {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--verde-oscuro); color: var(--blanco);
  padding: 7px 16px; border-radius: 20px;
  font-size: 13px; font-weight: 600; letter-spacing: .02em;
}

/* ── Tabla ── */
.tabla-wrap { overflow-x: auto; border-radius: var(--radio-md); border: 1px solid var(--borde); }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
thead tr { background: var(--verde-claro); }
thead th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 700; color: var(--verde-oscuro); white-space: nowrap; letter-spacing: .04em; text-transform: uppercase; }
tbody tr { border-top: 1px solid var(--borde); transition: background var(--trans); }
tbody tr:hover { background: #F5FBF8; }
tbody td { padding: 13px 16px; vertical-align: middle; }
.num   { color: var(--texto-tenue); font-size: 13px; }
.hora  { font-size: 15px; font-family: 'DM Sans', monospace; }
.mono  { font-family: monospace; font-size: 13px; }
.sm    { font-size: 13px; }
.tenue { font-size: 13px; color: var(--texto-suave); }
.obs   { font-size: 13px; color: var(--texto-suave); max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cancelada { font-size: 12px; color: var(--texto-tenue); }

/* ── Empty state ── */
.empty-state { text-align: center; padding: 56px 24px; }
.e-icon { width: 56px; height: 56px; margin: 0 auto 16px; background: var(--verde-claro); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.empty-state h3 { font-family: 'DM Serif Display', serif; font-size: 20px; font-weight: 400; margin-bottom: 6px; }
.empty-state p  { font-size: 14px; color: var(--texto-tenue); max-width: 300px; margin: 0 auto; }

/* ── Botón de búsqueda alineado al fondo de la celda del grid ── */
.campo-boton {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

/* ── Responsive ── */
@media (max-width: 680px) {
  .sec-header-texto h2 { font-size: 22px; }

  /* En móvil el botón ocupa todo el ancho sin label vacío */
  .campo-boton label { display: none; }
  .campo-boton { justify-content: stretch; }
}
</style>