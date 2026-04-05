// ==========================================
// 1. IMPORTS (Wajib di baris paling atas)
// ==========================================
import { generateIDPelanggan, tampilkanAlert } from './utils.js';
import { eksporTabelKeExcel } from './utils.js';
import { ambilDataPelanggan, simpanDataPelanggan, updateDataPelanggan, deleteDataPelanggan } from './api.js';
import { renderDashboard } from './dashboard.js';

// ==========================================
// 2. VARIABEL STATE GLOBAL
// ==========================================
let currentPagePelanggan = 1;
let rowsPerPagePelanggan = 5; 
let currentKampungPelanggan = 'OPERATOR'; // <-- Ini penawar errornya!
let currentDataPelanggan = []; // ✅ Tambah: simpan data pelanggan terakhir yang di-load

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

    // Loading state
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px;">⏳ Sedang mengambil data...</td></tr>`;

    // Fetch data dari API
    (async () => {
        try {
            console.log(`📥 Fetch data untuk kampung: ${currentKampungPelanggan}`);
            
            const dataAPI = await ambilDataPelanggan(currentKampungPelanggan);
            
            console.log("🔍 DEBUG - Raw dataAPI:", dataAPI);
            console.log("🔍 DEBUG - Type:", typeof dataAPI);
            console.log("🔍 DEBUG - Is Array:", Array.isArray(dataAPI));
            
            if (!dataAPI || dataAPI === null) {
                console.warn("⚠️ API mengembalikan null, gunakan mock data sebagai fallback");
                loadPelangganDataWithMock();
                return;
            }

            if (!Array.isArray(dataAPI)) {
                console.warn("⚠️ Data API bukan array, mencoba parse...", dataAPI);
                // Coba parse jika string
                if (typeof dataAPI === 'string') {
                    try {
                        const parsed = JSON.parse(dataAPI);
                        console.log("✅ Berhasil parse string ke object:", parsed);
                        if (Array.isArray(parsed)) {
                            currentDataPelanggan = parsed; // ✅ Simpan ke global
                            renderTableWithData(parsed, tbody, paginationContainer);
                            return;
                        }
                    } catch (e) {
                        console.error("❌ Gagal parse string:", e);
                    }
                }
                loadPelangganDataWithMock();
                return;
            }

            console.log(`✅ Data dari API (${dataAPI.length} records):`, dataAPI);
            
            // Debug struktur field
            if (dataAPI.length > 0) {
                console.log("🔍 DEBUG - Struktur record pertama:", dataAPI[0]);
                console.log("🔍 DEBUG - Field-field yang ada:", Object.keys(dataAPI[0]));
            }
            
            currentDataPelanggan = dataAPI; // ✅ Simpan data ke global variable
            renderTableWithData(dataAPI, tbody, paginationContainer);

        } catch (error) {
            console.error("❌ Error saat load data pelanggan:", error);
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Error: ${error.message}</td></tr>`;
            loadPelangganDataWithMock();
        }
    })();
}

// Fallback ke data kosong jika API error
function loadPelangganDataWithMock() {
    const tbody = document.getElementById('pelangganTableBody');
    const paginationContainer = document.getElementById('paginationPelanggan');
    if (!tbody) return;

    console.log("📋 Tidak dapat mengambil data pelanggan dari API, menampilkan data kosong sebagai fallback");

    // --- LOGIKA FILTER KAMPUNG ---
    let dataTampil = [];

    currentDataPelanggan = dataTampil; // ✅ Simpan data kosong

    // --- LOGIKA PAGINATION ---
    const totalData = dataTampil.length; 
    const totalPages = Math.ceil(totalData / rowsPerPagePelanggan);
    const startIdx = (currentPagePelanggan - 1) * rowsPerPagePelanggan;
    const paginatedData = dataTampil.slice(startIdx, startIdx + rowsPerPagePelanggan); 

    // Render Baris Tabel
    tbody.innerHTML = paginatedData.map((p, index) => {
        const idAman = p.id || p.idPelanggan || ''; 

        return `
            <tr style="background-color: #ffffcc;">
                <td style="text-align:center;">${startIdx + index + 1}</td>
                <td>${idAman || '-'}</td>
                <td>${p.nama}</td>
                <td>${p.noHp}</td>
                <td style="text-align:center;">${p.paket}</td>
                <td>${p.alamat}</td>
                
                <td class="table-aksi" style="text-align:center; min-width: 120px;">
                    <button class="btn-aksi-hapus" onclick="confirmDelete('${idAman}')" style="background:red; color:white; padding:5px 10px; border:1px solid #000; cursor:pointer; margin-right:5px;">Hapus</button>
                    <button class="btn-aksi-edit" onclick="editPelanggan('${idAman}')" style="background:#FFC000; padding:5px 10px; border:1px solid #000; cursor:pointer;">Edit</button>
                </td>
            </tr>
        `;
    }).join('');

    if (paginatedData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Tidak ada data pelanggan (menggunakan mock data)</td></tr>`;
    }

    // Render Tombol Pagination
    let paginationHtml = `<button onclick="ubahHalamanPelanggan(${currentPagePelanggan - 1})" ${currentPagePelanggan === 1 ? 'disabled' : ''} style="margin-right:5px; cursor:pointer;">Prev</button>`;
    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `<button class="${i === currentPagePelanggan ? 'active' : ''}" onclick="ubahHalamanPelanggan(${i})" style="margin-right:5px; cursor:pointer; ${i === currentPagePelanggan ? 'background:#FFC000; font-weight:bold;' : ''}">${i}</button>`;
    }
    paginationHtml += `<button onclick="ubahHalamanPelanggan(${currentPagePelanggan + 1})" ${currentPagePelanggan === totalPages || totalPages === 0 ? 'disabled' : ''} style="cursor:pointer;">Next</button>`;
    
    paginationContainer.innerHTML = paginationHtml;
}

