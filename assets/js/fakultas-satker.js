let FAKULTAS = [];

async function fetchFakultas() {
  const res = await fetch(API.fakultas);
  return await res.json();
}

async function loadFakultas() {
  try {
    // 🔄 tambahan loading (tidak mengubah struktur lama)
    if (typeof showLoading === "function") {
      showLoading("Memuat data fakultas...");
    }

    const res = await fetchFakultas();

    if (!Array.isArray(res)) {
      console.error("API ERROR:", res);
      FAKULTAS = [];
    } else {
      FAKULTAS = res;
    }

    console.log("DATA FAKULTAS:", FAKULTAS);
  } catch (e) {
    console.error(e);
    FAKULTAS = [];
  } finally {
    // ⛔ pastikan loading selalu ditutup
    if (typeof hideLoading === "function") {
      hideLoading();
    }
  }

  // ⛔ tetap di luar try-catch (STRUKTUR ASLI)
  renderFakultas();
  renderFakultasDropdown();
}

function renderFakultas() {
  const tb = document.getElementById("fakultasBody");
  if (!tb) return;

  tb.innerHTML = "";

  FAKULTAS.forEach((v, i) => {
    tb.innerHTML += `
      <tr>
        <td class="border px-3 py-2 text-center">${i + 1}</td>
        <td class="border px-3 py-2">${v.nama}</td>
        <td class="border px-3 py-2 text-center">
          <button onclick="editFakultas(${v.row}, '${v.nama}')">✏️</button>
          <button onclick="deleteFakultas(${v.row})">🗑️</button>
        </td>
      </tr>
    `;
  });
}
window.openFakultas = function () {
  if (!window.fakultasModal) initFakultas();

  fakultasIndex.value = "";
  fakultasNama.value = "";
  fakultasModal.classList.remove("hidden");
};

function closeFakultas() {
  fakultasModal.classList.add("hidden");
}
async function saveFakultas() {
  const nama = fakultasNama.value.trim();
  if (!nama) return alert("Fakultas wajib diisi");

  const isEdit = fakultasIndex.value !== "";

  // ⬅️ STRUKTUR LAMA DIPERTAHANKAN
  let data = {
    FAKULTAS: nama,
  };

  const payload = {
    sheet: "FAKULTASSATKER",
    action: isEdit ? "update" : "create",
    data,
  };

  if (isEdit) payload.row = Number(fakultasIndex.value);

  try {
    // 🔄 TAMBAHAN GLOBAL LOADING
    showLoading(isEdit ? "Menyimpan perubahan..." : "Menyimpan data...");

    await fetch(API.auth, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    closeFakultas();
    await loadFakultas();
  } catch (err) {
    console.error(err);
    alert("Gagal menyimpan fakultas");
  } finally {
    hideLoading();
  }
}

function editFakultas(row, nama) {
  fakultasIndex.value = row;
  fakultasNama.value = nama;
  fakultasModal.classList.remove("hidden");
}
async function deleteFakultas(row) {
  if (!confirm("Hapus Fakultas / Satker?")) return;

  try {
    showLoading("Menghapus data...");

    await fetch(API.auth, {
      method: "POST",
      body: JSON.stringify({
        sheet: "FAKULTASSATKER",
        action: "delete",
        row: Number(row),
      }),
    });

    loadFakultas();
  } catch (err) {
    console.error(err);
    alert("Gagal menghapus data");
  } finally {
    hideLoading();
  }
}

// 🔥 EXPOSE DATA FAKULTAS / SATKER KE FORM KERJASAMA
window.getFakultasData = function () {
  return Array.isArray(FAKULTAS) ? FAKULTAS.map((f) => f.nama) : [];
};

function initFakultas() {
  window.fakultasModal = document.getElementById("fakultasModal");
  window.fakultasIndex = document.getElementById("fakultasIndex");
  window.fakultasNama = document.getElementById("fakultasNama");

  loadFakultas();
}
