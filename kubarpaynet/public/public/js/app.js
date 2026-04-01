// ==========================================
// 1. SEMUA IMPORT WAJIB DI ATAS SINI
// ==========================================
import { renderFormGantiAdmin } from './admin.js';
import { renderInputDataForm, renderDataPelangganTable } from './pelanggan.js';
import { renderBillingForm, renderDataPembayaranTable,} from './pembayaran.js';
import { renderInfoKontak } from './kontak.js';
import { renderLaporan } from './laporan.js';
import { jalankanJamRealtime } from './utils.js';
import { tampilkanAlert } from './utils.js';
import { renderDashboard } from './dashboard.js'; 

// ==========================================
// 2. SISTEM KEAMANAN & CEK SESI (LOGIN)
// ==========================================
export const DB_USERS = {
    'admin_pusat':   { pass: 'pusat1234',   role: 'OPERATOR' },
    'admin_awai':    { pass: 'awai1234',    role: 'AWAI' },
    'admin_dempar':  { pass: 'dempar1234',  role: 'DEMPAR' },
    'admin_muut':    { pass: 'muut1234',    role: 'MUUT' },
    'admin_lendian': { pass: 'lendian1234', role: 'LENDIAN' },
    'admin_marimun': { pass: 'marimun1234', role: 'MARIMUN' },
    'admin_mjawaq':  { pass: 'mjawaq1234',  role: 'MUARA JAWAQ' },
    'admin_tondoh':  { pass: 'tondoh1234',  role: 'TONDOH' }
};

const sessionRole = sessionStorage.getItem('userRole');
const isLoginPage = window.location.pathname.toLowerCase().includes('login.html');

if (!sessionRole && !isLoginPage) {
    window.location.href = 'login.html';
    throw new Error("Belum login. Mengalihkan ke halaman login...");
}
if (sessionRole && isLoginPage) {
    window.location.href = 'index.html';
    throw new Error("Sudah login. Mengalihkan ke dashboard...");
}

// ==========================================
// 3. FUNGSI HALAMAN LOGIN AKTIF
// ==========================================
if (isLoginPage) {
    document.addEventListener('DOMContentLoaded', () => {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const u = document.getElementById('username').value.toLowerCase();
                const p = document.getElementById('password').value;

                if (DB_USERS[u] && DB_USERS[u].pass === p) {
                    sessionStorage.setItem('userRole', DB_USERS[u].role);
                    window.location.href = 'index.html';
                } else {
                    alert('Username atau Password salah! Silakan coba lagi.');
                }
            });
        }
    });
    throw new Error("Halaman login aktif. Script dashboard dihentikan.");
}

// ==========================================
// 4. DATA VISUAL & FUNGSI HELPER
// ==========================================
let kampungAktif = sessionStorage.getItem('kampungPilihan') || sessionRole || 'OPERATOR';

const lokasiData = {
    'OPERATOR': { title: 'KUBARPAYNET', bg: 'url("img/kubarpaynet.png")', tColor: '#0011ff' },
    'AWAI': { title: 'KAMPUNG AWAI', bg: 'url("img/awai.jpg")', tColor: '#ff3300' },
    'DEMPAR': { title: 'KAMPUNG DEMPAR', bg: 'url("img/navbar.png")', tColor: '#eeff00' },
    'MUUT': { title: 'KAMPUNG MUUT', bg: 'url("img/muut.jpg")', tColor: '#f705a6' },
    'LENDIAN': { title: 'KAMPUNG LENDIAN', bg: 'url("img/lendian.jpg")', tColor: '#FF5722' },
    'MARIMUN': { title: 'KAMPUNG MARIMUN', bg: 'url("img/marimun.jpg")', tColor: '#27fa0b' },
    'TONDOH': { title: 'KAMPUNG TONDOH', bg: 'url("img/tondoh.jpg")', tColor: '#00eeff' },
    'MUARA JAWAQ': { title: 'KAMPUNG MUARA JAWAQ', bg: 'url("img/muarajawaq.jpg")', tColor: '#FFFFFF' }
};

function updateHeader(namaMenu) {
    const data = lokasiData[namaMenu];
    if (!data) return;

    const banner = document.getElementById('bannerContainer');
    const mainTitle = document.getElementById('mainTitle');
    const subTitle = document.getElementById('subTitle');
    const navPelanggan = document.getElementById('navPelanggan');

    if (banner) banner.style.backgroundImage = data.bg;
    if (mainTitle) {
        mainTitle.innerText = data.title;
        mainTitle.style.color = data.tColor;
    }
    if (subTitle) subTitle.style.color = '#FFCC00';
    if (navPelanggan) navPelanggan.innerText = (namaMenu === 'OPERATOR') ? 'ADMIN' : 'PELANGGAN';
}

function navigasiKe(fungsiRender) {
    const container = document.getElementById('mainContentArea');
    if (container) {
        container.innerHTML = "";
        fungsiRender();
    }
}

