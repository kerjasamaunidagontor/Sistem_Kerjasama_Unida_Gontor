let IS_ADD_MODE = false; // 🔥 KHUSUS tambah kerjasama
let IS_ADD_MITRA_MODE = false; // 🔥 MODE TAMBAH MITRA BARU
/* ===============================
   HELPER DOM
================================ */
function getEditIndex() {
  return document.getElementById("editIndex");
}

/* ===============================
   DATA KERJASAMA (MOCK)
=============================== */
window.KERJASAMA = [];

async function loadKerjasamaFromSheet() {
  showLoading("Memuat data kerjasama...");

  try {
    const res = await fetch(API.kerjasama);
    if (!res.ok) throw new Error("HTTP " + res.status);

    const json = await res.json();
    KERJASAMA = Array.isArray(json) ? json : json.data || [];

    console.log("KERJASAMA from sheet:", KERJASAMA);
    renderKerjasamaTable();
    renderChartStatus();
    renderChartSebaran();
  } catch (err) {
    console.error("loadKerjasamaFromSheet error:", err);
    KERJASAMA = [];
    renderKerjasamaTable();
  } finally {
    hideLoading();
  }
}

/* ===============================
   CONFIG SEARCH & PAGINATION
=============================== */
let CURRENT_PAGE = 1;
const PER_PAGE = 50;
let SEARCH_KEY = "";

/* ===============================
   SEARCH
=============================== */
function handleSearch() {
  SEARCH_KEY = document.getElementById("searchKerjasama").value.toLowerCase();
  CURRENT_PAGE = 1;
  renderKerjasamaTable();
}

