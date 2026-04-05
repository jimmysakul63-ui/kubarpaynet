// ==========================================
// PEMBAYARAN (sinkron ke GAS)
// ==========================================
import { eksporTabelKeExcel, tampilkanAlert } from './utils.js';
import { ambilDataPelanggan, ambilDataPembayaran, simpanDataPembayaran } from './api.js';

const daftarBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

let currentPageBayar = 1;
let rowsPerPageBayar = 5;
let filterBulanBayar = 'Semua';
let currentKampungBayar = 'OPERATOR';
let currentDataPelanggan = [];
let currentRiwayatPembayaran = [];
// ==========================================
// 2. RENDER FORM BILLING
// ==========================================
export async function renderBillingForm() {
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

    await loadPelangganForBilling(currentKampungBayar);
    setupAutocomplete();
    setupFormSubmission();
}

async function loadPelangganForBilling(kampung = 'OPERATOR') {
    try {
        const data = await ambilDataPelanggan(kampung);
        currentDataPelanggan = Array.isArray(data) ? data : [];
    } catch (error) {
        currentDataPelanggan = [];
        console.error('Gagal mengambil data pelanggan untuk billing:', error);
    }
}


function setupAutocomplete() {
    const input = document.getElementById('inputCariPelanggan');
    const list = document.getElementById('autocomplete-list');
    if (!input || !list) return;

    input.addEventListener('input', function () {
        list.innerHTML = '';
        const val = this.value.toLowerCase();
        if (!val) return;

        const matches = currentDataPelanggan.filter(p => {
            const id = (p.id || p.idPelanggan || '').toString().toLowerCase();
            const nama = (p.nama || '').toString().toLowerCase();
            return id.includes(val) || nama.includes(val);
        });

        matches.forEach(match => {
            const item = document.createElement('div');
            item.className = 'autocomplete-suggestion';
            item.innerHTML = `<strong>${match.id || match.idPelanggan || ''}</strong> - ${match.nama || ''}`;

            item.onclick = () => {
                input.value = match.id || match.idPelanggan || '';
                list.innerHTML = '';

                document.getElementById('billId').value = match.id || match.idPelanggan || '';
                document.getElementById('billNama').value = match.nama || '';
                document.getElementById('billPaket').value = match.paket || '';
                const harga = Number(match.harga || match.Harga || 0);
                document.getElementById('billNominal').value = harga;
                document.getElementById('billHarga').innerText = `Rp ${harga.toLocaleString('id-ID')}`;
            };

            list.appendChild(item);
        });
    });

    document.addEventListener('click', function (e) {
        if (e.target !== input) {
            list.innerHTML = '';
        }
    });
}

function setupFormSubmission() {
    const form = document.getElementById('billingForm');
    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();

        const id = document.getElementById('billId').value.trim();
        const nama = document.getElementById('billNama').value.trim();
        const paket = document.getElementById('billPaket').value.trim();
        const jumlah = parseInt(document.getElementById('billNominal').value) || 0;
        const bulan = document.getElementById('billBulan').value;
        const metode = document.getElementById('billMetode').value;

        if (!id || !bulan) {
            tampilkanAlert('ID dan bulan harus dipilih!', 'gagal');
            return;
        }

        if (currentRiwayatPembayaran.some(p => p.idPelanggan === id && p.bulan === bulan && (p.status || '').toString().toLowerCase() === 'lunas')) {
            tampilkanAlert('Pelanggan ini sudah bayar untuk bulan tersebut!', 'gagal');
            return;
        }

        const dataBayar = {
            idPelanggan: id,
            nama: nama,
            paket: paket,
            nominal: jumlah,
            metode: metode,
            status: 'Lunas',
            bulan: bulan,
            kampung: currentKampungBayar
        };

        try {
            const result = await simpanDataPembayaran(dataBayar);
            if (result && result.success) {
        console.log('✅ Pembayaran disimpan dengan data:', dataBayar);
                tampilkanAlert('Pembayaran Berhasil!', 'sukses', async () => {
                    // Tunggu sebentar supaya GAS update sempurna
                    setTimeout(() => {
                        reloadPembayaranData();
                        renderDataPembayaranTable(currentKampungBayar);
                    }, 500);
                });

                form.reset();
                document.getElementById('billHarga').innerText = 'Rp 0';
            } else {
                throw new Error(result?.message || 'Gagal menyimpan pembayaran');
            }
        } catch (error) {
            console.warn('⚠️ Gagal menyimpan pembayaran ke server, simpan lokal:', error);

            currentRiwayatPembayaran.push({ ...dataBayar, idTrx: 'LOCAL-' + Date.now() });

            tampilkanAlert('Pembayaran tersimpan lokal. Silakan cek koneksi dan ulangi sinkronisasi.', 'peringatan', async () => {
                await reloadPembayaranData();
                renderDataPembayaranTable(currentKampungBayar);
            });

            form.reset();
            document.getElementById('billHarga').innerText = 'Rp 0';
        }
    };
}

