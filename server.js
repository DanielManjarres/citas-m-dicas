const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


const patients = [];
let patientIdSeq = 1;
const doctors = [
  { id: 1, name: 'Dr. Alice' },
  { id: 2, name: 'Dr. Bob' }
];
const appointments = [];
let appointmentIdSeq = 1;


function isValidEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}
function isValidPhone(phone) {
  return /^\+?[0-9]{7,15}$/.test(phone);
}


app.post('/api/patients', (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Campos requeridos faltantes' });
  }
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Email inválido' });
  if (!isValidPhone(phone)) return res.status(400).json({ error: 'Teléfono inválido' });

  const patient = { id: patientIdSeq++, name, email, phone };
  patients.push(patient);
  res.json(patient);
});


app.get('/api/doctors', (req, res) => {
  res.json(doctors);
});

app.post('/api/appointments', (req, res) => {
  const { patientId, doctorId, datetime } = req.body;
  if (!patientId || !doctorId || !datetime) return res.status(400).json({ error: 'Campos requeridos faltantes' });

  const patient = patients.find(p => p.id === Number(patientId));
  if (!patient) return res.status(400).json({ error: 'Paciente no existe' });
  const doctor = doctors.find(d => d.id === Number(doctorId));
  if (!doctor) return res.status(400).json({ error: 'Doctor no existe' });

  const start = new Date(datetime);
  if (isNaN(start)) return res.status(400).json({ error: 'Datetime inválido' });


  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const overlap = appointments.find(a => a.doctorId === doctor.id && !(end <= new Date(a.datetime) || start >= new Date(new Date(a.datetime).getTime() + 60*60*1000)));
  if (overlap) return res.status(409).json({ error: 'Horario ya ocupado para ese doctor' });

  const appt = { id: appointmentIdSeq++, patientId: patient.id, doctorId: doctor.id, datetime: start.toISOString() };
  appointments.push(appt);
  res.json(appt);
});

app.get('/api/appointments', (req, res) => {
  const detailed = appointments.map(a => ({
    ...a,
    patient: patients.find(p => p.id === a.patientId),
    doctor: doctors.find(d => d.id === a.doctorId)
  }));
  res.json(detailed);
});

app.delete('/api/appointments/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = appointments.findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Cita no encontrada' });
  appointments.splice(idx, 1);
  res.json({ ok: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
