// ==========================================
// 1. SEMUA IMPORT WAJIB DI ATAS SINI
// ==========================================
import { renderFormGantiAdmin } from './admin.js';
import { renderInputDataForm, renderDataPelangganTable } from './pelanggan.js';
import { renderBillingForm, renderDataPembayaranTable,} from './pembayaran.js';
import { renderInfoKontak } from './kontak.js';
import { renderLaporan } from './laporan.js';
import { jalankanJamRealtime, tampilkanAlert, isMaintenanceActive } from './utils.js';
import { renderDashboard } from './dashboard.js'; 
import { ambilDataPelanggan, ambilMaintenanceSchedule, API_URL, testKoneksiGAS, testAmbilDataKampung, validasiLogin, testLogin, ambilDataUser, testSimpanDataPelanggan, testUpdateDataPelanggan, testDeleteDataPelanggan, testAmbilDataPembayaran } from './api.js';

// ==========================================
// DEBUG FUNCTIONS: Available di Browser Console (SELALU TERSEDIA)
// ==========================================
window.testGAS = {
    koneksi: testKoneksiGAS,
    ambilData: testAmbilDataKampung,
    ambilDataPembayaran: testAmbilDataPembayaran,
    ambilUser: ambilDataUser,
    login: testLogin,
    simpan: testSimpanDataPelanggan,
    update: testUpdateDataPelanggan,
    hapus: testDeleteDataPelanggan,
    url: () => console.log("Current GAS URL:", API_URL)
};

// ==========================================
// 2. SISTEM KEAMANAN & CEK SESI (LOGIN)
// ==========================================
// Catatan: Data user sekarang diambil dari Google Sheets via API
// DB_USERS yang hardcoded sudah tidak digunakan lagi

const sessionRole = sessionStorage.getItem('userRole');
const isLoginPage = window.location.pathname.toLowerCase().includes('login.html');
const isMaintenancePage = window.location.pathname.toLowerCase().includes('maintenance.html');
const maintenanceActive = isMaintenanceActive();

const isMaintenanceScheduleActive = (schedule) => {
    if (!schedule || !schedule.date || !schedule.start || !schedule.end) return false;
    const now = new Date();
    const startDateTime = new Date(`${schedule.date}T${schedule.start}:00`);
    let endDateTime = new Date(`${schedule.date}T${schedule.end}:00`);
    if (endDateTime <= startDateTime) {
        endDateTime = new Date(endDateTime.getTime() + 24 * 60 * 60 * 1000);
    }
    return now >= startDateTime && now <= endDateTime;
};

if (maintenanceActive && !isMaintenancePage && !isLoginPage) {
    window.location.href = 'maintenance.html';
    throw new Error("Maintenance aktif. Mengalihkan ke halaman maintenance...");
}

if (!sessionRole && !isLoginPage) {
    if (maintenanceActive && !isMaintenancePage) {
        window.location.href = 'maintenance.html';
        throw new Error("Maintenance aktif. Mengalihkan ke halaman maintenance...");
    }
    window.location.href = 'login.html';
    throw new Error("Belum login. Mengalihkan ke halaman login...");
}

if (sessionRole && isLoginPage) {
    window.location.href = 'index.html';
    throw new Error("Sudah login. Mengalihkan ke dashboard...");
}

if (sessionRole && maintenanceActive && !isMaintenancePage) {
    window.location.href = 'maintenance.html';
    throw new Error("Maintenance aktif. Mengalihkan ke halaman maintenance...");
}