// ==========================================
// 5. INISIALISASI EVENT LISTENERS (DASHBOARD)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Jalankan Jam
    jalankanJamRealtime();

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            // Kita panggil dengan tipe 'konfirmasi'
            tampilkanAlert("Apakah Anda yakin ingin keluar dari sistem?", 'konfirmasi', () => {
                // Kode di bawah ini HANYA jalan kalau tombol "YA" diklik
                sessionStorage.clear();
                window.location.href = 'login.html';
            });
        });
    }

    // 3. Navbar Khusus Operator (Ganti Menu)
    if (sessionRole === 'OPERATOR') {
        const dropdowns = document.querySelectorAll('.top-nav .dropdown');
        if (dropdowns.length >= 2) {
            const menuPelanggan = dropdowns[0];
            menuPelanggan.innerHTML = `<a href="#" class="dropbtn" id="navAdmin">ADMIN</a>`;
            document.getElementById('navAdmin').addEventListener('click', (e) => {
                e.preventDefault();
                navigasiKe(renderFormGantiAdmin);
            });

            const menuDataMgmt = dropdowns[1];
            menuDataMgmt.innerHTML = `
                <a href="#" class="dropbtn">DATA MANAGEMENT</a>
                <div class="dropdown-content">
                    <a href="#" id="opDataPelanggan">DATA PELANGGAN</a>
                    <a href="#" id="opDataPembayaran">DATA PEMBAYARAN</a>
                </div>
            `;
            
            document.getElementById('opDataPelanggan').addEventListener('click', (e) => {
                e.preventDefault();
                navigasiKe(() => renderDataPelangganTable(kampungAktif));
            });
            document.getElementById('opDataPembayaran').addEventListener('click', (e) => {
                e.preventDefault();
                navigasiKe(() => renderDataPembayaranTable(kampungAktif));
            });
        }
    }

    // 4. EFEK COLLAPSE SIDEBAR (DENGAN MEMORI)
    const sidebarElement = document.querySelector('.sidebar');
    const btnToggleSidebar = document.getElementById('btnToggleSidebar');
    
    if (sessionStorage.getItem('statusSidebar') === 'tertutup') {
        sidebarElement.classList.add('collapsed');
        if (btnToggleSidebar) btnToggleSidebar.innerText = '❯';
    }

    if (btnToggleSidebar && sidebarElement) {
        btnToggleSidebar.addEventListener('click', () => {
            sidebarElement.classList.toggle('collapsed');
            const isCollapsed = sidebarElement.classList.contains('collapsed');
            btnToggleSidebar.innerText = isCollapsed ? '❯' : '❮';
            sessionStorage.setItem('statusSidebar', isCollapsed ? 'tertutup' : 'terbuka');
        });
    }

    // 5. MENU SIDEBAR (GANTI KAMPUNG DENGAN MEMORI)
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
    
    sidebarLinks.forEach(link => {
        const menuText = link.innerText.trim();
        if (sessionRole !== 'OPERATOR' && menuText !== sessionRole) {
            link.style.display = 'none'; 
        }

        if (menuText === kampungAktif) {
            link.classList.add('active-sidebar');
        }

        link.addEventListener('click', (e) => {
            e.preventDefault();
            kampungAktif = menuText; 
            sessionStorage.setItem('kampungPilihan', kampungAktif);
            updateHeader(kampungAktif);
            
            // Klik ulang tombol aktif agar isinya merefresh kampung baru
            const menuAktifId = sessionStorage.getItem('menuTerakhir') || 'navDashboard';
            const tombolAktif = document.getElementById(menuAktifId);
            if(tombolAktif) tombolAktif.click();
            
            sidebarLinks.forEach(l => l.classList.remove('active-sidebar'));
            link.classList.add('active-sidebar');
        });
    });

    // 6. Menu Navigasi Atas (Dashboard, Laporan, Kontak)
    const btnDash = document.getElementById('navDashboard');
    if (btnDash) {
        btnDash.addEventListener('click', (e) => {
            e.preventDefault();
            navigasiKe(() => renderDashboard(kampungAktif));
        });
    }

    const btnLaporan = document.getElementById('navLaporan');
    if (btnLaporan) {
        btnLaporan.addEventListener('click', (e) => {
            e.preventDefault();
            
            // MODIFIKASI DI SINI:
            // Kirim 'kampungAktif' ke dalam fungsi renderLaporan
            navigasiKe(() => renderLaporan(kampungAktif)); 
        });
    }

    const btnKontak = document.getElementById('navKontak');
    if (btnKontak) {
        btnKontak.addEventListener('click', (e) => {
            e.preventDefault();
            navigasiKe(renderInfoKontak);
        });
    }

    // 7. Logika Dropdown (Bagi Non-Operator)
    if (sessionRole !== 'OPERATOR') {
        const menuActions = {
            'subMenuInputData': () => renderInputDataForm(kampungAktif),
            'subMenuDataPelanggan': () => renderDataPelangganTable(kampungAktif),
            'subMenuBilling': renderBillingForm,
            'subMenuDataPembayaran': () => renderDataPembayaranTable(kampungAktif)
        };

        Object.keys(menuActions).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    navigasiKe(menuActions[id]);
                });
            }
        });
    }

    // ==========================================
    // 8. FITUR INGAT HALAMAN (ANTI-BLANK REVISI)
    // ==========================================
    
    // a. Radar Pencatat Klik
    document.addEventListener('click', (e) => {
        const linkNav = e.target.closest('.top-nav a, .dropdown-content a');
        if (linkNav && linkNav.id && linkNav.id !== 'btnLogout') {
            sessionStorage.setItem('menuTerakhir', linkNav.id);
        }
    });

    // b. Jaring Pengaman Dasar (Tampilkan Dashboard Dulu)
    updateHeader(kampungAktif);
    navigasiKe(() => renderDashboard(kampungAktif));

    // c. Tumpuk layarnya jika punya memori halaman lain
    const idMenuTerakhir = sessionStorage.getItem('menuTerakhir');
    if (idMenuTerakhir && idMenuTerakhir !== 'navDashboard') {
        // Tunda 50 milidetik agar HTML siap dicari JS
        setTimeout(() => {
            const tombolMenuGhaib = document.getElementById(idMenuTerakhir);
            if (tombolMenuGhaib) {
                tombolMenuGhaib.click(); 
            }
        }, 50);
    }

}); // <-- PENUTUP DOMContentLoaded ADA DI SINI (JANGAN DIHAPUS)