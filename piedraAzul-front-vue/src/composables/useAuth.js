/* ═══════════════════════════════════════════
   PIEDRAZUL — composables/useAuth.js
   Autenticación delegada a Keycloak
═══════════════════════════════════════════ */

import { ref, computed } from 'vue'

const usuario = ref(null)
// usuario tiene forma: { token, username, rol, nombres, apellidos }

const sesionActiva = computed(() => !!usuario.value)
const esPaciente = computed(() => usuario.value?.rol === 'PACIENTE')

// ── Configuración de Keycloak ─────────────────────────────────────────────
const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8180'
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM ?? 'piedrazul'
const KEYCLOAK_CLIENT = import.meta.env.VITE_KEYCLOAK_CLIENT ?? 'piedrazul-api'
const KEYCLOAK_SECRET = import.meta.env.VITE_KEYCLOAK_SECRET ?? 'lU5PljMWMfq0sM9rTIJeNFgjvYVHGQDa'  // ← el secret del client en Keycloak
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'
// ─────────────────────────────────────────────────────────────────────────

export function useAuth() {

  async function login(username, password) {
    // 1. Pedir token directamente a Keycloak
    const params = new URLSearchParams()
    params.append('grant_type', 'password')
    params.append('client_id', KEYCLOAK_CLIENT)
    params.append('client_secret', KEYCLOAK_SECRET)
    params.append('username', username)
    params.append('password', password)

    const res = await fetch(
      `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
      { method: 'POST', body: params }
    )

    if (!res.ok) {
      throw new Error('Usuario o contraseña incorrectos')
    }

    const data = await res.json()
    const accessToken = data.access_token

    // 2. Decodificar el JWT para sacar username, rol, nombres
    const payload = JSON.parse(atob(accessToken.split('.')[1]))

    usuario.value = {
      token: accessToken,
      username: payload.preferred_username,
      rol: payload.roles?.find(r =>
        ['ADMINISTRADOR', 'AGENDADOR', 'MEDICO_TERAPISTA', 'PACIENTE'].includes(r)
      ) || null,   // primer rol asignado
      nombres: payload.given_name || payload.preferred_username,
      apellidos: payload.family_name || '',
    }
  }

  async function registro(form) {
    // El registro va al backend de Spring Boot (que a su vez crea en Keycloak)
    const res = await fetch(`${API}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      if (res.status === 409) throw new Error('El usuario o documento ya existe')
      throw new Error('Error al registrar usuario')
    }

    // Login automático tras registro exitoso
    await login(form.username, form.password)
  }

  function cerrarSesion() {
    usuario.value = null
  }

  const avatarLetra = computed(() => {
    if (!usuario.value) return 'U'
    return (usuario.value.nombres?.[0] || usuario.value.username?.[0] || 'U').toUpperCase()
  })

  const nombreCompleto = computed(() => {
    if (!usuario.value) return ''
    return usuario.value.nombres
      ? `${usuario.value.nombres} ${usuario.value.apellidos || ''}`.trim()
      : usuario.value.username
  })

  const rolLabel = computed(() => {
    const ROLES = {
      ADMINISTRADOR: 'Administrador',
      MEDICO_TERAPISTA: 'Médico',
      AGENDADOR: 'Agendador',
      PACIENTE: 'Paciente',
    }
    return ROLES[usuario.value?.rol] || usuario.value?.rol || ''
  })

  return {
    usuario,
    sesionActiva,
    esPaciente,
    avatarLetra,
    nombreCompleto,
    rolLabel,
    login,
    registro,
    cerrarSesion,
  }
}