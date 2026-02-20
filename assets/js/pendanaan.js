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
    // 🔄 tambahan: loading (tidak mengubah flow lama)
    if (typeof showLoading === "function") {
      showLoading("Memuat pendanaan...");
    }

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
  } finally {
    // ⛔ pastikan loading selalu ditutup
    if (typeof hideLoading === "function") {
      hideLoading();
    }
  }

  // ⬇️ tetap di posisi asli (tidak dipindah)
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

  // ⬇️ struktur lama tetap dipertahankan
  if (isEdit) {
    const row = Number(pendanaanIndex.value);
    const old = PENDANAAN.find((v) => v.row === row);

    // (kalau nanti mau merge field lain, tinggal pakai old)
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

  try {
    // 🔄 LOADING GLOBAL
    showLoading(isEdit ? "Menyimpan perubahan..." : "Menyimpan pendanaan...");

    await fetch(API.auth, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    closePendanaan();
    await loadPendanaan();
  } catch (err) {
    console.error(err);
    alert("Gagal menyimpan pendanaan");
  } finally {
    // ⛔ pastikan loading selalu ditutup
    hideLoading();
  }
}

function editPendanaan(row, nama) {
  pendanaanIndex.value = row;
  pendanaanNama.value = nama;
  pendanaanModal.classList.remove("hidden");
}

async function deletePendanaan(row) {
  if (!confirm("Hapus pendanaan?")) return;

  try {
    // ➕ tambahan: loading global
    if (typeof showLoading === "function") {
      showLoading("Menghapus pendanaan...");
    }

    await fetch(API.auth, {
      method: "POST",
      body: JSON.stringify({
        sheet: "PENDANAAN",
        action: "delete",
        row: Number(row),
      }),
    });

    // ⬅️ struktur lama tetap
    loadPendanaan();
  } catch (err) {
    console.error(err);
    alert("Gagal menghapus pendanaan");
  } finally {
    // ➕ tambahan: pastikan loading ditutup
    if (typeof hideLoading === "function") {
      hideLoading();
    }
  }
}

function initPendanaan() {
  window.pendanaanModal = document.getElementById("pendanaanModal");
  window.pendanaanIndex = document.getElementById("pendanaanIndex");
  window.pendanaanNama = document.getElementById("pendanaanNama");

  loadPendanaan(); // ⬅️ penting
}
