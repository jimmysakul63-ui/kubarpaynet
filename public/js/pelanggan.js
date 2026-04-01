// ==========================================
// 1. IMPORTS (Wajib di baris paling atas)
// ==========================================
import { mockDataPelanggan, mockRiwayatPembayaran } from './pembayaran.js';
import { generateIDPelanggan, tampilkanAlert } from './utils.js';
import { eksporTabelKeExcel } from './utils.js';

// ==========================================
// 2. VARIABEL STATE GLOBAL
// ==========================================
let currentPagePelanggan = 1;
let rowsPerPagePelanggan = 5; 
let currentKampungPelanggan = 'OPERATOR'; // <-- Ini penawar errornya!

// Konfigurasi Harga Paket
const PRICING_CONFIG = {
    'PAKET A': 250000,
    'PAKET B': 300000,
    'PAKET C': 350000,
    'PAKET D': 400000,
    'PAKET E': 450000
};

// ==========================================
// 3. FUNGSI RENDER TABEL PELANGGAN
// ==========================================
export function renderDataPelangganTable(filterLokasi = 'OPERATOR') {
    currentKampungPelanggan = filterLokasi; // Simpan lokasi yang dipilih
    
    const container = document.getElementById('mainContentArea');
    if (!container) return;

    container.innerHTML = `
        <h2 class="page-title">
            DATA PELANGGAN ${currentKampungPelanggan !== 'OPERATOR' ? '- ' + currentKampungPelanggan : 'GLOBAL'}
        </h2>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1px;">
            
            <button id="btnExportPelanggan"
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

        <div class="table-actions" style="display: flex; justify-content: flex-end; margin-bottom: 1px;">
            <div>
                <select id="payLimit" class="table-limit" style="padding: 5px;">
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                </select>
            </div>
        </div>

        <div class="table-container">
            <table id="tabelPelanggan" class="data-table">
                <thead>
                    <tr style="background-color:#00B050; color: white; border: 2px solid #000;">
                        <th width="5%" style="padding: 10px;">No</th>
                        <th width="15%">ID Pelanggan</th>
                        <th width="20%">Nama</th>
                        <th width="15%">No HP</th>
                        <th width="10%">Paket</th>
                        <th width="15%">Harga</th>
                        <th width="20%">Alamat</th>
                        <th width="10%">Aksi</th>
                    </tr>
                </thead>
                <tbody id="pelangganTableBody"></tbody>
            </table>
        </div>

        <div class="table-pagination" style="display: flex; justify-content: flex-end; margin-top: 15px;">
            <div class="pagination-buttons" id="paginationPelanggan"></div>
        </div>
    `;

    // INI DIA PERBAIKANNYA! (Ganti kampungAktif jadi currentKampungPelanggan)
    const btnExportPelanggan = document.getElementById('btnExportPelanggan');
    if (btnExportPelanggan) {
        btnExportPelanggan.addEventListener('click', () => {
            const tgl = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
            eksporTabelKeExcel('tabelPelanggan', `Data_Pelanggan_${currentKampungPelanggan}_${tgl}`);
        });
    }

    loadPelangganData();
}