// ==========================================
// 3. RENDER TABEL DATA PEMBAYARAN
// ==========================================
export async function renderDataPembayaranTable(filterLokasi = 'OPERATOR') {
    currentKampungBayar = filterLokasi;
    const container = document.getElementById('mainContentArea');
    if (!container) return;

    container.innerHTML = `
        <h2 class="page-title">
            DATA PEMBAYARAN ${currentKampungBayar !== 'OPERATOR' ? '- ' + currentKampungBayar : 'GLOBAL'}
        </h2>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1px;">
            <button id="btnExportPembayaran" style="background-color: #1D6F42; color: white; padding: 10px 10px; border: 2px solid #000; border-radius: 5px; cursor: pointer; font-weight: bold; box-shadow: 3px 3px 0px #000;">Export ke Excel</button>
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
                    <!-- Options akan diisi secara dinamis berdasarkan data yang ada -->
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

    const btnExportPembayaran = document.getElementById('btnExportPembayaran');
    if (btnExportPembayaran) {
        btnExportPembayaran.addEventListener('click', () => {
            const tgl = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
            eksporTabelKeExcel('tabelPembayaran', `Data_Pembayaran_${currentKampungBayar}_${tgl}`);
        });
    }

    await reloadPembayaranData();
    loadTableDataBayar();

    // Setup event listener untuk dropdown setelah DOM ready
    setTimeout(() => {
        const limitEl = document.getElementById('payLimit');
        const filterEl = document.getElementById('payBulanFilter');

        if (limitEl) {
            limitEl.value = rowsPerPageBayar;
            limitEl.addEventListener('change', (e) => {
                console.log('🔄 Rows per page diubah dari', rowsPerPageBayar, 'ke', e.target.value);
                rowsPerPageBayar = parseInt(e.target.value) || 5;
                currentPageBayar = 1;
                loadTableDataBayar();
            });
        }

        if (filterEl) {
            updateBulanDropdown();
            filterEl.value = filterBulanBayar;
            filterEl.addEventListener('change', (e) => {
                console.log('📅 Filter bulan diubah dari', filterBulanBayar, 'ke', e.target.value);
                filterBulanBayar = e.target.value;
                currentPageBayar = 1;
                loadTableDataBayar();
            });
        }
    }, 100);
}

async function reloadPembayaranData() {
    try {
        const tahun = new Date().getFullYear().toString();
        const data = await ambilDataPembayaran(currentKampungBayar, 'Semua', tahun);
        currentRiwayatPembayaran = Array.isArray(data) ? data : [];
        
        console.log('📊 Data pembayaran dimuat:', {
            kampung: currentKampungBayar,
            total: currentRiwayatPembayaran.length,
            data: currentRiwayatPembayaran
        });
        
        // Analisis detail bulan
        const bulanSummary = {};
        currentRiwayatPembayaran.forEach(p => {
            const b = p.bulan || 'KOSONG';
            bulanSummary[b] = (bulanSummary[b] || 0) + 1;
        });
        console.log('📅 Ringkasan data per bulan:', bulanSummary);
        
        // Update dropdown bulan setelah data dimuat
        updateBulanDropdown();
        
    } catch (error) {
        console.error('❌ Gagal memuat data pembayaran:', error);
        currentRiwayatPembayaran = [];
    }
}

function updateBulanDropdown() {
    const filterEl = document.getElementById('payBulanFilter');
    if (!filterEl) return;

    // Ambil semua bulan yang ada di data
    const availableBulan = [...new Set(currentRiwayatPembayaran.map(p => p.bulan).filter(b => b && b !== 'KOSONG'))];
    
    // Sort bulan sesuai urutan kalender
    const bulanOrder = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    availableBulan.sort((a, b) => bulanOrder.indexOf(a) - bulanOrder.indexOf(b));
    
    // Jika bulan yang sedang dipilih tidak lagi tersedia, reset ke "Semua"
    if (filterBulanBayar !== 'Semua' && !availableBulan.includes(filterBulanBayar)) {
        filterBulanBayar = 'Semua';
        console.log('🔄 Filter bulan direset ke "Semua" karena bulan', filterBulanBayar, 'tidak lagi tersedia');
    }
    
    // Rebuild dropdown options
    let optionsHtml = '<option value="Semua">Semua Bulan</option>';
    availableBulan.forEach(bulan => {
        optionsHtml += `<option value="${bulan}">${bulan}</option>`;
    });
    
    filterEl.innerHTML = optionsHtml;
    filterEl.value = filterBulanBayar; // Set value sesuai current filter
    
    console.log('📅 Dropdown bulan diupdate:', {
        availableBulan: availableBulan,
        currentFilter: filterBulanBayar,
        totalOptions: availableBulan.length + 1 // +1 untuk "Semua"
    });
}

function loadTableDataBayar() {
    const tbody = document.getElementById('pembayaranTableBody');
    const paginationContainer = document.getElementById('paginationBayar');
    if (!tbody || !paginationContainer) return;

    console.log('🔨 loadTableDataBayar dipanggil:', {
        currentRiwayatPembayaran: currentRiwayatPembayaran.length,
        currentKampungBayar,
        filterBulanBayar,
        currentPageBayar,
        rowsPerPageBayar
    });

    let dataTerfilter = [...currentRiwayatPembayaran];

    // Filter by kampung hanya jika bukan OPERATOR
    if (currentKampungBayar !== 'OPERATOR') {
        const kampungUpper = currentKampungBayar.toUpperCase();
        dataTerfilter = dataTerfilter.filter(p => {
            const pKampung = (p.kampung || '').toUpperCase();
            return pKampung === kampungUpper || pKampung === '';
        });
        console.log('📍 Setelah filter kampung:', dataTerfilter.length);
    }

    // Filter by bulan
    if (filterBulanBayar !== 'Semua') {
        dataTerfilter = dataTerfilter.filter(p => {
            const pBulan = (p.bulan || '').toString().trim();
            return pBulan === filterBulanBayar;
        });
        console.log('📅 Setelah filter bulan:', dataTerfilter.length);
    }

    const totalData = dataTerfilter.length;
    const totalPages = Math.max(Math.ceil(totalData / rowsPerPageBayar), 1);
    const startIdx = (currentPageBayar - 1) * rowsPerPageBayar;
    const paginatedData = dataTerfilter.slice(startIdx, startIdx + rowsPerPageBayar);

    console.log('📊 Perhitungan paginasi:', {
        totalData,
        totalPages,
        rowsPerPageBayar,
        currentPageBayar,
        startIdx,
        paginatedData: paginatedData.length
    });

    if (paginatedData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 15px;">Tidak ada data pembayaran untuk kriteria ini.</td></tr>`;
    } else {
        tbody.innerHTML = paginatedData.map((p, i) => `
            <tr>
                <td style="text-align:center;">${startIdx + i + 1}</td>
                <td>${p.idPelanggan || ''}</td>
                <td>${p.nama || ''}</td>
                <td style="text-align:center;">${p.paket || ''}</td>
                <td style="text-align:right;">Rp ${Number(p.jumlah || 0).toLocaleString('id-ID')}</td>
                <td style="text-align:center;">${p.metode || ''}</td>
                <td style="text-align:center;">${p.bulan || ''}</td>
                <td style="text-align:center; color:green; font-weight:bold;">${p.status || ''}</td>
            </tr>
        `).join('');
    }

    let paginationHtml = `<button onclick="ubahHalamanBayar(${Math.max(currentPageBayar - 1,1)})" ${currentPageBayar === 1 ? 'disabled' : ''} style="margin-right:5px; cursor:pointer;">Prev</button>`;
    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `<button class="${i === currentPageBayar ? 'active' : ''}" onclick="ubahHalamanBayar(${i})" style="margin-right:5px; cursor:pointer; ${i === currentPageBayar ? 'background:#FFC000; font-weight:bold;' : ''}">${i}</button>`;
    }
    paginationHtml += `<button onclick="ubahHalamanBayar(${Math.min(currentPageBayar + 1,totalPages)})" ${currentPageBayar === totalPages ? 'disabled' : ''} style="cursor:pointer;">Next</button>`;

    paginationContainer.innerHTML = paginationHtml;
}

