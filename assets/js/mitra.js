/* ===============================
   PAGINATION MITRA CONFIG
=============================== */
let MITRA_PAGE = 1;
const MITRA_PER_PAGE = 20;

/* ===============================
   DATA MITRA
================================ */
let MITRA = [];
let MITRA_GROUPED = [];
let MITRA_FILTERED = [];

/* ===============================
   BUILD MITRA FROM KEGIATAN
================================ */
function buildMitraFromKegiatan() {
  if (!Array.isArray(KEGIATAN)) {
    MITRA = [];
    return;
  }
  MITRA = KEGIATAN.map((k) => ({
    mitra: k.no || "-",
    mitraTerkait: k.mitra || "-",
    namaKegiatan: k.bentuk || k.deskripsi || "-",
    jenisDokumen: k.jenisDokumen || "-",
    tanggal: k.tanggal || "",
    pj: k.pj || "-",
    tingkat: k.tingkat || "-",
    fakultas: k.fakultas || "-",
    jenisMitra: k.jenisMitra || "-",
    linkSimkerma: k.linkSimkerma || "",
  }));

  console.log("MITRA built:", MITRA);
}

/* ===============================
   🔥 BUAT GRUP MITRA (DIPERBAIKI)
   - HAPUS populateJenisMitraDropdown()
   - Tambah populateTingkatDropdown()
================================ */
function buildMitraGroupedFromKegiatan() {
  const map = {};

  KEGIATAN.forEach((k) => {
    const namaMitra =
      k.no !== undefined && k.no !== null ? String(k.no).trim() : "";

    if (!namaMitra) return;

    if (!map[namaMitra]) {
      map[namaMitra] = {
        mitra: namaMitra,
        tingkat: k.tingkat || "-",
        jenisMitra: k.jenisMitra || "-",
        fakultas: k.fakultas || "-",
        kegiatan: [],
      };
    }

    map[namaMitra].kegiatan.push({
      nama: k.bentuk || k.deskripsi || "-",
      tanggal: k.tanggal || "",
      pj: k.pj || "-",
      mitra: k.mitra || "-",
      jenisDokumen: k.jenisDokumen || "-",
      linkSimkerma: k.linkSimkerma || "",
    });
  });

  MITRA_GROUPED = Object.values(map);
  MITRA_FILTERED = [...MITRA_GROUPED];

  // 🔥 POPULATE DROPDOWN TINGKAT (bukan jenis!)
  populateTingkatDropdown();

  console.log("MITRA_GROUPED:", MITRA_GROUPED);
}
/* ===============================
   🔥 POPULATE DROPDOWN TINGKAT
   - Isi dengan Lokal, Nasional, Internasional
================================ */
function populateTingkatDropdown() {
  const select = document.getElementById("mitra-filter-tingkat");
  if (!select) {
    console.warn("⚠️ Element mitra-filter-tingkat tidak ditemukan!");
    return;
  }

  // Simpan value yang sedang dipilih
  const currentValue = select.value;

  // Ambil semua nilai tingkat yang unik dari data
  const tingkatSet = new Set();
  MITRA_GROUPED.forEach(m => {
    if (m.tingkat && m.tingkat.trim() !== "" && m.tingkat !== "-") {
      tingkatSet.add(m.tingkat.trim());
    }
  });

  // Urutkan: Lokal → Nasional → Internasional
  const tingkatList = Array.from(tingkatSet).sort((a, b) => {
    const order = { "Lokal": 1, "Nasional": 2, "Internasional": 3 };
    return (order[a] || 99) - (order[b] || 99);
  });

  console.log("📋 Tingkat kerjasama yang tersedia:", tingkatList);

  // Reset dropdown (keep option pertama)
  select.innerHTML = `<option value="">Semua Tingkat Kerjasama</option>`;

  // Tambahkan option dari data
  tingkatList.forEach(tingkat => {
    const option = document.createElement("option");
    option.value = tingkat;
    option.textContent = tingkat;
    select.appendChild(option);
  });

  // Restore value yang dipilih
  if (currentValue && tingkatList.includes(currentValue)) {
    select.value = currentValue;
  }
}
function getUniqueJenisMitra() {
  const set = new Set();
  MITRA_GROUPED.forEach(m => {
    if (m.jenisMitra && m.jenisMitra !== "-" && m.jenisMitra.trim() !== "") {
      set.add(m.jenisMitra.trim());
    }
  });
  // Urutkan: Lokal → Nasional → Internasional → lainnya
  return Array.from(set).sort((a, b) => {
    const order = { "Lokal": 1, "Nasional": 2, "Internasional": 3 };
    const aOrder = order[a] || 99;
    const bOrder = order[b] || 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.localeCompare(b);
  });
}
function populateJenisMitraDropdown() {
  const select = document.getElementById("mitra-filter-jenis");
  if (!select) return;

  // Simpan value yang sedang dipilih
  const currentValue = select.value;

  // Kosongkan isi (kecuali option pertama)
  select.innerHTML = `<option value="">Semua Jenis Mitra</option>`;

  // Ambil daftar unik
  const jenisList = getUniqueJenisMitra();

  console.log("📋 Daftar Jenis Mitra untuk dropdown:", jenisList);

  // Tambahkan option
  jenisList.forEach(jenis => {
    const option = document.createElement("option");
    option.value = jenis;
    option.textContent = jenis;
    select.appendChild(option);
  });

  // Kembalikan value yang tadi dipilih (kalau masih ada)
  if (currentValue && jenisList.includes(currentValue)) {
    select.value = currentValue;
  }
}
/* ===============================
   🔥 FILTER - DIPERBAIKI UNTUK TINGKAT
================================ */
function applyMitraPageFilter() {
  const searchInput = document.getElementById("mitra-search");
  const tingkatSelect = document.getElementById("mitra-filter-tingkat"); // 🔥 UBAH

  if (!searchInput || !tingkatSelect) {
    console.warn("Filter element tidak ditemukan!");
    return;
  }

  const keyword = searchInput.value.toLowerCase().trim();
  const tingkat = tingkatSelect.value.trim(); // 🔥 UBAH: jenis → tingkat

  console.log("🔍 Filter diterapkan:");
  console.log("   - Keyword:", JSON.stringify(keyword));
  console.log("   - Tingkat:", JSON.stringify(tingkat));
  console.log("   - Total data sebelum filter:", MITRA_GROUPED.length);

  MITRA_FILTERED = MITRA_GROUPED.filter((m) => {
    // 🔥 FILTER TINGKAT - case insensitive + trim
    let matchTingkat = true;
    if (tingkat) {
      const mTingkat = (m.tingkat || "").trim();
      matchTingkat = mTingkat.toLowerCase() === tingkat.toLowerCase();
    }

    // 🔥 FILTER KEYWORD
    let matchKeyword = true;
    if (keyword) {
      matchKeyword = 
        (m.mitra || "").toLowerCase().includes(keyword) ||
        (m.tingkat || "").toLowerCase().includes(keyword) ||
        (m.fakultas || "").toLowerCase().includes(keyword) ||
        (m.jenisMitra || "").toLowerCase().includes(keyword) ||
        m.kegiatan.some((k) =>
          (k.nama || "").toLowerCase().includes(keyword) ||
          (k.pj || "").toLowerCase().includes(keyword) ||
          (k.mitra || "").toLowerCase().includes(keyword) ||
          (k.jenisDokumen || "").toLowerCase().includes(keyword)
        );
    }

    return matchTingkat && matchKeyword; // 🔥 UBAH
  });

  console.log("✅ Hasil filter:", MITRA_FILTERED.length, "data");

  // Debug jika hasil 0
  if (MITRA_FILTERED.length === 0 && tingkat) {
    console.warn("⚠️ Tidak ada data untuk tingkat:", tingkat);
    const tingkatAsli = [...new Set(MITRA_GROUPED.map(m => m.tingkat))];
    console.log("💡 Tingkat yang ada di data:", tingkatAsli);
  }

  MITRA_PAGE = 1;
  renderMitraGroupedTable();
}

