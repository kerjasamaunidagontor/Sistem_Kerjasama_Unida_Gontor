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
  if (Array.isArray(window.JENIS_MITRA) && window.JENIS_MITRA.length > 0) {
    return window.JENIS_MITRA.map((m, i) => ({
      id: m.id ?? m.row ?? i + 1,
      nama: m.nama?.trim(),
    }));
  }
  return [];
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

    const nilai = nilaiIku[mitra.id]?.nilai || 0;
    const jumlah = moa + ia;
    const nilaiAkhir = jumlah * nilai;

    totalMoa += moa;
    totalIa += ia;
    totalJumlah += jumlah;
    totalNilaiAkhir += nilaiAkhir;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="border px-3 py-2">${mitra.nama}</td>
      <td class="border px-3 py-2 text-center">${moa}</td>
      <td class="border px-3 py-2 text-center">${ia}</td>
      <td
  class="border px-3 py-2 text-center ${
    isAdmin() ? "bg-yellow-50 cursor-text" : "bg-gray-100 text-gray-500"
  }"
  ${isAdmin() ? 'contenteditable="true"' : ""}
  data-id="${mitra.id}"
  ${isAdmin() ? 'onblur="updateNilaiIku(this)"' : ""}
  ${isAdmin() ? 'onkeydown="handleNilaiKey(event, this)"' : ""}
>
  ${nilai}
</td>


      <td class="border px-3 py-2 text-center">${jumlah}</td>
      <td class="border px-3 py-2 text-center">${nilaiAkhir.toFixed(2)}</td>
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
function updateNilaiIku(el) {
  if (!isAdmin()) {
    renderNilaiIku(); // balikin tampilan
    return;
  }

  const id = el.dataset.id;
  let value = parseFloat(el.innerText.replace(",", "."));

  if (isNaN(value) || value < 0) value = 0;

  const data = getNilaiIku();
  data[id] = { ...(data[id] || {}), nilai: value };
  saveNilaiIku(data);

  renderNilaiIku();
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
