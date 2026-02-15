let PENDANAAN = [];

// ===============================
// API
// ===============================
async function fetchPendanaan() {
  const res = await fetch(`${API.auth}?sheet=PENDANAAN`);
  return await res.json();
}

async function loadPendanaan() {
  try {
    const res = await fetchPendanaan();

    if (!Array.isArray(res)) {
      console.error("API Error:", res);
      PENDANAAN = [];
    } else {
      PENDANAAN = res;
    }

    console.log("DATA PENDANAAN:", PENDANAAN);
  } catch (e) {
    console.error(e);
    PENDANAAN = [];
  }

  renderPendanaan();
  renderPendanaanDropdown();
}

// ===============================
// RENDER
// ===============================
function renderPendanaan() {
  const tb = document.getElementById("pendanaanBody");
  if (!tb) return;

  tb.innerHTML = "";
  PENDANAAN.forEach((v, i) => {
    tb.innerHTML += `
      <tr>
        <td class="border px-3 py-2 text-center">${i + 1}</td>
        <td class="border px-3 py-2">${v.nama}</td>
        <td class="border px-3 py-2 text-center">
          <button onclick="editPendanaan(${v.row}, '${String(v.nama).replace(/'/g, "\\'")}')">✏️</button>

          <button onclick="deletePendanaan(${v.row})">🗑️</button>
        </td>
      </tr>`;
  });
}

// ===============================
// ACTION
// ===============================
window.openPendanaan = function () {
  if (!window.pendanaanModal) initPendanaan();
  pendanaanIndex.value = "";
  pendanaanNama.value = "";
  pendanaanModal.classList.remove("hidden");
};

function closePendanaan() {
  pendanaanModal.classList.add("hidden");
}

async function savePendanaan() {
  const nama = pendanaanNama.value.trim();
  if (!nama) return alert("Nama wajib diisi");

  const isEdit = pendanaanIndex.value !== "";

  let data = {
    "Nama Pendanaan": nama,
  };

  if (isEdit) {
    const row = Number(pendanaanIndex.value);
    const old = PENDANAAN.find((v) => v.row === row);

    // ⬇️ gabungkan data lama + data baru
    data = {
      "Nama Pendanaan": nama,
    };
  }

  const payload = {
    sheet: "PENDANAAN",
    action: isEdit ? "update" : "create",
    data,
  };

  if (isEdit) payload.row = Number(pendanaanIndex.value);

  await fetch(API.auth, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  closePendanaan();
  loadPendanaan();
}

function editPendanaan(row, nama) {
  pendanaanIndex.value = row;
  pendanaanNama.value = nama;
  pendanaanModal.classList.remove("hidden");
}

async function deletePendanaan(row) {
  if (!confirm("Hapus pendanaan?")) return;

  await fetch(API.auth, {
    method: "POST",
    body: JSON.stringify({
      sheet: "PENDANAAN",
      action: "delete",
      row: Number(row),
    }),
  });

  loadPendanaan();
}

function initPendanaan() {
  window.pendanaanModal = document.getElementById("pendanaanModal");
  window.pendanaanIndex = document.getElementById("pendanaanIndex");
  window.pendanaanNama = document.getElementById("pendanaanNama");

  loadPendanaan(); // ⬅️ penting
}
