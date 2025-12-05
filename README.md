# Simple Medical Appointments

Proyecto demo: API Express + frontend estático + pruebas E2E con Cypress.

Endpoints:
- POST /api/patients {name,email,phone}
- GET /api/doctors
- POST /api/appointments {patientId, doctorId, datetime}
- GET /api/appointments
- DELETE /api/appointments/:id

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
