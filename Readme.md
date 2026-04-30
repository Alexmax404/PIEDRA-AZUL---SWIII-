# Piedrazul — Ejecucion Backend con Docker

De esta forma se levanta Keycloak y el backend con un solo comando. No necesitas tener Java ni Maven instalados, asegurarse de estar en la carpeta raiz del proyecto (justo donde esta el archivo docker-compose.yml).

**1. Levanta los servicios:**

```bash
docker-compose up --build -d
```

Esto levanta automáticamente:
- **Keycloak** en `http://localhost:8180` — con el realm `piedrazul` ya configurado
- **Backend** en `http://localhost:8080` — con la BD H2 poblada con datos de prueba
  Espera unos 30 segundos mientras los servicios arrancan completamente.
  **Frontend** en `http://localhost:5173` — con la configuración para conectar al backend y Keycloak ya lista
**2. Verifica que todo esté corriendo:**

```bash
docker-compose ps
```

Debes ver los dos contenedores con estado `Up`.

**3. Para detener los servicios:**

```bash
docker-compose down
```
**4. Ya podras hacer uso de las funcionalidades del frontend y el backend**
---

## Opción B — Correr el frontend y el backend sin Docker

Usa esta opción si prefieres correr el backend directamente en tu máquina para desarrollo.

**1. Levanta solo Keycloak con Docker:**

```bash
docker-compose up -d keycloak
```

Espera un minuto.

**2. Ejecuta el backend desde el editor de codigo (Visual Studio Code o IntelliJ)**


El backend queda disponible en `http://localhost:8080`.

**3. Ejecuta el frontend desde el editor de código (Visual Studio Code o IntelliJ)**
Entra al modulo de frontend y ejecuta el comando `npm run dev` para levantar el frontend
En la terminal aparecerá la URL donde se está ejecutando el frontend, usualmente `http://localhost:5173`.

**3. Ya podras hacer uso de las funcionalidades del frontend y el backend**


