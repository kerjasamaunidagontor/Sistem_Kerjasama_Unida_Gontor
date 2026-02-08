const TOTAL_PRODI = 21; // t = jumlah prodi S1 + D4/D3/D2

if (window.__NILAI_IKU_LOADED__) {
  console.warn("nilai-iku.js sudah dimuat");
} else {
  window.__NILAI_IKU_LOADED__ = true;
}

/* ===============================
   DATA KEGIATAN (MANDIRI)
================================ */

async function loadKegiatanForIku() {
  try {
    if (Array.isArray(window.KEGIATAN) && window.KEGIATAN.length > 0) {
      // sudah ada dari kegiatan.js
      return;
    }

    const res = await fetch(API.kegiatan);
    const json = await res.json();
    window.KEGIATAN = Array.isArray(json) ? json : [];
  } catch (err) {
    console.error("Load kegiatan IKU gagal:", err);
    window.KEGIATAN = [];
  }
}

/* ===============================
   KONFIG & UTIL
================================ */
const NILAI_IKU_KEY = "nilaiIkuData";

function normalize(text) {
  return text?.toString().trim().toLowerCase();
}

/* ===============================
   NILAI IKU (LOCAL STORAGE)
================================ */
function getNilaiIku() {
  return JSON.parse(localStorage.getItem(NILAI_IKU_KEY)) || {};
}

function saveNilaiIku(data) {
  localStorage.setItem(NILAI_IKU_KEY, JSON.stringify(data));
}

/* ===============================
   JENIS MITRA (DARI jenis-mitra.js)
================================ */
function getJenisMitra() {
  if (!Array.isArray(window.JENIS_MITRA)) return [];

  return window.JENIS_MITRA.map((m) => ({
    id: Number(m.row), // ID stabil
    row: Number(m.row), // dipakai update API
    nama: (m.nama || "").trim(),
    nilai_iku: Number(m.nilai_iku) || 0, // 🔥 SUMBER NILAI
  }));
}

/* ===============================
   HITUNG DOKUMEN
================================ */
function hitungDokumenByJenisMitra(namaJenisMitra, tipe) {
  if (!Array.isArray(window.KEGIATAN)) return 0;

  const targetMitra = normalize(namaJenisMitra);
  const targetTipe = normalize(tipe);

  const tahunDipilih = document.getElementById("filterTahunIku")?.value || "";

  const fakultasDipilih =
    document.getElementById("filterFakultasIku")?.value || "";

  return window.KEGIATAN.filter((k) => {
    const jm = normalize(k.jenisMitra);
    const jd = normalize(k.jenisDokumen);

    /* =====================
       FILTER TAHUN
    ===================== */
    if (tahunDipilih) {
      const tgl =
        k.tanggal || k.tanggalMulai || k.tglKegiatan || k.tanggalKegiatan;

      const year = new Date(tgl).getFullYear();
      if (year.toString() !== tahunDipilih) return false;
    }

    /* =====================
       FILTER FAKULTAS
    ===================== */
    if (fakultasDipilih) {
      const fakultas =
        k.fakultas || k.namaFakultas || k.fakultasSatker || k.unit;

      if (!normalize(fakultas)?.includes(normalize(fakultasDipilih))) {
        return false;
      }
    }

    /* =====================
       FILTER JENIS
    ===================== */
    return (
      jm?.includes(targetMitra) &&
      ((targetTipe === "moa" && jd?.includes("moa")) ||
        (targetTipe === "ia" &&
          (jd?.includes("ia") || jd?.includes("implementation"))))
    );
  }).length;
}

