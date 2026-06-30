/* ===============================
   TAMBAH MITRA (READ-ONLY)
   Data diambil langsung dari KERJASAMA (kerjasama.js)
   Jika ada mitra yang sama (dobel), hanya ditampilkan 1 saja
=============================== */
// 🔥 CONFIG PAGINATION
let TM_CURRENT_PAGE = 1;
const TM_PER_PAGE = 50;

let renderInterval = null;
let maxAttempts = 0;

// 🔥 SEARCH & FILTER STATE
let TM_SEARCH_KEY = "";
let TM_FILTER_NAMA = "";
let TM_FILTER_NEGARA = "";
let TM_FILTER_JENIS = "";
let TM_FILTER_TINGKAT = "";

/* ===============================
   AMBIL DATA MITRA UNIK
=============================== */
function getUniqueMitraList() {
  if (!window.KERJASAMA || !Array.isArray(window.KERJASAMA) || window.KERJASAMA.length === 0) {
    return [];
  }

  const grouped = {};
  window.KERJASAMA.forEach((item) => {
    const key = (item.mitra || "Tanpa Mitra").trim();
    if (!grouped[key]) {
      grouped[key] = {
        mitra: item.mitra || "-",
        negara: item.negara || "-",
        jenisMitra: item.jenisMitra || "-",
        tingkat: item.tingkat || "-",
      };
    }
  });

  return Object.values(grouped);
}

/* ===============================
   APPLY FILTER (GLOBAL + PER KOLOM)
=============================== */
function applyMitraFilter() {
  // Update filter values
  TM_SEARCH_KEY = document.getElementById("search-mitra")?.value.toLowerCase() || "";
  TM_FILTER_NAMA = document.getElementById("filter-nama-mitra")?.value.toLowerCase() || "";
  TM_FILTER_NEGARA = document.getElementById("filter-negara")?.value || "";
  TM_FILTER_JENIS = document.getElementById("filter-jenis-mitra")?.value || "";
  TM_FILTER_TINGKAT = document.getElementById("filter-tingkat")?.value || "";

  // Reset ke halaman 1
  TM_CURRENT_PAGE = 1;
  renderTM();
}

/* ===============================
   GET FILTERED DATA
=============================== */
function getFilteredMitraData() {
  let data = getUniqueMitraList();

  // 🔍 Global search
  if (TM_SEARCH_KEY) {
    data = data.filter(item => 
      Object.values(item).some(val => 
        String(val ?? "").toLowerCase().includes(TM_SEARCH_KEY)
      )
    );
  }

  // 🔍 Filter per kolom
  if (TM_FILTER_NAMA) {
    data = data.filter(item => 
      (item.mitra ?? "").toLowerCase().includes(TM_FILTER_NAMA)
    );
  }

  if (TM_FILTER_NEGARA) {
    data = data.filter(item => 
      (item.negara ?? "").toLowerCase() === TM_FILTER_NEGARA.toLowerCase()
    );
  }

  if (TM_FILTER_JENIS) {
    data = data.filter(item => 
      (item.jenisMitra ?? "").toLowerCase() === TM_FILTER_JENIS.toLowerCase()
    );
  }

  if (TM_FILTER_TINGKAT) {
    data = data.filter(item => 
      (item.tingkat ?? "").toLowerCase() === TM_FILTER_TINGKAT.toLowerCase()
    );
  }

  return data;
}

/* ===============================
   POPULATE DROPDOWN FILTERS
=============================== */
function populateMitraFilters() {
  const data = getUniqueMitraList();

  // 🔹 Ambil data unik untuk dropdown
  const negaraList = [...new Set(data.map(d => d.negara).filter(Boolean))].sort();
  const jenisMitraList = [...new Set(data.map(d => d.jenisMitra).filter(Boolean))].sort();
  const tingkatList = [...new Set(data.map(d => d.tingkat).filter(Boolean))].sort();

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
  fillSelect("filter-negara", negaraList, "Semua Negara");
  fillSelect("filter-jenis-mitra", jenisMitraList, "Semua Jenis");
  fillSelect("filter-tingkat", tingkatList, "Semua Tingkat");
}

