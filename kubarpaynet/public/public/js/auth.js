export function initAuth() {
    // 1. Logika untuk Logout (di halaman index.html)
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if(confirm('Apakah Anda yakin ingin keluar?')) {
                window.location.href = 'login.html';
            }
        });
    }

    // 2. Logika untuk Login (di halaman login.html)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Mencegah form reload halaman bawaan browser
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Di sini nantinya Anda bisa melakukan validasi ke API/Database.
            // Untuk sementara, kita buat simulasi login sederhana:
            if (DB_USERS[u] && DB_USERS[u].pass === p) {
                sessionStorage.setItem('userRole', DB_USERS[u].role);
                window.location.href = 'index.html';
            } else {
                // Pakai alert merah (gagal)
                tampilkanAlert('Username atau Password salah!', 'gagal');
            }
        });
    }
}