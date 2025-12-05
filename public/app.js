async function loadDoctors(){
  const res = await fetch('/api/doctors');
  const doctors = await res.json();
  const sel = document.getElementById('doctor-select');
  sel.innerHTML = doctors.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
}

async function loadPatients(){
  const res = await fetch('/api/patients');
  let patients = [];
  try{
    const r2 = await fetch('/api/patients');
    if (r2.ok) patients = await r2.json();
  }catch(e){ /* ignore */ }

  if (!patients.length){
    const ares = await fetch('/api/appointments');
    if (ares.ok){
      const appts = await ares.json();
      const map = {};
      appts.forEach(a => { if (a.patient) map[a.patient.id] = a.patient; });
      patients = Object.values(map);
    }
  }

  const sel = document.getElementById('patient-select');
  if (!sel) return;
  const html = ['<option value="">-- Seleccione paciente --</option>']
    .concat(patients.map(p => `<option value="${p.id}">${p.name} (ID ${p.id})</option>`)).join('');
  sel.innerHTML = html;
}
async function loadAppointments(){
  const res = await fetch('/api/appointments');
  const list = await res.json();
  const ul = document.getElementById('appointments-list');
  ul.innerHTML = list.map(a => {
    const dt = new Date(a.datetime).toLocaleString();
    return `<li data-id="${a.id}"><div><strong>${a.doctor.name}</strong> <span class="meta">${dt}</span><div class="meta">Paciente: ${a.patient.name} (ID ${a.patient.id})</div></div><div><button class="cancel secondary">Cancelar</button></div></li>`;
  }).join('');
  document.querySelectorAll('.cancel').forEach(btn => btn.addEventListener('click', async (e) => {
    const li = e.target.closest('li');
    const id = li.getAttribute('data-id');
    const resp = await fetch('/api/appointments/'+id, { method: 'DELETE' });
    if (resp.ok){ loadAppointments(); }
  }));
}

document.getElementById('form-register').addEventListener('submit', async (e) =>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  const msg = document.getElementById('register-msg');
  msg.textContent = '';
  try{
    const res = await fetch('/api/patients', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'Error');
    msg.classList.remove('error'); msg.classList.add('success');
    msg.textContent = `Registrado con ID ${body.id}`;
    const sel = document.getElementById('patient-select');
    if (sel){
      const opt = document.createElement('option'); opt.value = body.id; opt.textContent = `${body.name} (ID ${body.id})`;
      sel.appendChild(opt);
      sel.value = body.id;
    }
  }catch(err){ msg.style.color='crimson'; msg.textContent = err.message; }
});

document.getElementById('form-schedule').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  const msg = document.getElementById('schedule-msg');
  msg.textContent = '';
  try{
    const dtInput = document.getElementById('datetime-input');
    if (dtInput){
      const chosen = new Date(data.datetime);
      if (chosen < new Date()) throw new Error('No se puede agendar en el pasado');
    }
    if (!data.patientId) throw new Error('Seleccione un paciente');
    const res = await fetch('/api/appointments', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ patientId: Number(data.patientId), doctorId: Number(data.doctorId), datetime: data.datetime }) });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'Error');
    msg.classList.remove('error'); msg.classList.add('success');
    msg.textContent = `Cita creada ID ${body.id}`;
    loadAppointments();
  }catch(err){ msg.style.color='crimson'; msg.textContent = err.message; }
});

loadDoctors();
loadPatients();
loadAppointments();

setInterval(loadAppointments, 5000);

window.loadPatients = loadPatients;
