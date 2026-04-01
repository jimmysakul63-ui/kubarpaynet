// ==========================================
// DATA SIMULASI (Database Sederhana)
// ==========================================
import { eksporTabelKeExcel, tampilkanAlert } from './utils.js';

export const mockDataPelanggan = [
    { id: 'DMP6543020001', nama: 'RUDI', noHp: '0852xxxxxxxx', paket: 'PAKET B', harga: 300000, alamat: 'KAMPUNG TONDOH' },
    { id: 'DMP6543020002', nama: 'ARIF', noHp: '0852xxxxxxxx', paket: 'PAKET B', harga: 300000, alamat: 'KAMPUNG TONDOH' },
    { id: 'DMP6543020003', nama: 'WATI', noHp: '0852xxxxxxxx', paket: 'PAKET B', harga: 300000, alamat: 'KAMPUNG TONDOH' },
    { id: 'DMP6543020004', nama: 'RIO RIVALDI RUMALAG', noHp: '0852xxxxxxxx', paket: 'PAKET C', harga: 350000, alamat: 'KAMPUNG TONDOH' }
];

export let mockRiwayatPembayaran = [
    { idPelanggan: 'DMP6543020001', nama: 'RUDI', noHp: '0852xxxxxxxx', paket: 'PAKET B', jumlah: 300000, metode: 'TRANSFER', status: 'Lunas', bulan: 'Januari' },
    { idPelanggan: 'DMP6543020002', nama: 'ARIF', noHp: '0852xxxxxxxx', paket: 'PAKET B', jumlah: 300000, metode: 'TRANSFER', status: 'Lunas', bulan: 'Januari' }
];

const daftarBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// ==========================================
// VARIABEL STATE GLOBAL UNTUK TABEL PEMBAYARAN
// ==========================================
let currentPageBayar = 1;
let rowsPerPageBayar = 5;
let filterBulanBayar = 'Semua';
let currentKampungBayar = 'OPERATOR'; // <-- Ini obat anti errornya!

