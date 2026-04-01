// public/js/kontak.js

export function renderInfoKontak() {
    const container = document.getElementById('mainContentArea');
    if (!container) return;

    // Bersihkan kontainer
    container.innerHTML = `
        <div style="display: flex; justify-content: center; padding-top: 50px; height: 100%; box-sizing: border-box;">
            
            <div class="form-container">
                
                <h2 class="form-title">KONTAK ADMIN</h2>
                
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    
                    <div style="display: flex; align-items: center;">
                        <div style="width: 80px; font-weight: normal; color: #000;">Nama</div>
                        <div style="margin-right: 10px;">:</div>
                        <div style="flex-grow: 1; background: white; border: 1px solid black; padding: 6px 10px; font-size: 14px;">
                            RIO
                        </div>
                    </div>

                    <div style="display: flex; align-items: center;">
                        <div style="width: 80px; font-weight: normal; color: #000;">No HP</div>
                        <div style="margin-right: 10px;">:</div>
                        <div style="flex-grow: 1; background: white; border: 1px solid black; padding: 6px 10px; font-size: 14px;">
                            0895XXXXXXX
                        </div>
                    </div>

                    <div style="display: flex; align-items: center;">
                        <div style="width: 80px; font-weight: normal; color: #000;">Email</div>
                        <div style="margin-right: 10px;">:</div>
                        <div style="flex-grow: 1; background: white; border: 1px solid black; padding: 6px 10px; font-size: 14px;">
                            <a href="mailto:riorumalag@gmail.com" style="color: #0563C1; text-decoration: underline;">riorumalag@gmail.com</a>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center;">
                        <div style="width: 80px; font-weight: normal; color: #000;">No Rek</div>
                        <div style="margin-right: 10px;">:</div>
                        <div style="flex-grow: 1; background: white; border: 1px solid black; padding: 6px 10px; font-size: 14px;">
                            5xxxxxxxxxxxxxxx01
                        </div>
                    </div>

                    <div style="display: flex; align-items: center;">
                        <div style="width: 80px; font-weight: normal; color: #000;">Bank</div>
                        <div style="margin-right: 10px;">:</div>
                        <div style="flex-grow: 1; background: white; border: 1px solid black; padding: 6px 10px; font-size: 14px;">
                            BRI
                        </div>
                    </div>

                </div>
            </div>
            
        </div>
    `;
}