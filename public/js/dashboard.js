const usuario = requireAuth(['empleado', 'admin']);
if (usuario) {
    document.getElementById('nombre-usuario').textContent = usuario.nombre;
    cargarHistorial();
}

document.getElementById('btn-logout').addEventListener('click', cerrarSesion);
document.getElementById('btn-entrada').addEventListener('click', () => marcar('entrada'));
document.getElementById('btn-salida').addEventListener('click', () => marcar('salida'));

async function marcar(accion) {
    const msg = document.getElementById('msg');
    msg.textContent = '';
    try {
        const data = await apiFetch('/api/asistencia/marcar', {
            method: 'POST',
            body: JSON.stringify({ accion })
        });
        msg.textContent = `${data.mensaje} (${data.hora})`;
        msg.className = 'msg ok';
        cargarHistorial();
    } catch (err) {
        msg.textContent = err.message;
        msg.className = 'msg error';
    }
}

async function cargarHistorial() {
    const tbody = document.querySelector('#tabla-historial tbody');
    tbody.innerHTML = '';
    const registros = await apiFetch('/api/asistencia/me');
    for (const r of registros) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${r.fecha.slice(0, 10)}</td><td>${r.hora_entrada || '—'}</td><td>${r.hora_salida || '—'}</td>`;
        tbody.appendChild(tr);
    }
}
