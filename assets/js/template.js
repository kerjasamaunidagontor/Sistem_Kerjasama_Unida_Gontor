/* ===============================
   TEMPLATE PAGE CONTROLLER (CONNECTED TO GOOGLE SHEETS)
=============================== */

let allTemplates = []; // Menyimpan data dari Google Sheet

/**
 * Inisialisasi halaman template
 */
function initTemplatePage() {
  console.log("✅ Halaman Template berhasil dimuat");
  console.log("🔐 Role user saat ini:", getRole());
  
  const pageTitle = document.getElementById("page-title");
  if (pageTitle) pageTitle.textContent = "Template";
  
  // 🔥 SEMBUNYIKAN TOMBOL TAMBAH TEMPLATE JIKA BUKAN ADMIN
  const btnTambah = document.querySelector('button[onclick="openModalTambahTemplate()"]');
  if (btnTambah && getRole() !== 'admin') {
    btnTambah.style.display = 'none';
    console.log("🚫 Tombol tambah template disembunyikan untuk user");
  }
  
  loadTemplatesFromSheet();
}

/**
 * Ambil data template dari Google Sheet
 */
function loadTemplatesFromSheet() {
  const tbody = document.getElementById('templateTableBody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-slate-500">Memuat data...</td></tr>';

  fetch(window.API.template)
    .then(res => res.json())
    .then(data => {
      allTemplates = data || [];
      renderTemplates();
    })
    .catch(err => {
      console.error("Gagal memuat template:", err);
      if (tbody) tbody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-red-500">Gagal memuat data. Periksa koneksi atau deploy script.</td></tr>';
    });
}

/**
 * Render tabel template
 */
function renderTemplates() {
  const tbody = document.getElementById('templateTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = "";

  const role = getRole(); // 🔥 Ambil role user saat ini

  if (allTemplates.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-slate-500">Belum ada template.</td></tr>';
    return;
  }

  allTemplates.forEach((template, index) => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';
    
    let fileBadge = '';
    if (template.fileName && template.fileName !== "Tidak ada file") {
      const ext = template.fileName.split('.').pop().toLowerCase();
      if (['pdf'].includes(ext)) fileBadge = `<span class="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold ml-2">PDF</span>`;
      else if (['doc', 'docx'].includes(ext)) fileBadge = `<span class="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold ml-2">WORD</span>`;
      else fileBadge = `<span class="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold ml-2">EXCEL</span>`;
    }

    const hasLink = template.fileUrl && template.fileUrl.trim() !== "";
    
    // 🔥 TOMBOL HAPUS HANYA DIBUAT JIKA ROLE = ADMIN
    const deleteButton = role === 'admin' ? `
      <button onclick="hapusTemplate(${template.row})" class="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors" title="Hapus">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
      </button>
    ` : '';

    row.innerHTML = `
      <td class="px-4 py-3 font-medium text-slate-700">
        ${template.nama} ${fileBadge}
      </td>
      <td class="px-4 py-3 text-slate-600">
        ${template.keterangan}
      </td>
      <td class="px-4 py-3 text-center">
        <div class="flex justify-center gap-2">
          ${hasLink ? `
          <a href="${template.fileUrl}" target="_blank" class="inline-flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium rounded transition-colors" title="Download/Review">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          </a>` : '<span class="text-xs text-gray-400">No link</span>'}
          
          ${deleteButton}
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

/**
 * Buka modal
 */
function openModalTambahTemplate() {
  const modal = document.getElementById('modalTambahTemplate');
  if (modal) modal.classList.remove('hidden');
}

/**
 * Tutup modal
 */
function closeModalTambahTemplate() {
  const modal = document.getElementById('modalTambahTemplate');
  if (modal) {
    modal.classList.add('hidden');
    const form = document.getElementById('formTambahTemplate');
    if (form) form.reset();
  }
}

/**
 * Simpan template ke Google Sheet (Hanya Link URL)
 */
function simpanTemplate(event) {
  // 🔥 CEK ROLE SEBELUM MEMPROSES
  if (getRole() !== 'admin') {
    alert("⛔ Akses Ditolak: Hanya Admin yang dapat menambah template!");
    closeModalTambahTemplate();
    return;
  }

  event.preventDefault();
  
  const nama = document.getElementById('inputNamaTemplate').value.trim();
  const keterangan = document.getElementById('inputKeteranganTemplate').value.trim();
  const linkInput = document.getElementById('inputLinkTemplate').value.trim();
  
  if (!nama || !keterangan) {
    alert('Mohon lengkapi Nama dan Keterangan!');
    return;
  }

  if (typeof showLoading === "function") showLoading("Menyimpan template...");

  const payload = {
    action: "create",
    sheet: "TEMPLATE",
    data: {
      nama: nama,
      keterangan: keterangan,
      fileName: linkInput ? "Link Eksternal" : "Tidak ada file",
      fileUrl: linkInput || "",
      fileType: "link"
    }
  };

  fetch(window.API.template, {
    method: "POST",
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(result => {
    if (typeof hideLoading === "function") hideLoading();
    
    if (result.success) {
      closeModalTambahTemplate();
      alert("✅ Template berhasil disimpan!");
      loadTemplatesFromSheet();
    } else {
      alert("❌ Gagal menyimpan: " + result.error);
    }
  })
  .catch(err => {
    if (typeof hideLoading === "function") hideLoading();
    console.error(err);
    alert("❌ Terjadi kesalahan jaringan.");
  });
}

/**
 * Hapus template dari Google Sheet
 */
function hapusTemplate(rowIndex) {
  // 🔥 CEK ROLE SEBELUM MEMPROSES
  if (getRole() !== 'admin') {
    alert("⛔ Akses Ditolak: Hanya Admin yang dapat menghapus template!");
    return;
  }

  if (!confirm('Apakah Anda yakin ingin menghapus template ini?')) return;

  if (typeof showLoading === "function") showLoading("Menghapus...");

  fetch(window.API.template, {
    method: "POST",
    body: JSON.stringify({
      action: "delete",
      sheet: "TEMPLATE",
      row: rowIndex
    })
  })
  .then(res => res.json())
  .then(result => {
    if (typeof hideLoading === "function") hideLoading();
    if (result.success) {
      alert("✅ Template berhasil dihapus!");
      loadTemplatesFromSheet();
    } else {
      alert("❌ Gagal menghapus: " + result.error);
    }
  })
  .catch(err => {
    if (typeof hideLoading === "function") hideLoading();
    alert("❌ Terjadi kesalahan jaringan.");
  });
}