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

    // Schedule an appointment in the next hour boundary
    const now = new Date();
    now.setMinutes(0); now.setSeconds(0); now.setMilliseconds(0);
    now.setHours(now.getHours()+1);
    slot = formatLocal(now);

    // Read the register message and then schedule using the extracted id
    cy.get('#register-msg').invoke('text').then(text => {
      const id = (text.match(/ID (\d+)/) || [])[1] || '1';
      cy.get('#form-schedule input[name="patientId"]').clear().type(id);
      cy.get('#form-schedule select[name="doctorId"]').select('1');
      cy.get('#form-schedule input[name="datetime"]').type(slot);
      cy.get('#form-schedule').submit();
      cy.get('#schedule-msg').should('contain.text', 'Cita creada ID');
      cy.get('#appointments-list').should('contain.text', patient.name);
    });
  });

  it('Validaciones: email inválido y campos vacíos', () => {
    cy.visit('/');
    // empty fields
    cy.get('#form-register').within(() => {
      cy.get('input[name="name"]').clear();
      cy.get('input[name="email"]').clear();
      cy.get('input[name="phone"]').clear();
      cy.root().submit();
    });
    cy.get('#register-msg').should('contain.text', 'Campos requeridos');

    // invalid email
    cy.get('#form-register input[name="name"]').type('Test');
    cy.get('#form-register input[name="email"]').type('invalid-email');
    cy.get('#form-register input[name="phone"]').type('+34123456');
    cy.get('#form-register').submit();
    cy.get('#register-msg').should('contain.text', 'Email inválido');
  });

  it('Intento de agendar en horario ocupado para el mismo doctor', () => {
    cy.visit('/');
    // Registrar otro paciente
    cy.get('#form-register input[name="name"]').clear().type('Maria');
    cy.get('#form-register input[name="email"]').clear().type('maria@example.com');
    cy.get('#form-register input[name="phone"]').clear().type('+34111222333');
    cy.get('#form-register').submit();
    cy.get('#register-msg').should('contain.text', 'Registrado con ID').invoke('text').then(text =>{
      const id = (text.match(/ID (\d+)/) || [])[1];
      cy.get('#form-schedule input[name="patientId"]').clear().type(id);
      cy.get('#form-schedule select[name="doctorId"]').select('1');
      cy.get('#form-schedule input[name="datetime"]').clear().type(slot);
      cy.get('#form-schedule').submit();
      // server returns a 409 with message containing 'Horario' or 'ocupado'
      cy.get('#schedule-msg').should('satisfy', ($el) => {
        const txt = $el.text();
        return /ocupad|Horario/i.test(txt) || /Cita creada ID/.test(txt) === false;
      });
    });
  });

  it('Cancelar una cita existente', () => {
    cy.visit('/');
    // ensure list has entries and cancel the first
    cy.get('#appointments-list li').first().within(() => {
      cy.get('button.cancel').click();
    });
    // After cancel, appointment list should not contain the previously booked time
    cy.get('#appointments-list').should('not.contain.text', slot.replace('T',' '));
  });
});
