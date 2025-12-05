function formatLocal(dt){
  const pad = n => n.toString().padStart(2,'0');
  const yyyy = dt.getFullYear();
  const mm = pad(dt.getMonth()+1);
  const dd = pad(dt.getDate());
  const hh = pad(dt.getHours());
  const min = pad(dt.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

describe('Flujo completo de reserva de citas', () => {
  const patient = { name: 'Juan Perez', email: 'juan.perez@example.com', phone: '+34123456789' };
  let slot;

  it('Registro de paciente válido y agendamiento exitoso', () => {
    cy.visit('/');
    cy.get('#form-register input[name="name"]').type(patient.name);
    cy.get('#form-register input[name="email"]').type(patient.email);
    cy.get('#form-register input[name="phone"]').type(patient.phone);
    cy.get('#form-register').submit();
    cy.get('#register-msg').should('contain.text', 'Registrado con ID').then(($msg) =>{
      const id = $msg.text().match(/ID (\d+)/)[1];
      cy.wrap(id).as('patientId');
    });

    const now = new Date();
    now.setMinutes(0); now.setSeconds(0); now.setMilliseconds(0);
    now.setHours(now.getHours()+1);
    slot = formatLocal(now);

    cy.get('#register-msg').invoke('text').then(text => {
      const id = (text.match(/ID (\d+)/) || [])[1] || '1';
      // select the patient from the improved UI
      cy.get('#patient-select').select(id);
      cy.get('#form-schedule select[name="doctorId"]').select('1');
      cy.get('#datetime-input').clear().type(slot);
      cy.get('#form-schedule').submit();
      cy.get('#schedule-msg').should('contain.text', 'Cita creada ID');
      cy.get('#appointments-list').should('contain.text', patient.name);
    });
  });

  it('Validaciones: email inválido y campos vacíos', () => {
    cy.visit('/');
    cy.get('#form-register').within(() => {
      cy.get('input[name="name"]').clear();
      cy.get('input[name="email"]').clear();
      cy.get('input[name="phone"]').clear();
      cy.root().submit();
    });
    cy.get('#register-msg').should('contain.text', 'Campos requeridos');

    cy.get('#form-register input[name="name"]').type('Test');
    cy.get('#form-register input[name="email"]').type('invalid-email');
    cy.get('#form-register input[name="phone"]').type('+34123456');
    cy.get('#form-register').submit();
    cy.get('#register-msg').should('contain.text', 'Email inválido');
  });

  it('Intento de agendar en horario ocupado para el mismo doctor', () => {
    cy.visit('/');
    cy.get('#form-register input[name="name"]').clear().type('Maria');
    cy.get('#form-register input[name="email"]').clear().type('maria@example.com');
    cy.get('#form-register input[name="phone"]').clear().type('+34111222333');
    cy.get('#form-register').submit();
    cy.get('#register-msg').should('contain.text', 'Registrado con ID').invoke('text').then(text =>{
      const id = (text.match(/ID (\d+)/) || [])[1];
      cy.get('#patient-select').select(id);
      cy.get('#form-schedule select[name="doctorId"]').select('1');
      cy.get('#datetime-input').clear().type(slot);
      cy.get('#form-schedule').submit();
      cy.get('#schedule-msg').should('satisfy', ($el) => {
        const txt = $el.text();
        return /ocupad|Horario/i.test(txt) || /Cita creada ID/.test(txt) === false;
      });
    });
  });

  it('Cancelar una cita existente', () => {
    cy.visit('/');
    cy.get('#appointments-list li', { timeout: 10000 }).first().within(() => {
      cy.get('button.cancel').click();
    });
    cy.get('#appointments-list', { timeout: 5000 }).should('not.contain.text', slot.replace('T',' '));
  });
});
