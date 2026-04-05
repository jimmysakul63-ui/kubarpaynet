// public/js/admin.js
import { tampilkanAlert } from './utils.js';
import { updateDataUser, ambilMaintenanceSchedule, simpanMaintenanceSchedule } from './api.js';

export function renderFormGantiAdmin() {
    const container = document.getElementById('mainContentArea');
    if (!container) return;

    // Daftar role kampung yang tersedia
    const roles = ['OPERATOR', 'AWAI', 'DEMPAR', 'LENDIAN', 'MARIMUN', 'MUARA JAWAQ', 'MUUT', 'TONDOH'];

    container.innerHTML = `
        <div style="display: flex; justify-content: center; padding-top: 30px; gap: 30px; min-height: 100%;">
            
            <div class="form-container" style="flex: 1; max-width: 480px;">
                <h2 class="form-title">GANTI USER DAN PASSWORD ADMIN</h2>
                <form id="formGantiAdmin" style="display: flex; flex-direction: column; gap: 15px;">
                    <div style="display: flex; align-items: center;">
                        <div style="width: 100px; color: #000;">Role</div>
                        <div style="margin-right: 10px;">:</div>
                        <select id="adminRole" style="flex-grow: 1; padding: 6px; border: 1px solid #000; background: white;" required>
                            <option value="">-- Pilih Role --</option>
                            ${roles.map(r => `<option value="${r}">${r}</option>`).join('')}
                        </select>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <div style="width: 100px; color: #000;">Username</div>
                        <div style="margin-right: 10px;">:</div>
                        <input type="text" id="adminUser" style="flex-grow: 1; padding: 6px; border: 1px solid #000;" required>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <div style="width: 100px; color: #000;">Password</div>
                        <div style="margin-right: 10px;">:</div>
                        <input type="password" id="adminPass" style="flex-grow: 1; padding: 6px; border: 1px solid #000;" required>
                    </div>
                    <div class="form-actions"><button type="submit" class="btn-simpan">Simpan</button></div>
                </form>
            </div>

            <div class="form-container" style="flex: 1; max-width: 480px;">
                <h2 class="form-title">PENGUMUMAN MAINTENANCE</h2>
                <form id="formMaintenance" style="display: flex; flex-direction: column; gap: 15px;">
                    <div style="display: flex; align-items: center;">
                        <div style="width: 140px; color: #000;">Tanggal</div>
                        <div style="margin-right: 10px;">:</div>
                        <input type="date" id="maintenanceDate" style="flex-grow: 1; padding: 6px; border: 1px solid #000;" required>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <div style="width: 140px; color: #000;">Jam Mulai</div>
                        <div style="margin-right: 10px;">:</div>
                        <input type="time" id="maintenanceStart" style="flex-grow: 1; padding: 6px; border: 1px solid #000;" required>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <div style="width: 140px; color: #000;">Jam Selesai</div>
                        <div style="margin-right: 10px;">:</div>
                        <input type="time" id="maintenanceEnd" style="flex-grow: 1; padding: 6px; border: 1px solid #000;" required>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <div style="width: 140px; color: #000;">Catatan</div>
                        <div style="margin-right: 10px;">:</div>
                        <textarea id="maintenanceNote" rows="3" style="flex-grow: 1; padding: 6px; border: 1px solid #000;"></textarea>
                    </div>
                    <div class="form-actions"><button type="submit" class="btn-simpan">Konfirmasi</button></div>
                </form>
                <div id="maintenanceInfo" style="margin-top: 20px; padding: 12px; background:#f7f7f7; border:1px solid #ddd; border-radius:6px;"></div>
            </div>
        </div>
    `;

    // Aksi saat tombol Simpan diklik
    document.getElementById('formGantiAdmin').addEventListener('submit', async (e) => {
        e.preventDefault();
        const role = document.getElementById('adminRole').value;
        const user = document.getElementById('adminUser').value;
        const pass = document.getElementById('adminPass').value;

        try {
            const result = await updateDataUser({
                username: user,
                password: pass,
                role: role,
                kampungAkses: role === 'OPERATOR' ? 'SEMUA' : role
            });

            if (result.success) {
                tampilkanAlert("Konfigurasi Admin Berhasil Diperbarui!", 'sukses');
                e.target.reset();
            } else {
                tampilkanAlert("Gagal update: " + result.message, 'error');
            }
        } catch (error) {
            console.error("Error updating admin:", error);
            tampilkanAlert("Terjadi kesalahan: " + error.message, 'error');
        }
    });

    async function renderMaintenanceInfo() {
        const infoEl = document.getElementById('maintenanceInfo');
        if (!infoEl) return;

        let data = null;
        let source = 'local';

        try {
            data = await ambilMaintenanceSchedule();
            if (data && data.date && data.start && data.end) {
                source = 'backend';
                localStorage.setItem('maintenanceSchedule', JSON.stringify({
                    date: data.date,
                    start: data.start,
                    end: data.end,
                    note: data.note || '',
                    createdAt: data.createdAt || new Date().toISOString()
                }));
            }
        } catch (err) {
            console.warn('Gagal ambil jadwal maintenance backend, pakai fallback lokal:', err);
        }

        if (!data) {
            const saved = localStorage.getItem('maintenanceSchedule');
            if (saved) {
                try {
                    data = JSON.parse(saved);
                    source = 'local';
                } catch (err) {
                    console.error('Gagal parsing jadwal maintenance lokal:', err);
                }
            }
        }

        if (!data) {
            infoEl.innerHTML = '<strong>Status:</strong> Tidak ada jadwal maintenance terpasang.';
            return;
        }

        const formatMaintenanceDate = (value) => {
            if (!value) return '-';
            if (typeof value === 'string') {
                const parsed = new Date(value);
                if (!isNaN(parsed)) return parsed.toLocaleDateString('id-ID');
                return value;
            }
            if (value instanceof Date) return value.toLocaleDateString('id-ID');
            return String(value);
        };

        const formatMaintenanceTime = (value) => {
            if (!value) return '-';
            if (typeof value === 'string') {
                if (/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return value;
                const parsed = new Date(value);
                if (!isNaN(parsed)) return parsed.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                return value;
            }
            if (value instanceof Date) return value.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            return String(value);
        };

        infoEl.innerHTML = `
            <strong>Jadwal Maintenance ${source === 'backend' ? '(Global)' : '(Lokal)'}</strong><br>
            Tanggal: ${formatMaintenanceDate(data.date)}<br>
            Jam: ${formatMaintenanceTime(data.start)} s/d ${formatMaintenanceTime(data.end)}<br>
            Catatan: ${data.note || '-'}<br>
            <small>Terpasang sejak ${new Date(data.createdAt || new Date().toISOString()).toLocaleString('id-ID')}</small>
        `;
    }

    const formMaintenance = document.getElementById('formMaintenance');
    if (formMaintenance) {
        formMaintenance.addEventListener('submit', async (e) => {
            e.preventDefault();

            const date = document.getElementById('maintenanceDate').value;
            const start = document.getElementById('maintenanceStart').value;
            const end = document.getElementById('maintenanceEnd').value;
            const note = document.getElementById('maintenanceNote').value;

            if (!date || !start || !end) {
                tampilkanAlert('Tanggal, jam mulai, dan jam selesai harus diisi!', 'gagal');
                return;
            }

            const schedule = {
                date,
                start,
                end,
                note,
                createdAt: new Date().toISOString(),
            };

            try {
                const result = await simpanMaintenanceSchedule(schedule);
                if (result && (result.success || result.updated)) {
                    localStorage.setItem('maintenanceSchedule', JSON.stringify(schedule));
                    renderMaintenanceInfo();
                    tampilkanAlert('Jadwal maintenance global berhasil disimpan!', 'sukses');
                    formMaintenance.reset();
                } else {
                    throw new Error(result.message || 'Backend tidak mengonfirmasi update');
                }
            } catch (error) {
                console.error('Gagal simpan jadwal maintenance global:', error);
                localStorage.setItem('maintenanceSchedule', JSON.stringify(schedule));
                renderMaintenanceInfo();
                tampilkanAlert('Jadwal maintenance disimpan di browser, tapi gagal menyimpan global: ' + error.message, 'error');
                formMaintenance.reset();
            }
        });
    }

    renderMaintenanceInfo();
}
