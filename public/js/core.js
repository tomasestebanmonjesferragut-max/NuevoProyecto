function getToken() { return localStorage.getItem('token'); }
function getUsuario() {
    try { return JSON.parse(localStorage.getItem('usuario')); } catch { return null; }
}
function guardarSesion(data) {
    const { token, ...usuario } = data;
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
}
function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/html/index.html';
}

async function apiFetch(url, opciones = {}) {
    const headers = { 'Content-Type': 'application/json', ...(opciones.headers || {}) };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, { ...opciones, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Ocurrió un error inesperado.');
    return data;
}

function requireAuth(rolesPermitidos) {
    const usuario = getUsuario();
    if (!getToken() || !usuario) {
        window.location.href = '/html/index.html';
        return null;
    }
    if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
        window.location.href = usuario.rol === 'admin' ? '/html/admin.html' : '/html/dashboard.html';
        return null;
    }
    return usuario;
}