/* ===============================
   🔥 RESET FILTER - DIPERBAIKI
================================ */
function resetMitraPageFilters() {
  const searchInput = document.getElementById("mitra-search");
  const tingkatSelect = document.getElementById("mitra-filter-tingkat"); // 🔥 UBAH

  if (searchInput) searchInput.value = "";
  if (tingkatSelect) tingkatSelect.value = ""; // 🔥 UBAH

  MITRA_FILTERED = [...MITRA_GROUPED];
  MITRA_PAGE = 1;

  renderMitraGroupedTable();

  const btn = event?.target?.closest?.('button');
  if (btn) {
    btn.classList.add('scale-95');
    setTimeout(() => btn.classList.remove('scale-95'), 150);
  }
}

/* ===============================
   PAGINATED DATA MITRA
=============================== */
function getPaginatedMitra() {
  const start = (MITRA_PAGE - 1) * MITRA_PER_PAGE;
  return MITRA_FILTERED.slice(start, start + MITRA_PER_PAGE);
}

function renderMitraGroupedTable() {
  const tbody = document.getElementById("mitra-body");
  if (!tbody) return;

  if (!MITRA_FILTERED.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="p-4 text-center text-gray-500">
          Data mitra tidak ditemukan
        </td>
      </tr>`;
    renderMitraPagination(0);
    return;
  }

  const pageData = getPaginatedMitra();
  let html = "";

  pageData.forEach((m, i) => {
    const realIndex = (MITRA_PAGE - 1) * MITRA_PER_PAGE + i;

    html += `
      <tr class="border-b bg-gray-50 font-medium">
        <td class="p-3">${m.mitra}</td>
        <td class="p-3">${m.tingkat || "-"}</td>
        <td class="p-3">${m.kegiatan.length} Kegiatan</td>
        <td class="p-3 text-center">${m.jenisMitra || "-"}</td>
        <td class="p-3 text-center">
          <button
            onclick="toggleMitraDetail(${realIndex})"
            class="text-purple-600 hover:underline"
          >
            Detail
          </button>
        </td>
      </tr>

      <tr id="mitra-detail-${realIndex}" class="hidden bg-white">
        <td colspan="5" class="p-4" data-loaded="0"></td>
      </tr>
    `;
  });

  tbody.innerHTML = html;

  renderMitraPagination(MITRA_FILTERED.length);
}

function renderMitraKegiatanList(list) {
  return `
    <table class="w-full text-sm border">
      <thead class="bg-gray-100">
        <tr>
          <th class="p-2 text-left">Mitra Terkait</th>
          <th class="p-2 text-left">Nama Kegiatan</th>
          <th class="p-2 text-center">Tanggal</th>
          <th class="p-2 text-center">PJ</th>
          <th class="p-2 text-center">Jenis Dokumen</th>
          <th class="p-2 text-center">SIMKERMA</th>
        </tr>
      </thead>
      <tbody>
        ${list
          .map(
            (k) => `
          <tr class="border-t">
            <td class="p-2">${k.mitra}</td>
            <td class="p-2">${k.nama}</td>
            <td class="p-2 text-center">${k.tanggal ? formatTanggalMitra(k.tanggal) : "-"}</td>
            <td class="p-2 text-center">${k.pj}</td>
            <td class="p-2 text-center">${k.jenisDokumen}</td>
            <td class="p-2 text-center">
              ${
                k.linkSimkerma
                  ? `<a href="${k.linkSimkerma}" target="_blank"
                       class="text-blue-600 underline">Buka</a>`
                  : "-"
              }
            </td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function toggleMitraDetail(index) {
  const row = document.getElementById(`mitra-detail-${index}`);
  if (!row) return;

  const cell = row.querySelector("td");
  const mitra = MITRA_FILTERED[index];

  if (cell.dataset.loaded === "0") {
    cell.innerHTML = renderMitraKegiatanList(mitra.kegiatan);
    cell.dataset.loaded = "1";
  }

  row.classList.toggle("hidden");
}

async function loadMitraPage() {
  console.log("loadMitraPage() dipanggil");

  showLoading("Memuat data mitra...");

  try {
    if (!Array.isArray(KEGIATAN) || KEGIATAN.length === 0) {
      if (typeof loadKegiatanFromSheet === "function") {
        await loadKegiatanFromSheet();
      }
    }

    if (!KEGIATAN.length) {
      console.warn("KEGIATAN masih kosong");
      return;
    }

    buildMitraGroupedFromKegiatan();
    renderMitraGroupedTable();
  } finally {
    hideLoading();
  }
}

/* ===============================
   PAGINATION MITRA
=============================== */
function renderMitraPagination(total) {
  const pagination = document.getElementById("mitra-pagination");
  const info = document.getElementById("mitra-info");

  const pageCount = Math.ceil(total / MITRA_PER_PAGE);
  if (!pagination || !info) return;

  pagination.innerHTML = "";

  info.textContent = total
    ? `Menampilkan ${(MITRA_PAGE - 1) * MITRA_PER_PAGE + 1}
       - ${Math.min(MITRA_PAGE * MITRA_PER_PAGE, total)} dari ${total} data`
    : "Menampilkan 0 data";

  if (pageCount <= 1) return;

  const isMobile = window.innerWidth < 640;

  pagination.innerHTML += `
    <button onclick="goToMitraPage(${Math.max(1, MITRA_PAGE - 1)})"
      class="px-2 py-1 text-xs border rounded-md hover:bg-gray-100">
      ◀
    </button>
  `;

  if (isMobile) {
    if (MITRA_PAGE > 2) pagination.innerHTML += mitraPageButton(1);
    if (MITRA_PAGE > 3) pagination.innerHTML += mitraEllipsis();
    pagination.innerHTML += mitraPageButton(MITRA_PAGE);
    if (MITRA_PAGE < pageCount - 2) pagination.innerHTML += mitraEllipsis();
    if (MITRA_PAGE < pageCount - 1) pagination.innerHTML += mitraPageButton(pageCount);
  } else {
    const maxVisible = 5;
    let start = Math.max(1, MITRA_PAGE - 2);
    let end = Math.min(pageCount, start + maxVisible - 1);

    for (let i = start; i <= end; i++) {
      pagination.innerHTML += mitraPageButton(i);
    }
  }

  pagination.innerHTML += `
    <button onclick="goToMitraPage(${Math.min(pageCount, MITRA_PAGE + 1)})"
      class="px-2 py-1 text-xs border rounded-md hover:bg-gray-100">
      ▶
    </button>
  `;
}

function mitraPageButton(page) {
  return `
    <button onclick="goToMitraPage(${page})"
      class="px-3 py-1 rounded-lg border
      ${
        page === MITRA_PAGE ? "bg-purple-600 text-white" : "hover:bg-gray-100"
      }">
      ${page}
    </button>
  `;
}

function mitraEllipsis() {
  return `<span class="px-2 text-gray-400">...</span>`;
}

function goToMitraPage(page) {
  MITRA_PAGE = page;
  renderMitraGroupedTable();
}

/* ===============================
   🔥 DOWNLOAD CSV - SUDAH DI-RENAME
================================ */
function downloadMitraPageCSV() {
  if (!MITRA_FILTERED.length) {
    alert("Tidak ada data untuk diunduh!");
    return;
  }

  let csv = "No,Mitra,Tingkat Kerjasama,Jumlah Kegiatan,Jenis Mitra,Fakultas\n";

  MITRA_FILTERED.forEach((m, i) => {
    csv += `${i + 1},"${m.mitra}","${m.tingkat}","${m.kegiatan.length}","${m.jenisMitra}","${m.fakultas}"\n`;
  });

  csv += "\n\n=== DETAIL KEGIATAN PER MITRA ===\n\n";

  MITRA_FILTERED.forEach((m) => {
    csv += `Mitra: ${m.mitra}\n`;
    csv += "No,Nama Kegiatan,Tanggal,PJ,Mitra Terkait,Jenis Dokumen\n";

    m.kegiatan.forEach((k, idx) => {
      csv += `${idx + 1},"${k.nama}","${k.tanggal ? formatTanggalMitra(k.tanggal) : "-"}","${k.pj}","${k.mitra}","${k.jenisDokumen}"\n`;
    });
    csv += "\n";
  });

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Data_Mitra_${formatTanggalFileMitra()}.csv`;
  link.click();
}

/* ===============================
   🔥 DOWNLOAD EXCEL - SUDAH DI-RENAME
================================ */
function downloadMitraPageExcel() {
  if (!MITRA_FILTERED.length) {
    alert("Tidak ada data untuk diunduh!");
    return;
  }

  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Data Mitra</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        td, th { border: 1px solid #ddd; padding: 5px; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .header { font-size: 14px; font-weight: bold; background-color: #4a90d9; color: white; }
      </style>
    </head>
    <body>
      <table>
        <tr class="header">
          <th>No</th>
          <th>Mitra</th>
          <th>Tingkat Kerjasama</th>
          <th>Jumlah Kegiatan</th>
          <th>Jenis Mitra</th>
          <th>Fakultas</th>
        </tr>`;

  MITRA_FILTERED.forEach((m, i) => {
    html += `
        <tr>
          <td>${i + 1}</td>
          <td>${m.mitra}</td>
          <td>${m.tingkat}</td>
          <td>${m.kegiatan.length}</td>
          <td>${m.jenisMitra}</td>
          <td>${m.fakultas}</td>
        </tr>`;
  });

  html += `</table>
      <br><br>
      <table>
        <tr class="header">
          <th colspan="6">DETAIL KEGIATAN PER MITRA</th>
        </tr>
      </table>`;

  MITRA_FILTERED.forEach((m) => {
    html += `
      <br>
      <table>
        <tr class="header">
          <th colspan="6">Mitra: ${m.mitra}</th>
        </tr>
        <tr>
          <th>No</th>
          <th>Nama Kegiatan</th>
          <th>Tanggal</th>
          <th>PJ</th>
          <th>Mitra Terkait</th>
          <th>Jenis Dokumen</th>
        </tr>`;

    m.kegiatan.forEach((k, idx) => {
      html += `
        <tr>
          <td>${idx + 1}</td>
          <td>${k.nama}</td>
          <td>${k.tanggal ? formatTanggalMitra(k.tanggal) : "-"}</td>
          <td>${k.pj}</td>
          <td>${k.mitra}</td>
          <td>${k.jenisDokumen}</td>
        </tr>`;
    });

    html += `</table>`;
  });

  html += `</body></html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Data_Mitra_${formatTanggalFileMitra()}.xls`;
  link.click();
}

/* ===============================
   🔥 DOWNLOAD PDF - SUDAH DI-RENAME
================================ */
function downloadMitraPagePDF() {
  if (!MITRA_FILTERED.length) {
    alert("Tidak ada data untuk diunduh!");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("l", "mm", "a4");

  doc.setFontSize(16);
  doc.text("LAPORAN DATA MITRA", 148.5, 15, { align: "center" });
  doc.setFontSize(10);
  doc.text(`Tanggal: ${formatTanggalMitra(new Date().toISOString())}`, 148.5, 22, { align: "center" });

  const summaryData = MITRA_FILTERED.map((m, i) => [
    i + 1,
    m.mitra,
    m.tingkat,
    m.kegiatan.length + " Kegiatan",
    m.jenisMitra,
    m.fakultas,
  ]);

  doc.autoTable({
    startY: 30,
    head: [["No", "Mitra", "Tingkat", "Jumlah Kegiatan", "Jenis Mitra", "Fakultas"]],
    body: summaryData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [74, 144, 217], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 248, 255] },
  });

  MITRA_FILTERED.forEach((m) => {
    doc.addPage();
    doc.setFontSize(12);
    doc.text(`Detail Kegiatan - ${m.mitra}`, 14, 15);
    doc.setFontSize(9);
    doc.text(`Tingkat: ${m.tingkat} | Jenis: ${m.jenisMitra}`, 14, 22);

    const detailData = m.kegiatan.map((k, idx) => [
      idx + 1,
      k.nama,
      k.tanggal ? formatTanggalMitra(k.tanggal) : "-",
      k.pj,
      k.mitra,
      k.jenisDokumen,
    ]);

    doc.autoTable({
      startY: 28,
      head: [["No", "Nama Kegiatan", "Tanggal", "PJ", "Mitra Terkait", "Jenis Dokumen"]],
      body: detailData,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [74, 144, 217], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 248, 255] },
    });
  });

  doc.save(`Data_Mitra_${formatTanggalFileMitra()}.pdf`);
}

/* ===============================
   UTIL - SUDAH DI-RENAME
================================ */
function formatTanggalMitra(val) {
  if (!val) return "-";
  return new Date(val).toLocaleDateString("id-ID");
}

function formatTanggalFileMitra() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
}

function showLoading(msg) {
  console.log("Loading:", msg);
}

function hideLoading() {
  console.log("Loading selesai");
}
