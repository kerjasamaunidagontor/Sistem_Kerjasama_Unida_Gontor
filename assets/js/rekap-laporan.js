let REKAP_DETAIL_ROW = null;
let REKAP_PAGE = 1;
const REKAP_PER_PAGE = 25;

/* ===============================
   INIT REKAP LAPORAN
=============================== */
function initRekapLaporan() {
  console.log("INIT REKAP LAPORAN");

  if (!window.KEGIATAN || KEGIATAN.length === 0) {
    loadKegiatanFromSheet().then(() => {
      renderRekapTable(); // ✅ BENAR
    });
  } else {
    renderRekapTable(); // ✅ BENAR
  }
}

/* ===============================
   RENDER TABLE (SAMA DENGAN KEGIATAN)
=============================== */
function renderRekapTable() {
  const tbody = document.getElementById("rekap-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  // 🔎 ambil nilai search
  const searchValue =
    document.getElementById("search-rekap")?.value.toLowerCase().trim() || "";

  // reset ke page 1 jika sedang mencari
  if (searchValue) {
    REKAP_PAGE = 1;
  }

  // 🔥 filter status + search
  const filtered = KEGIATAN.filter((k) => {
    const matchStatus = ["Direvisi", "Belum Sesuai", "Proses"].includes(
      k.status,
    );

    const matchSearch =
      (k.pj || "").toLowerCase().includes(searchValue) ||
      (k.bidang || "").toLowerCase().includes(searchValue) ||
      (k.bentuk || "").toLowerCase().includes(searchValue) ||
      (k.tingkat || "").toLowerCase().includes(searchValue) ||
      (k.mitra || "").toLowerCase().includes(searchValue) ||
      (k.status || "").toLowerCase().includes(searchValue);

    return matchStatus && matchSearch;
  });

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="p-4 text-center text-gray-500">
          Data tidak ditemukan
        </td>
      </tr>`;
    renderRekapPagination(0);
    return;
  }

  const start = (REKAP_PAGE - 1) * REKAP_PER_PAGE;
  const pageData = filtered.slice(start, start + REKAP_PER_PAGE);

  const fragment = document.createDocumentFragment();

  pageData.forEach((k) => {
    const tr = document.createElement("tr");
    tr.className = "border-b hover:bg-gray-50";

    tr.innerHTML = `
      <td class="p-3">${k.pj || "-"}</td>
      <td class="p-3">${k.bidang || "-"}</td>
      <td class="p-3">${k.bentuk || "-"}</td>
      <td class="p-3">${k.tingkat || "-"}</td>
      <td class="p-3">${formatTanggal(k.tanggal)}</td>
      <td class="p-3">${k.mitra || "-"}</td>
      <td class="p-3">${renderStatusBadge(k.status)}</td>
      <td class="p-3 font-semibold">${k.cekLaporan || "Belum Dicek"}</td>
      <td class="p-2 text-center sticky right-0 bg-white">
        <button
          onclick="openRekapDetail(${k.row})"
          class="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200"
        >
          🔍
        </button>
      </td>
    `;

    fragment.appendChild(tr);
  });

  tbody.appendChild(fragment);

  renderRekapPagination(filtered.length);
}

/* ===============================
   DETAIL (COPY DARI KEGIATAN)
=============================== */

function openRekapDetail(sheetRow) {
  console.log("Detail row:", sheetRow);
  console.log("KEGIATAN:", KEGIATAN);

  const k = KEGIATAN.find((x) => Number(x.row) === Number(sheetRow));

  if (!k) {
    alert("Data kegiatan tidak ditemukan");
    return;
  }

  REKAP_DETAIL_ROW = sheetRow;

  document.getElementById("rekap-detail-content").innerHTML = `
    <div><b>Mitra</b><br>${k.no || "-"}</div>
    <div><b>Mitra Terkait</b><br>${k.mitra || "-"}</div>

    <div><b>Tanggal</b><br>${formatTanggal(k.tanggal || "-")}</div>
    <div><b>Tingkat</b><br>${k.tingkat || "-"}</div>

    <div><b>Jenis Mitra</b><br>${k.jenisMitra || "-"}</div>
    <div><b>Jenis Dokumen</b><br>${k.jenisDokumen || "-"}</div>

    <div><b>Bentuk Kegiatan</b><br>${k.bentuk || "-"}</div>
    <div><b>Bidang</b><br>${k.bidang || "-"}</div>

    <div><b>Pendanaan</b><br>${k.pendanaan || "-"}</div>
    <div><b>Fakultas / Satker</b><br>${k.fakultas || "-"}</div>

    <div><b>Penanggung Jawab</b><br>${k.pj || "-"}</div>
    <div><b>Tahun</b><br>${k.tahun || "-"}</div>

    <div><b>Status</b><br>${k.status || "-"}</div>
    <div><b>SIMKERMA</b><br>${k.simkerma || "-"}</div>

    <div><b>Cek Laporan</b><br>${k.cekLaporan || "-"}</div>

    <div class="md:col-span-2">
      <b>Link SIMKERMA</b><br>
      ${
        k.linkSimkerma
          ? `<a href="${k.linkSimkerma}" target="_blank" class="text-blue-600 underline">Buka Link</a>`
          : "-"
      }
    </div>

    <div class="md:col-span-2">
      <b>Laporan Kegiatan</b><br>
      ${
        k.laporan
          ? `<a href="${k.laporan}" target="_blank" class="text-blue-600 underline">Buka Laporan</a>`
          : "-"
      }
    </div>

    <div class="md:col-span-2">
      <b>Dokumen Kegiatan</b><br>
      ${
        k.dokumen
          ? `<a href="${k.dokumen}" target="_blank" class="text-blue-600 underline">Buka Dokumen</a>`
          : "-"
      }
    </div>

    <div class="md:col-span-2">
      <b>Deskripsi</b><br>${k.deskripsi || "-"}
    </div>

    <div class="md:col-span-2">
      <b>Catatan</b><br>${k.catatan || "-"}
    </div>
  `;

  const modal = document.getElementById("rekap-detail-modal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeRekapDetail() {
  const modal = document.getElementById("rekap-detail-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}
async function editRekapFull() {
  if (!REKAP_DETAIL_ROW) return;

  const k = KEGIATAN.find((x) => Number(x.row) === Number(REKAP_DETAIL_ROW));

  if (!k) {
    alert("Data tidak ditemukan");
    return;
  }

  closeRekapDetail();

  // 🔥 tandai kita datang dari rekap
  window.__FROM_REKAP__ = true;

  await loadPage("kegiatan");

  if (!window.KERJASAMA || window.KERJASAMA.length === 0) {
    if (typeof loadKerjasamaFromSheet === "function") {
      await loadKerjasamaFromSheet();
    }
  }

  editKegiatan(k.row);

  if (typeof setMitraForEdit === "function") {
    setMitraForEdit(k.no);
  }
}

/* ===============================
   VALIDASI LAPORAN (PAKAI STATUS)
=============================== */
async function validasiLaporan(status) {
  if (!REKAP_DETAIL_ROW) return;

  // 🔐 Hanya admin boleh validasi
  if (!isAdmin()) {
    alert("Hanya admin yang dapat melakukan validasi.");
    return;
  }

  // 🔒 Whitelist status
  const ALLOWED_STATUS = ["Direvisi", "Belum Sesuai", "Proses"];

  if (!ALLOWED_STATUS.includes(status)) {
    alert("Status tidak valid untuk Rekap Laporan");
    return;
  }

  try {
    await fetch(API.kegiatan, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        sheet: "INPUT KEGIATAN",
        row: Number(REKAP_DETAIL_ROW),
        data: {
          status: status,
        },
      }),
    });

    await loadKegiatanFromSheet();
    renderRekapTable();
    closeRekapDetail();
  } catch (err) {
    console.error("Validasi gagal:", err);
    alert("Gagal melakukan validasi");
  }
}

/* ===============================
   PAGINATION REKAP (ADVANCED)
=============================== */
function renderRekapPagination(total) {
  const pagination = document.getElementById("rekap-pagination");
  const info = document.getElementById("rekap-info");

  const pageCount = Math.ceil(total / REKAP_PER_PAGE);
  if (!pagination || !info) return;

  pagination.innerHTML = "";

  info.textContent = total
    ? `Menampilkan ${(REKAP_PAGE - 1) * REKAP_PER_PAGE + 1}
       - ${Math.min(REKAP_PAGE * REKAP_PER_PAGE, total)}
       dari ${total} data`
    : "Menampilkan 0 data";

  if (pageCount <= 1) return;

  const maxVisible = 5;
  let start = Math.max(1, REKAP_PAGE - Math.floor(maxVisible / 2));
  let end = Math.min(pageCount, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  // ⬅ Prev
  pagination.innerHTML += `
    <button onclick="goToRekapPage(${Math.max(1, REKAP_PAGE - 1)})"
      class="px-3 py-1 border rounded-lg hover:bg-gray-100">
      ◀
    </button>
  `;

  // Page 1
  if (start > 1) {
    pagination.innerHTML += rekapPageButton(1);
    if (start > 2) pagination.innerHTML += rekapEllipsis();
  }

  // Middle pages
  for (let i = start; i <= end; i++) {
    pagination.innerHTML += rekapPageButton(i);
  }

  // Last page
  if (end < pageCount) {
    if (end < pageCount - 1) pagination.innerHTML += rekapEllipsis();
    pagination.innerHTML += rekapPageButton(pageCount);
  }

  // Next ➡
  pagination.innerHTML += `
    <button onclick="goToRekapPage(${Math.min(pageCount, REKAP_PAGE + 1)})"
      class="px-3 py-1 border rounded-lg hover:bg-gray-100">
      ▶
    </button>
  `;
}
/* ===============================
   PAGINATION UTIL REKAP
=============================== */
function rekapPageButton(page) {
  return `
    <button onclick="goToRekapPage(${page})"
      class="px-3 py-1 rounded-lg border
      ${
        page === REKAP_PAGE ? "bg-purple-600 text-white" : "hover:bg-gray-100"
      }">
      ${page}
    </button>
  `;
}

function rekapEllipsis() {
  return `<span class="px-2 text-gray-400">...</span>`;
}

function goToRekapPage(page) {
  REKAP_PAGE = page;
  renderRekapTable();

  document.getElementById("rekap-body")?.scrollIntoView({ behavior: "smooth" });
}