// ==========================================
// 3. FUNGSI HALAMAN LOGIN AKTIF
// ==========================================
if (isLoginPage) {
    document.addEventListener('DOMContentLoaded', () => {
        const loginForm = document.getElementById('loginForm');
        const loginBtn = document.getElementById('loginBtn');
        const errorMsg = document.getElementById('errorMessage');

        async function checkServerMaintenance() {
            try {
                const schedule = await ambilMaintenanceSchedule();
                if (schedule && isMaintenanceScheduleActive(schedule)) {
                    window.location.href = 'maintenance.html';
                    return true;
                }
            } catch (err) {
                console.warn('Gagal cek maintenance server:', err);
            }
            return false;
        }

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const username = document.getElementById('username').value.toLowerCase().trim();
                const password = document.getElementById('password').value.trim();

                // Validasi input
                if (!username || !password) {
                    showLoginError('Username dan password harus diisi!');
                    return;
                }

                // Jika maintenance backend aktif, langsung ke halaman maintenance
                if (await checkServerMaintenance()) {
                    return;
                }

                // Disable button selama proses
                if (loginBtn) {
                    loginBtn.disabled = true;
                    loginBtn.textContent = 'Sedang memverifikasi...';
                }

                try {
                    console.log('🔐 Attempting login for:', username);
                    
                    const result = await validasiLogin(username, password);
                    
                    if (result.success) {
                        console.log('✅ Login successful:', result.user);
                        
                        // Simpan data user ke session
                        sessionStorage.setItem('userRole', result.user.role);
                        sessionStorage.setItem('username', result.user.username);
                        sessionStorage.setItem('kampungAkses', result.user.kampung);
                        
                        // Redirect ke dashboard
                        window.location.href = 'index.html';
                    } else {
                        console.log('❌ Login failed:', result.message);
                        showLoginError(result.message);
                    }
                    
                } catch (error) {
                    console.error('❌ Login error:', error);
                    showLoginError('Terjadi kesalahan sistem. Silakan coba lagi.');
                } finally {
                    // Re-enable button
                    if (loginBtn) {
                        loginBtn.disabled = false;
                        loginBtn.textContent = 'LOGIN';
                    }
                }
            });
        }

        function showLoginError(message) {
            if (errorMsg) {
                errorMsg.textContent = message;
                errorMsg.style.display = 'block';
                
                // Auto hide after 5 seconds
                setTimeout(() => {
                    errorMsg.style.display = 'none';
                }, 5000);
            } else {
                alert(message);
            }
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

    // 2. Cek maintenance global dari backend pada halaman non-login
    (async () => {
        if (!isMaintenancePage && !isLoginPage) {
            try {
                const schedule = await ambilMaintenanceSchedule();
                if (schedule && isMaintenanceScheduleActive(schedule)) {
                    window.location.href = 'maintenance.html';
                    return;
                }
            } catch (err) {
                console.warn('Gagal cek maintenance global pada load:', err);
            }
        }
    })();

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
                <a href="#" class="dropbtn">MANAGEMENT</a>
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

});

// ==========================================
// TEST DRIVE: TES KONEKSI KE GUDANG GOOGLE
// ==========================================
async function tesKoneksiGudang() {
    console.log("🚀 Menghidupkan mesin...");
    console.log("🏃 Kurir sedang jalan ke gudang AWAI...");
    console.log("📝 API URL:", API_URL);
    
    try {
        const dataDariGudang = await ambilDataPelanggan(kampungAktif); // Ganti dengan parameter yang sesuai jika perlu
        
        if (dataDariGudang && Array.isArray(dataDariGudang)) {
            console.log("✅ BERHASIL! Kurir bawa pulang data ini Bang:");
            console.table(dataDariGudang);
        } else if (dataDariGudang === null) {
            console.log("⚠️ Kurir tidak bawa apa-apa (data null)");
            console.log("🔍 Kemungkinan penyebab:");
            console.log("   1. Google Apps Script belum di-deploy public");
            console.log("   2. URL di API_URL salah atau sudah expired");
            console.log("   3. Parameter kampung tidak diterima backend");
            console.log("   4. Network/CORS error - cek tab Network di DevTools");
        } else {
            console.log("⚠️ Data dari gudang aneh:", dataDariGudang);
        }
    } catch (error) {
        console.error("❌ Waduh! Terjadi kesalahan fatal:", error);
    }
}

// Langsung gaskeun saat halaman di-refresh
tesKoneksiGudang();