const usuario = requireAuth(['admin']);
if (usuario) {
    document.getElementById('nombre-usuario').textContent = usuario.nombre;
    cargarUsuarios();
}

document.getElementById('btn-logout').addEventListener('click', cerrarSesion);

/* ---------- Pestañas ---------- */
const tabs = document.querySelectorAll('.tabs button');
tabs.forEach((btn) => btn.addEventListener('click', () => {
    tabs.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.panel').forEach((p) => p.classList.add('hidden'));
    document.getElementById(btn.dataset.panel).classList.remove('hidden');
}));

/* ---------- GU-01/02/03: Usuarios ---------- */
let editandoId = null;
const form = document.getElementById('form-usuario');
const msgUsuarios = document.getElementById('msg-usuarios');

async function cargarUsuarios() {
    const tbody = document.querySelector('#tabla-usuarios tbody');
    tbody.innerHTML = '';
    const usuarios = await apiFetch('/api/usuarios');
    for (const u of usuarios) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${u.nombre}</td>
            <td>${u.correo}</td>
            <td>${u.rol}</td>
            <td>${u.estado}</td>
            <td>
                <button class="btn-secondary" data-editar="${u.id}">Editar</button>
                <button class="btn-danger" data-eliminar="${u.id}">Eliminar</button>
            </td>`;
        tbody.appendChild(tr);
        tr.querySelector('[data-editar]').addEventListener('click', () => editarUsuario(u));
        tr.querySelector('[data-eliminar]').addEventListener('click', () => eliminarUsuario(u.id));
    }
}

function editarUsuario(u) {
    editandoId = u.id;
    document.getElementById('nombre').value = u.nombre;
    document.getElementById('correo').value = u.correo;
    document.getElementById('password').value = '';
    document.getElementById('rol').value = u.rol;
    document.getElementById('estado').value = u.estado;
    document.getElementById('titulo-form').textContent = 'Editar usuario';
}

document.getElementById('btn-cancelar').addEventListener('click', () => resetForm());

function resetForm() {
    editandoId = null;
    form.reset();
    document.getElementById('titulo-form').textContent = 'Nuevo usuario';
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgUsuarios.textContent = '';
    const cuerpo = {
        nombre: document.getElementById('nombre').value.trim(),
        correo: document.getElementById('correo').value.trim(),
        password: document.getElementById('password').value,
        rol: document.getElementById('rol').value,
        estado: document.getElementById('estado').value
    };

    try {
        if (editandoId) {
            await apiFetch(`/api/usuarios/${editandoId}`, { method: 'PUT', body: JSON.stringify(cuerpo) });
        } else {
            await apiFetch('/api/usuarios', { method: 'POST', body: JSON.stringify(cuerpo) });
        }
        resetForm();
        cargarUsuarios();
    } catch (err) {
        msgUsuarios.textContent = err.message;
        msgUsuarios.className = 'msg error';
    }
});

async function eliminarUsuario(id) {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
        await apiFetch(`/api/usuarios/${id}`, { method: 'DELETE' });
        cargarUsuarios();
    } catch (err) {
        msgUsuarios.textContent = err.message;
        msgUsuarios.className = 'msg error';
    }
}

/* ---------- RE-01/02/03: Reportes ---------- */
document.getElementById('btn-atrasos').addEventListener('click', async () => {
    const datos = await apiFetch('/api/reportes/atrasos');
    pintarReporte(['Empleado', 'Fecha', 'Hora entrada'], datos.map((d) => [d.nombre, d.fecha.slice(0, 10), d.hora_entrada]));
});

document.getElementById('btn-salidas').addEventListener('click', async () => {
    const datos = await apiFetch('/api/reportes/salidas-anticipadas');
    pintarReporte(['Empleado', 'Fecha', 'Hora salida'], datos.map((d) => [d.nombre, d.fecha.slice(0, 10), d.hora_salida]));
});

document.getElementById('btn-inasistencias').addEventListener('click', async () => {
    const fecha = document.getElementById('fecha-inasistencias').value || new Date().toISOString().slice(0, 10);
    const datos = await apiFetch(`/api/reportes/inasistencias?fecha=${fecha}`);
    pintarReporte(['Empleado'], datos.empleados.map((d) => [d.nombre]));
});

function pintarReporte(columnas, filas) {
    const thead = document.querySelector('#tabla-reporte thead tr');
    const tbody = document.querySelector('#tabla-reporte tbody');
    thead.innerHTML = columnas.map((c) => `<th>${c}</th>`).join('');
    tbody.innerHTML = filas.length
        ? filas.map((f) => `<tr>${f.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')
        : `<tr><td colspan="${columnas.length}">Sin resultados.</td></tr>`;
}