function getFilteredData() {
  if (!SEARCH_KEY) return KERJASAMA;
  return KERJASAMA.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(SEARCH_KEY),
    ),
  );
}
/* ===============================
   GROUP BY MITRA
=============================== */
function groupKerjasamaByMitra(data) {
  return data.reduce((acc, d) => {
    const key = d.mitra || "Tanpa Mitra";
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});
}
/* ===============================
   DOWNLOAD FILE
=============================== */
function downloadCSV() {
  const data = getFilteredData();

  if (!data.length) {
    alert("Tidak ada data untuk didownload");
    return;
  }

  const headers = [
    "Mitra",
    "Benua",
    "Negara",
    "Jenis Mitra",
    "Tingkat",
    "Status",
  ];

  const rows = data.map((d) => [
    d.mitra,
    d.benua,
    d.negara,
    d.jenisMitra,
    d.tingkat,
    d.status,
  ]);

  let csvContent =
    headers.join(",") + "\n" + rows.map((r) => r.join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "data-kerjasama.csv";
  a.click();
}
function downloadExcel() {
  const data = getFilteredData();

  if (!data.length) {
    alert("Tidak ada data untuk didownload");
    return;
  }

  const formatted = data.map((d) => ({
    Mitra: d.mitra,
    Benua: d.benua,
    Negara: d.negara,
    "Jenis Mitra": d.jenisMitra,
    Tingkat: d.tingkat,
    Status: d.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(formatted);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Kerjasama");

  XLSX.writeFile(workbook, "data-kerjasama.xlsx");
}
async function downloadPDF() {
  const data = getFilteredData();

  if (!data.length) {
    alert("Tidak ada data untuk didownload");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const tableData = data.map((d) => [
    d.mitra,
    d.benua,
    d.negara,
    d.jenisMitra,
    d.tingkat,
    d.status,
  ]);

  doc.text("Data Kerjasama", 14, 10);

  doc.autoTable({
    head: [["Mitra", "Benua", "Negara", "Jenis", "Tingkat", "Status"]],
    body: tableData,
    startY: 20,
    styles: { fontSize: 8 },
  });

  doc.save("data-kerjasama.pdf");
}

/* ===============================
   RENDER TABLE
=============================== */
function renderKerjasamaTable() {
  const tbody = document.getElementById("kerjasama-body");
  if (!tbody) return;

  const filtered = getFilteredData();

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="p-4 text-center text-gray-500">
          Data tidak ditemukan
        </td>
      </tr>`;
    renderPagination(0);
    return;
  }

  // ===============================
  // GROUP BY MITRA
  // ===============================
  const grouped = groupKerjasamaByMitra(filtered);
  const mitraList = Object.keys(grouped);

  // ===============================
  // PAGINATION (PER MITRA)
  // ===============================
  const total = mitraList.length;
  const start = (CURRENT_PAGE - 1) * PER_PAGE;
  const pageMitra = mitraList.slice(start, start + PER_PAGE);

  // ===============================
  // RENDER (STRING BUFFER)
  // ===============================
  let html = "";

  pageMitra.forEach((mitra) => {
    const items = grouped[mitra];
    const first = items[0];
    const safeMitra = mitra.replace(/"/g, "&quot;");

    // 🔹 BARIS RINGKASAN MITRA
    html += `
      <tr class="bg-purple-50 font-semibold">
        <td class="p-3">${mitra}</td>
        <td class="p-3">${first.benua || "-"}</td>
        <td class="p-3">${first.negara || "-"}</td>
        <td class="p-3">${items.length} Kerjasama</td>
        <td class="p-3">${first.jenisMitra || "-"}</td>
        <td class="p-2 text-center">
          <button
            data-mitra="${safeMitra}"
            class="btn-toggle px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs"
          >
            Detail
          </button>
        </td>
      </tr>
    `;

    // 🔹 BARIS DETAIL (HIDDEN DEFAULT)
    for (let i = 0; i < items.length; i++) {
      const d = items[i];
      html += `
        <tr class="border-b bg-gray-50 mitra-detail hidden"
            data-mitra="${safeMitra}">
          <td class="p-3 pl-6 text-sm">* ${d.mitraTerkait || "-"}</td>
          <td class="p-3 text-sm">${d.noSurat}</td>
          <td class="p-3 text-sm">${d.jenisDokumen}</td>
          <td class="p-3 text-sm">${d.tingkat}</td>
          <td class="p-3 text-sm">${d.status}</td>
          <td class="p-3 text-sm">
            ${d.tahunMulai} – ${d.tahunBerakhir}
            <div class="flex gap-2 mt-1">
              <button
                onclick="openDetailKerjasama(${d.row})"
                class="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-lg"
              >🔍</button>
              <button
    onclick="openFile(${d.row})"
    class="w-7 h-7 bg-green-100 text-green-600 rounded-lg"
  >📎</button>
              <button
                onclick="deleteKerjasama(${d.row})"
                class="w-7 h-7 bg-red-100 text-red-600 rounded-lg"
              >🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }
  });

  // 🔥 1x DOM UPDATE
  tbody.innerHTML = html;

  bindToggleButtons();
  renderPagination(total);
}

function bindToggleButtons() {
  document.querySelectorAll(".btn-toggle").forEach((btn) => {
    btn.onclick = () => {
      const mitra = btn.dataset.mitra;
      document
        .querySelectorAll(`.mitra-detail[data-mitra="${mitra}"]`)
        .forEach((row) => row.classList.toggle("hidden"));
    };
  });
}

/* ===============================
   PAGINATION
=============================== */
function renderPagination(total) {
  const pagination = document.getElementById("pagination");
  const info = document.getElementById("pagination-info");

  const pageCount = Math.ceil(total / PER_PAGE);
  if (!pagination || !info) return;

  pagination.innerHTML = "";

  info.textContent = total
    ? `Menampilkan ${(CURRENT_PAGE - 1) * PER_PAGE + 1}
       - ${Math.min(CURRENT_PAGE * PER_PAGE, total)} dari ${total} data`
    : "Menampilkan 0 data";

  const maxVisible = 5; // jumlah tombol tengah
  let start = Math.max(1, CURRENT_PAGE - Math.floor(maxVisible / 2));
  let end = Math.min(pageCount, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  // ⬅ Prev
  pagination.innerHTML += `
    <button onclick="goToPage(${Math.max(1, CURRENT_PAGE - 1)})"
      class="px-3 py-1 border rounded-lg hover:bg-gray-100">
      ◀
    </button>
  `;

  // Page 1
  if (start > 1) {
    pagination.innerHTML += pageButton(1);
    if (start > 2) pagination.innerHTML += ellipsis();
  }

  // Middle pages
  for (let i = start; i <= end; i++) {
    pagination.innerHTML += pageButton(i);
  }

  // Last page
  if (end < pageCount) {
    if (end < pageCount - 1) pagination.innerHTML += ellipsis();
    pagination.innerHTML += pageButton(pageCount);
  }

  // Next ➡
  pagination.innerHTML += `
    <button onclick="goToPage(${Math.min(pageCount, CURRENT_PAGE + 1)})"
      class="px-3 py-1 border rounded-lg hover:bg-gray-100">
      ▶
    </button>
  `;
}
function pageButton(page) {
  return `
    <button onclick="goToPage(${page})"
      class="px-3 py-1 rounded-lg border
      ${
        page === CURRENT_PAGE ? "bg-purple-600 text-white" : "hover:bg-gray-100"
      }">
      ${page}
    </button>
  `;
}

function ellipsis() {
  return `<span class="px-2 text-gray-400">...</span>`;
}

function goToPage(page) {
  CURRENT_PAGE = page;
  renderKerjasamaTable();
}

/* ===============================
   MODAL
=============================== */
let IS_EDIT_MODE = false;

async function openKerjasamaForm() {
  IS_ADD_MODE = true;   // 🔥 TAMBAH MODE
  IS_EDIT_MODE = false;
  IS_ADD_MITRA_MODE = false; // reset setiap buka form


  const editIndex = document.getElementById("editIndex");
  if (editIndex) editIndex.value = "";

  document.getElementById("modal-title").textContent = "Tambah Kerjasama";

  document
    .querySelectorAll(
      "#kerjasama-form input, #kerjasama-form textarea, #kerjasama-form select",
    )
    .forEach((el) => (el.value = ""));

  setFormReadonly(false);

  document.getElementById("btn-edit").classList.add("hidden");
  document.getElementById("btn-save").classList.remove("hidden");

  // 🔥 TARUH DI SINI
  await initJenisMitraSelect(); // dropdown jenis mitra diisi
  renderFakultasSelect(); // dropdown fakultas/satker diisi
  renderJenisDokumenSelect(); // dropdown jenis dokumen diisi
  await loadKerjasamaFromSheet();

  loadBenuaDropdown();
  await loadCountryDropdown(true);

  document.getElementById("kerjasama-modal").classList.remove("hidden");
}

function closeKerjasamaForm() {
  document.getElementById("kerjasama-modal")?.classList.add("hidden");

  const ei = getEditIndex();
  if (ei) ei.value = "";

  document
    .querySelectorAll("#kerjasama-modal input, #kerjasama-modal textarea")
    .forEach((el) => (el.value = ""));
}

// panggil ini dari openKerjasamaForm() dan dari openDetailKerjasama()
async function loadCountryDropdown(force = false) {
  const select = document.getElementById("negara");
  if (!select) return;

  // kalau sudah terisi (lebih dari 1 option), skip kecuali paksa
  if (!force && select.options.length > 1) return;

  const COUNTRY_LIST = [
    "Afghanistan",
    "Albania",
    "Algeria",
    "Andorra",
    "Angola",
    "Argentina",
    "Australia",
    "Austria",
    "Bangladesh",
    "Belgium",
    "Brazil",
    "Brunei Darussalam",
    "Cambodia",
    "Canada",
    "China",
    "Denmark",
    "Egypt",
    "France",
    "Germany",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Italy",
    "Japan",
    "Jordan",
    "Kenya",
    "Kuwait",
    "Laos",
    "Malaysia",
    "Mexico",
    "Morocco",
    "Myanmar",
    "Netherlands",
    "New Zealand",
    "Nigeria",
    "Norway",
    "Pakistan",
    "Philippines",
    "Qatar",
    "Russia",
    "Saudi Arabia",
    "Singapore",
    "South Africa",
    "South Korea",
    "Spain",
    "Sri Lanka",
    "Sweden",
    "Switzerland",
    "Thailand",
    "Turkey",
    "United Arab Emirates",
    "United Kingdom",
    "United States",
    "Vietnam",
    "Yemen",
    "Zimbabwe",
  ];

  // fallback option: pakai list statis (reliable)
  const renderOptions = (list) => {
    select.innerHTML = `<option value="">-- Pilih Negara --</option>`;
    list
      .sort((a, b) => a.localeCompare(b))
      .forEach((name) => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
      });
    console.log(
      "Country dropdown populated, count:",
      select.options.length - 1,
    );
  };

  // coba fetch API, kalau gagal pakai COUNTRY_LIST
  try {
    const res = await fetch("https://restcountries.com/v3.1/all?fields=name");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const countries = data.map((c) => c.name.common);
    renderOptions(countries);
  } catch (err) {
    console.warn("Gagal load countries API, pakai fallback list", err);
    renderOptions(COUNTRY_LIST);
  }
}
function loadBenuaDropdown() {
  const select = document.getElementById("benua");
  if (!select) return;

  const BENUA_LIST = [
    // ASIA
    "Asia Tenggara",
    "Asia Timur",
    "Asia Selatan",
    "Asia Tengah",
    "Asia Barat (Timur Tengah)",

    // EROPA
    "Eropa Barat",
    "Eropa Timur",
    "Eropa Utara",
    "Eropa Selatan",

    // AMERIKA
    "Amerika Utara",
    "Amerika Tengah",
    "Amerika Selatan",
    "Karibia",

    // AFRIKA
    "Afrika Utara",
    "Afrika Barat",
    "Afrika Tengah",
    "Afrika Timur",
    "Afrika Selatan",

    // OSEANIA
    "Australia & Selandia Baru",
    "Melanesia",
    "Mikronesia",
    "Polinesia",
  ];

  select.innerHTML = `<option value="">-- Pilih Benua --</option>`;

  BENUA_LIST.forEach((benua) => {
    const opt = document.createElement("option");
    opt.value = benua;
    opt.textContent = benua;
    select.appendChild(opt);
  });

  console.log("Dropdown benua siap:", BENUA_LIST.length);
}
// ===============================
// DATA MITRA UNTUK DROPDOWN
// ===============================
function getMitraList() {
  console.log("DEBUG KERJASAMA:", KERJASAMA);

  return [
    ...new Set(
      KERJASAMA.map((d) => d.mitra) // ⬅️ PASTIKAN KEY INI BENAR
        .filter(Boolean),
    ),
  ];
}

function filterMitraDropdown(forceShow = false) {
  // 🔒 BLOK SAAT MODE TAMBAH MITRA BARU
  if (IS_ADD_MITRA_MODE) return;

  const input = document.getElementById("mitra");
  const dropdown = document.getElementById("k-no-dropdown");
  if (!input || !dropdown) return;

  const keyword = input.value.toLowerCase();
  dropdown.innerHTML = "";

  const data = getMitraList();
  
  console.log("Mitra list:", data); // Debug

  const filtered = keyword
    ? data.filter((m) => m.toLowerCase().includes(keyword))
    : data;

  if (!filtered.length && !forceShow) {
    dropdown.classList.add("hidden");
    return;
  }

  // Render hasil filter
  filtered.forEach((nama) => {
    const item = document.createElement("div");
    item.textContent = nama;
    item.className = "px-3 py-2 text-sm cursor-pointer hover:bg-purple-100";

    item.onclick = () => {
      input.value = nama;
      dropdown.classList.add("hidden");
    };

    dropdown.appendChild(item);
  });

  // ➕ TAMBAH MENU "TAMBAH MITRA"
  const addItem = document.createElement("div");
  addItem.textContent = "+ Tambah Mitra Baru";
  addItem.className =
    "px-3 py-2 text-sm cursor-pointer font-semibold text-purple-700 hover:bg-purple-100 border-t mt-1";

  addItem.onclick = () => {
    IS_ADD_MITRA_MODE = true;
    dropdown.classList.add("hidden");
    input.value = "";
    input.focus();
    input.placeholder = "Ketik nama mitra baru...";
  };

  dropdown.appendChild(addItem);
  dropdown.classList.remove("hidden");
}

function showAllMitra() {
  if (
    IS_EDIT_MODE === true &&
    document.getElementById("btn-save").classList.contains("hidden")
  ) {
    return;
  }
  const input = document.getElementById("mitra");
  if (!input) return;

  input.value = "";
  filterMitraDropdown(true);
}

function toggleMitraDropdown(show) {
  const dropdown = document.getElementById("k-no-dropdown");
  if (!dropdown) return;

  if (show) {
    filterMitraDropdown(true); // 🔥 paksa render isi
  } else {
    dropdown.classList.add("hidden");
  }
}

document.addEventListener("click", (e) => {
  if (!document.getElementById("mitra-wrapper")?.contains(e.target)) {
    document.getElementById("k-no-dropdown")?.classList.add("hidden");
  }
});



/* ===============================
   JENIS MITRA SELECT (FORM)
================================ */

// 1️⃣ render select (punyamu)
function renderJenisMitraSelect(selectedValue = "") {
  const select = document.getElementById("jenisMitra");
  if (!select) return;

  const data = Array.isArray(window.JENIS_MITRA) ? window.JENIS_MITRA : [];

  select.innerHTML = `<option value="">-- Pilih Jenis Mitra --</option>`;

  let found = false;

  data.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item.nama;
    opt.textContent = item.nama;

    if (item.nama === selectedValue) {
      opt.selected = true;
      found = true;
    }

    select.appendChild(opt);
  });

  if (selectedValue && !found) {
    const opt = document.createElement("option");
    opt.value = selectedValue;
    opt.textContent = selectedValue;
    opt.selected = true;
    select.appendChild(opt);
  }
}