/* ===============================
   RENDER NILAI IKU
================================ */
function renderNilaiIku() {
  const tbody = document.getElementById("nilaiIkuBody");
  if (!tbody) return;

  const jenisMitra = getJenisMitra();
  const nilaiIku = getNilaiIku();

  let totalMoa = 0;
  let totalIa = 0;
  let totalJumlah = 0;
  let totalNilaiAkhir = 0;

  tbody.innerHTML = "";

  if (jenisMitra.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-6 text-gray-400">
          Jenis Mitra belum tersedia
        </td>
      </tr>
    `;
    return;
  }

  jenisMitra.forEach((mitra) => {
    const moa = hitungDokumenByJenisMitra(mitra.nama, "moa");
    const ia = hitungDokumenByJenisMitra(mitra.nama, "ia");

    const nilai = Number(mitra.nilai_iku) || 0; // k
    const jumlah = moa + ia; // n

    const nilaiAkhir = ((jumlah * nilai) / TOTAL_PRODI) * 100;

    totalMoa += moa;
    totalIa += ia;
    totalJumlah += jumlah;
    totalNilaiAkhir += nilaiAkhir;

    const tr = document.createElement("tr");
    tr.innerHTML = `
    <td class="border px-3 py-2">${mitra.nama}</td>
    <td class="border px-3 py-2 text-center">${moa}</td>
    <td class="border px-3 py-2 text-center">${ia}</td>

    <td class="border px-3 py-2 text-center bg-gray-100 text-gray-700">
      ${nilai}
    </td>

    <td class="border px-3 py-2 text-center">${jumlah}</td>
    <td class="border px-3 py-2 text-center">
      ${nilaiAkhir.toFixed(2)}
    </td>
  `;
    tbody.appendChild(tr);
  });

  document.getElementById("totalMoa").innerText = totalMoa;
  document.getElementById("totalIa").innerText = totalIa;
  document.getElementById("totalJumlah").innerText = totalJumlah;
  document.getElementById("totalNilaiAkhir").innerText =
    totalNilaiAkhir.toFixed(2);
}

/* ===============================
    EDIT NILAI IKU
================================ */
async function updateNilaiIku(el) {
  if (!isAdmin()) return;

  const row = Number(el.dataset.row);
  let nilai = parseFloat(el.innerText.replace(",", "."));

  if (isNaN(nilai) || nilai < 0) nilai = 0;

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        sheet: "JENIS MITRA",
        row: row,
        data: { nilai_iku: nilai },
      }),
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.message || "Update gagal");

    // update local state biar langsung sinkron
    const m = window.JENIS_MITRA.find((x) => x.row === row);
    if (m) m.nilai_iku = nilai;

    el.innerText = nilai;
    el.dataset.value = nilai;
  } catch (err) {
    console.error(err);
    alert("Gagal menyimpan nilai IKU");
    el.innerText = el.dataset.value || 0;
  }
}

function handleNilaiKey(e, el) {
  if (e.key === "Enter") {
    e.preventDefault();
    el.blur();
  }
}
document.addEventListener("input", (e) => {
  if (e.target.matches("[contenteditable][data-id]")) {
    e.target.innerText = e.target.innerText.replace(/[^0-9.,]/g, "");
  }
});

/* ===============================
   CEK ADMIN
================================ */
function isAdmin() {
  return (
    localStorage.getItem("isLogin") === "true" &&
    localStorage.getItem("role") === "admin"
  );
}

/* ===============================
   INIT (URUTAN WAJIB)
================================ */
async function initNilaiIku() {
  // 1. Load jenis mitra
  if (typeof loadJenisMitra === "function") {
    await loadJenisMitra();
  }

  // 2. Load kegiatan
  await loadKegiatanForIku();

  initFilterTahunIku(); // ⬅️ TAMBAH INI
  initFilterFakultasIku(); // ⬅️ TAMBAH INI

  // 3. Render
  if (Array.isArray(window.JENIS_MITRA) && window.JENIS_MITRA.length > 0) {
    renderNilaiIku();
  }
}

function initFilterTahunIku() {
  const select = document.getElementById("filterTahunIku");
  if (!select || !Array.isArray(window.KEGIATAN)) return;

  const tahunSet = new Set();

  window.KEGIATAN.forEach((k) => {
    // sesuaikan field tanggal kegiatan kamu
    const tgl =
      k.tanggal || k.tanggalMulai || k.tglKegiatan || k.tanggalKegiatan;

    if (!tgl) return;

    const year = new Date(tgl).getFullYear();
    if (!isNaN(year)) tahunSet.add(year);
  });

  [...tahunSet]
    .sort((a, b) => b - a)
    .forEach((tahun) => {
      const opt = document.createElement("option");
      opt.value = tahun;
      opt.textContent = tahun;
      select.appendChild(opt);
    });
}
function initFilterFakultasIku() {
  const select = document.getElementById("filterFakultasIku");
  if (!select || !Array.isArray(window.KEGIATAN)) return;

  const fakultasSet = new Set();

  window.KEGIATAN.forEach((k) => {
    const fakultas = k.fakultas || k.namaFakultas || k.fakultasSatker || k.unit; // sesuaikan field kamu

    if (fakultas) {
      fakultasSet.add(fakultas.trim());
    }
  });

  [...fakultasSet]
    .sort((a, b) => a.localeCompare(b))
    .forEach((fakultas) => {
      const opt = document.createElement("option");
      opt.value = fakultas;
      opt.textContent = fakultas;
      select.appendChild(opt);
    });
}
