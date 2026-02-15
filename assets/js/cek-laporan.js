/* ===============================
   CEK LAPORAN
=============================== */

function initCekLaporan() {
  const wait = setInterval(() => {
    const tbody = document.getElementById("cek-laporan-body");
    if (tbody) {
      clearInterval(wait);
      console.log("DOM READY, RENDER");
      renderCekLaporanTable();
    }
  }, 50);
}

window.initCekLaporan = initCekLaporan;

/* ===============================
   FILTER DATA
=============================== */
function getCekLaporanData() {
  return KEGIATAN.filter((k) => {
    const status = (k.status || "").trim();
    return status !== "Diterima";
  });
}

/* ===============================
   RENDER TABLE
=============================== */
function renderCekLaporanTable() {
  const tbody = document.getElementById("cek-laporan-body");
  if (!tbody) return;

  const data = getCekLaporanData();
  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="p-4 text-center text-gray-500">
          Tidak ada data cek laporan
        </td>
      </tr>
    `;
    return;
  }

  data.forEach((k) => {
    const editable = isCekLaporanEditable(k.status);

    tbody.innerHTML += `
      <tr class="border-b hover:bg-gray-50">
        <td class="p-3">${k.pj || "-"}</td>
        <td class="p-3">${k.mitra || "-"}</td>
        <td class="p-3">${k.deskripsi || "-"}</td>
        <td class="p-3">${formatTanggal(k.tanggal)}</td>
        <td class="p-3">
          ${renderCekLaporanBadge(k.status)}
        </td>
        <td class="p-2 text-center sticky right-0 bg-white">
          ${
            editable
              ? `
            <button
              onclick="openCekLaporanEdit(${k.row})"
              class="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200"
              title="Edit Laporan"
            >✏️</button>
          `
              : `
            <button
              onclick="openKegiatanDetail(${k.row})"
              class="w-8 h-8 rounded-lg bg-gray-100 text-gray-500"
              title="Lihat Detail"
            >🔍</button>
          `
          }
        </td>
      </tr>
    `;
  });
}

/* ===============================
   BADGE STATUS
=============================== */
function renderCekLaporanBadge(status = "") {
  status = status.trim();

  if (!status)
    return `<span class="px-2 py-1 rounded bg-gray-100 text-gray-600">⚪ Belum Dicek</span>`;

  if (status === "Direvisi")
    return `<span class="px-2 py-1 rounded bg-orange-100 text-orange-700">🟠 Direvisi (User)</span>`;

  if (status === "Belum Sesuai")
    return `<span class="px-2 py-1 rounded bg-blue-100 text-blue-700">🔵 Belum Sesuai (Admin)</span>`;

  if (status === "Proses")
    return `<span class="px-2 py-1 rounded bg-yellow-100 text-yellow-700">🟡 Proses</span>`;

  return `<span class="px-2 py-1 rounded bg-gray-200">${status}</span>`;
}

/* ===============================
   RULE EDIT
=============================== */
function isCekLaporanEditable(status = "") {
  return ["Direvisi", "Belum Sesuai", "Proses"].includes(status);
}

/* ===============================
   EDIT HANDLER
=============================== */
function openCekLaporanEdit(row) {
  showTab("input-kegiatan"); // atau render dulu
  setTimeout(() => editKegiatan(row), 200);
}
