/* ==============================
   VARIABEL GLOBAL
============================== */
let bentukChart, mitraChart, topMitraChart, topQSChart;
const kegiatan = JSON.parse(localStorage.getItem("kegiatan")) || [];

/* ==============================
   LOAD PAGE (SPA)
============================== */
function loadPage(page) {
  return fetch(`pages/${page}.html`)
    .then((res) => {
      if (!res.ok) throw new Error("Page not found");
      return res.text();
    })
    .then((html) => {
      document.getElementById("app-content").innerHTML = html;
      document.getElementById("page-title").textContent =
        page.charAt(0).toUpperCase() + page.slice(1);

      setActiveMenu(page);

      return new Promise((resolve) => {
        setTimeout(() => {
          runPageScript(page);
          resolve();
        }, 0);
      });
    })
    .catch((err) => {
      document.getElementById("app-content").innerHTML =
        `<p class="text-red-500">Gagal memuat halaman</p>`;
      console.error(err);
    });
}

/* ==============================
   ACTIVE SIDEBAR
============================== */

/*================ Menu HUMBERGER ===============*/

function toggleSidebar(forceClose = false) {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  const isOpen = !sidebar.classList.contains("-translate-x-full");

  if (forceClose || isOpen) {
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
  } else {
    sidebar.classList.remove("-translate-x-full");
    overlay.classList.remove("hidden");
  }
}

function setActiveMenu(page) {
  document.querySelectorAll(".menu-link").forEach((link) => {
    link.classList.remove("bg-white/10");
    if (link.dataset.page === page) {
      link.classList.add("bg-white/10");
    }
  });
}

/* ==============================
   DASHBOARD (stats + charts)
============================== */
const APP = {
  stats: { ia: 0, mou: 0, moa: 0 },
};

let statusChart, growthChart;

function animateCounter(el, value) {
  if (!el) return;
  let n = 0;
  const step = Math.ceil(value / 40) || 1;
  const t = setInterval(() => {
    n += step;
    if (n >= value) {
      el.textContent = value;
      clearInterval(t);
    } else {
      el.textContent = n;
    }
  }, 20);
}

async function loadDashboardStats() {
  try {
    const res = await fetch(API.kerjasama);
    const data = await res.json();

    const stats = { ia: 0, mou: 0, moa: 0 };
    let aktif = 0;
    let tidakAktif = 0;
    const growth = {}; // { tahun: {MoU, MoA, IA} }

    data.forEach((d) => {
      const jenis = (d.jenisDokumen || "").toLowerCase();
      const ket = (d.keterangan || "").toLowerCase();
      const tahun = (d.tahunMulai || "").toString().trim();

      // ===== STAT BOX =====
      if (jenis.includes("implementation")) stats.ia++;
      else if (jenis.includes("understanding")) stats.mou++;
      else if (jenis.includes("agreement")) stats.moa++;

      // ===== STATUS PIE =====
      if (ket.includes("tidak")) {
        tidakAktif++;
      } else if (ket.includes("aktif")) {
        aktif++;
      }

      // ===== GROWTH LINE =====
      if (tahun) {
        if (!growth[tahun]) {
          growth[tahun] = { MoU: 0, MoA: 0, IA: 0 };
        }

        if (jenis.includes("implementation")) growth[tahun].IA++;
        else if (jenis.includes("understanding")) growth[tahun].MoU++;
        else if (jenis.includes("agreement")) growth[tahun].MoA++;
      }
    });

    // update stat boxes with animation (safely get elements)
    const elIa = document.getElementById("stat-ia");
    const elMou = document.getElementById("stat-mou");
    const elMoa = document.getElementById("stat-moa");

    animateCounter(elIa, stats.ia);
    animateCounter(elMou, stats.mou);
    animateCounter(elMoa, stats.moa);

    // render charts (will safely no-op if canvas not present)
    renderStatusChart(aktif, tidakAktif);
    renderGrowthChart(growth);
  } catch (err) {
    console.error("Dashboard stats error:", err);
  }
}
/* ==============================
   DASHBOARD FEED AKTIVITAS
============================== */

