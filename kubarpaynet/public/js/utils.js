// ==========================================
// public/js/utils.js
// KUMPULAN FUNGSI BANTUAN (UTILITIES)
// ==========================================

// 1. PETA KODE WILAYAH KAMPUNG
const kodeWilayah = {
    'AWAI':        { inisial: 'AWI', kode: '654301' },
    'DEMPAR':      { inisial: 'DMP', kode: '654302' },
    'MUUT':        { inisial: 'MUT', kode: '654303' },
    'LENDIAN':     { inisial: 'LND', kode: '654304' },
    'MARIMUN':     { inisial: 'MRM', kode: '_2025_0' },
    'TONDOH':      { inisial: 'TND', kode: '2025' },
    'MUARA JAWAQ': { inisial: 'MJW', kode: '_2025_0' }
};

// 2. FUNGSI GENERATE ID PELANGGAN
export function generateIDPelanggan(namaKampung, noUrut) {
    if (!namaKampung) return ''; // Mencegah error jika belum ada kampung yang dipilih

    const data = kodeWilayah[namaKampung.toUpperCase()];
    if (!data) return ''; // Kampung tidak ditemukan di daftar

    // Ubah angka 1 jadi 0001
    const formatNoUrut = String(noUrut).padStart(4, '0');
    return `${data.inisial}${data.kode}${formatNoUrut}`;
}

// 3. FUNGSI FORMAT RUPIAH OTOMATIS
export function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR',
        minimumFractionDigits: 0 // Menghilangkan ,00 di belakang jika tidak diperlukan
    }).format(angka);
}// public/js/utils.js

// Pastikan ada kata 'export' di depan function
export function formatCurrency(nominal) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(nominal);
}

// 4. FUNGSI JAM REALTIME ANTI-ERROR
export function jalankanJamRealtime() {
    const timeElem = document.getElementById('timeDisplay');
    const dateElem = document.getElementById('dateDisplay');

    // Jika elemen tidak ditemukan (seperti di halaman Login), fungsi berhenti diam-diam
    if (!timeElem || !dateElem) return;

    const updateWaktu = () => {
        const now = new Date();

        // Format Jam (selalu 2 digit)
        const jam = String(now.getHours()).padStart(2, '0');
        const menit = String(now.getMinutes()).padStart(2, '0');
        const detik = String(now.getSeconds()).padStart(2, '0');
        
        // Format Tanggal (Indonesia)
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        
        // Tembakkan ke HTML
        timeElem.innerText = `${jam}:${menit}:${detik} `;
        dateElem.innerText = now.toLocaleDateString('id-ID', options).toUpperCase();
    };

    updateWaktu(); // Panggil sekali di awal agar tidak delay 1 detik
    setInterval(updateWaktu, 1000); // Ulangi setiap detik
}

// Fungsi untuk Export Tabel HTML ke Excel
export function eksporTabelKeExcel(idTabel, namaFile) {
    const tabel = document.getElementById(idTabel);
    if (!tabel) {
        alert("Tabel tidak ditemukan!");
        return;
    }

    // 1. Buat workbook baru
    const wb = XLSX.utils.table_to_book(tabel, { sheet: "Data" });

    // 2. Simpan file-nya
    XLSX.writeFile(wb, `${namaFile}.xlsx`);
}

// Fungsi Alert & Konfirmasi Custom
export function tampilkanAlert(pesan, tipe = 'sukses', callback = null) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'custom-alert-overlay';
    
    const ikon = tipe === 'sukses' ? '✔' : (tipe === 'konfirmasi' ? '❓' : '✖');
    const warnaIkon = tipe === 'sukses' ? '#00B050' : (tipe === 'konfirmasi' ? '#FFC000' : '#C00000');

    // Cek apakah ini mode konfirmasi (butuh 2 tombol) atau cuma info (1 tombol)
    const isConfirm = tipe === 'konfirmasi';

    alertDiv.innerHTML = `
        <div class="custom-alert-box" style="border: 3px solid #000; box-shadow: 8px 8px 0px #000; min-width: 350px;">
            <div class="alert-icon" style="background-color: ${warnaIkon}; color: white; border: 2px solid #000;">${ikon}</div>
            <div class="alert-text" style="font-weight: bold; font-size: 18px; margin: 20px 0; color: #000;">${pesan}</div>
            
            <div style="display: flex; justify-content: center; gap: 15px;">
                ${isConfirm ? `<button class="btn-alert-ok" id="confirmYes" style="background: #00B050; color: white;">YA</button>` : ''}
                <button class="btn-alert-ok" id="closeAlert" style="${isConfirm ? 'background: #C00000; color: white;' : 'background: #FFC000;'}">
                    ${isConfirm ? 'BATAL' : 'OK'}
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Tombol BATAL atau OK (Menutup saja)
    document.getElementById('closeAlert').addEventListener('click', () => {
        alertDiv.remove();
    });

    // Tombol YA (Menjalankan perintah)
    if (isConfirm && document.getElementById('confirmYes')) {
        document.getElementById('confirmYes').addEventListener('click', () => {
            alertDiv.remove();
            if (callback) callback(); // Jalankan aksinya di sini
        });
    }
}