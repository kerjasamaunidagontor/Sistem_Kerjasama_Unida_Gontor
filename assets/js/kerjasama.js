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
    
    // 🔥 POPULATE DROPDOWN FILTER SETELAH DATA SIAP
    populateKerjasamaFilters();
    
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
   APPLY FILTER (GLOBAL + PER KOLOM)
=============================== */
function applyKerjasamaFilter() {
  // Update global search
  SEARCH_KEY = document.getElementById("searchKerjasama")?.value.toLowerCase() || "";
  
  // Reset ke halaman 1 saat filter berubah
  CURRENT_PAGE = 1;
  renderKerjasamaTable();
}

/* ===============================
   GET FILTERED DATA (ADVANCED)
=============================== */
function getFilteredData() {
  const role = getRole();
  const username = localStorage.getItem("username");
  
  let data = KERJASAMA;
  
  // 🔥 FILTER: user hanya lihat data miliknya
  if (role !== "admin") {
    data = data.filter(item => 
      item.created_by === username || 
      item.created_by === undefined // data lama tanpa creator
    );
  }
  // 🔍 Global search
  const globalKeyword = SEARCH_KEY;
  
  // 🔍 Filter per kolom (KECUALI jumlah)
  const filterMitra = document.getElementById("filter-mitra")?.value.toLowerCase() || "";
  const filterBenua = document.getElementById("filter-benua")?.value.toLowerCase() || "";
  const filterNegara = document.getElementById("filter-negara")?.value.toLowerCase() || "";
  const filterJenisMitra = document.getElementById("filter-jenis-mitra")?.value.toLowerCase() || "";

  return KERJASAMA.filter((item) => {
    // Global search
    const matchGlobal = !globalKeyword || Object.values(item).some((val) =>
      String(val ?? "").toLowerCase().includes(globalKeyword)
    );

    // Filter per kolom (data mentah)
    const matchMitra = !filterMitra || (item.mitra ?? "").toLowerCase().includes(filterMitra);
    const matchBenua = !filterBenua || (item.benua ?? "").toLowerCase() === filterBenua;
    const matchNegara = !filterNegara || (item.negara ?? "").toLowerCase() === filterNegara;
    const matchJenisMitra = !filterJenisMitra || (item.jenisMitra ?? "").toLowerCase() === filterJenisMitra;

    // ✅ Hanya filter yang sudah didefinisikan
return matchGlobal && matchMitra && matchBenua && matchNegara && matchJenisMitra;
  });
}
/* ===============================
   POPULATE DROPDOWN FILTER DARI DATA
=============================== */
function populateKerjasamaFilters() {
  // 🔹 Ambil data unik untuk dropdown
  const benuaList = [...new Set(KERJASAMA.map(k => k.benua).filter(Boolean))].sort();
  const negaraList = [...new Set(KERJASAMA.map(k => k.negara).filter(Boolean))].sort();
  const jenisMitraList = [...new Set(KERJASAMA.map(k => k.jenisMitra).filter(Boolean))].sort();

  // 🔹 Helper: isi select dengan preserve selected value
  const fillSelect = (id, items, placeholder = "Pilih...") => {
    const select = document.getElementById(id);
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = `<option value="">${placeholder}</option>`;
    
    items.forEach(item => {
      const opt = document.createElement("option");
      opt.value = item;
      opt.textContent = item;
      if (item.toLowerCase() === currentValue.toLowerCase()) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  };

  // 🔹 Isi dropdown
  fillSelect("filter-benua", benuaList, "Semua Benua");
  fillSelect("filter-negara", negaraList, "Semua Negara");
  fillSelect("filter-jenis-mitra", jenisMitraList, "Semua Jenis");
}

function resetKerjasamaFilters() {
  // Reset text search
  document.getElementById('filter-mitra').value = '';
  
  // Reset number filter (single)
  document.getElementById('filter-jumlah').value = '';
  
  // Reset dropdowns
  ['benua', 'negara', 'jenis-mitra'].forEach(id => {
    const el = document.getElementById(`filter-${id}`);
    if (el) el.value = '';
  });
  
  // Re-apply filter
  applyKerjasamaFilter();
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

  const filtered = getFilteredData(); // Filter data mentah dulu

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="p-4 text-center text-gray-500">
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
  
  // 🔥 FILTER JUMLAH IMPLEMENTASI (SETELAH GROUPING!)
  const filterJumlah = document.getElementById("filter-jumlah")?.value || "";
  
  if (filterJumlah) {
    const targetJumlah = parseInt(filterJumlah);
    
    // Filter grouped data berdasarkan jumlah
    Object.keys(grouped).forEach(mitra => {
      if (grouped[mitra].length !== targetJumlah) {
        delete grouped[mitra]; // Hapus mitra yang jumlahnya tidak match
      }
    });
  }
  
  const mitraList = Object.keys(grouped);

  // ===============================
  // CHECK IF EMPTY AFTER JUMLAH FILTER
  // ===============================
  if (mitraList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="p-4 text-center text-gray-500">
          Data tidak ditemukan
        </td>
      </tr>`;
    renderPagination(0);
    return;
  }

  // ===============================
  // PAGINATION (PER MITRA)
  // ===============================
  const total = mitraList.length;
  const start = (CURRENT_PAGE - 1) * PER_PAGE;
  const pageMitra = mitraList.slice(start, start + PER_PAGE);
  // 🔥 TAMBAHKAN DI ATAS FUNGSI
  const role = getRole(); // admin | user

  // ===============================
  // RENDER TABLE
  // ===============================
  let html = "";

  pageMitra.forEach((mitra) => {
    const items = grouped[mitra];
    const first = items[0];
    const safeMitra = mitra.replace(/"/g, "&quot;");
    const jumlahImplementasi = items.length; // 🔥 Hitung dari grouped data

    // 🔹 BARIS RINGKASAN MITRA
    html += `
      <tr class="bg-purple-50 font-semibold">
        <td class="p-3">${mitra}</td>
        <td class="p-3">${first.benua || "-"}</td>
        <td class="p-3">${first.negara || "-"}</td>
        <td class="p-3">${jumlahImplementasi} Kerjasama</td>
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
    <td class="p-3 text-sm">${d.noSurat || "-"}</td>
    <td class="p-3 text-sm">${d.jenisDokumen || "-"}</td>
    <td class="p-3 text-sm">${d.tingkat || "-"}</td>
    <td class="p-3 text-sm">${d.status || "-"}</td>
    <td class="p-3 text-sm">
      ${d.tahunMulai || "-"} – ${d.tahunBerakhir || "-"}
      <div class="flex gap-2 mt-1">
        <button
          onclick="openDetailKerjasama(${d.row})"
          class="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-lg"
        >🔍</button>
        <button
          onclick="openFile(${d.row})"
          class="w-7 h-7 bg-green-100 text-green-600 rounded-lg"
        >📎</button>
        
        <!-- 🔥 HANYA TAMPILKAN UNTUK ADMIN -->
        ${role === "admin" ? `
          <button
            onclick="deleteKerjasama(${d.row})"
            class="w-7 h-7 bg-red-100 text-red-600 rounded-lg"
          >🗑️</button>
        ` : ''}
      </div>
    </td>
  </tr>
`;
    }
  });

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
  // 🔥 1️⃣ RESET STATE
  IS_ADD_MODE = true;         // 🔥 MODE TAMBAH
  IS_EDIT_MODE = false;
  IS_ADD_MITRA_MODE = false;  // reset setiap buka form

  // 🔥 2️⃣ RESET FORM
  const editIndex = document.getElementById("editIndex");
  if (editIndex) editIndex.value = "";

  document.getElementById("modal-title").textContent = "Tambah Kerjasama";

  document
    .querySelectorAll(
      "#kerjasama-form input, #kerjasama-form textarea, #kerjasama-form select"
    )
    .forEach((el) => (el.value = ""));

  // 🔥 3️⃣ SET UI MODE (TAMBAH)
  setFormReadonly(false);
  document.getElementById("btn-edit").classList.add("hidden");
  document.getElementById("btn-save").classList.remove("hidden");

  // 🔥 4️⃣ LOAD SEMUA DATA AUTOCOMPLETE DULU
  // (biar AUTOCOMPLETE_DATA terisi sebelum user mulai interaksi)
  loadBenuaDropdown();              // isi AUTOCOMPLETE_DATA.benua
  await loadCountryDropdown(true);  // isi AUTOCOMPLETE_DATA.negara
  await initJenisMitraSelect();     // isi AUTOCOMPLETE_DATA.jenisMitra
  await renderFakultasSelect();     // isi AUTOCOMPLETE_DATA.unit
  
  // 🔥 5️⃣ LOAD DATA KERJASAMA DARI SHEET
  await loadKerjasamaFromSheet();

  // 🔥 6️⃣ TAMPILKAN MODAL
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
async function loadCountryDropdown(force = false, currentValue = "") {
  const input = document.getElementById("negara");

  const COUNTRY_LIST = [
    "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Australia","Austria",
    "Bangladesh","Belgium","Brazil","Brunei Darussalam","Cambodia","Canada","China","Denmark",
    "Egypt","France","Germany","India","Indonesia","Iran","Iraq","Ireland","Italy","Japan",
    "Jordan","Kenya","Kuwait","Laos","Malaysia","Mexico","Morocco","Myanmar","Netherlands",
    "New Zealand","Nigeria","Norway","Pakistan","Philippines","Qatar","Russia","Saudi Arabia",
    "Singapore","South Africa","South Korea","Spain","Sri Lanka","Sweden","Switzerland",
    "Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam",
    "Yemen","Zimbabwe"
  ];

  try {
    const res = await fetch("https://restcountries.com/v3.1/all?fields=name");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const countries = data.map(c => c.name.common).sort((a,b) => a.localeCompare(b));
    setAutocompleteData("negara", countries);
    console.log("Autocomplete negara siap (API):", countries.length);
  } catch (err) {
    console.warn("Gagal load countries API, pakai fallback list", err);
    setAutocompleteData("negara", COUNTRY_LIST.sort());
  }

  if (input && currentValue) input.value = currentValue;
}
function loadBenuaDropdown(currentValue = "") {
  const BENUA_LIST = [
    "Asia Tenggara", "Asia Timur", "Asia Selatan", "Asia Tengah", "Asia Barat (Timur Tengah)",
    "Eropa Barat", "Eropa Timur", "Eropa Utara", "Eropa Selatan",
    "Amerika Utara", "Amerika Tengah", "Amerika Selatan", "Karibia",
    "Afrika Utara", "Afrika Barat", "Afrika Tengah", "Afrika Timur", "Afrika Selatan",
    "Australia & Selandia Baru", "Melanesia", "Mikronesia", "Polinesia",
  ];

  setAutocompleteData("benua", BENUA_LIST);

  const input = document.getElementById("benua");
  if (input && currentValue) input.value = currentValue;

  console.log("Autocomplete benua siap:", BENUA_LIST.length);
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
/* ===============================
   GENERIC AUTOCOMPLETE (Benua, Negara, Unit, Jenis Mitra, Jenis Dokumen)
=============================== */

// Cache data untuk setiap field autocomplete
const AUTOCOMPLETE_DATA = {
  benua: [],
  negara: [],
  unit: [],
  jenisMitra: [],
  
};

// Set data untuk field tertentu
function setAutocompleteData(fieldId, dataArray) {
  AUTOCOMPLETE_DATA[fieldId] = (dataArray || []).filter(Boolean);
}

// Filter dropdown berdasarkan keyword
function filterAutocomplete(fieldId, forceShow = false) {
  const input = document.getElementById(fieldId);
  const dropdown = document.getElementById(`${fieldId}-dropdown`);
  if (!input || !dropdown) return;

  const data = AUTOCOMPLETE_DATA[fieldId] || [];
  const keyword = input.value.toLowerCase().trim();

  const filtered = keyword
    ? data.filter(x => x.toLowerCase().includes(keyword))
    : data;

  dropdown.innerHTML = "";

  if (!filtered.length && !forceShow) {
    dropdown.classList.add("hidden");
    return;
  }

  // Kalau tidak ada hasil tapi user mengetik, tampilkan pesan
  if (!filtered.length && forceShow) {
    dropdown.classList.add("hidden");
    return;
  }

  filtered.forEach(item => {
    const div = document.createElement("div");
    div.textContent = item;
    div.className = "px-3 py-2 text-sm cursor-pointer hover:bg-purple-100";

    // Pakai mousedown agar tidak konflik dengan blur/click outside
    div.onmousedown = (e) => {
      e.preventDefault();
      input.value = item;
      dropdown.classList.add("hidden");
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };

    dropdown.appendChild(div);
  });

  dropdown.classList.remove("hidden");
}

// Tampilkan semua opsi saat input diklik
function showAllAutocomplete(fieldId) {
  const input = document.getElementById(fieldId);
  if (!input) return;

  // Jangan kosongkan value saat klik (biar user bisa lihat list sambil tetap ada nilai)
  filterAutocomplete(fieldId, true);
}

// Tutup dropdown saat klik di luar wrapper
document.addEventListener("click", (e) => {
  const fields = ["benua", "negara", "unit", "jenisMitra"];
  fields.forEach(fieldId => {
    const wrapper = document.getElementById(`${fieldId}-wrapper`);
    const dropdown = document.getElementById(`${fieldId}-dropdown`);
    if (wrapper && dropdown && !wrapper.contains(e.target)) {
      dropdown.classList.add("hidden");
    }
  });
});
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
async function initJenisMitraSelect(selectedValue = "") {
  if (!Array.isArray(window.JENIS_MITRA) || window.JENIS_MITRA.length === 0) {
    if (typeof loadJenisMitra === "function") {
      await loadJenisMitra();
    }
  }

  const data = Array.isArray(window.JENIS_MITRA)
    ? window.JENIS_MITRA.map(x => x.nama).filter(Boolean)
    : [];

  setAutocompleteData("jenisMitra", data);

  const input = document.getElementById("jenisMitra");
  if (input && selectedValue) input.value = selectedValue;
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
  const input = document.getElementById("unit");
  if (!input) return;

  if (
    (!Array.isArray(FAKULTAS) || FAKULTAS.length === 0) &&
    typeof loadFakultas === "function"
  ) {
    await loadFakultas();
  }

  const data = window.getFakultasData?.() || [];
  setAutocompleteData("unit", data);

  if (selectedValue) input.value = selectedValue;
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
    // ✅ Ambil tahun langsung dari string YYYY-MM-DD
    tahunMulai.value = tglMulai.value.split("-")[0];
  } else {
    tahunMulai.value = "";
  }

  if (tglBerakhir?.value) {
    tahunBerakhir.value = tglBerakhir.value.split("-")[0];
  } else {
    tahunBerakhir.value = "";
  }
}
function toDateInputValue(val) {
  if (!val) return "";
  
  // ✅ Jika sudah format YYYY-MM-DD, kembalikan langsung
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  
  // ✅ Handle format MM/DD/YYYY (dari Google Sheets US format)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) {
    const [m, d, y] = val.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  
  // ✅ Handle format DD/MM/YYYY (jika diperlukan)
  // Jika Anda pakai format Indonesia, swap m dan d di bawah:
  // const [d, m, y] = val.split("/");
  
  // ✅ Fallback: Date object / timestamp - gunakan LOCAL date components
  const dt = new Date(val);
  if (!isNaN(dt)) {
    // ⚠️ PENTING: Gunakan getFullYear/getMonth/getDate untuk ambil tanggal LOKAL
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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

  // ✅ Parse tanggal tanpa timezone shift: gunakan komponen lokal
  const [y, m, d] = tglBerakhirVal.split("-").map(Number);
  const end = new Date(y, (m || 1) - 1, d || 1); // Month 0-indexed
  const now = new Date();
  
  // ✅ Reset waktu ke midnight untuk perbandingan tanggal yang akurat
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (isNaN(end)) return "Tidak Aktif";
  if (end < now) return "Tidak Aktif";

  // Hitung selisih
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

function hitungKeterangan(tglBerakhirVal) {
  if (!tglBerakhirVal) return "Aktif";
  
  const [y, m, d] = tglBerakhirVal.split("-").map(Number);
  const end = new Date(y, (m || 1) - 1, d || 1);
  const now = new Date();
  
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  if (isNaN(end)) return "Aktif";
  
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
  const role = getRole();
  
  // 🔥 BLOKIR USER NON-ADMIN
  if (role !== "admin") {
    alert("Anda tidak memiliki izin untuk menyimpan data.");
    return;
  }
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
  const role = getRole(); // 🔥 CEK ROLE

  try {
    IS_ADD_MODE = false; // 🔥 BUKAN TAMBAH
    IS_EDIT_MODE = true; // 🔥 MODE DETAIL / EDIT

    // 🔍 Cari data berdasarkan row
    const idx = KERJASAMA.findIndex((x) => Number(x.row) === Number(sheetRow));
    if (idx === -1) {
      alert("Data tidak ditemukan");
      return;
    }

    const d = KERJASAMA[idx];

    const ei = getEditIndex();
    if (ei) ei.value = d.row;

    // 🔥 1️⃣ LOAD SEMUA DATA AUTOCOMPLETE DULU
    // (biar AUTOCOMPLETE_DATA terisi sebelum value di-set)
    await loadCountryDropdown(true);   // isi AUTOCOMPLETE_DATA.negara
    loadBenuaDropdown();               // isi AUTOCOMPLETE_DATA.benua
    await initJenisMitraSelect();      // isi AUTOCOMPLETE_DATA.jenisMitra
    await renderFakultasSelect();      // isi AUTOCOMPLETE_DATA.unit
    

    // 🔥 2️⃣ BARU SET VALUE DARI DATA
    Object.keys(d).forEach((k) => {
      const el = document.getElementById(k);
      if (!el) return;

      if (el.type === "date") {
        el.value = toDateInputValue(d[k]); // 🔥 FIX format tanggal
      } else {
        el.value = d[k] ?? "";
      }
    });

    // 🔥 3️⃣ SYNC FIELD TURUNAN
    syncTahunFromTanggal();
    syncStatusKerjasama();

    document.getElementById("modal-title").textContent = "Detail Kerjasama";

    // 🔥 FORM SELALU READONLY UNTUK USER
    setFormReadonly(true || role !== "admin");

    // 🔥 HANYA ADMIN LIHAT TOMBOL EDIT
    const btnEdit = document.getElementById("btn-edit");
    if (btnEdit) {
      if (role === "admin") {
        btnEdit.classList.remove("hidden");
      } else {
        btnEdit.classList.add("hidden");
      }
    }
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

  // 🔥 Tidak perlu passing selectedValue, karena value sudah ada di input
  await initJenisMitraSelect();
  await renderFakultasSelect();
  renderJenisDokumenSelect();

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
  const role = getRole();
  
  // 🔥 BLOKIR USER NON-ADMIN
  if (role !== "admin") {
    alert("Anda tidak memiliki izin untuk menghapus data.");
    return;
  }
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
// 🔥 TERAPKAN ROLE SAAT FORM DI-BIND
  const role = getRole();
  
  if (role !== "admin") {
    // Sembunyikan tombol submit/save
    const btnSave = document.getElementById("btn-save");
    if (btnSave) btnSave.classList.add("hidden");
    
    // Nonaktifkan input (opsional, sebagai UX tambahan)
    document.querySelectorAll("#kerjasama-form input, #kerjasama-form textarea")
      .forEach(el => {
        if (!ALWAYS_READONLY_FIELDS.includes(el.id)) {
          el.readOnly = true;
        }
      });
  }
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
// 🔍 Debug helper - panggil di console untuk cek
function debugDate(val, label = "") {
  console.log(`📅 ${label}:`, {
    original: val,
    toDateInputValue: toDateInputValue(val),
    newDate: new Date(val),
    local: new Date(val).toLocaleDateString('id-ID')
  });
}
