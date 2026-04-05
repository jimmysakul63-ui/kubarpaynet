// ==========================================
// KONEKSI DATABASE GOOGLE SHEETS KUBARPAYNET
// ==========================================

export const API_URL = "https://script.google.com/macros/s/AKfycbxBHe4LYOYbX677pyqfmrOcYBaiGAFg6V-uE2CFteKBAvLi5NYL-fMhfGu8DB6tOtcB/exec";

// Expose API_URL ke global window untuk debug di console
if (typeof window !== 'undefined') {
  window.KUBARPAYNET_API_URL = API_URL;
  console.log("✅ KUBARPAYNET API URL loaded:", API_URL);
}

// Timeout helpers
const DEFAULT_TIMEOUT_MS = 15000; // 15 detik

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = DEFAULT_TIMEOUT_MS } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout} ms`);
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

async function postWithTimeout(url, payload, timeout = DEFAULT_TIMEOUT_MS) {
  return fetchWithTimeout(url, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload),
    timeout: timeout
  });
}

/**
 * FUNGSI 1: AMBIL DATA PELANGGAN (GET)
 * Tugasnya narik data dari sheet AWAI, MUUT, dll
 */
export async function ambilDataPelanggan(kampung) {
    try {
        // Validasi input
        if (!kampung) {
            throw new Error("Kampung tidak boleh kosong!");
        }

        // Tempelkan perintah aksi dan nama kampung di ujung URL
        const urlPencarian = `${API_URL}?aksi=ambilPelanggan&kampung=${encodeURIComponent(kampung)}`;

        console.log("📡 Mencoba fetch dari:", urlPencarian);
        console.log("🏷️ Parameter kampung:", kampung);

        const respon = await fetchWithTimeout(urlPencarian, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            },
            timeout: DEFAULT_TIMEOUT_MS
        });

        console.log("📊 Response status:", respon.status, respon.statusText);
        console.log("📊 Response headers:", [...respon.headers.entries()]);

        // Cek apakah response berhasil
        if (!respon.ok) {
            const errorText = await respon.text();
            console.error("❌ HTTP Error response body:", errorText);
            throw new Error(`HTTP Error! Status: ${respon.status} ${respon.statusText} - ${errorText}`);
        }

        // Parse JSON
        const responseText = await respon.text();
        console.log("📄 Raw response text:", responseText);

        if (!responseText || responseText.trim() === '') {
            throw new Error("Response kosong dari server!");
        }

        const data = JSON.parse(responseText);
        console.log("✅ Data berhasil diambil:", data);

        // Cek apakah data adalah error object
        if (data && typeof data === 'object' && data.error) {
            throw new Error(`Server Error: ${data.error}`);
        }

        return data; // Bakal nampilin Array data dari Google Sheets
    } catch (error) {
        console.error("❌ Waduh, gagal narik data pelanggan Bang:", error);
        console.error("🔍 Error details:", {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        console.error("💡 Tips: Pastikan Google Apps Script sudah di-deploy dan URL benar");
        console.error("🔗 URL GAS saat ini:", API_URL);
        return null;
    }
}

/**
 * FUNGSI 3: AMBIL DATA USER (GET)
 * Tugasnya narik data user dari Google Sheets untuk login
 */
export async function ambilDataUser() {
    try {
        const urlPencarian = `${API_URL}?aksi=ambilUser`;
        
        console.log("👤 Fetch data user dari:", urlPencarian);
        
        const respon = await fetchWithTimeout(urlPencarian, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            },
            timeout: DEFAULT_TIMEOUT_MS
        });

        if (!respon.ok) {
            const errorText = await respon.text();
            console.error("❌ HTTP Error response body:", errorText);
            throw new Error(`HTTP Error! Status: ${respon.status} ${respon.statusText} - ${errorText}`);
        }

        const responseText = await respon.text();
        console.log("📄 Raw user response:", responseText);

        if (!responseText || responseText.trim() === '') {
            throw new Error("Response kosong dari server!");
        }

        const data = JSON.parse(responseText);
        console.log("✅ Data user berhasil diambil:", data);

        if (data && typeof data === 'object' && data.error) {
            throw new Error(`Server Error: ${data.error}`);
        }

        return data;
    } catch (error) {
        console.error("❌ Gagal ambil data user:", error);
        console.error("💡 Tips: Pastikan Google Apps Script sudah di-deploy");
        return null;
    }
}

/**
 * FUNGSI 2.5: AMBIL DATA PEMBAYARAN (GET)
 * Tugasnya narik riwayat pembayaran dari Google Sheets
 */
export async function ambilDataPembayaran(kampung, bulan = 'Semua', tahun = new Date().getFullYear().toString()) {
    try {
        if (!kampung) {
            throw new Error("Kampung tidak boleh kosong!");
        }

        const query = `?aksi=ambilPembayaran&kampung=${encodeURIComponent(kampung)}&bulan=${encodeURIComponent(bulan)}&tahun=${encodeURIComponent(tahun)}`;
        const urlPencarian = `${API_URL}${query}`;

        console.log("📡 Mengambil data pembayaran dari:", urlPencarian);

        const respon = await fetchWithTimeout(urlPencarian, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            },
            timeout: DEFAULT_TIMEOUT_MS
        });

        console.log("📊 Response status:", respon.status, respon.statusText);
        if (!respon.ok) {
            const errorText = await respon.text();
            console.error("❌ HTTP Error response body:", errorText);
            throw new Error(`HTTP Error! Status: ${respon.status} ${respon.statusText} - ${errorText}`);
        }

        const responseText = await respon.text();
        console.log("📄 Raw response text:", responseText);

        if (!responseText || responseText.trim() === '') {
            throw new Error("Response kosong dari server!");
        }

        const data = JSON.parse(responseText);

        if (data && typeof data === 'object' && data.error) {
            throw new Error(`Server Error: ${data.error}`);
        }

        if (!Array.isArray(data)) {
            console.warn("⚠️ Data pembayaran tidak array, kembalikan array kosong");
            return [];
        }

        return data;
    } catch (error) {
        console.error("❌ Gagal ambil data pembayaran:", error);
        console.error("💡 Tips: Pastikan Google Apps Script sudah di-deploy");
        return [];
    }
}

/**
 * FUNGSI 4: VALIDASI LOGIN USER
 * Tugasnya cek username dan password dari Google Sheets
 */
export async function validasiLogin(username, password) {
    try {
        console.log("🔐 Validasi login untuk:", username);
        
        const dataUser = await ambilDataUser();
        
        if (!dataUser || !Array.isArray(dataUser)) {
            console.error("❌ Data user tidak valid:", dataUser);
            return { success: false, message: "Tidak dapat mengambil data user" };
        }

        // Cari user berdasarkan username (case insensitive)
        const user = dataUser.find(u => 
            u.username && u.username.toLowerCase() === username.toLowerCase()
        );

        if (!user) {
            console.log("❌ Username tidak ditemukan:", username);
            return { success: false, message: "Username tidak ditemukan" };
        }

        // Cek password
        if (user.password !== password) {
            console.log("❌ Password salah untuk user:", username);
            return { success: false, message: "Password salah" };
        }

        console.log("✅ Login berhasil untuk:", username, "Role:", user.role);
        return { 
            success: true, 
            user: {
                username: user.username,
                role: user.role,
                kampung: user.kampung_akses || user.role
            }
        };

    } catch (error) {
        console.error("❌ Error validasi login:", error);
        return { success: false, message: "Terjadi kesalahan sistem" };
    }
}

export async function ambilMaintenanceSchedule() {
    try {
        const url = `${API_URL}?aksi=ambilMaintenance`;
        console.log("⏱️ Mengambil jadwal maintenance global dari:", url);

        const respon = await fetchWithTimeout(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            },
            timeout: DEFAULT_TIMEOUT_MS
        });

        if (!respon.ok) {
            const errorText = await respon.text();
            console.error("❌ HTTP Error ambilMaintenance:", errorText);
            throw new Error(`HTTP Error! Status: ${respon.status} ${respon.statusText} - ${errorText}`);
        }

        const responseText = await respon.text();
        console.log("📄 Raw response ambilMaintenance:", responseText);

        if (!responseText || responseText.trim() === '') {
            return null;
        }

        const data = JSON.parse(responseText);
        if (data && typeof data === 'object' && data.error) {
            // Jika error "aksi tidak dikenali", fallback ke localStorage
            if (data.error.includes('tidak dikenali') || data.error.includes('not recognized')) {
                console.warn("⚠️ Handler maintenance belum diimplementasi di GAS, menggunakan fallback lokal");
                return null;
            }
            throw new Error(`Server Error: ${data.error}`);
        }

        return data;
    } catch (error) {
        console.error("❌ Gagal ambil jadwal maintenance:", error);
        // Jika network error atau timeout, fallback ke localStorage
        console.warn("⚠️ Menggunakan jadwal maintenance dari localStorage");
        return null;
    }
}

export async function simpanMaintenanceSchedule(schedule) {
    try {
        if (!schedule || !schedule.date || !schedule.start || !schedule.end) {
            throw new Error("Jadwal maintenance tidak lengkap");
        }

        const payload = { ...schedule, aksi: 'updateMaintenance' };

        console.log("📤 Mengirim jadwal maintenance ke backend:", API_URL);
        console.log("📦 Payload maintenance:", JSON.stringify(payload, null, 2));

        const respon = await postWithTimeout(API_URL, payload, DEFAULT_TIMEOUT_MS);

        if (!respon.ok) {
            const errorText = await respon.text();
            console.error("❌ HTTP Error updateMaintenance:", errorText);
            throw new Error(`HTTP Error! Status: ${respon.status} ${respon.statusText} - ${errorText}`);
        }

        const responseText = await respon.text();
        console.log("📄 Raw response updateMaintenance:", responseText);

        if (!responseText || responseText.trim() === '') {
            throw new Error("Response kosong dari server!");
        }

        const data = JSON.parse(responseText);
        if (data && typeof data === 'object' && data.error) {
            throw new Error(`Server Error: ${data.error}`);
        }

        if (data.success === false) {
            throw new Error(data.message || 'Gagal menyimpan jadwal maintenance');
        }

        return data;
    } catch (error) {
        console.error("❌ Gagal simpan jadwal maintenance:", error);
        throw error;
    }
}

export async function testKoneksiGAS() {
    try {
        console.log("🧪 Testing koneksi ke GAS...");
        console.log("🔗 URL GAS:", API_URL);

        // Test 1: Basic connectivity
        const testUrl = `${API_URL}?aksi=test`;
        console.log("📡 Test URL:", testUrl);

        const respon = await fetch(testUrl, {
            method: 'GET',
            mode: 'cors'
        });

        console.log("📊 Test Response Status:", respon.status, respon.statusText);

        if (respon.ok) {
            const text = await respon.text();
            console.log("✅ GAS reachable! Response:", text);
            return { success: true, message: "GAS reachable", response: text };
        } else {
            const errorText = await respon.text();
            console.error("❌ GAS not reachable:", errorText);
            return { success: false, message: "GAS not reachable", error: errorText };
        }

    } catch (error) {
        console.error("❌ Network error:", error);
        return { success: false, message: "Network error", error: error.message };
    }
}

export async function testLogin(username = "admin_pusat", password = "pusat1234") {
    console.log(`🧪 Testing login: ${username}`);
    const result = await validasiLogin(username, password);
    console.log("📊 Login test result:", result);
    return result;
}

export async function testAmbilDataKampung(kampung = "AWAI") {
    console.log(`🧪 Testing ambil data kampung: ${kampung}`);
    const result = await ambilDataPelanggan(kampung);
    console.log("📊 Test result:", result);
    return result;
}

export async function testAmbilDataPembayaran(kampung = "OPERATOR", bulan = "Semua", tahun = new Date().getFullYear().toString()) {
    console.log(`🧪 Testing ambil data pembayaran: ${kampung}, bulan=${bulan}, tahun=${tahun}`);
    const result = await ambilDataPembayaran(kampung, bulan, tahun);
    console.log("📊 Test result:", result);
    return result;
}

export async function testSimpanDataPelanggan() {
    console.log("🧪 Testing simpan data pelanggan...");
    
    const testData = {
        idPelanggan: "TEST-" + Date.now(),
        nama: "Pelanggan Test",
        alamat: "Jl. Test No. 123",
        kampung: "AWAI",
        paket: "PAKET B",
        noHp: "081234567890",
        email: "test@example.com",
        status: "Aktif"
    };
    
    try {
        const result = await simpanDataPelanggan(testData);
        console.log("📊 Test simpan result:", result);
        return result;
    } catch (error) {
        console.error("❌ Test simpan failed:", error);
        return { success: false, error: error.message };
    }
}

export async function testUpdateDataPelanggan() {
    console.log("🧪 Testing UPDATE data pelanggan...");
    
    try {
        // STEP 1: Ambil data yang ada dulu
        console.log("📥 Step 1: Ambil data pelanggan yang ada...");
        const dataExisting = await ambilDataPelanggan("AWAI");
        
        if (!dataExisting || dataExisting.length === 0) {
            console.error("❌ Tidak ada data untuk di-update!");
            return { success: false, error: "Tidak ada data pelanggan di Google Sheets" };
        }
        
        // STEP 2: Ambil ID pertama yang ada
        const existingData = dataExisting[0];
        const existingId = existingData.id || existingData.idPelanggan;
        console.log("✅ Step 1 OK - Ditemukan ID:", existingId);
        
        // STEP 3: Siapkan data update dengan ID yang sudah ada
        const testData = {
            idPelanggan: existingId,
            nama: "UPDATED " + new Date().toLocaleString('id-ID'),
            alamat: existingData.alamat || "Jl. Test Update",
            kampung: existingData.kampung || "AWAI",
            paket: existingData.paket || "PAKET B",
            harga: existingData.harga || 300000,
            noHp: existingData.noHp || "0851999999",
            email: existingData.email || "test@test.com",
            status: "Aktif"
        };
        
        console.log("📝 Step 3: Sending update data:", testData);
        
        // STEP 4: Jalankan update
        const result = await updateDataPelanggan(testData);
        console.log("✅ Test UPDATE result:", result);
        return result;
        
    } catch (error) {
        console.error("❌ Test UPDATE failed:", error);
        return { success: false, error: error.message };
    }
}

export async function testDeleteDataPelanggan() {
    console.log("🧪 Testing DELETE data pelanggan...");
    
    try {
        // STEP 1: Buat data test baru dulu
        console.log("📝 Step 1: Membuat data test untuk dihapus...");
        const testId = "TEST-DELETE-" + Date.now();
        const testData = {
            idPelanggan: testId,
            nama: "Test Delete " + new Date().toLocaleTimeString('id-ID'),
            alamat: "Jl. Test Delete",
            kampung: "AWAI",
            paket: "PAKET A",
            harga: 250000,
            noHp: "0899999999",
            email: "testdelete@test.com",
            status: "Aktif"
        };
        
        // STEP 2: Simpan test data
        console.log("💾 Step 2: Saving test data...", testData);
        const saveResult = await simpanDataPelanggan(testData);
        if (!saveResult || !saveResult.success) {
            console.warn("⚠️ Save test data gagal, tapi coba delete ID:", testId);
        } else {
            console.log("✅ Test data saved:", saveResult);
        }
        
        // STEP 3: Hapus test data
        console.log("🗑️ Step 3: Deleting test data dengan ID:", testId);
        const result = await deleteDataPelanggan(testId, "AWAI");
        console.log("✅ Test DELETE result:", result);
        return result;
        
    } catch (error) {
        console.error("❌ Test DELETE failed:", error);
        return { success: false, error: error.message };
    }
}

/**
 * FUNGSI 5: SIMPAN DATA PELANGGAN (POST)
 * Tugasnya menyimpan data pelanggan baru ke Google Sheets
 */
export async function simpanDataPelanggan(dataPelanggan) {
    try {
        // Validasi input
        if (!dataPelanggan || !dataPelanggan.idPelanggan || !dataPelanggan.nama || !dataPelanggan.alamat) {
            throw new Error("Data pelanggan tidak lengkap!");
        }

        // Bungkus datanya pake label "simpanPelanggan" biar Juru Tulis tau tugasnya
        const payload = { ...dataPelanggan, aksi: "simpanPelanggan" };

        console.log("📤 Mengirim data pelanggan ke:", API_URL);
        console.log("📦 Payload yang dikirim:", JSON.stringify(payload, null, 2));

        const respon = await postWithTimeout(API_URL, payload, DEFAULT_TIMEOUT_MS);

        console.log("📊 Response status:", respon.status, respon.statusText);

        // Cek apakah response berhasil
        if (!respon.ok) {
            const errorText = await respon.text();
            console.error("❌ HTTP Error response body:", errorText);
            throw new Error(`HTTP Error! Status: ${respon.status} ${respon.statusText} - ${errorText}`);
        }

        const responseText = await respon.text();
        console.log("📄 Raw response:", responseText);

        if (!responseText || responseText.trim() === '') {
            throw new Error("Response kosong dari server!");
        }

        const result = JSON.parse(responseText);
        console.log("✅ Data pelanggan berhasil dikirim:", result);

        if (result.success) {
            return result;
        } else {
            throw new Error(result.message || "Gagal menyimpan data pelanggan");
        }

    } catch (error) {
        console.error("❌ Gagal simpan data pelanggan:", error);
        console.error("💡 Tips: Pastikan Google Apps Script sudah di-deploy");
        throw error;
    }
}

/**
 * FUNGSI 5: SIMPAN DATA PEMBAYARAN (POST)
 * Tugasnya simpan data pembayaran ke Google Sheets
 */
export async function simpanDataPembayaran(dataBayar) {
    try {
        // Validasi input
        if (!dataBayar || Object.keys(dataBayar).length === 0) {
            throw new Error("Data pembayaran tidak boleh kosong!");
        }

        // Bungkus datanya pake label "simpanPembayaran" biar Juru Tulis tau tugasnya
        const payload = { ...dataBayar, aksi: "simpanPembayaran" };

        console.log("📤 Mengirim data pembayaran ke:", API_URL);
        console.log("📦 Payload yang dikirim:", JSON.stringify(payload, null, 2));

        const respon = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                // Avoid preflight OPTIONS with JSON payload
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log("📊 Response status:", respon.status, respon.statusText);

        // Cek apakah response berhasil
        if (!respon.ok) {
            const errorText = await respon.text();
            console.error("❌ HTTP Error response body:", errorText);
            throw new Error(`HTTP Error! Status: ${respon.status} ${respon.statusText} - ${errorText}`);
        }

        const responseText = await respon.text();
        console.log("📄 Raw response:", responseText);

        if (!responseText || responseText.trim() === '') {
            throw new Error("Response kosong dari server!");
        }

        const result = JSON.parse(responseText);
        console.log("✅ Data pembayaran berhasil dikirim:", result);

        if (result.success) {
            return result;
        } else {
            throw new Error(result.message || "Gagal menyimpan data pembayaran");
        }

    } catch (error) {
        console.error("❌ Gagal simpan data pembayaran:", error);
        console.error("💡 Tips: Pastikan Google Apps Script sudah di-deploy");
        throw error;
    }
}

/**
 * FUNGSI 6: UPDATE DATA PELANGGAN (POST)
 * Tugasnya update data pelanggan yang sudah ada di Google Sheets
 */
export async function updateDataPelanggan(dataPelanggan) {
    try {
        // Cek koneksi internet sebelum memanggil API
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            throw new Error("Tidak ada koneksi internet. Periksa jaringan Anda dan coba lagi.");
        }

        // Validasi input
        if (!dataPelanggan || !dataPelanggan.idPelanggan) {
            throw new Error("Data pelanggan dan ID pelanggan harus diisi!");
        }

        // Bungkus datanya pake label "updatePelanggan" biar Juru Tulis tau tugasnya
        const payload = { ...dataPelanggan, aksi: "updatePelanggan" };

        console.log("📤 Mengirim update data pelanggan ke:", API_URL);
        console.log("📦 Payload yang dikirim:", JSON.stringify(payload, null, 2));
        console.log("🔄 Attempt update data pelanggan...");

        // PENTING: Jangan gunakan AbortController karena bisa trigger CORS error
        const respon = await postWithTimeout(API_URL, payload, DEFAULT_TIMEOUT_MS);

        console.log("📊 Response status:", respon.status, respon.statusText);

        // Cek apakah response berhasil
        if (!respon.ok) {
            const errorText = await respon.text();
            console.error("❌ HTTP Error response body:", errorText);
            throw new Error(`HTTP Error! Status: ${respon.status} ${respon.statusText} - ${errorText}`);
        }

        const responseText = await respon.text();
        console.log("📄 Raw response:", responseText);

        if (!responseText || responseText.trim() === '') {
            throw new Error("Response kosong dari server!");
        }

        const result = JSON.parse(responseText);
        console.log("✅ Data pelanggan berhasil diupdate:", result);

        if (result.success) {
            return result;
        } else {
            throw new Error(result.message || "Update gagal dari GAS!");
        }

    } catch (error) {
        console.error("❌ Gagal update data pelanggan:", error);
        console.error("📋 Error Details:", {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        
        // Diagnostic hints
        if (error.message.includes('Failed to fetch')) {
            console.error("💡 DIAGNOSIS: Kemungkinan CORS issue atau GAS handler tidak ada untuk 'updatePelanggan'");
            console.error("💡 SOLUSI: Cek console GAS di https://script.google.com - apakah ada error saat GAS dijalankan?");
        }
        
        throw error;
    }
}

/**
 * FUNGSI 7: DELETE DATA PELANGGAN (POST)
 * Tugasnya hapus data pelanggan dari Google Sheets
 */
export async function deleteDataPelanggan(idPelanggan, kampung) {
    try {
        // Validasi input
        if (!idPelanggan || !kampung) {
            throw new Error("ID pelanggan dan kampung harus diisi!");
        }

        // Bungkus datanya pake label "deletePelanggan" biar Juru Tulis tau tugasnya
        const payload = { idPelanggan: idPelanggan, kampung: kampung, aksi: "deletePelanggan" };

        console.log("📤 Mengirim delete data pelanggan ke:", API_URL);
        console.log("📦 Payload yang dikirim:", JSON.stringify(payload, null, 2));

        const respon = await postWithTimeout(API_URL, payload, DEFAULT_TIMEOUT_MS);

        console.log("📊 Response status:", respon.status, respon.statusText);

        // Cek apakah response berhasil
        if (!respon.ok) {
            const errorText = await respon.text();
            console.error("❌ HTTP Error response body:", errorText);
            throw new Error(`HTTP Error! Status: ${respon.status} ${respon.statusText} - ${errorText}`);
        }

        const responseText = await respon.text();
        console.log("📄 Raw response:", responseText);

        if (!responseText || responseText.trim() === '') {
            throw new Error("Response kosong dari server!");
        }

        const result = JSON.parse(responseText);
        console.log("✅ Data pelanggan berhasil dihapus:", result);

        if (result.success) {
            return result;
        } else {
            throw new Error(result.message || "Gagal menghapus data pelanggan");
        }

    } catch (error) {
        console.error("❌ Gagal delete data pelanggan:", error);
        console.error("� Error Details:", {
            message: error.message,
            name: error.name
        });
        
        if (error.message.includes('Failed to fetch')) {
            console.error("💡 DIAGNOSIS: Kemungkinan CORS issue atau GAS handler tidak ada untuk 'deletePelanggan'");
            console.error("💡 SOLUSI: Cek console GAS di https://script.google.com");
        }
        
        throw error;
    }
}
/**
 * FUNGSI 8: UPDATE DATA USER (POST)
 * Tugasnya update username dan password untuk role tertentu
 */
export async function updateDataUser(dataUser) {
    try {
        // Validasi input
        if (!dataUser || !dataUser.username || !dataUser.role) {
            throw new Error("Data user, username, dan role harus diisi!");
        }

        // Bungkus datanya pake label "updateUser" biar GAS tau tugasnya
        const payload = { ...dataUser, aksi: "updateUser" };

        console.log("📤 Mengirim update data user ke:", API_URL);
        console.log("📦 Payload yang dikirim:", JSON.stringify(payload, null, 2));

        const respon = await postWithTimeout(API_URL, payload, DEFAULT_TIMEOUT_MS);

        console.log("📊 Response status:", respon.status, respon.statusText);

        // Cek apakah response berhasil
        if (!respon.ok) {
            const errorText = await respon.text();
            console.error("❌ HTTP Error response body:", errorText);
            throw new Error(`HTTP Error! Status: ${respon.status} ${respon.statusText} - ${errorText}`);
        }

        const responseText = await respon.text();
        console.log("📄 Raw response:", responseText);

        if (!responseText || responseText.trim() === '') {
            throw new Error("Response kosong dari server!");
        }

        const result = JSON.parse(responseText);
        console.log("✅ Data user berhasil diupdate:", result);

        if (result.success) {
            return result;
        } else {
            throw new Error(result.message || "Gagal update data user");
        }

    } catch (error) {
        console.error("❌ Gagal update data user:", error);
        throw error;
    }
}