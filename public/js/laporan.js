// public/js/laporan.js
import { eksporTabelKeExcel, eksporKeExcel, tampilkanAlert, formatRupiah } from './utils.js';
import { ambilDataPelanggan, ambilDataPembayaran } from './api.js';

const daftarBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// State untuk Laporan
let globalKampung = 'OPERATOR';
let filterTahun = '2026';
let cachedPelanggan = [];
let cachedPembayaran = [];

async function getLokasiOptions() {
    if (globalKampung !== 'OPERATOR') {
        return [globalKampung.toUpperCase()];
    }

    try {
        const pelanggan = await ambilDataPelanggan('OPERATOR');
        const list = Array.isArray(pelanggan) ? pelanggan : [];
        const kampungSet = new Set();
        list.forEach(p => {
            const k = (p.kampung || p.alamat || '').toString().trim().toUpperCase();
            if (!k || k === 'OPERATOR') return;
            kampungSet.add(k);
        });

        const sorted = [...kampungSet].sort((a, b) => a.localeCompare(b));
        return ['SEMUA', ...sorted];
    } catch (error) {
        console.error('Gagal ambil daftar kampung untuk filter:', error);
        return ['SEMUA'];
    }
}

export async function renderLaporan(kampungAktif = 'OPERATOR') {
    const container = document.getElementById('mainContentArea');
    if (!container) return;

    globalKampung = kampungAktif;
    const lokasiOptions = await getLokasiOptions();

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

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; background: #fff; padding: 10px; border: 2px solid #000; border-radius: 5px;">
            
            <div style="display: flex; gap: 10px; align-items: center;">
                <label style="font-weight: bold; color: #000;">LOKASI:</label>
                <select id="filterLokasi" style="padding: 5px; font-weight: bold; border: 1px solid #000; outline: none; border-radius: 4px;"></select>

                <label style="font-weight: bold; color: #000;">BULAN:</label>
                <select id="filterBulan" style="padding: 5px; font-weight: bold; border: 1px solid #000; outline: none; border-radius: 4px;">
                    <option value="SEMUA">-- SEMUA BULAN --</option>
                    ${daftarBulan.map(b => `<option value="${b}">${b}</option>`).join('')}
                </select>

                <button id="btnExportDataMentah" style="background-color: #FFC000; color: #000; padding: 5px 15px; border: 2px solid #000; border-radius: 5px; cursor: pointer; font-weight: bold; box-shadow: 2px 2px 0px #000;">
                    📥 EXPORT DATA
                </button>
            </div>

            <div style="display: flex; gap: 10px; align-items: center;">
                <label style="font-weight: bold; color: #000;">TAHUN LAPORAN:</label>
                <select id="laporanTahun" style="padding: 5px; font-weight: bold; border: 1px solid #000; outline: none; border-radius: 4px;">
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                </select>

                <button id="btnExportTabel" style="background-color: #1D6F42; color: white; padding: 5px 15px; border: 2px solid #000; border-radius: 5px; cursor: pointer; font-weight: bold; box-shadow: 2px 2px 0px #000;">
                    📊 EXPORT TABEL INI
                </button>
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

    // Aksi 1: Export Data Detail berdasar Filter Lokasi & Bulan
    document.getElementById('btnExportDataMentah').addEventListener('click', () => {
        prosesExportLaporan();
    });

    // Aksi 2: Export Rekap Tabel 12 Bulan yang tampil di layar
    document.getElementById('btnExportTabel').addEventListener('click', () => {
        const tgl = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
        eksporTabelKeExcel('laporanTable', `Rekap_Tabel_Keuangan_${globalKampung}_${tgl}`);
    });

    // Aksi 3: Ubah Tahun Tabel
    const selectTahun = document.getElementById('laporanTahun');
    selectTahun.value = filterTahun;
    selectTahun.addEventListener('change', (e) => {
        filterTahun = e.target.value;
        loadDataRekapBulan();
    });

    const ddlFilterLokasi = document.getElementById('filterLokasi');
    if (ddlFilterLokasi) {
        ddlFilterLokasi.innerHTML = lokasiOptions.map(opt => {
            if (opt === 'SEMUA') return `<option value="SEMUA">-- SEMUA KAMPUNG --</option>`;
            return `<option value="${opt}">${opt}</option>`;
        }).join('');

        if (globalKampung !== 'OPERATOR') {
            ddlFilterLokasi.value = globalKampung.toUpperCase();
            ddlFilterLokasi.disabled = true; // Kunci biar gak bisa intip kampung lain
        } else {
            ddlFilterLokasi.value = 'SEMUA';
            ddlFilterLokasi.disabled = false;
            ddlFilterLokasi.addEventListener('change', () => {
                loadDataRekapBulan();
            });
        }
    }

    loadDataRekapBulan();
}

