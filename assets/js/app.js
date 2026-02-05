/* ==============================
   ROUTER
============================== */
/* ==============================
   AUTH CHECK
============================== */
function getRole() {
  return localStorage.getItem("role"); // admin | user
}
function loadUserSidebar() {
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  if (!username || !role) return;

  document.getElementById("sidebarUsername").innerText = username;

  const roleBadge = document.getElementById("sidebarRole");
  roleBadge.innerText = role.toUpperCase();

  // warna badge
  if (role === "admin") {
    roleBadge.className =
      "text-xs px-2 py-0.5 rounded bg-purple-600 text-white";
  } else {
    roleBadge.className = "text-xs px-2 py-0.5 rounded bg-blue-500 text-white";
  }
}

function runPageScript(page) {
  const role = getRole();

  // proteksi halaman admin
  if (role !== "admin" && (page === "kerjasama" || page === "kegiatan")) {
    alert("Halaman ini hanya bisa diakses admin");
    loadPage("dashboard");
    return;
  }

  if (page === "dashboard") {
    loadDashboardStats();
  }
  if (page === "analitik-status" && typeof initAnalitikStatus === "function") {
    initAnalitikStatus();
  }

  if (
    page === "analitik-klasifikasi" &&
    typeof initAnalitikKlasifikasi === "function"
  ) {
    initAnalitikKlasifikasi();
  }

  if (page === "analitik-geo" && typeof initAnalitikGeo === "function") {
    initAnalitikGeo();
  }

  if (page === "kerjasama") {
    bindKerjasamaForm();
    loadBenuaDropdown();
    loadCountryDropdown();
    loadKerjasamaFromSheet();
  }

  if (page === "kegiatan") {
    bindKegiatanForm();

    loadBentukKegiatan();

    // 🔥 WAJIB: load master Jenis Mitra
    if (typeof loadJenisMitra === "function") {
      loadJenisMitra();
    }

    loadKegiatanFromSheet();
    initPendanaan();
    initFakultas();
    initProdi();
    bindTanggalToTahun();
  }

  if (page === "mitra" && typeof loadMitraPage === "function") {
    loadMitraPage();
  }

  if (page === "jenis-mitra" && typeof initJenisMitra === "function") {
    initJenisMitra();
  }

  if (page === "nilai-iku" && typeof initNilaiIku === "function") {
    initNilaiIku();
  }
  if (page === "bentuk-kegiatan" && typeof initBentukKegiatan === "function") {
    initBentukKegiatan();
  }
  if (page === "tambah-mitra" && typeof initTambahMitra === "function") {
    initTambahMitra();
  }
  if (page === "pendanaan" && typeof initPendanaan === "function") {
    initPendanaan();
  }
  if (page === "prodi-satker" && typeof initProdi === "function") {
    initProdi();
  }
  if (page === "fakultas-satker" && typeof initFakultas === "function") {
    initFakultas();
  }
}
function renderUserInfo() {
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  if (!username || !role) return;

  document.getElementById("sidebarUsername").textContent = username;
  document.getElementById("sidebarRole").textContent = role;
}

function logout() {
  localStorage.clear();
  window.location.href = "pages/login.html";
}
/* ==============================
   FORMAT LOGIN HEADER
============================== */
function loadUserHeader() {
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  if (!username || !role) return;

  const u = document.getElementById("headerUsername");
  const r = document.getElementById("headerRole");

  if (u) u.textContent = username;
  if (r) r.textContent = role.toUpperCase();
}

function toggleUserMenu() {
  document.getElementById("userDropdown").classList.toggle("hidden");
}

// klik di luar → dropdown nutup
document.addEventListener("click", function (e) {
  const dropdown = document.getElementById("userDropdown");
  if (!dropdown) return;

  if (!e.target.closest(".relative")) {
    dropdown.classList.add("hidden");
  }
});

/* ===============================
   FORMAT TANGGAL
================================= */
function formatTanggal(val) {
  if (!val) return "-";

  // kalau sudah Date
  if (val instanceof Date && !isNaN(val)) {
    return val.toLocaleDateString("id-ID");
  }

  // kalau number (serial spreadsheet)
  if (typeof val === "number") {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    return isNaN(d) ? "-" : d.toLocaleDateString("id-ID");
  }

  // kalau string
  const d = new Date(val);
  return isNaN(d) ? "-" : d.toLocaleDateString("id-ID");
}
let idleTimer;
const IDLE_LIMIT = 10 * 60 * 1000; // 10 menit
/* ============================
  untuk timer logout otomatis
============================== */
function resetIdleTimer() {
  clearTimeout(idleTimer);

  idleTimer = setTimeout(() => {
    alert("Session habis karena tidak ada aktivitas.");
    logout();
  }, IDLE_LIMIT);
}

function initIdleLogout() {
  ["mousemove", "keydown", "click", "scroll"].forEach((event) => {
    document.addEventListener(event, resetIdleTimer);
  });

  resetIdleTimer();
}

/* ==============================
   INIT
============================== */
document.addEventListener("DOMContentLoaded", () => {
  applyRoleUI();
  loadUserSidebar();
  loadUserHeader();
  renderUserInfo(); // 👤 tampilkan user
  initIdleLogout();
  loadPage("dashboard");
});

function applyRoleUI() {
  const role = getRole();

  if (role !== "admin") {
    document.querySelectorAll("[data-admin]").forEach((el) => {
      el.style.display = "none";
    });
  }
}
