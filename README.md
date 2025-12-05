# Simple Medical Appointments

Proyecto demo: API Express + frontend estático + pruebas E2E con Cypress.

Endpoints:

Correr local:

```powershell
npm install
npm start
# abrir http://localhost:3000
```

Ejecutar E2E local (requiere instalar dependencias):

```powershell
npm install
npx cypress open # o npm run test:e2e
```

Casos de prueba documentados en `cypress/e2e/appointments.spec.js`.

Casos de prueba

- **Registro y agendamiento exitoso**: flujo completo donde un paciente válido se registra y agenda una cita en un horario libre. (Partición: datos válidos básicos).
- **Validaciones de entrada**: envío de campos vacíos y email inválido para comprobar respuestas de error del servidor y del frontend. (Partición de equivalencia: campos vacíos; caso límite: email sin `@`).
- **Cita en horario ocupado**: intentar agendar una cita para el mismo doctor y horario ya reservado, esperando un HTTP 409 y mensaje de conflicto. (Partición: horario ocupado vs libre).
- **Cancelación de cita**: cancelar una cita existente y verificar que desaparece de la lista.

Se usan valores límites y particiones de equivalencia: teléfono con prefijo `+` y mínimo de 7 dígitos (válido), email sin arroba (inválido), y reuso del mismo horario para comprobar solapamiento.

Los tests están implementados en `cypress/e2e/appointments.spec.js`.
