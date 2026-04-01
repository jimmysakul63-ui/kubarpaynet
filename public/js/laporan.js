// public/js/laporan.js
import { eksporTabelKeExcel } from './utils.js';
import { mockDataPelanggan, mockRiwayatPembayaran } from './pembayaran.js';
import { formatRupiah } from './utils.js';

const daftarBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// State untuk Laporan
let globalKampung = 'OPERATOR'; // Menyimpan filter kampung saat ini
let filterTahun = '2026';

export function renderLaporan(kampungAktif = 'OPERATOR') {
    const container = document.getElementById('mainContentArea');
    if (!container) return;

    // Simpan kampung aktif ke variabel global agar bisa dipakai fungsi di bawahnya
    globalKampung = kampungAktif;

    container.innerHTML = `
        <h2 class="page-title">
            LAPORAN KEUANGAN ${globalKampung === 'OPERATOR' ? 'GLOBAL' : `KAMPUNG ${globalKampung}`}
        </h2>

        <div class="stats-grid" style="margin-bottom: 20px; width: 100%; max-width: 100%;">
            <div class="stat-card" style="border: 2px solid #000; box-shadow: 4px 4px 0px #000;">
                <div class="stat-header" style="background-color: #00B050; color: white;">TOTAL TRANSAKSI</div>
                <div class="stat-body" style="color: #00B050; font-size: 40px;" id="totalTransaksiTahun">-</div>
            </div>
            <div class="stat-card" style="border: 2px solid #000; box-shadow: 4px 4px 0px #000;">
                <div class="stat-header" style="background-color: #00B050; color: white;">TOTAL PENDAPATAN</div>
                <div class="stat-body" style="color: #00B050; font-size: 40px;" id="totalPendapatanTahun">-</div>
            </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1px;">
            <button id="btnExportLaporan"
                style="background-color: #1D6F42;
                color: white;
                padding: 10px 10px;
                border: 2px solid #000;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                box-shadow: 3px 3px 0px #000;">
                Export ke Excel
            </button>
        </div>

        <div style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 1px;">
            <div>
                <select id="laporanTahun" style="padding: 5px; font-weight: bold; border: 1px solid #000; outline: none;">
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                </select>
            </div>
        </div>

        <div class="table-container">
            <table id="laporanTable" class="data-table">
                <thead>
                    <tr style="background-color: #8FAADC; color: black; border-bottom: 2px solid #000;"> 
                        <th width="5%" style="text-align: center;">No</th>
                        <th width="15%">Bulan</th>
                        <th width="20%" style="text-align: center;">Total Pelanggan</th>
                        <th width="20%" style="text-align: center;">Sudah Bayar</th>
                        <th width="20%" style="text-align: center;">Belum Bayar</th>
                        <th width="20%" style="text-align: right;">Total Pendapatan</th>
                    </tr>
                </thead>
                <tbody id="laporanTableBody">
                    </tbody>
            </table>
        </div>
    `;

     // Pasang listener di bawah innerHTML:
     document.getElementById('btnExportLaporan').addEventListener('click', () => {
        const tgl = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
        eksporTabelKeExcel('laporanTable', `Laporan_Keuangan_${globalKampung}_${tgl}`);
        });

    // Pasang Event Listeners untuk Tahun
    const selectTahun = document.getElementById('laporanTahun');
    selectTahun.value = filterTahun;
    selectTahun.addEventListener('change', (e) => {
        filterTahun = e.target.value;
        loadDataRekapBulan();
    });

    // Load data pertama kali
    loadDataRekapBulan();
}

function loadDataRekapBulan() {
    const tbody = document.getElementById('laporanTableBody');
    
    // VARIABEL UNTUK KARTU RINGKASAN ATAS
    let grandTotalTransaksi = 0;
    let grandTotalPendapatan = 0;

    // 1. FILTER PELANGGAN BERDASARKAN KAMPUNG AKTIF
    let pelangganAktif = [];
    if (globalKampung === 'OPERATOR') {
        pelangganAktif = mockDataPelanggan; // Ambil semua
    } else {
        pelangganAktif = mockDataPelanggan.filter(p => p.kampung === globalKampung);
    }
    const totalPelangganSaatIni = pelangganAktif.length;

    // 2. HITUNG REKAPITULASI PER BULAN (Semua 12 Bulan Ditampilkan)
    let rekapData = daftarBulan.map(bulan => {
        
        // Ambil riwayat pembayaran LUNAS di bulan & tahun ini
        let bayarBulanIni = mockRiwayatPembayaran.filter(p => 
            p.bulan === bulan && 
            p.status === 'Lunas' && 
            (p.tahun === filterTahun || !p.tahun) 
        );

        // Jika bukan OPERATOR, saring lagi riwayat pembayarannya khusus kampung tersebut!
        if (globalKampung !== 'OPERATOR') {
            // Kita cari idPelanggan dari riwayat, apakah ada di daftar pelangganAktif (kampung tersebut)?
            bayarBulanIni = bayarBulanIni.filter(riwayat => {
                return pelangganAktif.some(pelanggan => pelanggan.id === riwayat.idPelanggan);
            });
        }

        const totalBayar = bayarBulanIni.length;
        const totalBelumBayar = totalPelangganSaatIni - totalBayar;
        const jumlahUang = bayarBulanIni.reduce((sum, p) => sum + p.jumlah, 0);

        // Tambahkan ke Grand Total untuk kartu ringkasan
        grandTotalTransaksi += totalBayar;
        grandTotalPendapatan += jumlahUang;

        return { bulan, totalPelanggan: totalPelangganSaatIni, totalBayar, totalBelumBayar, jumlah: jumlahUang };
    });

    // 3. RENDER ISI TABEL (Tanpa Pagination, Langsung 12 Bulan)
    tbody.innerHTML = rekapData.map((data, index) => {
        // Beri warna latar belakang berbeda jika ada pemasukan
        const rowBg = data.jumlah > 0 ? 'background-color: #E2EFDA;' : '';
        
        return `
            <tr style="${rowBg}">
                <td style="text-align:center; font-weight: bold;">${index + 1}</td>
                <td style="font-weight: bold;">${data.bulan.toUpperCase()}</td>
                <td style="text-align:center;">${data.totalPelanggan}</td>
                <td style="text-align:center; color: #00B050; font-weight: bold;">${data.totalBayar}</td>
                <td style="text-align:center; color: #C00000; font-weight: bold;">${data.totalBelumBayar < 0 ? 0 : data.totalBelumBayar}</td>
                <td style="text-align:right; font-weight: bold;">${formatRupiah(data.jumlah)}</td>
            </tr>
        `;
    }).join('');

    // 4. UPDATE KARTU RINGKASAN DI ATAS
    const elTotalTransaksi = document.getElementById('totalTransaksiTahun');
    const elTotalPendapatan = document.getElementById('totalPendapatanTahun');
    
    if(elTotalTransaksi) elTotalTransaksi.innerText = grandTotalTransaksi;
    if(elTotalPendapatan) elTotalPendapatan.innerText = formatRupiah(grandTotalPendapatan);
}