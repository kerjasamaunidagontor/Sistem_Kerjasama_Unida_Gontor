/* ===============================
   CONFIG
=============================== */
let LAPORAN_PAGE = 1;
const LAPORAN_PER_PAGE = 25;
let LAPORAN_CACHE = [];

function initLaporanKegiatan() {
  console.log("✅ Init Laporan FIXED", KEGIATAN.length);

  LAPORAN_PAGE = 1;
  renderLaporanTable();
}

/* ===============================
   FILTER DATA
=============================== */
function getLaporanData() {
  const keyword =
    document.getElementById("search-laporan")?.value.toLowerCase() || "";

  return KEGIATAN.filter((k) => k.status === "Diterima").filter((k) =>
    Object.values(k).some((v) =>
      String(v || "")
        .toLowerCase()
        .includes(keyword),
    ),
  );
}

/* ===============================
   RENDER TABLE
=============================== */
function renderLaporanTable() {
  const tbody = document.getElementById("laporan-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  const data = getLaporanData();
  LAPORAN_CACHE = data;

  const start = (LAPORAN_PAGE - 1) * LAPORAN_PER_PAGE;
  const pageData = data.slice(start, start + LAPORAN_PER_PAGE);

  if (!pageData.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="p-4 text-center text-gray-500">
          Tidak ada laporan kegiatan
        </td>
      </tr>
    `;
    return;
  }

  pageData.forEach((k, index) => {
    tbody.innerHTML += `
    <tr class="border-b hover:bg-gray-50">
      <td class="p-3">${k.pj}</td>
        <td class="p-3">${k.bidang}</td>
        <td class="p-3">${k.bentuk}</td>
        <td class="p-3">${k.tingkat}</td>
        <td class="p-3">${formatTanggal(k.tanggal)}</td>
        <td class="p-3">${k.deskripsi}</td>
        <td class="p-3">${k.mitra}</td>
        <td class="p-3">
  ${renderStatusBadge(k.status)}
</td>

      <td class="p-3 text-center">
        <button
          onclick="openLaporanDetail(${start + index})"
          class="text-purple-600 hover:underline text-sm"
        >
          Lihat
        </button>
      </td>
    </tr>
  `;
  });

  renderLaporanPagination(data.length);
}
function openLaporanDetail(index) {
  const k = LAPORAN_CACHE[index];
  if (!k) {
    alert("Data laporan tidak ditemukan");
    return;
  }

  const container = document.getElementById("laporan-detail-content");

  container.innerHTML = `
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
          ? `<a href="${k.linkSimkerma}" target="_blank"
               class="text-blue-600 underline">Buka Link</a>`
          : "-"
      }
    </div>

    <div class="md:col-span-2">
      <b>Laporan Kegiatan</b><br>
      ${
        k.laporan
          ? `<a href="${k.laporan}" target="_blank"
               class="text-blue-600 underline">Buka Laporan</a>`
          : "-"
      }
    </div>

    <div class="md:col-span-2">
      <b>Dokumen Kegiatan</b><br>
      ${
        k.dokumen
          ? `<a href="${k.dokumen}" target="_blank"
               class="text-blue-600 underline">Buka Dokumen</a>`
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

  const modal = document.getElementById("laporan-detail-modal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeLaporanDetail() {
  document.getElementById("laporan-detail-modal").classList.add("hidden");
}

/* ===============================
   PAGINATION LAPORAN (ADVANCED)
=============================== */
function renderLaporanPagination(total) {
  const pagination = document.getElementById("laporan-pagination");
  const info = document.getElementById("laporan-info");

  const pageCount = Math.ceil(total / LAPORAN_PER_PAGE);
  if (!pagination || !info) return;

  pagination.innerHTML = "";

  info.textContent = total
    ? `Menampilkan ${(LAPORAN_PAGE - 1) * LAPORAN_PER_PAGE + 1}
       - ${Math.min(LAPORAN_PAGE * LAPORAN_PER_PAGE, total)}
       dari ${total} laporan`
    : "Menampilkan 0 laporan";

  if (pageCount <= 1) return;

  const maxVisible = 5;
  let start = Math.max(1, LAPORAN_PAGE - Math.floor(maxVisible / 2));
  let end = Math.min(pageCount, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  // ⬅ Prev
  pagination.innerHTML += `
    <button onclick="goToLaporanPage(${Math.max(1, LAPORAN_PAGE - 1)})"
      class="px-3 py-1 border rounded-lg hover:bg-gray-100">
      ◀
    </button>
  `;

  // Page 1
  if (start > 1) {
    pagination.innerHTML += laporanPageButton(1);
    if (start > 2) pagination.innerHTML += laporanEllipsis();
  }

  // Middle pages
  for (let i = start; i <= end; i++) {
    pagination.innerHTML += laporanPageButton(i);
  }

  // Last page
  if (end < pageCount) {
    if (end < pageCount - 1) pagination.innerHTML += laporanEllipsis();
    pagination.innerHTML += laporanPageButton(pageCount);
  }

  // Next ➡
  pagination.innerHTML += `
    <button onclick="goToLaporanPage(${Math.min(pageCount, LAPORAN_PAGE + 1)})"
      class="px-3 py-1 border rounded-lg hover:bg-gray-100">
      ▶
    </button>
  `;
}
/* ===============================
   PAGINATION UTIL LAPORAN
=============================== */
function laporanPageButton(page) {
  return `
    <button onclick="goToLaporanPage(${page})"
      class="px-3 py-1 rounded-lg border
      ${
        page === LAPORAN_PAGE ? "bg-purple-600 text-white" : "hover:bg-gray-100"
      }">
      ${page}
    </button>
  `;
}

function laporanEllipsis() {
  return `<span class="px-2 text-gray-400">...</span>`;
}

function goToLaporanPage(page) {
  LAPORAN_PAGE = page;
  renderLaporanTable();

  document
    .getElementById("laporan-body")
    ?.scrollIntoView({ behavior: "smooth" });
}
function bindLaporanSearch() {
  const input = document.getElementById("search-laporan");
  if (!input) return;

  input.addEventListener("input", () => {
    LAPORAN_PAGE = 1;
    renderLaporanTable();
  });
}