// 2️⃣ INIT (INI YANG KAMU TANYAKAN)
async function initJenisMitraSelect(selectedValue = "") {
  // pastikan data sudah ada
  if (!Array.isArray(window.JENIS_MITRA) || window.JENIS_MITRA.length === 0) {
    if (typeof loadJenisMitra === "function") {
      await loadJenisMitra();
    }
  }

  renderJenisMitraSelect(selectedValue);
}
// ======= BUKA LINK DOKUMEN ======= //
function openFile(row) {
  const data = KERJASAMA.find((x) => Number(x.row) === Number(row));

  if (!data) {
    alert("Data tidak ditemukan");
    return;
  }

  const fileLink = String(data.linkFile || "").trim();

  if (!fileLink) {
    alert("File tidak tersedia");
    return;
  }

  window.open(fileLink, "_blank", "noopener");
}

//======== AMBIL DATA FAKULTAS / SATKER ========//
async function renderFakultasSelect(selectedValue = "") {
  const select = document.getElementById("unit");
  if (!select) return;

  // 🔥 PAKSA LOAD JIKA DATA BELUM ADA
  if (
    (!Array.isArray(FAKULTAS) || FAKULTAS.length === 0) &&
    typeof loadFakultas === "function"
  ) {
    await loadFakultas();
  }

  const data = window.getFakultasData?.() || [];

  select.innerHTML = `<option value="">-- Pilih Fakultas / Satker --</option>`;

  let found = false;

  data.forEach((nama) => {
    const opt = document.createElement("option");
    opt.value = nama;
    opt.textContent = nama;

    if (nama === selectedValue) {
      opt.selected = true;
      found = true;
    }

    select.appendChild(opt);
  });

  // fallback data lama
  if (selectedValue && !found) {
    const opt = document.createElement("option");
    opt.value = selectedValue;
    opt.textContent = selectedValue;
    opt.selected = true;
    select.appendChild(opt);
  }
}