/* ===============================
   RESET FILTERS
=============================== */
function resetMitraFilters() {
  // Reset text search
  document.getElementById('search-mitra').value = '';
  document.getElementById('filter-nama-mitra').value = '';
  
  // Reset dropdowns
  ['filter-negara', 'filter-jenis-mitra', 'filter-tingkat'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  
  // Re-apply filter
  applyMitraFilter();
}

/* ===============================
   RENDER TABEL + PAGINATION
=============================== */
function renderTM() {
  const tb = document.getElementById("tambahMitraBody");
  if (!tb) {
    console.log('⚠️ Element tambahMitraBody tidak ditemukan');
    return false;
  }

  tb.innerHTML = "";

  // 🔥 POPULATE FILTERS (hanya sekali)
  if (!window._mitraFiltersPopulated) {
    populateMitraFilters();
    window._mitraFiltersPopulated = true;
  }

  const list = getFilteredMitraData();

  // 🔥 CEK DATA KOSONG
  if (list.length === 0) {
    if (!window.KERJASAMA || window.KERJASAMA.length === 0) {
      tb.innerHTML = `
        <tr>
          <td colspan="5" class="p-4 text-center text-gray-500">
            <div class="flex items-center justify-center gap-2">
              <div class="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Memuat data mitra...</span>
            </div>
          </td>
        </tr>`;
      return false;
    } else {
      tb.innerHTML = `
        <tr>
          <td colspan="5" class="p-4 text-center text-gray-500">
            Tidak ada data mitra yang sesuai filter
          </td>
        </tr>`;
      renderTMPagination(0);
      return true;
    }
  }

  // 🔥 PAGINATION LOGIC
  const total = list.length;
  const pageCount = Math.ceil(total / TM_PER_PAGE);

  if (TM_CURRENT_PAGE > pageCount) TM_CURRENT_PAGE = 1;

  const start = (TM_CURRENT_PAGE - 1) * TM_PER_PAGE;
  const end = Math.min(start + TM_PER_PAGE, total);
  const pageData = list.slice(start, end);

  // 🔥 RENDER TABEL
  let html = "";
  pageData.forEach((v, i) => {
    const no = start + i + 1;
    html += `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="border px-3 py-2 text-center font-medium">${no}</td>
        <td class="border px-3 py-2 font-semibold text-slate-700">${v.mitra}</td>
        <td class="border px-3 py-2">${v.negara}</td>
        <td class="border px-3 py-2">${v.jenisMitra}</td>
        <td class="border px-3 py-2">${v.tingkat}</td>
      </tr>`;
  });

  tb.innerHTML = html;
  renderTMPagination(total);

  return true;
}

/* ===============================
   RENDER PAGINATION
=============================== */
function renderTMPagination(total) {
  const pagination = document.getElementById("tm-pagination");
  const info = document.getElementById("tm-pagination-info");

  if (!pagination || !info) return;

  const pageCount = Math.ceil(total / TM_PER_PAGE);
  pagination.innerHTML = "";

  if (total === 0) {
    info.textContent = "Menampilkan 0 data";
  } else {
    const start = (TM_CURRENT_PAGE - 1) * TM_PER_PAGE + 1;
    const end = Math.min(TM_CURRENT_PAGE * TM_PER_PAGE, total);
    info.textContent = `Menampilkan ${start} - ${end} dari ${total} data`;
  }

  // Prev
  pagination.innerHTML += `
    <button 
      onclick="goToTMPage(${Math.max(1, TM_CURRENT_PAGE - 1)})"
      ${TM_CURRENT_PAGE === 1 ? 'disabled' : ''}
      class="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
      ◀
    </button>
  `;

  // Page Numbers
  const maxVisible = 5;
  let startPage = Math.max(1, TM_CURRENT_PAGE - Math.floor(maxVisible / 2));
  let endPage = Math.min(pageCount, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    pagination.innerHTML += tmPageButton(1);
    if (startPage > 2) pagination.innerHTML += tmEllipsis();
  }

  for (let i = startPage; i <= endPage; i++) {
    pagination.innerHTML += tmPageButton(i);
  }

  if (endPage < pageCount) {
    if (endPage < pageCount - 1) pagination.innerHTML += tmEllipsis();
    pagination.innerHTML += tmPageButton(pageCount);
  }

  // Next
  pagination.innerHTML += `
    <button 
      onclick="goToTMPage(${Math.min(pageCount, TM_CURRENT_PAGE + 1)})"
      ${TM_CURRENT_PAGE === pageCount || pageCount === 0 ? 'disabled' : ''}
      class="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
      ▶
    </button>
  `;
}

function tmPageButton(page) {
  const active = page === TM_CURRENT_PAGE;
  return `
    <button 
      onclick="goToTMPage(${page})"
      class="px-3 py-1 rounded-lg border ${
        active 
          ? 'bg-blue-600 text-white border-blue-600' 
          : 'hover:bg-gray-100'
      }">
      ${page}
    </button>
  `;
}

function tmEllipsis() {
  return `<span class="px-2 text-gray-400">...</span>`;
}

function goToTMPage(page) {
  TM_CURRENT_PAGE = page;
  renderTM();
  document.getElementById("tambahMitraBody")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ===============================
   EXPORT FUNCTIONS
=============================== */
function downloadMitraCSV() {
  const data = getFilteredMitraData();

  if (!data.length) {
    alert("Tidak ada data untuk didownload");
    return;
  }

  const headers = ["No", "Nama Mitra", "Negara", "Jenis Mitra", "Tingkat"];
  const rows = data.map((d, i) => [i + 1, d.mitra, d.negara, d.jenisMitra, d.tingkat]);

  let csvContent = headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "daftar-mitra.csv";
  a.click();
}

function downloadMitraExcel() {
  const data = getFilteredMitraData();

  if (!data.length) {
    alert("Tidak ada data untuk didownload");
    return;
  }

  const formatted = data.map((d, i) => ({
    No: i + 1,
    "Nama Mitra": d.mitra,
    Negara: d.negara,
    "Jenis Mitra": d.jenisMitra,
    Tingkat: d.tingkat,
  }));

  const worksheet = XLSX.utils.json_to_sheet(formatted);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Mitra");
  XLSX.writeFile(workbook, "daftar-mitra.xlsx");
}

function downloadMitraPDF() {
  const data = getFilteredMitraData();

  if (!data.length) {
    alert("Tidak ada data untuk didownload");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const tableData = data.map((d, i) => [i + 1, d.mitra, d.negara, d.jenisMitra, d.tingkat]);

  doc.text("Daftar Mitra", 14, 10);

  doc.autoTable({
    head: [["No", "Nama Mitra", "Negara", "Jenis Mitra", "Tingkat"]],
    body: tableData,
    startY: 20,
    styles: { fontSize: 8 },
  });

  doc.save("daftar-mitra.pdf");
}

/* ===============================
   INIT DENGAN POLLING (DIPERBAIKI)
=============================== */
function initTambahMitra() {
  console.log('🚀 initTambahMitra dipanggil');

  // 🔥 PERBAIKAN: Cek dulu apakah elemen ada sebelum polling
  const tb = document.getElementById("tambahMitraBody");
  if (!tb) {
    console.log('ℹ️ Halaman ini bukan halaman Tambah Mitra, polling dilewati.');
    return; // ⛔ JANGAN lanjut ke polling!
  }

  TM_CURRENT_PAGE = 1;

  if (renderInterval) {
    clearInterval(renderInterval);
    renderInterval = null;
  }

  maxAttempts = 0;
  const success = renderTM();

  if (!success) {
    console.log('⏳ Memulai polling untuk menunggu data KERJASAMA...');

    renderInterval = setInterval(() => {
      maxAttempts++;
      console.log(`🔄 Polling attempt ${maxAttempts}/40...`);

      // 🔥 PERBAIKAN: Cek lagi apakah elemen masih ada
      const tbCheck = document.getElementById("tambahMitraBody");
      if (!tbCheck) {
        console.log('ℹ️ Elemen hilang, polling dihentikan.');
        clearInterval(renderInterval);
        renderInterval = null;
        return;
      }

      const success = renderTM();

      if (success || maxAttempts >= 40) {
        clearInterval(renderInterval);
        renderInterval = null;

        if (!success) {
          console.warn('⚠️ Timeout: Data KERJASAMA tidak muncul setelah 20 detik');
          if (tbCheck) {
            tbCheck.innerHTML = `
              <tr>
                <td colspan="5" class="p-4 text-center text-red-500">
                  ⚠️ Gagal memuat data mitra. Silakan refresh halaman.
                </td>
              </tr>`;
          }
        } else {
          console.log('✅ Data mitra berhasil dimuat!');
        }
      }
    }, 500);
  }

  // Hook ke loadKerjasamaFromSheet
  const originalLoad = window.loadKerjasamaFromSheet;
  if (typeof originalLoad === "function" && !window._tmHookInstalled) {
    window.loadKerjasamaFromSheet = async function (...args) {
      console.log('🔄 loadKerjasamaFromSheet dipanggil, akan re-render mitra');
      const result = await originalLoad.apply(this, args);
      window._mitraFiltersPopulated = false;
      TM_CURRENT_PAGE = 1;
      renderTM();
      return result;
    };
    window._tmHookInstalled = true;
    console.log('✅ Hook installed ke loadKerjasamaFromSheet');
  }
}

/* ===============================
   MANUAL TRIGGER
=============================== */
window.refreshMitraTable = function() {
  console.log('🔄 Manual refresh dipanggil');
  if (renderInterval) {
    clearInterval(renderInterval);
    renderInterval = null;
  }
  TM_CURRENT_PAGE = 1;
  window._mitraFiltersPopulated = false;
  initTambahMitra();
};
