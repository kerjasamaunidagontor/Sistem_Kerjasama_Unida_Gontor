// URL web app Apps Script
const API_BASE =
  "https://script.google.com/macros/s/AKfycbzHzKcm-fPEVOfKeU9iWoC3OcaDiR-G2hoMEh868zO1d0KpGeTUXI8sA1ljP658gjSWxQ/exec";

let BENTUK_KEGIATAN = [];
const SHEET_BENTUK = "BENTUK KEGIATAN";

/* ===============================
   API
================================= */
async function fetchBentukKegiatan() {
  const res = await fetch(
    `${API_BASE}?sheet=${encodeURIComponent(SHEET_BENTUK)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );
  return await res.json();
}

async function createBentukKegiatan(nama) {
  const res = await fetch(API_BASE, {
    method: "POST",
    body: JSON.stringify({
      action: "create",
      sheet: SHEET_BENTUK,
      data: { nama },
    }),
  });
  return await res.json();
}

async function updateBentukKegiatan(row, nama) {
  const res = await fetch(API_BASE, {
    method: "POST",
    body: JSON.stringify({
      action: "update",
      sheet: SHEET_BENTUK,
      row,
      data: { nama },
    }),
  });
  return await res.json();
}

async function deleteBentukKegiatanAPI(row) {
  const res = await fetch(API_BASE, {
    method: "POST",
    body: JSON.stringify({
      action: "delete",
      sheet: SHEET_BENTUK,
      row,
    }),
  });
  return await res.json();
}

/* ===============================
   RENDER
================================= */
function renderBentukKegiatan() {
  const tbody = document.getElementById("bentukKegiatanBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  BENTUK_KEGIATAN.forEach((item, i) => {
    tbody.innerHTML += `
      <tr>
        <td class="border px-3 py-2 text-center">${i + 1}</td>
        <td class="border px-3 py-2">${item.nama}</td>
        <td class="border px-3 py-2 text-center">
          <button onclick="editBentukKegiatan(${item.row}, '${escapeForJS(item.nama)}')">✏️</button>
          <button onclick="hapusBentukKegiatan(${item.row})">🗑️</button>
        </td>
      </tr>
    `;
  });
}

function escapeForJS(s) {
  return String(s).replace(/'/g, "\\'").replace(/\n/g, "\\n");
}

/* ===============================
   ACTION
================================= */
async function loadBentukKegiatan() {
  try {
    BENTUK_KEGIATAN = await fetchBentukKegiatan();

    // 🔥 expose ke global
    window.BENTUK_KEGIATAN = BENTUK_KEGIATAN || [];
  } catch (err) {
    console.error("Gagal load bentuk kegiatan:", err);
    BENTUK_KEGIATAN = [];
    window.BENTUK_KEGIATAN = [];
  }

  renderBentukKegiatan();
}

function openCreateBentukKegiatan() {
  bentukKegiatanIndex.value = "";
  bentukKegiatanNama.value = "";
  bentukKegiatanModal.classList.remove("hidden");
}

function closeBentukKegiatan() {
  bentukKegiatanModal.classList.add("hidden");
}

async function saveBentukKegiatan() {
  const nama = bentukKegiatanNama.value.trim();
  const row = bentukKegiatanIndex.value;

  if (!nama) return alert("Nama wajib diisi");

  try {
    if (row === "") {
      const r = await createBentukKegiatan(nama);
      if (!r?.success) throw new Error(r?.message || "create failed");
    } else {
      const r = await updateBentukKegiatan(Number(row), nama);
      if (!r?.success) throw new Error(r?.message || "update failed");
    }
    closeBentukKegiatan();
    await loadBentukKegiatan();
  } catch (err) {
    console.error(err);
    alert("Gagal menyimpan: " + err.message);
  }
}

function editBentukKegiatan(row, nama) {
  bentukKegiatanIndex.value = row;
  bentukKegiatanNama.value = nama;
  bentukKegiatanModal.classList.remove("hidden");
}

async function hapusBentukKegiatan(row) {
  if (!confirm("Hapus data?")) return;
  try {
    const r = await deleteBentukKegiatanAPI(row);
    if (!r?.success) throw new Error(r?.message || "delete failed");
    await loadBentukKegiatan();
  } catch (err) {
    console.error(err);
    alert("Gagal menghapus: " + err.message);
  }
}

/* ===============================
   INIT
================================= */
function initBentukKegiatan() {
  window.bentukKegiatanModal = document.getElementById("bentukKegiatanModal");
  window.bentukKegiatanIndex = document.getElementById("bentukKegiatanIndex");
  window.bentukKegiatanNama = document.getElementById("bentukKegiatanNama");
  loadBentukKegiatan();
}