//======== AMBIL DATA JENIS DOKUMEN ========//
function renderJenisDokumenSelect(selectedValue = "") {
  const select = document.getElementById("jenisDokumen");
  if (!select) return;

  const OPTIONS = [
    { value: "MoU (Memorandum of Understanding)", label: "MoU (Memorandum of Understanding)" },
    { value: "MoA (Memorandum of Agreement)", label: "MoA (Memorandum of Agreement)" },
    { value: "IA (Implementation Arrangement)", label: "IA (Implementation Arrangement)" },
  ];

  select.innerHTML = `<option value="">-- Pilih Jenis Dokumen --</option>`;

  let found = false;

  OPTIONS.forEach((o) => {
    const opt = document.createElement("option");
    opt.value = o.value;
    opt.textContent = o.label;

    // cocokkan baik value ATAU label (data lama)
    if (o.value === selectedValue || o.label === selectedValue) {
      opt.selected = true;
      found = true;
    }

    select.appendChild(opt);
  });

  // fallback untuk data lama yg benar-benar beda
  if (selectedValue && !found) {
    const opt = document.createElement("option");
    opt.value = selectedValue;
    opt.textContent = selectedValue;
    opt.selected = true;
    select.appendChild(opt);
  }
}
/* ===============================
   UNTUK TAHUN MULAI & BERAKHIR
=============================== */
const ALWAYS_READONLY_FIELDS = ["status", "tahunMulai", "tahunBerakhir"];

