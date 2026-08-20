document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const correo = document.getElementById('correo').value.trim();
    const password = document.getElementById('password').value;
    const msg = document.getElementById('msg');
    msg.textContent = '';

    try {
        const data = await apiFetch('/api/login', {
            method: 'POST',
            body: JSON.stringify({ correo, password })
        });
        guardarSesion(data);
        window.location.href = data.rol === 'admin' ? '/html/admin.html' : '/html/dashboard.html';
    } catch (err) {
        msg.textContent = err.message;
        msg.className = 'msg error';
    }
});