// ==========================================
// 2. RENDER FORM BILLING
// ==========================================
export function renderBillingForm() {
    const container = document.getElementById('mainContentArea');
    if (!container) return;

    container.innerHTML = `
        <div class="form-wrapper">
            <div class="form-container">
                <h2 class="form-title">FORM BILLING</h2>
                <div class="autocomplete" style="position: relative; width:100%;">
                    <div class="input-search-group">
                        <input type="text" id="inputCariPelanggan" placeholder="Ketik Nama atau ID..." class="input-field input-search" autocomplete="off">
                        <button class="btn-cari" id="btnCariPelanggan">Cari</button>
                    </div>
                    <div id="autocomplete-list" class="autocomplete-items"></div>
                </div>
                <form id="billingForm" style="margin-top: 20px;">
                    <div class="form-group"><label>ID :</label><input type="text" id="billId" class="input-field" readonly required></div>
                    <div class="form-group"><label>Nama :</label><input type="text" id="billNama" class="input-field" readonly required></div>
                    <div class="form-group"><label>Paket :</label><input type="text" id="billPaket" class="input-field" readonly required></div>
                    <div class="form-group"><label>Harga :</label><span id="billHarga" style="font-weight:bold; font-size:18px;">Rp 0</span><input type="hidden" id="billNominal"></div>
                    <div class="form-group">
                        <label>Bulan :</label>
                        <select id="billBulan" class="input-field select-field" required>
                            <option value="">-- Pilih Bulan --</option>
                            ${daftarBulan.map(b => `<option value="${b}">${b}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Metode :</label>
                        <select id="billMetode" class="input-field select-field" required>
                            <option value="CASH">CASH</option>
                            <option value="TRANSFER">TRANSFER</option>
                            <option value="QRIS">QRIS</option>
                        </select>
                    </div>
                    <div class="form-actions"><button type="submit" class="btn-simpan">Konfirmasi Bayar</button></div>
                </form>
            </div>
        </div>
    `;
    setupAutocomplete();
    setupFormSubmission();
}

function setupAutocomplete() {
    const input = document.getElementById('inputCariPelanggan');
    const list = document.getElementById('autocomplete-list');
    if(!input) return;

    input.addEventListener('input', function() {
        list.innerHTML = '';
        const val = this.value.toLowerCase();
        if (!val) return;

        const matches = mockDataPelanggan.filter(p => 
            p.nama.toLowerCase().includes(val) || 
            (p.id || p.idPelanggan).toLowerCase().includes(val)
        );

        matches.forEach(match => {
            const item = document.createElement('div');
            // Tambahkan class agar bisa diatur di CSS
            item.className = 'autocomplete-suggestion'; 
            item.innerHTML = `<strong>${match.id || match.idPelanggan}</strong> - ${match.nama}`;
            
            item.onclick = () => {
                input.value = match.id || match.idPelanggan;
                list.innerHTML = '';
                
                // Isi form otomatis
                document.getElementById('billId').value = match.id || match.idPelanggan;
                document.getElementById('billNama').value = match.nama;
                document.getElementById('billPaket').value = match.paket;
                document.getElementById('billNominal').value = match.harga;
                document.getElementById('billHarga').innerText = `Rp ${match.harga.toLocaleString('id-ID')}`;
            };
            list.appendChild(item);
        });
    });

    // FITUR TAMBAHAN: Klik di luar pencarian akan menutup dropdown
    document.addEventListener('click', function (e) {
        if (e.target !== input) {
            list.innerHTML = '';
        }
    });
}

function setupFormSubmission() {
    const form = document.getElementById('billingForm');
    if (!form) return;
    form.onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('billId').value;
        const bulan = document.getElementById('billBulan').value;
        if (mockRiwayatPembayaran.some(p => p.idPelanggan === id && p.bulan === bulan)) {
            tampilkanAlert("Pelanggan ini sudah bayar untuk bulan tersebut!");
            return;
        }
        mockRiwayatPembayaran.push({
            idPelanggan: id,
            nama: document.getElementById('billNama').value,
            paket: document.getElementById('billPaket').value,
            jumlah: parseInt(document.getElementById('billNominal').value),
            metode: document.getElementById('billMetode').value,
            status: 'Lunas',
            bulan: bulan
        });
        tampilkanAlert("Pembayaran Berhasil!");
        form.reset();
        document.getElementById('billHarga').innerText = 'Rp 0';
    };
}

// ==========================================
// 3. RENDER TABEL DATA PEMBAYARAN
// ==========================================
export function renderDataPembayaranTable(filterLokasi = 'OPERATOR') {
    currentKampungBayar = filterLokasi;
    const container = document.getElementById('mainContentArea');
    if (!container) return;

    container.innerHTML = `
        <h2 class="page-title">
            DATA PEMBAYARAN ${currentKampungBayar !== 'OPERATOR' ? '- ' + currentKampungBayar : 'GLOBAL'}
        </h2>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1px;">
            
            <button id="btnExportPembayaran" 
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

        <div class="table-actions" style="display: flex; justify-content: space-between; margin-bottom: 1px;">
            <div>
                <select id="payLimit" class="table-limit" style="padding: 5px;">
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                </select>
            </div>

            <div>
                <select id="payBulanFilter" class="table-limit" style="padding: 5px 15px;">
                    <option value="Semua">Semua Bulan</option>
                    ${daftarBulan.map(b => `<option value="${b}">${b}</option>`).join('')}
                </select>
            </div>
        </div>

        <div class="table-container">
            <table id="tabelPembayaran" class="data-table">
                <thead>
                    <tr style="background-color:#00B050; color: white;">
                        <th>No</th>
                        <th>ID Pelanggan</th>
                        <th>Nama</th>
                        <th>Paket</th>
                        <th>Jumlah</th>
                        <th>Metode</th>
                        <th>Bulan</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody id="pembayaranTableBody"></tbody>
            </table>
        </div>

        <div class="table-pagination" style="display: flex; justify-content: flex-end; margin-top: 15px;">
            <div class="pagination-buttons" id="paginationBayar"></div>
        </div>
    `;

    // Pasang event listener untuk tombol export
    const btnExportPembayaran = document.getElementById('btnExportPembayaran');
    if (btnExportPembayaran) {
        btnExportPembayaran.addEventListener('click', () => {
            const tgl = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
            eksporTabelKeExcel('tabelPembayaran', `Data_Pembayaran_${currentKampungBayar}_${tgl}`);
        });
    }

    document.getElementById('payLimit').value = rowsPerPageBayar;
    document.getElementById('payBulanFilter').value = filterBulanBayar;

    document.getElementById('payLimit').addEventListener('change', (e) => {
        rowsPerPageBayar = parseInt(e.target.value);
        currentPageBayar = 1; 
        loadTableDataBayar();
    });

    document.getElementById('payBulanFilter').addEventListener('change', (e) => {
        filterBulanBayar = e.target.value;
        currentPageBayar = 1; 
        loadTableDataBayar();
    });

    loadTableDataBayar();
}

function loadTableDataBayar() {
    const tbody = document.getElementById('pembayaranTableBody');
    const paginationContainer = document.getElementById('paginationBayar');
    if (!tbody) return;
    
    // --- 1. Logika Filter Kampung & Bulan ---
    let dataTerfilter = mockRiwayatPembayaran;
    
    if (currentKampungBayar !== 'OPERATOR') {
        const pelangganSesuai = mockDataPelanggan.filter(p => p.alamat && p.alamat.toUpperCase().includes(currentKampungBayar.toUpperCase()));
        const idSesuai = pelangganSesuai.map(p => p.id || p.idPelanggan);
        dataTerfilter = mockRiwayatPembayaran.filter(b => idSesuai.includes(b.idPelanggan));
    }

    if (filterBulanBayar !== 'Semua') {
        dataTerfilter = dataTerfilter.filter(p => p.bulan === filterBulanBayar);
    }
    
    // 2. Logika Pagination
    const totalData = dataTerfilter.length;
    const totalPages = Math.ceil(totalData / rowsPerPageBayar);
    const startIdx = (currentPageBayar - 1) * rowsPerPageBayar;
    const paginatedData = dataTerfilter.slice(startIdx, startIdx + rowsPerPageBayar);

    // 3. Render Baris Tabel
    if (paginatedData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 15px;">Tidak ada data pembayaran untuk kriteria ini.</td></tr>`;
    } else {
        tbody.innerHTML = paginatedData.map((p, i) => `
            <tr>
                <td style="text-align:center;">${startIdx + i + 1}</td>
                <td>${p.idPelanggan}</td>
                <td>${p.nama}</td>
                <td style="text-align:center;">${p.paket}</td>
                <td style="text-align:right;">Rp ${p.jumlah.toLocaleString('id-ID')}</td>
                <td style="text-align:center;">${p.metode}</td>
                <td style="text-align:center;">${p.bulan}</td>
                <td style="text-align:center; color:green; font-weight:bold;">${p.status}</td>
            </tr>
        `).join('');
    }

    // 4. Render Tombol Pagination
    let paginationHtml = `<button onclick="ubahHalamanBayar(${currentPageBayar - 1})" ${currentPageBayar === 1 ? 'disabled' : ''} style="margin-right:5px; cursor:pointer;">Prev</button>`;
    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `<button class="${i === currentPageBayar ? 'active' : ''}" onclick="ubahHalamanBayar(${i})" style="margin-right:5px; cursor:pointer; ${i === currentPageBayar ? 'background:#FFC000; font-weight:bold;' : ''}">${i}</button>`;
    }
    paginationHtml += `<button onclick="ubahHalamanBayar(${currentPageBayar + 1})" ${currentPageBayar === totalPages || totalPages === 0 ? 'disabled' : ''} style="cursor:pointer;">Next</button>`;
    
    paginationContainer.innerHTML = paginationHtml;
}

window.ubahHalamanBayar = function(newPage) {
    currentPageBayar = newPage;
    loadTableDataBayar();
};

window.ubahHalamanBayar = function(newPage) {
    currentPageBayar = newPage;
    loadTableDataBayar();
};