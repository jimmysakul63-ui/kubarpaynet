import { formatCurrency, getMaintenanceSchedule, isMaintenanceActive } from './utils.js';
import { ambilDataPelanggan, ambilDataPembayaran, ambilMaintenanceSchedule } from './api.js';

export async function initDashboard() {
    try {
        const stats = await fetchDashboardStats();
        document.getElementById('valTotalPelanggan').innerText = stats.totalPelanggan;
        document.getElementById('valSudahBayar').innerText = stats.sudahBayar;
        document.getElementById('valTotalPendapatan').innerText = formatCurrency(stats.totalPendapatan);
        document.getElementById('valBelumBayar').innerText = stats.belumBayar;
    } catch (error) {
        console.error("Gagal memuat data dashboard", error);
    }
}

// ==========================================
// 1. RENDER DASHBOARD (VERSI LENGKAP & RAPI)
// ==========================================
export async function renderDashboard(filterLokasi = 'OPERATOR') {
    const container = document.getElementById('mainContentArea');
    if (!container) return;

    let dataPelanggan = [];
    let dataBayar = [];

    try {
        const result = await ambilDataPelanggan(filterLokasi);
        dataPelanggan = Array.isArray(result) ? result : [];
    } catch (error) {
        console.warn('⚠️ Gagal mengambil data pelanggan untuk statistik:', error);
        dataPelanggan = [];
    }

    const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const bulanIni = namaBulan[new Date().getMonth()];

    try {
        const result = await ambilDataPembayaran(filterLokasi, bulanIni, new Date().getFullYear().toString());
        dataBayar = Array.isArray(result) ? result : [];
    } catch (error) {
        console.warn('⚠️ Gagal mengambil data pembayaran untuk statistik:', error);
        dataBayar = [];
    }

    let backendSchedule = null;
    try {
        backendSchedule = await ambilMaintenanceSchedule();
    } catch (error) {
        console.warn('⚠️ Gagal ambil jadwal maintenance backend:', error);
        backendSchedule = null;
    }

    if (filterLokasi !== 'OPERATOR') {
        const kampungUpper = filterLokasi.toUpperCase();
        dataPelanggan = dataPelanggan.filter(p => (p.kampung || '').toUpperCase() === kampungUpper);
        dataBayar = dataBayar.filter(p => (p.kampung || '').toUpperCase() === kampungUpper);
    }

    const totalPelanggan = dataPelanggan.length;
    const sudahBayarData = dataBayar.filter(p => (p.status || '').toString().trim().toLowerCase() === 'lunas');
    const sudahBayar = sudahBayarData.length;
    const belumBayar = Math.max(totalPelanggan - sudahBayar, 0);
    const totalPendapatan = sudahBayarData.reduce((sum, p) => sum + (Number(p.jumlah) || 0), 0);

    const maintenanceHtml = getMaintenanceBannerHtml(backendSchedule);

    container.innerHTML = `
        ${maintenanceHtml}

        <h2 class="page-title">
            STATISTIK ${filterLokasi === 'OPERATOR' ? 'GLOBAL' : 'PELANGGAN ' + filterLokasi}
        </h2>

        <div class="dashboard-wrapper">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-header">TOTAL PELANGGAN</div>
                    <div class="stat-body">${totalPelanggan}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">SUDAH BAYAR</div>
                    <div class="stat-body">${sudahBayar}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">TOTAL PENDAPATAN</div>
                    <div class="stat-body" style="font-size: 35px;">Rp ${totalPendapatan.toLocaleString('id-ID')}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">BELUM BAYAR</div>
                    <div class="stat-body">${belumBayar}</div>
                </div>
            </div>

            <div style="margin-top: 30px; text-align: center; font-size: 20px; color: #666; font-weight: bold;">
                Menampilkan data untuk: <span style="color: #C00000;">${filterLokasi}</span>
            </div>
        </div>
    `;
}

function formatMaintenanceDate(value) {
    if (!value) return '-';
    const parsed = new Date(value);
    if (!isNaN(parsed)) return parsed.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    return String(value);
}

function formatMaintenanceTime(value) {
    if (!value) return '-';
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return value;
    const parsed = new Date(value);
    if (!isNaN(parsed)) return parsed.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return String(value);
}

function getMaintenanceBannerHtml(backendSchedule = null) {
    try {
        let data = backendSchedule;

        if (!data || !data.date || !data.start || !data.end) {
            data = getMaintenanceSchedule();
        }

        if (!data || !data.date || !data.start || !data.end) return '';

        const date = formatMaintenanceDate(data.date);
        const start = formatMaintenanceTime(data.start);
        const end = formatMaintenanceTime(data.end);
        const note = data.note;

        const parsedStart = new Date(`${data.date}T${data.start}:00`);
        let parsedEnd = new Date(`${data.date}T${data.end}:00`);
        if (parsedEnd <= parsedStart) {
            parsedEnd = new Date(parsedEnd.getTime() + 24 * 60 * 60 * 1000);
        }

        const now = new Date();
        if (now < parsedStart || now > parsedEnd) {
            return '';
        }

        const message = note ? `<div class="maintenance-note">${note}</div>` : '';

        return `
            <div class="maintenance-banner">
                <div class="maintenance-title">
                    <span class="maintenance-title-icon">!</span>
                    <strong>Pengumuman Maintenance</strong>
                </div>
                <div class="maintenance-row">Tanggal: <strong>${date}</strong></div>
                <div class="maintenance-row">Waktu: <strong>${start} - ${end}</strong></div>
                ${message}
            </div>
        `;
    } catch (err) {
        console.warn('Error membaca maintenance info', err);
        return '';
    }
}

async function fetchDashboardStats(filterLokasi = 'OPERATOR') {
    try {
        const customerData = await ambilDataPelanggan(filterLokasi);

        const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const bulanIni = namaBulan[new Date().getMonth()];

        const paymentData = await ambilDataPembayaran(filterLokasi, bulanIni, new Date().getFullYear().toString());

        const pelanggan = Array.isArray(customerData) ? customerData : [];
        const bayar = Array.isArray(paymentData) ? paymentData : [];

        const bayarLunas = bayar.filter(p => (p.status || '').toString().trim().toLowerCase() === 'lunas');
        return {
            totalPelanggan: pelanggan.length,
            sudahBayar: bayarLunas.length,
            belumBayar: Math.max(pelanggan.length - bayarLunas.length, 0),
            totalPendapatan: bayarLunas.reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0)
        };
    } catch (error) {
        console.error('fetchDashboardStats error', error);
        return { totalPelanggan: 0, sudahBayar: 0, belumBayar: 0, totalPendapatan: 0 };
    }
}