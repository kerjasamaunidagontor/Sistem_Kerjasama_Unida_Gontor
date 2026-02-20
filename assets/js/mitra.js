/* ===============================
   PAGINATION MITRA CONFIG
=============================== */
let MITRA_PAGE = 1;
const MITRA_PER_PAGE = 20;

/* ===============================
   DATA MITRA (MOCK / API READY)
================================ */
let MITRA = [];
let MITRA_GROUPED = [];
let MITRA_FILTERED = [];

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
        <td class="p-3">${m.jenisMitra}</td>
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
          <th class="p-2">Tanggal</th>
          <th class="p-2">PJ</th>
          <th class="p-2">Jenis Dokumen</th>
          <th class="p-2">SIMKERMA</th>
        </tr>
      </thead>
      <tbody>
        ${list
          .map(
            (k) => `
          <tr class="border-t">
            <td class="p-2">${k.mitra}</td>
            <td class="p-2">${k.nama}</td>
            <td class="p-2">${k.tanggal ? formatTanggal(k.tanggal) : "-"}</td>
            <td class="p-2">${k.pj}</td>
            <td class="p-2">${k.jenisDokumen}</td>
            <td class="p-2">
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
    // 🔥 pastikan KEGIATAN ada
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
   PAGINATION MITRA (ADVANCED)
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

  // ======================
  // ⬅ PREV
  // ======================
  pagination.innerHTML += `
    <button onclick="goToMitraPage(${Math.max(1, MITRA_PAGE - 1)})"
      class="px-2 py-1 text-xs border rounded-md hover:bg-gray-100">
      ◀
    </button>
  `;

  // ======================
  // 📱 MOBILE MODE
  // ======================
  if (isMobile) {

    // First page
    if (MITRA_PAGE > 2) {
      pagination.innerHTML += mitraPageButton(1);
    }

    // Ellipsis kiri
    if (MITRA_PAGE > 3) {
      pagination.innerHTML += mitraEllipsis();
    }

    // Current page
    pagination.innerHTML += mitraPageButton(MITRA_PAGE);

    // Ellipsis kanan
    if (MITRA_PAGE < pageCount - 2) {
      pagination.innerHTML += mitraEllipsis();
    }

    // Last page
    if (MITRA_PAGE < pageCount - 1) {
      pagination.innerHTML += mitraPageButton(pageCount);
    }

  } else {

    // ======================
    // 💻 DESKTOP MODE
    // ======================
    const maxVisible = 5;
    let start = Math.max(1, MITRA_PAGE - 2);
    let end = Math.min(pageCount, start + maxVisible - 1);

    for (let i = start; i <= end; i++) {
      pagination.innerHTML += mitraPageButton(i);
    }
  }

  // ======================
  // ➡ NEXT
  // ======================
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
   BUAT GRUP MITRA
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

  console.log("MITRA_GROUPED:", MITRA_GROUPED);
}

/* ===============================
   UNTUK FILTER 
=================================*/
function applyMitraFilter() {
  const keyword =
    document.getElementById("mitra-search")?.value.toLowerCase() || "";
  const jenis = document.getElementById("mitra-filter-jenis")?.value || "";

  MITRA_FILTERED = MITRA_GROUPED.filter((m) => {
    const matchJenis = !jenis || m.jenisMitra === jenis;

    const matchKeyword =
      m.mitra.toLowerCase().includes(keyword) ||
      m.kegiatan.some(
        (k) =>
          k.nama.toLowerCase().includes(keyword) ||
          k.pj.toLowerCase().includes(keyword),
      );

    return matchJenis && matchKeyword;
  });

  MITRA_PAGE = 1; // 🔥 reset halaman
  renderMitraGroupedTable();
}
/* ===============================
   UTIL
================================ */
function formatTanggal(val) {
  if (!val) return "-";
  return new Date(val).toLocaleDateString("id-ID");
}
