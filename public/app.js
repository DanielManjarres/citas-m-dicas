async function loadDoctors(){
  const res = await fetch('/api/doctors');
  const doctors = await res.json();
  const sel = document.getElementById('doctor-select');
  sel.innerHTML = doctors.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
}

async function loadAppointments(){
  const res = await fetch('/api/appointments');
  const list = await res.json();
  const ul = document.getElementById('appointments-list');
  ul.innerHTML = list.map(a => {
    const dt = new Date(a.datetime).toLocaleString();
    return `<li data-id="${a.id}">${dt} - ${a.doctor.name} - ${a.patient.name} <button class="cancel">Cancelar</button></li>`;
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
    msg.style.color = 'green';
    msg.textContent = `Registrado con ID ${body.id}`;
  }catch(err){ msg.style.color='crimson'; msg.textContent = err.message; }
});

document.getElementById('form-schedule').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  const msg = document.getElementById('schedule-msg');
  msg.textContent = '';
  try{
    const res = await fetch('/api/appointments', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ patientId: Number(data.patientId), doctorId: Number(data.doctorId), datetime: data.datetime }) });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'Error');
    msg.style.color = 'green';
    msg.textContent = `Cita creada ID ${body.id}`;
    loadAppointments();
  }catch(err){ msg.style.color='crimson'; msg.textContent = err.message; }
});

loadDoctors();
loadAppointments();

setInterval(loadAppointments, 5000);
