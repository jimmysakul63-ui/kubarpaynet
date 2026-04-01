// public/js/admin.js
import { tampilkanAlert } from './utils.js';

export function renderFormGantiAdmin() {
    const container = document.getElementById('mainContentArea');
    if (!container) return;

    // Daftar role kampung yang tersedia
    const roles = ['OPERATOR', 'AWAI', 'DEMPAR', 'LENDIAN', 'MARIMUN', 'MUARA JAWAQ', 'MUUT', 'TONDOH'];

    container.innerHTML = `
        <div style="display: flex; justify-content: center; padding-top: 50px; height: 100%;">
            
            <div class="form-container">
                
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
        </div>
    `;

    // Aksi saat tombol Simpan diklik
    document.getElementById('formGantiAdmin').addEventListener('submit', (e) => {
        e.preventDefault();
        const role = document.getElementById('adminRole').value;
        const user = document.getElementById('adminUser').value;
        const pass = document.getElementById('adminPass').value;
        
        tampilkanAlert("Konfigurasi Admin Berhasil Diperbarui!", 'sukses');
        e.target.reset();

    });
}