window.ubahHalamanBayar = function(newPage) {
    currentPageBayar = newPage;
    loadTableDataBayar();
};

// Debug function untuk console (bisa diakses global)
window.debugPembayaran = function() {
    console.clear();
    console.log('%c🔍 DEBUG PEMBAYARAN', 'background: #FF5722; color: white; font-size: 14px; padding: 5px 10px;');
    console.log('');
    
    console.log('%cRINGKASAN DATA:', 'background: #2196F3; color: white; padding: 3px 5px;');
    console.log({
        totalData: currentRiwayatPembayaran.length,
        currentKampung: currentKampungBayar,
        currentFilter: filterBulanBayar,
        rowsPerPage: rowsPerPageBayar,
        currentPage: currentPageBayar
    });
    
    console.log('');
    console.log('%cDISTRIBUSI DATA PER BULAN:', 'background: #4CAF50; color: white; padding: 3px 5px;');
    const bulanSummary = {};
    currentRiwayatPembayaran.forEach(p => {
        const b = p.bulan || 'KOSONG';
        bulanSummary[b] = (bulanSummary[b] || 0) + 1;
    });
    console.table(bulanSummary);
    
    console.log('');
    console.log('%cSEMUA BULAN YANG TERSEDIA:', 'background: #9C27B0; color: white; padding: 3px 5px;');
    const uniqueBulan = [...new Set(currentRiwayatPembayaran.map(p => p.bulan))];
    console.log(uniqueBulan);
    
    console.log('');
    console.log('%cSAMPEL DATA (5 RECORD PERTAMA):', 'background: #FF9800; color: white; padding: 3px 5px;');
    console.table(currentRiwayatPembayaran.slice(0, 5));
    
    console.log('');
    console.log('%cFILTER BULAN SAAT INI:', 'background: #673AB7; color: white; padding: 3px 5px;');
    const filtered = filterBulanBayar === 'Semua' 
        ? currentRiwayatPembayaran 
        : currentRiwayatPembayaran.filter(p => p.bulan === filterBulanBayar);
    console.log(`Filter: "${filterBulanBayar}" → ${filtered.length} record`);
    console.table(filtered.slice(0, 5));
};

// Alias untuk kemudahan
window.dbg = window.debugPembayaran;
window.showData = function() {
    return currentRiwayatPembayaran;
};
window.showStats = function() {
    const summary = {};
    currentRiwayatPembayaran.forEach(p => {
        const b = p.bulan || 'KOSONG';
        summary[b] = (summary[b] || 0) + 1;
    });
    return summary;
};

