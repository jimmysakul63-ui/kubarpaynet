import { fetchDashboardStats } from './api.js';
import { formatCurrency } from './utils.js';
import { mockDataPelanggan, mockRiwayatPembayaran } from './pembayaran.js';

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
export function renderDashboard(filterLokasi = 'OPERATOR') {
    const container = document.getElementById('mainContentArea');
    if (!container) return;

    // --- PROSES HITUNG DATA (WAJIB ADA) ---
    let dataPelanggan = mockDataPelanggan;
    let dataBayar = mockRiwayatPembayaran;

    // Filter jika bukan Operator
    if (filterLokasi !== 'OPERATOR') {
        dataPelanggan = mockDataPelanggan.filter(p => p.alamat && p.alamat.toUpperCase().includes(filterLokasi.toUpperCase()));
        dataBayar = mockRiwayatPembayaran.filter(p => {
            const pelanggan = mockDataPelanggan.find(pl => pl.id === p.idPelanggan || pl.idPelanggan === p.idPelanggan);
            return pelanggan && pelanggan.alamat.toUpperCase().includes(filterLokasi.toUpperCase());
        });
    }

    const totalPelanggan = dataPelanggan.length;
    const sudahBayar = dataBayar.length;
    const belumBayar = totalPelanggan - sudahBayar;
    const totalPendapatan = dataBayar.reduce((sum, p) => sum + p.jumlah, 0);

    // --- RENDER HTML (SESUAI CSS BARU) ---
    container.innerHTML = `
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