async function loadDataRekapBulan() {
    const tbody = document.getElementById('laporanTableBody');
    let grandTotalTransaksi = 0;
    let grandTotalPendapatan = 0;

    const selectedLokasi = (document.getElementById('filterLokasi')?.value || (globalKampung === 'OPERATOR' ? 'SEMUA' : globalKampung)).toString().toUpperCase();
    const queryLokasi = (globalKampung === 'OPERATOR' && selectedLokasi !== 'SEMUA') ? selectedLokasi : (globalKampung === 'OPERATOR' ? 'OPERATOR' : globalKampung);

    try {
        const pelanggan = await ambilDataPelanggan(queryLokasi);
        cachedPelanggan = Array.isArray(pelanggan) ? pelanggan : [];
    } catch (error) {
        console.error('Gagal ambil pelanggan untuk laporan:', error);
        cachedPelanggan = [];
    }

    try {
        const pembayaran = await ambilDataPembayaran(queryLokasi, 'Semua', filterTahun);
        cachedPembayaran = Array.isArray(pembayaran) ? pembayaran : [];
    } catch (error) {
        console.error('Gagal ambil pembayaran untuk laporan:', error);
        cachedPembayaran = [];
    }

    let pelangganAktif;
    if (globalKampung === 'OPERATOR') {
        if (selectedLokasi === 'SEMUA') {
            pelangganAktif = cachedPelanggan;
        } else {
            pelangganAktif = cachedPelanggan.filter(p => (p.kampung || '').toString().toUpperCase() === selectedLokasi);
        }
    } else {
        pelangganAktif = cachedPelanggan.filter(p => (p.kampung || '').toString().toUpperCase() === globalKampung.toUpperCase());
    }
    const totalPelangganSaatIni = pelangganAktif.length;

    let rekapData = daftarBulan.map(bulan => {
        let bayarBulanIni = cachedPembayaran.filter(p =>
            p.bulan === bulan && (p.status || '').toString().toLowerCase() === 'lunas' && (p.tahun === filterTahun || !p.tahun)
        );

        if (globalKampung !== 'OPERATOR' || selectedLokasi !== 'SEMUA') {
            bayarBulanIni = bayarBulanIni.filter(riwayat => pelangganAktif.some(pelanggan => (pelanggan.id || pelanggan.idPelanggan) === riwayat.idPelanggan));
        }

        const totalBayar = bayarBulanIni.length;
        const totalBelumBayar = Math.max(totalPelangganSaatIni - totalBayar, 0);
        const jumlahUang = bayarBulanIni.reduce((sum, p) => sum + (Number(p.jumlah) || 0), 0);

        grandTotalTransaksi += totalBayar;
        grandTotalPendapatan += jumlahUang;

        return { bulan, totalPelanggan: totalPelangganSaatIni, totalBayar, totalBelumBayar, jumlah: jumlahUang };
    });

    tbody.innerHTML = rekapData.map((data, index) => {
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

    const elTotalTransaksi = document.getElementById('totalTransaksiTahun');
    const elTotalPendapatan = document.getElementById('totalPendapatanTahun');
    if(elTotalTransaksi) elTotalTransaksi.innerText = grandTotalTransaksi;
    if(elTotalPendapatan) elTotalPendapatan.innerText = formatRupiah(grandTotalPendapatan);
}

// Fungsi Internal Untuk Export Data Mentah
function prosesExportLaporan() {
    const lokasiDipilih = document.getElementById('filterLokasi').value;
    const bulanDipilih = document.getElementById('filterBulan').value;

    let dataLaporan = cachedPembayaran.map(bayar => {
        const pelanggan = cachedPelanggan.find(p => (p.id || p.idPelanggan) === bayar.idPelanggan);
        return {
            "ID Transaksi": bayar.idTrx || bayar.id || '',
            "ID Pelanggan": bayar.idPelanggan || '',
            "Nama Pelanggan": pelanggan ? pelanggan.nama : (bayar.nama || 'Tidak Diketahui'),
            "Lokasi/Kampung": pelanggan ? (pelanggan.alamat || pelanggan.kampung || '') : (bayar.kampung || ''),
            "Bulan Tagihan": bayar.bulan || '',
            "Tahun": bayar.tahun || filterTahun,
            "Nominal Bayar": Number(bayar.jumlah || 0),
            "Metode": bayar.metode || '',
            "Status": bayar.status || '',
            "Catatan": bayar.catatan || ''
        };
    });

    if (lokasiDipilih !== "SEMUA") {
        dataLaporan = dataLaporan.filter(item => item["Lokasi/Kampung"].toUpperCase().includes(lokasiDipilih));
    }

    if (bulanDipilih !== "SEMUA") {
        dataLaporan = dataLaporan.filter(item => item["Bulan Tagihan"] === bulanDipilih);
    }

    if (dataLaporan.length === 0) {
        tampilkanAlert(`Tidak ada data pembayaran untuk ${lokasiDipilih} di bulan ${bulanDipilih}`, 'gagal');
        return; 
    }

    const namaFile = `Rekap_Pembayaran_${lokasiDipilih}_${bulanDipilih}`;
    eksporKeExcel(dataLaporan, namaFile);
}