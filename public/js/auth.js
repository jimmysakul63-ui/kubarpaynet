const DB_USERS = {
    'admin_pusat':   { pass: 'pusat1234',   role: 'OPERATOR' },
    'admin_awai':    { pass: 'awai1234',    role: 'AWAI' },
    'admin_dempar':  { pass: 'dempar1234',  role: 'DEMPAR' },
    'admin_muut':    { pass: 'muut1234',    role: 'MUUT' },
    'admin_lendian': { pass: 'lendian1234', role: 'LENDIAN' },
    'admin_marimun': { pass: 'marimun1234', role: 'MARIMUN' },
    'admin_mjawaq':  { pass: 'mjawaq1234',  role: 'MUARA JAWAQ' },
    'admin_tondoh':  { pass: 'tondoh1234',  role: 'TONDOH' }
};

export function initAuth() {
    // 1. Logika untuk Logout (di halaman index.html)
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin keluar?')) {
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        });
    }

    // 2. Logika untuk Login (di halaman login.html)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.toLowerCase();
            const password = document.getElementById('password').value;

            if (DB_USERS[username] && DB_USERS[username].pass === password) {
                sessionStorage.setItem('userRole', DB_USERS[username].role);
                window.location.href = 'index.html';
            } else {
                alert('Username atau Password salah! Silakan coba lagi.');
            }
        });
    }
}