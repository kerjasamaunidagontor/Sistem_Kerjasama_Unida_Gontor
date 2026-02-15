let PRODI = [];

// ===============================
// API
// ===============================
async function fetchProdi() {
  const res = await fetch(API.prodi);
  return await res.json();
}

async function loadProdi() {
  try {
    const res = await fetchProdi();

    if (!Array.isArray(res)) {
      console.error("API ERROR:", res);
      PRODI = [];
    } else {
      PRODI = res;
    }

    console.log("DATA PRODI:", PRODI);
  } catch (e) {
    console.error(e);
    PRODI = [];
  }

  renderProdi();
  renderProdiDropdown();
}

// ===============================
// RENDER
// ===============================
function renderProdi() {
  const tb = document.getElementById("prodiBody");
  if (!tb) return;

  tb.innerHTML = "";

  PRODI.forEach((v, i) => {
    tb.innerHTML += `
    <tr>
      <td class="border px-3 py-2 text-center">${i + 1}</td>
      <td class="border px-3 py-2">${v.nama}</td>
      <td class="border px-3 py-2 text-center">
        <button onclick="editProdi(${v.row}, '${v.nama}')">✏️</button>
        <button onclick="deleteProdi(${v.row})">🗑️</button>
      </td>
    </tr>`;
  });
}

// ===============================
// ACTION
// ===============================
window.openProdi = function () {
  if (!window.prodiModal) initProdi();

  prodiIndex.value = "";
  prodiNama.value = "";
  prodiModal.classList.remove("hidden");
};

function closeProdi() {
  prodiModal.classList.add("hidden");
}

async function saveProdi() {
  const nama = prodiNama.value.trim();
  if (!nama) return alert("Nama wajib diisi");

  const isEdit = prodiIndex.value !== "";

  let data = {
    NAMA: nama,
  };

  if (isEdit) {
    const row = Number(prodiIndex.value);

    // kalau mau gabung data lama bisa, tapi untuk 1 kolom tidak wajib
    data = {
      NAMA: nama,
    };
  }

  const payload = {
    sheet: "PRODISATKER",
    action: isEdit ? "update" : "create",
    data,
  };

  if (isEdit) payload.row = Number(prodiIndex.value);

  await fetch(API.auth, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  closeProdi();
  loadProdi();
}

function editProdi(row, nama) {
  prodiIndex.value = row;
  prodiNama.value = nama;
  prodiModal.classList.remove("hidden");
}
async function deleteProdi(row) {
  if (!confirm("Hapus Prodi / Satker?")) return;

  await fetch(API.auth, {
    method: "POST",
    body: JSON.stringify({
      sheet: "PRODISATKER",
      action: "delete",
      row: Number(row),
    }),
  });

  loadProdi();
}

// ===============================
// INIT
// ===============================
function initProdi() {
  window.prodiModal = document.getElementById("prodiModal");
  window.prodiIndex = document.getElementById("prodiIndex");
  window.prodiNama = document.getElementById("prodiNama");

  loadProdi();
}
