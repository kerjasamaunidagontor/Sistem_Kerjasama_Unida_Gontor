// ===============================
// CONFIG
// ===============================
window.API_BASE =
  "https://script.google.com/macros/s/AKfycbyevdBJNFAh-oAPxwfjWbTNs4xW9Wmt162wwlIQ21imS46JKYoLboTIGe9hFaOLZgs9qg/exec";

let JENIS_MITRA = [];
let editRow = null;

// ===============================
// API
// ===============================
async function fetchJenisMitra() {
  const res = await fetch(
    `${API_BASE}?sheet=${encodeURIComponent("JENIS MITRA")}&_=${Date.now()}`,
    { cache: "no-store" },
  );

  const json = await res.json();
  return json;
}

async function createJenisMitra(nama) {
  const res = await fetch(API_BASE, {
    method: "POST",
    body: JSON.stringify({
      action: "create",
      sheet: "JENIS MITRA",
      data: {
        nama_jenis_mitra: nama,
      },
    }),
  });
  return await res.json();
}

async function updateJenisMitra(row, nama) {
  const res = await fetch(API_BASE, {
    method: "POST",
    body: JSON.stringify({
      action: "update",
      sheet: "JENIS MITRA",
      row,
      data: {
        nama_jenis_mitra: nama,
      },
    }),
  });
  return await res.json();
}

async function deleteJenisMitraAPI(row) {
  const res = await fetch(API_BASE, {
    method: "POST",
    body: JSON.stringify({
      action: "delete",
      sheet: "JENIS MITRA",
      row,
    }),
  });
  return await res.json();
}

// ===============================
// RENDER
// ===============================
function renderJenisMitra(loading = false) {
  const tbody = document.getElementById("jenisMitraBody");
  if (!tbody) return;

  if (loading) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="text-center py-6 text-gray-400">
          ⏳ Memuat data...
        </td>
      </tr>
    `;
    return;
  }

  if (JENIS_MITRA.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="text-center py-6 text-gray-400">
          Tidak ada data
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = "";

  JENIS_MITRA.forEach((item, i) => {
    tbody.innerHTML += `
      <tr>
        <td class="border px-3 py-2 text-center">${i + 1}</td>
        <td class="border px-3 py-2">${item.nama}</td>
        <td class="border px-3 py-2 text-center">
          <button onclick="editJenisMitra(${item.row}, '${item.nama}')">✏️</button>
          <button onclick="hapusJenisMitra(${item.row})">🗑️</button>
        </td>
      </tr>
    `;
  });
}

// ===============================
// ACTION
// ===============================
async function loadJenisMitra() {
  renderJenisMitra(true);

  try {
    const raw = await fetchJenisMitra();
    const data = Array.isArray(raw) ? raw : raw.data || [];

    JENIS_MITRA = data.map((r) => ({
      id: r.row, // ✅ ID STABIL UNTUK IKU
      nama: r.nama || r.nama_jenis_mitra || "",
      row: r.row,
    }));

    // 🔥 WAJIB: expose ke global
    window.JENIS_MITRA = JENIS_MITRA;
  } catch (err) {
    console.error("Load jenis mitra gagal:", err);
    JENIS_MITRA = [];
    window.JENIS_MITRA = [];
  }

  renderJenisMitra();
}

function openCreateJenisMitra() {
  editRow = null;
  document.getElementById("modalTitle").innerText = "Create Jenis Mitra";
  document.getElementById("jenisMitraNama").value = "";
  showModal();
}

function editJenisMitra(row, nama) {
  editRow = row;
  document.getElementById("modalTitle").innerText = "Edit Jenis Mitra";
  document.getElementById("jenisMitraNama").value = nama;
  showModal();
}

async function saveJenisMitraFromModal() {
  const nama = document.getElementById("jenisMitraNama").value.trim();

  if (!nama) {
    alert("Nama tidak boleh kosong");
    return;
  }

  try {
    if (editRow === null) {
      const r = await createJenisMitra(nama);
      if (!r.success) throw new Error(r.message);
    } else {
      const r = await updateJenisMitra(editRow, nama);
      if (!r.success) throw new Error(r.message);
    }

    closeJenisMitraModal();
    await loadJenisMitra();
  } catch (err) {
    console.error(err);
    alert("Gagal menyimpan: " + (err.message || err));
  }
}

async function hapusJenisMitra(row) {
  if (!confirm("Yakin hapus jenis mitra?")) return;

  try {
    const r = await deleteJenisMitraAPI(row);
    if (!r.success) throw new Error(r.message);
    await loadJenisMitra();
  } catch (err) {
    console.error(err);
    alert("Gagal menghapus: " + (err.message || err));
  }
}

// ===============================
// MODAL
// ===============================
function showModal() {
  document.getElementById("jenisMitraModal").classList.remove("hidden");
}

function closeJenisMitraModal() {
  document.getElementById("jenisMitraModal").classList.add("hidden");
}

// ⬇️ TAMBAHKAN DI SINI
window.getJenisMitraData = function () {
  return window.JENIS_MITRA || [];
};
// ===============================
// INIT (AMAN UNTUK LAYOUT / SPA)
// ===============================
function initJenisMitra() {
  if (document.getElementById("jenisMitraBody")) {
    loadJenisMitra();
  }
}

initJenisMitra();