function syncTahunFromTanggal() {
  const tglMulai = document.getElementById("tglMulai");
  const tglBerakhir = document.getElementById("tglBerakhir");
  const tahunMulai = document.getElementById("tahunMulai");
  const tahunBerakhir = document.getElementById("tahunBerakhir");

  if (tglMulai?.value) {
    tahunMulai.value = new Date(tglMulai.value).getFullYear();
  } else {
    tahunMulai.value = "";
  }

  if (tglBerakhir?.value) {
    tahunBerakhir.value = new Date(tglBerakhir.value).getFullYear();
  } else {
    tahunBerakhir.value = "";
  }
}
function toDateInputValue(val) {
  if (!val) return "";

  // kalau sudah ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

  // dd/mm/yyyy atau d/m/yyyy
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) {
    const [d, m, y] = val.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // fallback (Date object / timestamp)
  const dt = new Date(val);
  if (!isNaN(dt)) {
    return dt.toISOString().slice(0, 10);
  }

  return "";
}
/* ===============================
  STATUS KERJASAMA HITUNG SISA WAKTU
=============================== */
/* ===============================
  STATUS & KETERANGAN KERJASAMA
=============================== */
function hitungSisaWaktu(tglBerakhirVal) {
  if (!tglBerakhirVal) return "";

  const now = new Date();
  const end = new Date(tglBerakhirVal);

  if (isNaN(end)) return "Tidak Aktif";
  if (end < now) return "Tidak Aktif";

  let years = end.getFullYear() - now.getFullYear();
  let months = end.getMonth() - now.getMonth();
  let days = end.getDate() - now.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  return `${years} Tahun ${months} Bulan ${days} Hari`;
}