function loadPelangganData() {
    const tbody = document.getElementById('pelangganTableBody');
    const paginationContainer = document.getElementById('paginationPelanggan');
    if (!tbody) return;

    // --- LOGIKA FILTER KAMPUNG ---
    let dataTampil = mockDataPelanggan;
    if (currentKampungPelanggan !== 'OPERATOR') {
        dataTampil = mockDataPelanggan.filter(p => p.alamat && p.alamat.toUpperCase().includes(currentKampungPelanggan));
    }

    // --- LOGIKA PAGINATION ---
    const totalData = dataTampil.length; 
    const totalPages = Math.ceil(totalData / rowsPerPagePelanggan);
    const startIdx = (currentPagePelanggan - 1) * rowsPerPagePelanggan;
    const paginatedData = dataTampil.slice(startIdx, startIdx + rowsPerPagePelanggan); 

    // Render Baris Tabel
    tbody.innerHTML = paginatedData.map((p, index) => {
        const displayHarga = Number(p.harga) || 0;
        const idAman = p.id || p.idPelanggan || ''; 

        return `
            <tr>
                <td style="text-align:center;">${startIdx + index + 1}</td>
                <td>${idAman || '-'}</td>
                <td>${p.nama}</td>
                <td>${p.noHp}</td>
                <td style="text-align:center;">${p.paket}</td>
                <td style="text-align:right;">Rp ${displayHarga.toLocaleString('id-ID')}</td>
                <td>${p.alamat}</td>
                
                <td class="table-aksi" style="text-align:center; min-width: 120px;">
                    <button class="btn-aksi-hapus" onclick="confirmDelete('${idAman}')" style="background:red; color:white; padding:5px 10px; border:1px solid #000; cursor:pointer; margin-right:5px;">Hapus</button>
                    <button class="btn-aksi-edit" onclick="editPelanggan('${idAman}')" style="background:#FFC000; padding:5px 10px; border:1px solid #000; cursor:pointer;">Edit</button>
                </td>
            </tr>
        `;
    }).join('');

    if (paginatedData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Tidak ada data pelanggan</td></tr>`;
    }

    // Render Tombol Pagination
    let paginationHtml = `<button onclick="ubahHalamanPelanggan(${currentPagePelanggan - 1})" ${currentPagePelanggan === 1 ? 'disabled' : ''} style="margin-right:5px; cursor:pointer;">Prev</button>`;
    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `<button class="${i === currentPagePelanggan ? 'active' : ''}" onclick="ubahHalamanPelanggan(${i})" style="margin-right:5px; cursor:pointer; ${i === currentPagePelanggan ? 'background:#FFC000; font-weight:bold;' : ''}">${i}</button>`;
    }
    paginationHtml += `<button onclick="ubahHalamanPelanggan(${currentPagePelanggan + 1})" ${currentPagePelanggan === totalPages || totalPages === 0 ? 'disabled' : ''} style="cursor:pointer;">Next</button>`;
    
    paginationContainer.innerHTML = paginationHtml;
}

// Fungsi global untuk mengubah halaman
window.ubahHalamanPelanggan = function(newPage) {
    currentPagePelanggan = newPage;
    loadPelangganData();
};


// ==========================================
// 4. FUNGSI FORM INPUT & EDIT DATA
// ==========================================
export function renderInputDataForm(namaKampungDefault = '', dataEdit = null) {
    const container = document.getElementById('mainContentArea');
    if (!container) return;

    const isEdit = dataEdit !== null;
    const judul = isEdit ? 'EDIT DATA' : 'INPUT DATA';

    container.innerHTML = `
        <div class="form-wrapper">
            <div class="form-container">
                <h2 class="form-title">${judul}</h2>
                <div class="input-search-group">
                    <input type="text" placeholder="Cari..." class="input-field input-search">
                    <button class="btn-cari">Cari</button>
                </div>
                <form id="pelangganForm">
                    <div class="form-group">
                        <label>ID Pelanggan :</label>
                        <input type="text" name="idPelanggan" class="input-field" value="${isEdit ? (dataEdit.id || dataEdit.idPelanggan) : generateIDPelanggan(namaKampungDefault, 1)}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Nama :</label>
                        <input type="text" name="nama" class="input-field" value="${isEdit ? dataEdit.nama : ''}" required>
                    </div>
                    <div class="form-group">
                        <label>No HP :</label>
                        <input type="text" name="noHp" class="input-field" value="${isEdit ? dataEdit.noHp : ''}">
                    </div>
                    <div class="form-group">
                        <label>Paket :</label>
                        <select name="paket" id="paketSelect" class="input-field select-field">
                            ${Object.keys(PRICING_CONFIG).map(pkt => `
                                <option value="${pkt}" data-harga="${PRICING_CONFIG[pkt]}" 
                                    ${isEdit && dataEdit.paket === pkt ? 'selected' : (pkt === 'PAKET B' ? 'selected' : '')}>
                                    ${pkt} - Rp ${PRICING_CONFIG[pkt].toLocaleString('id-ID')}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Alamat :</label>
                        <input type="text" name="alamat" class="input-field" value="${isEdit ? dataEdit.alamat : ''}" required>
                    </div>
                    <input type="hidden" name="hargaPaket" id="hargaPaket" value="${isEdit ? dataEdit.harga : PRICING_CONFIG['PAKET B']}">

                    <div class="form-actions">
                        <button type="submit" class="btn-simpan">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('paketSelect').addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        document.getElementById('hargaPaket').value = selectedOption.getAttribute('data-harga');
    });

    document.getElementById('pelangganForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        const hargaVal = parseInt(data.hargaPaket) || 0;

        if (isEdit) {
            const index = mockDataPelanggan.findIndex(p => p.id === dataEdit.id || p.idPelanggan === dataEdit.id);
            if (index !== -1) {
                mockDataPelanggan[index].nama = data.nama;
                mockDataPelanggan[index].noHp = data.noHp;
                mockDataPelanggan[index].paket = data.paket;
                mockDataPelanggan[index].harga = hargaVal;
                mockDataPelanggan[index].alamat = data.alamat;
            }
        } else {
            mockDataPelanggan.push({
                id: data.idPelanggan,
                nama: data.nama,
                noHp: data.noHp,
                paket: data.paket,
                harga: hargaVal,
                alamat: data.alamat
            });
        }

        // Di dalam submit form pelanggan
        tampilkanAlert(isEdit ? "Data Berhasil Diperbarui!" : "Data Pelanggan Baru Berhasil Disimpan!", 'sukses', () => {
        renderDataPelangganTable(currentKampungPelanggan);
        });
    });
}

function showSuccessMessage(pesan) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'custom-alert-overlay';
    alertDiv.innerHTML = `
        <div class="custom-alert-box">
            <div class="alert-text">${pesan}</div>
            <button class="btn-alert-ok" id="closeAlert">OK</button>
        </div>
    `;
    document.body.appendChild(alertDiv);
    document.getElementById('closeAlert').addEventListener('click', () => {
        alertDiv.remove();
        renderDataPelangganTable(currentKampungPelanggan); // Kembali ke tabel dengan mempertahankan filter kampung
    });
}

// ==========================================
// 5. FUNGSI AKSI GLOBAL (HAPUS & EDIT)
// ==========================================
window.confirmDelete = function(id) {
    // 1. Panggil alert dengan tipe 'konfirmasi'
    // 2. Semua proses hapus dimasukkan ke dalam function() { ... } (Callback)
    tampilkanAlert(
        `YAKIN? Menghapus pelanggan ID ${id} juga akan menghapus SEMUA data riwayat pembayarannya!`, 
        'konfirmasi', 
        () => {
            // --- KODE DI BAWAH INI HANYA JALAN JIKA KLIK "YA" ---
            const indexPelanggan = mockDataPelanggan.findIndex(p => p.id === id || p.idPelanggan === id);
            
            if(indexPelanggan !== -1) {
                const namaDihapus = mockDataPelanggan[indexPelanggan].nama;
                
                // Proses Hapus Data Pelanggan
                mockDataPelanggan.splice(indexPelanggan, 1); 
                
                // Proses Hapus Riwayat Pembayaran Pelanggan Terkait
                for (let i = mockRiwayatPembayaran.length - 1; i >= 0; i--) {
                    if (mockRiwayatPembayaran[i].idPelanggan === id) {
                        mockRiwayatPembayaran.splice(i, 1); 
                    }
                }

                // Setelah berhasil hapus, beri tahu user dengan alert sukses
                tampilkanAlert(`Selesai! Data ${namaDihapus} telah dibersihkan.`, 'sukses', () => {
                    loadPelangganData(); // Refresh tabel setelah klik OK
                }); 

            } else {
                // Jika data tidak ketemu (jarang terjadi tapi buat jaga-jaga)
                tampilkanAlert('Error: Data tidak ditemukan!', 'gagal');
            }
        }
    );
};

window.editPelanggan = function(id) {
    const dataEdit = mockDataPelanggan.find(p => p.id === id || p.idPelanggan === id);
    if(dataEdit) {
        renderInputDataForm('', dataEdit); 
    } else {
        tampilkanAlert('Error: Data pelanggan tidak ditemukan untuk diedit.');
    }
};