// ==========================================
// HELPER: Render Table dengan Smart Field Mapping
// ==========================================
function renderTableWithData(dataArray, tbody, paginationContainer) {
    console.log("🎨 Render table dengan data API...");
    
    // --- LOGIKA PAGINATION ---
    const totalData = dataArray.length; 
    const totalPages = Math.ceil(totalData / rowsPerPagePelanggan);
    const startIdx = (currentPagePelanggan - 1) * rowsPerPagePelanggan;
    const paginatedData = dataArray.slice(startIdx, startIdx + rowsPerPagePelanggan);

    console.log(`📊 Total: ${totalData}, Page: ${currentPagePelanggan}, Rows: ${paginatedData.length}`);

    // Render Baris Tabel
    tbody.innerHTML = paginatedData.map((p, index) => {
        // Smart field mapping - coba berbagai nama field
        const getId = () => p.id || p.idPelanggan || p.ID_PELANGGAN || '';
        const getNama = () => p.nama || p.Nama || p.NAMA || '';
        const getNoHp = () => p.noHp || p.no_hp || p.No_HP || p.telepon || '';
        const getPaket = () => p.paket || p.Paket || p.PAKET || '';
        const getHarga = () => Number(p.harga || p.Harga || p.HARGA || 0);
        const getAlamat = () => p.alamat || p.Alamat || p.ALAMAT || '';
        
        const id = getId();
        const nama = getNama();
        const noHp = getNoHp();
        const paket = getPaket();
        const alamat = getAlamat();
        
        console.log(`  Row ${index + 1}:`, { id, nama, noHp, paket, alamat });

        return `
            <tr>
                <td style="text-align:center;">${startIdx + index + 1}</td>
                <td>${id || '-'}</td>
                <td>${nama || '-'}</td>
                <td>${noHp || '-'}</td>
                <td style="text-align:center;">${paket || '-'}</td>
                <td>${alamat || '-'}</td>
                
                <td class="table-aksi" style="text-align:center; min-width: 120px;">
                    <button class="btn-aksi-hapus" onclick="confirmDelete('${id}')" style="background:red; color:white; padding:5px 10px; border:1px solid #000; cursor:pointer; margin-right:5px;">Hapus</button>
                    <button class="btn-aksi-edit" onclick="editPelanggan('${id}')" style="background:#FFC000; padding:5px 10px; border:1px solid #000; cursor:pointer;">Edit</button>
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
    
    console.log("✅ Render selesai!");
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

    // ✅ Hitung noUrut berdasarkan data yang sudah ada
    const noUrut = isEdit ? 1 : (currentDataPelanggan.length + 1);
    const generatedID = isEdit ? (dataEdit.id || dataEdit.idPelanggan) : generateIDPelanggan(namaKampungDefault, noUrut);

    container.innerHTML = `
        <div class="form-wrapper">
            <div class="form-container">
                <h2 class="form-title">${judul}</h2>
                <div class="input-search-group">
                    <input type="text" placeholder="Cari..." class="input-field input-search">
                    <button class="btn-cari">Cari</button>
                </div>
                <form id="pelangganForm">
                    <input type="hidden" name="isEdit" value="${isEdit ? 'true' : 'false'}">
                    <input type="hidden" name="originalId" value="${isEdit ? (dataEdit.id || dataEdit.idPelanggan) : ''}">
                    <div class="form-group">
                        <label>ID Pelanggan :</label>
                        <input type="text" name="idPelanggan" class="input-field" value="${generatedID}" readonly>
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

    document.getElementById('pelangganForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        const hargaVal = parseInt(data.hargaPaket) || 0;
        const isEdit = data.isEdit === 'true';

        // Siapkan data untuk dikirim ke Google Sheets
        const dataPelanggan = {
            idPelanggan: data.idPelanggan,
            nama: data.nama,
            alamat: data.alamat,
            kampung: namaKampungDefault || currentKampungPelanggan || 'OPERATOR',
            paket: data.paket,
            harga: hargaVal,
            noHp: data.noHp || '',
            email: data.email || '',
            status: 'Aktif'
        };

        try {
            console.log(`${isEdit ? '📝' : '📤'} Mengirim data pelanggan:`, dataPelanggan);

            let result;
            if (isEdit) {
                // Mode EDIT: Update data existing
                try {
                    result = await updateDataPelanggan(dataPelanggan);
                } catch (apiError) {
                    console.warn("⚠️ API gagal, mencoba fallback ke local update...", apiError.message);
                    
                    // Fallback: Update local mock data sementara
                    result = handleLocalUpdateFallback(dataPelanggan);
                    
                    if (result && result.success) {
                        console.log("✅ Data diupdate di local (fallback):", result);
                        tampilkanAlert(
                            `Data Diupdate Lokal (API tidak dapat dijangkau)\n\n💡 Catatan: Pastikan Google Apps Script deployment URL valid dan koneksi internet stabil.`,
                            'sukses',
                            () => {
                                renderDataPelangganTable(currentKampungPelanggan);
                                renderDashboard(currentKampungPelanggan);
                            }
                        );
                        return;
                    }
                    throw apiError;
                }
            } else {
                // Mode CREATE: Simpan data baru
                try {
                    result = await simpanDataPelanggan(dataPelanggan);
                } catch (apiError) {
                    console.warn("⚠️ API gagal, mencoba fallback ke local save...", apiError.message);
                    
                    // Fallback: Simpan ke local mock data
                    result = handleLocalSaveFallback(dataPelanggan);
                    
                    if (result && result.success) {
                        console.log("✅ Data disimpan di local (fallback):", result);
                        tampilkanAlert(
                            `Data Disimpan Lokal (API tidak dapat dijangkau)\n\n💡 Catatan: Pastikan Google Apps Script deployment URL valid dan koneksi internet stabil.`,
                            'sukses',
                            () => {
                                renderDataPelangganTable(currentKampungPelanggan);
                                renderDashboard(currentKampungPelanggan);
                            }
                        );
                        return;
                    }
                    throw apiError;
                }
            }

            if (result && result.success) {
                console.log(`✅ Data pelanggan berhasil ${isEdit ? 'diupdate' : 'disimpan'}:`, result);
                tampilkanAlert(`Data Pelanggan Berhasil ${isEdit ? 'Diupdate' : 'Disimpan'}!`, 'sukses', () => {
                    renderDataPelangganTable(currentKampungPelanggan);
                    renderDashboard(currentKampungPelanggan);
                });
            } else {
                console.error(`❌ Gagal ${isEdit ? 'update' : 'simpan'} data pelanggan:`, result);
                tampilkanAlert(`Gagal ${isEdit ? 'mengupdate' : 'menyimpan'} data pelanggan: ` + (result?.message || "Unknown error"), 'gagal');
            }

        } catch (error) {
            console.error(`❌ Error saat ${isEdit ? 'mengupdate' : 'menyimpan'} data pelanggan:`, error);
            
            // Tampilkan pesan error yang lebih detail dan helpful
            let pesan = error.message || "Terjadi kesalahan yang tidak diketahui";
            if (error.message.includes('Failed to fetch')) {
                pesan = "Koneksi ke API gagal. Kemungkinan penyebab:\n" +
                       "• Google Apps Script URL tidak valid atau sudah expired\n" +
                       "• Koneksi internet tidak stabil\n" +
                       "• CORS issue - pastikan GAS sudah di-redeploy\n\n" +
                       "Solusi: Silakan cek console browser (F12) untuk detail lebih lanjut.";
            }
            
            tampilkanAlert(pesan, 'gagal');
        }
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
        renderDashboard(currentKampungPelanggan);
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
        async () => {
            // --- KODE DI BAWAH INI HANYA JALAN JIKA KLIK "YA" ---
            try {
                console.log("🗑️ Menghapus pelanggan ID:", id, "dari kampung:", currentKampungPelanggan);

                // Hapus dari Google Sheets via API
                const result = await deleteDataPelanggan(id, currentKampungPelanggan);

                if (result && result.success) {
                    console.log("✅ Data pelanggan berhasil dihapus:", result);

                    // Refresh tabel setelah berhasil hapus
                    tampilkanAlert(`Selesai! Data pelanggan ID ${id} telah dihapus.`, 'sukses', () => {
                        renderDataPelangganTable(currentKampungPelanggan);
                        renderDashboard(currentKampungPelanggan);
                    });
                } else {
                    console.error("❌ Gagal hapus data pelanggan:", result);
                    tampilkanAlert("Gagal menghapus data pelanggan: " + (result?.message || "Unknown error"), 'gagal');
                }

            } catch (error) {
                console.error("❌ Error saat menghapus data pelanggan:", error);
                tampilkanAlert("Terjadi kesalahan: " + error.message, 'gagal');
            }
        }
    );
};

window.editPelanggan = function(id) {
    console.log("✏️ Edit pelanggan ID:", id);
    console.log("📊 Current data:", currentDataPelanggan);

    const dataEdit = currentDataPelanggan.find(p => p.id === id || p.idPelanggan === id);

    if(dataEdit) {
        console.log("✅ Data ditemukan untuk edit:", dataEdit);
        renderInputDataForm(currentKampungPelanggan, dataEdit);
    } else {
        console.error("❌ Data pelanggan tidak ditemukan untuk ID:", id);
        tampilkanAlert('Error: Data pelanggan tidak ditemukan untuk diedit.', 'gagal');
    }
};

// ==========================================
// 6. FUNGSI FALLBACK UNTUK LOCAL UPDATE
// ==========================================
/**
 * Fallback: Update data pelanggan lokal (mock data)
 * Dijalankan ketika API Google Sheets tidak dapat dijangkau
 */
function handleLocalUpdateFallback(dataPelanggan) {
    try {
        console.log("💾 Fallback: Updating data pelanggan lokal...", dataPelanggan);

        const idPelanggan = dataPelanggan.idPelanggan;
        
        // Cari index data yang akan diupdate
        const indexUpdate = currentDataPelanggan.findIndex(p => 
            p.id === idPelanggan || p.idPelanggan === idPelanggan
        );

        if (indexUpdate === -1) {
            console.error("❌ Data tidak ditemukan di local:", idPelanggan);
            return { success: false, message: "Data tidak ditemukan di local storage" };
        }

        // Update data di mock array
        currentDataPelanggan[indexUpdate] = {
            ...currentDataPelanggan[indexUpdate],
            ...dataPelanggan
        };

        console.log("✅ Data berhasil diupdate di local:", currentDataPelanggan[indexUpdate]);
        
        return {
            success: true,
            message: "Data diupdate di local storage",
            data: currentDataPelanggan[indexUpdate]
        };

    } catch (error) {
        console.error("❌ Fallback update gagal:", error);
        return { success: false, message: error.message };
    }
}

/**
 * Fallback: Simpan data pelanggan baru ke local (mock data)
 * Dijalankan ketika API Google Sheets tidak dapat dijangkau
 */
function handleLocalSaveFallback(dataPelanggan) {
    try {
        console.log("💾 Fallback: Saving data pelanggan ke local...", dataPelanggan);

        // Cek apakah data sudah ada
        const exists = currentDataPelanggan.some(p => 
            p.id === dataPelanggan.idPelanggan || p.idPelanggan === dataPelanggan.idPelanggan
        );

        if (exists) {
            console.warn("⚠️ Data dengan ID " + dataPelanggan.idPelanggan + " sudah ada");
            return { success: false, message: "Data dengan ID ini sudah ada di local storage" };
        }

        // Tambah data baru ke mock array
        const newData = {
            id: dataPelanggan.idPelanggan,
            idPelanggan: dataPelanggan.idPelanggan,
            nama: dataPelanggan.nama,
            alamat: dataPelanggan.alamat,
            kampung: dataPelanggan.kampung,
            paket: dataPelanggan.paket,
            harga: dataPelanggan.harga,
            noHp: dataPelanggan.noHp,
            email: dataPelanggan.email,
            status: dataPelanggan.status || 'Aktif'
        };

        currentDataPelanggan.push(newData);
        
        console.log("✅ Data berhasil disimpan di local:", newData);
        console.log("📊 Total data lokal sekarang:", currentDataPelanggan.length);

        return {
            success: true,
            message: "Data disimpan di local storage",
            data: newData
        };

    } catch (error) {
        console.error("❌ Fallback save gagal:", error);
        return { success: false, message: error.message };
    }
}