// 🔥 FUNGSI BARU: Hitung Keterangan (Aktif/Tidak Aktif)
function hitungKeterangan(tglBerakhirVal) {
  if (!tglBerakhirVal) return "Aktif";
  
  const now = new Date();
  const end = new Date(tglBerakhirVal);
  
  if (isNaN(end)) return "Aktif";
  
  // Jika tanggal berakhir sudah lewat → Tidak Aktif
  return end < now ? "Tidak Aktif" : "Aktif";
}

// 🔥 UPDATE: Sync BOTH status DAN keterangan
function syncStatusKerjasama() {
  const tglBerakhir = document.getElementById("tglBerakhir");
  const status = document.getElementById("status");
  const keterangan = document.getElementById("keterangan");
  
  if (!tglBerakhir) return;

  const statusValue = hitungSisaWaktu(tglBerakhir.value);
  const keteranganValue = hitungKeterangan(tglBerakhir.value);

  // Update Status (sisa waktu)
  if (status) {
    status.value = statusValue;
    console.log("✅ Status di-set:", statusValue); // 🔥 DEBUG
  }
  
  // Update Keterangan (Aktif/Tidak Aktif)
  if (keterangan) {
    keterangan.value = keteranganValue;
    console.log("✅ Keterangan di-set:", keteranganValue); // 🔥 DEBUG
  }
  
  // 🔥 PAKSA TRIGGER CHANGE EVENT
  if (status) {
    status.dispatchEvent(new Event('change', { bubbles: true }));
  }
  if (keterangan) {
    keterangan.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

/* ===============================
   SAVE (CREATE & UPDATE)
=============================== */
async function saveKerjasama() {
  showLoading("Menyimpan data kerjasama...");

  const ei = getEditIndex();
  const isCreate = !ei || ei.value === "";

  const payload = {
    action: isCreate ? "create" : "update",
    sheet: "INPUT KERJASAMA",
    row: isCreate ? undefined : Number(ei.value),
    data: {
      mitra: mitra.value,
      benua: benua.value,
      negara: negara.value,
      mitraTerkait: mitraTerkait.value,
      linkFile: linkFile.value,
      unit: unit.value,
      noSurat: noSurat.value,
      jenisMitra: jenisMitra.value,
      jenisDokumen: jenisDokumen.value,
      tingkat: tingkat.value,
      status: statusEl.value,
      tglMulai: tglMulai.value,
      tglBerakhir: tglBerakhir.value,
      tahunMulai: tahunMulai.value,
      tahunBerakhir: tahunBerakhir.value,
      keterangan: keterangan.value,
    },
  };

  // 🔥 DEBUG: Lihat payload sebelum kirim
  console.log("📤 PAYLOAD YANG DIKIRIM:", JSON.stringify(payload, null, 2));
  console.log("📊 Status value:", status.value);
  console.log("📊 Keterangan value:", keterangan.value);

  try {
    const response = await fetch(API.kerjasama, {
      method: "POST",
      mode: "no-cors",  // ⚠️ INI MASALAHNYA!
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("✅ Response:", response);
    
    await loadKerjasamaFromSheet();
    closeKerjasamaForm();
  } catch (err) {
    console.error("❌ Save error:", err);
    alert("Gagal menyimpan: " + err.message);
  } finally {
    hideLoading();
  }
}

/* ================================
   BAGIAN DETAIL
================================== */

function setFormReadonly(isReadonly) {
  document
    .querySelectorAll("#kerjasama-form input, #kerjasama-form textarea")
    .forEach((el) => {
      // 🔥 HANYA tahunMulai & tahunBerakhir yang permanent readonly
      if (el.id === "tahunMulai" || el.id === "tahunBerakhir") {
        el.readOnly = true;
        return;
      }

      // Status dan keterangan tetap bisa diisi JS tapi readonly untuk user
      if (el.id === "status" || el.id === "keterangan") {
        el.readOnly = true; // User tidak bisa edit manual
        return;
      }

      el.readOnly = isReadonly;
      el.disabled = isReadonly && el.type === "date";
    });
}

async function openDetailKerjasama(sheetRow) {
  showLoading("Membuka detail kerjasama...");

  try {
    IS_ADD_MODE = false; // 🔥 BUKAN TAMBAH
    IS_EDIT_MODE = true; // 🔥 MODE DETAIL / EDIT

    await loadCountryDropdown(true);

    const idx = KERJASAMA.findIndex((x) => Number(x.row) === Number(sheetRow));
    if (idx === -1) {
      alert("Data tidak ditemukan");
      return;
    }

    const d = KERJASAMA[idx];

    const ei = getEditIndex();
    if (ei) ei.value = d.row;

    await initJenisMitraSelect(d.jenisMitra);
    renderFakultasSelect(d.unit);
    renderJenisDokumenSelect(d.jenisDokumen);

    Object.keys(d).forEach((k) => {
      const el = document.getElementById(k);
      if (!el) return;

      if (el.type === "date") {
        el.value = toDateInputValue(d[k]); // 🔥 FIX
      } else {
        el.value = d[k];
      }
    });

    syncTahunFromTanggal();
    syncStatusKerjasama();

    document.getElementById("modal-title").textContent = "Detail Kerjasama";
    setFormReadonly(true);
    document.getElementById("btn-edit").classList.remove("hidden");
    document.getElementById("btn-save").classList.add("hidden");
    document.getElementById("kerjasama-modal").classList.remove("hidden");
  } finally {
    hideLoading(); // 🔥 DIJAMIN TUTUP
  }
}

async function switchToEdit() {
  showLoading("Mengaktifkan mode edit...");

  document.getElementById("modal-title").textContent = "Edit Kerjasama";
  setFormReadonly(false);

  await initJenisMitraSelect(jenisMitra.value);
  renderFakultasSelect(unit.value);
  renderJenisDokumenSelect(jenisDokumen.value);

  document.getElementById("btn-edit").classList.add("hidden");
  document.getElementById("btn-save").classList.remove("hidden");

  setTimeout(() => {
    IS_ADD_MITRA_MODE = false;
    filterMitraDropdown(true);
    hideLoading();
  }, 0);
}

/* ===============================
   EDIT
=============================== */
function editKerjasama(i) {
  const d = KERJASAMA[i];
  const ei = getEditIndex();
  if (ei) ei.value = "";

  mitra.value = d.mitra;
  benua.value = d.benua;
  negara.value = d.negara;
  mitraTerkait.value = d.mitraTerkait;
  linkFile.value = d.linkFile;
  unit.value = d.unit;
  noSurat.value = d.noSurat;
  jenisMitra.value = d.jenisMitra;
  jenisDokumen.value = d.jenisDokumen;
  tingkat.value = d.tingkat;
  statusEl.value = d.status;
  tglMulai.value = d.tglMulai;
  tglBerakhir.value = d.tglBerakhir;
  tahunMulai.value = d.tahunMulai;
  tahunBerakhir.value = d.tahunBerakhir;
  keterangan.value = d.keterangan;

  openKerjasamaForm();
}

/* ===============================
   DELETE
=============================== */
async function deleteKerjasama(sheetRow) {
  if (!confirm("Hapus data kerjasama ini?")) return;

  showLoading("Menghapus data...");

  try {
    await fetch(API.kerjasama, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete",
        sheet: "INPUT KERJASAMA",
        row: Number(sheetRow),
      }),
    });

    // JANGAN res.json()
    await loadKerjasamaFromSheet();
  } catch (err) {
    console.error("Delete error:", err);
    alert("Gagal menghapus data: " + err.message);
  } finally {
    hideLoading();
  }
}

function bindKerjasamaForm() {
  // buat global supaya dipakai fungsi lain (edit/save/close)
  window.editIndex = document.getElementById("editIndex");
  window.mitra = document.getElementById("mitra");
  window.benua = document.getElementById("benua");
  window.negara = document.getElementById("negara");
  window.mitraTerkait = document.getElementById("mitraTerkait");
  window.linkFile = document.getElementById("linkFile");
  window.unit = document.getElementById("unit");
  window.noSurat = document.getElementById("noSurat");
  window.jenisMitra = document.getElementById("jenisMitra");
  window.jenisDokumen = document.getElementById("jenisDokumen");
  window.tingkat = document.getElementById("tingkat");
  window.statusEl = document.getElementById("status");
  window.tglMulai = document.getElementById("tglMulai");
  window.tglBerakhir = document.getElementById("tglBerakhir");
  window.tahunMulai = document.getElementById("tahunMulai");
  window.tahunBerakhir = document.getElementById("tahunBerakhir");
  window.keterangan = document.getElementById("keterangan");

  console.log("🔧 Binding form elements...");
  console.log("tglBerakhir element:", tglBerakhir);
  console.log("status element:", status);
  // 🔥 AUTO SYNC TAHUN & STATUS
tglMulai?.addEventListener("change", () => {
  syncTahunFromTanggal();
  syncStatusKerjasama();
});

tglBerakhir?.addEventListener("change", () => {
  syncTahunFromTanggal();
  syncStatusKerjasama(); // 🔥 Ini sekarang update status + keterangan
});

// 🔥 Realtime sync saat user mengetik/milih tanggal
tglBerakhir?.addEventListener("input", () => {
  syncStatusKerjasama();
});
  // 🔥 TAMBAH INI - Event listener untuk search mitra
  mitra?.addEventListener("input", () => {
    if (!IS_ADD_MITRA_MODE && !IS_EDIT_MODE) {
      filterMitraDropdown(false);
    }
  });

  mitra?.addEventListener("focus", () => {
    if (!IS_ADD_MITRA_MODE) {
      filterMitraDropdown(true);
    }
  });

}