async function loadDashboardFeed() {
  const feedEl = document.getElementById("dashboard-feed");
  if (!feedEl) return;

  await ensureKegiatanLoaded(); // 🔥 KUNCI UTAMA

  feedEl.innerHTML = "";

  if (!Array.isArray(KEGIATAN) || KEGIATAN.length === 0) {
    feedEl.innerHTML = `
      <li class="text-gray-400 text-center py-4">
        Belum ada aktivitas
      </li>
    `;
    return;
  }

  const sorted = [...KEGIATAN]
    .filter((k) => k.tanggal)
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    .slice(0, 5);

  sorted.forEach((k) => {
    const user = k.pj || "User";
    const judul =
      k.deskripsi || `${k.bentuk || "Kegiatan"} (${k.bidang || "-"})`;

    const tanggal = formatTanggal(k.tanggal);

    feedEl.innerHTML += `
      <li
        class="border-b pb-3 last:border-0 cursor-pointer hover:bg-gray-50 rounded px-2"
        onclick="openKegiatanDetail(${k.row})"
      >
        🔔 <b>${user}</b> menambahkan kegiatan<br />
        <span class="text-gray-600">${judul}</span><br />
        <span class="text-gray-400 text-xs">${tanggal}</span>
      </li>
    `;
  });
}

async function ensureKegiatanLoaded() {
  if (!Array.isArray(KEGIATAN) || KEGIATAN.length === 0) {
    if (typeof loadKegiatanFromSheet === "function") {
      await loadKegiatanFromSheet();
    }
  }
}

