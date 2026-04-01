// Simulasi fetch data dari server
export async function fetchDashboardStats() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                totalPelanggan: 15,
                sudahBayar: 15,
                totalPendapatan: 15, // Nanti diformat
                belumBayar: 15
            });
        }, 500);
    });
}