/* ============================================================
   PIE CHART
   Status Kerjasama (Aktif vs Tidak Aktif)
   Requires: <canvas id="statusChart"></canvas>
============================================================ */
function renderStatusChart(aktif = 0, tidakAktif = 0) {
  const canvas = document.getElementById("statusChart");
  if (!canvas) return;

  if (statusChart) statusChart.destroy();

  statusChart = new Chart(canvas, {
    type: "pie",
    data: {
      labels: ["Aktif", "Tidak Aktif"],
      datasets: [
        {
          data: [aktif, tidakAktif],
          backgroundColor: ["#22c55e", "#ef4444"],
          borderWidth: 1,
          borderColor: "#ffffff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 14,
            padding: 10,
            font: {
              size: 12,
              family: "Inter, sans-serif",
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.raw}`,
          },
        },
      },
    },
  });
}

/* ============================================================
   LINE CHART
   Pertumbuhan Kerjasama per Tahun
   Requires: <canvas id="growthChart"></canvas>
============================================================ */
function renderGrowthChart(growth = {}) {
  const canvas = document.getElementById("growthChart");
  if (!canvas) return;

  const years = Object.keys(growth).sort((a, b) => a - b);

  const mouData = years.map((y) => growth[y]?.MoU ?? 0);
  const moaData = years.map((y) => growth[y]?.MoA ?? 0);
  const iaData = years.map((y) => growth[y]?.IA ?? 0);

  if (growthChart) growthChart.destroy();

  growthChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
          label: "MoU",
          data: mouData,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37,99,235,0.1)",
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 4,
          fill: false,
        },
        {
          label: "MoA",
          data: moaData,
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245,158,11,0.1)",
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 4,
          fill: false,
        },
        {
          label: "IA",
          data: iaData,
          borderColor: "#10b981",
          backgroundColor: "rgba(16,185,129,0.1)",
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 4,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { left: 8, right: 20, top: 4, bottom: 0 },
      },
      scales: {
        x: {
          offset: true,
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0,0,0,0.05)",
          },
        },
      },
      plugins: {
        legend: {
          position: "bottom", // 🔥 sekarang legend tampil
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
    },
  });
}
function hitungGrowthPerJenis(data = []) {
  const result = {};

  data.forEach((d) => {
    const tahun = (d.tanggal || "").slice(-4); // ambil tahun
    if (!tahun) return;

    if (!result[tahun]) {
      result[tahun] = { MoU: 0, MoA: 0, IA: 0 };
    }

    const jenis = (d.jenisDokumen || "").toUpperCase();

    if (jenis.includes("MOU")) result[tahun].MoU++;
    else if (jenis.includes("MOA")) result[tahun].MoA++;
    else if (jenis.includes("IA")) result[tahun].IA++;
  });

  return result;
}
/* ===============================
   BAGIAN CHARTS KEGIATAN
=============================== */
async function loadDashboardKegiatan() {
  try {
    const res = await fetch(API.kegiatan);
    const data = await res.json();

    const bentukMap = {};
    const mitraMap = {};
    const topMitraMap = {};
    const topQSMap = {}; // ✅ map baru

    data.forEach((k) => {
      const bentuk = (k.bentuk || "-").trim();
      const jenisMitra = (k.jenisMitra || "-").trim();
      const mitra = (k.no || "-").toString().trim();

      bentukMap[bentuk] = (bentukMap[bentuk] || 0) + 1;
      mitraMap[jenisMitra] = (mitraMap[jenisMitra] || 0) + 1;
      topMitraMap[mitra] = (topMitraMap[mitra] || 0) + 1;

      // ✅ FILTER KHUSUS QS200 BY SUBJECT
      if (
        jenisMitra ===
        "Perguruan Tinggi yang masuk dalam daftar QS200 berdasarkan bidang ilmu (QS200 by subject)"
      ) {
        topQSMap[mitra] = (topQSMap[mitra] || 0) + 1;
      }
    });

    const topBentuk = Object.entries(bentukMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topJenisMitra = Object.entries(mitraMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topMitra = Object.entries(topMitraMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topQS = Object.entries(topQSMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    renderBentukChart(topBentuk);
    renderMitraChart(topJenisMitra);
    renderTopMitraChart(topMitra);
    renderTopQSChart(topQS); // ✅ render baru
  } catch (err) {
    console.error("Dashboard kegiatan error:", err);
  }
}
function getHorizontalBarOptions() {
  return {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 20,
        right: 20,
        top: 10,
        bottom: 10,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `Jumlah: ${ctx.raw}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          font: { size: 11 },
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          font: { size: 11 },
          callback: function (value) {
            const label = this.getLabelForValue(value);
            return label.length > 28 ? label.substring(0, 28) + "..." : label;
          },
        },
      },
    },
  };
}

function renderBentukChart(data = []) {
  const canvas = document.getElementById("bentukChart");
  if (!canvas) return;

  if (bentukChart) bentukChart.destroy();

  bentukChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.map((d) => d[0]),
      datasets: [
        {
          data: data.map((d) => d[1]),
          backgroundColor: "#3b82f6",
          borderRadius: 8,
          categoryPercentage: 0.7,
          barPercentage: 0.8,
        },
      ],
    },
    options: getHorizontalBarOptions(),
  });
}
function renderMitraChart(data = []) {
  const canvas = document.getElementById("mitraChart");
  if (!canvas) return;

  if (mitraChart) mitraChart.destroy();

  mitraChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.map((d) => d[0]),
      datasets: [
        {
          data: data.map((d) => d[1]),
          backgroundColor: "#8b5cf6",
          borderRadius: 8,
          categoryPercentage: 0.7,
          barPercentage: 0.8,
        },
      ],
    },
    options: getHorizontalBarOptions(),
  });
}
function renderTopMitraChart(data = []) {
  const canvas = document.getElementById("topMitraChart");
  if (!canvas) return;

  if (topMitraChart) topMitraChart.destroy();

  topMitraChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.map((d) => d[0]),
      datasets: [
        {
          data: data.map((d) => d[1]),
          backgroundColor: "#f59e0b",
          borderRadius: 8,
          categoryPercentage: 0.7,
          barPercentage: 0.8,
        },
      ],
    },
    options: getHorizontalBarOptions(),
  });
}
function renderTopQSChart(data = []) {
  const canvas = document.getElementById("topQSChart");
  if (!canvas) return;

  if (topQSChart) topQSChart.destroy();

  topQSChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.map((d) => d[0]),
      datasets: [
        {
          data: data.map((d) => d[1]),
          backgroundColor: "#10b981", // warna hijau biar beda
          borderRadius: 8,
          categoryPercentage: 0.7,
          barPercentage: 0.8,
        },
      ],
    },
    options: getHorizontalBarOptions(),
  });
}
/* ==============================
   BAGIAN BIDANG LAPORAN KEGIATAN
============================== */
async function renderDashboardRekapBidang(selectedYear = "ALL") {
  const tbody = document.getElementById("dashboard-rekap-bidang");
  const selectYear = document.getElementById("filter-tahun-bidang");
  if (!tbody) return;

  tbody.innerHTML = "";

  try {
    const res = await fetch(API.kegiatan);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-gray-400">
            Tidak ada data
          </td>
        </tr>
      `;
      return;
    }

    // ==============================
    // 🔥 AMBIL LIST TAHUN UNIK
    // ==============================
    const tahunSet = new Set();

    data.forEach((k) => {
      if (k.tanggal) {
        const tahun = k.tanggal.toString().slice(-4);
        tahunSet.add(tahun);
      }
    });

    const tahunList = Array.from(tahunSet).sort((a, b) => b - a);

    // isi dropdown (hanya pertama kali)
    if (selectYear && selectYear.options.length <= 1) {
      tahunList.forEach((t) => {
        selectYear.innerHTML += `<option value="${t}">${t}</option>`;
      });
    }

    // ==============================
    // 🔥 FILTER DATA BERDASARKAN TAHUN
    // ==============================
    const filteredData =
      selectedYear === "ALL"
        ? data
        : data.filter((k) =>
            k.tahun?.toString().endsWith(selectedYear)
          );

    // ==============================
    // 🔥 REKAP PER BIDANG
    // ==============================
    const rekap = {};

    filteredData.forEach((k) => {
      const bidang = k.bidang?.trim() || "Tidak Diketahui";
      const tingkat = (k.tingkat || "").toLowerCase();

      if (!rekap[bidang]) {
        rekap[bidang] = {
          international: 0,
          nasional: 0,
          lokal: 0,
        };
      }

      if (tingkat.includes("inter")) rekap[bidang].international++;
      else if (tingkat.includes("nas")) rekap[bidang].nasional++;
      else if (tingkat.includes("lok")) rekap[bidang].lokal++;
    });

    const sorted = Object.entries(rekap).sort(
      (a, b) =>
        b[1].international +
        b[1].nasional +
        b[1].lokal -
        (a[1].international + a[1].nasional + a[1].lokal)
    );

    let grandInternational = 0;
    let grandNasional = 0;
    let grandLokal = 0;

    sorted.forEach(([bidang, val], index) => {
      const total = val.international + val.nasional + val.lokal;

      grandInternational += val.international;
      grandNasional += val.nasional;
      grandLokal += val.lokal;

      tbody.innerHTML += `
        <tr class="border-b hover:bg-gray-50">
          <td class="px-3 py-2 text-center">${index + 1}</td>
          <td class="px-3 py-2">${bidang}</td>
          <td class="px-3 py-2 text-center text-blue-600 font-semibold">
            ${val.international}
          </td>
          <td class="px-3 py-2 text-center text-green-600 font-semibold">
            ${val.nasional}
          </td>
          <td class="px-3 py-2 text-center text-orange-500 font-semibold">
            ${val.lokal}
          </td>
          <td class="px-3 py-2 text-center font-bold">
            ${total}
          </td>
        </tr>
      `;
    });

    const grandTotal =
      grandInternational + grandNasional + grandLokal;

    tbody.innerHTML += `
      <tr class="bg-gray-100 font-bold">
        <td colspan="2" class="px-3 py-2 text-right">TOTAL</td>
        <td class="px-3 py-2 text-center">${grandInternational}</td>
        <td class="px-3 py-2 text-center">${grandNasional}</td>
        <td class="px-3 py-2 text-center">${grandLokal}</td>
        <td class="px-3 py-2 text-center">${grandTotal}</td>
      </tr>
    `;
  } catch (err) {
    console.error("Rekap bidang error:", err);
  }
}
