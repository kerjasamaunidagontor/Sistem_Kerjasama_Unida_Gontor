/* =====================================================
   ANALITIK STATUS — FINAL MERGED VERSION
===================================================== */

let chartStatus;
let chartSebaran;
let kalenderKerjasama;
let tooltipEl;
let currentStatusFilter = "all"; // all | Aktif | Tidak Aktif

/* ===============================
   FILTER STATUS (GLOBAL)
================================ */
function setStatusFilter(status) {
  currentStatusFilter = status;

  // 🔁 render ulang chart sebaran
  renderChartSebaran();

  // 🔄 update tampilan tombol (optional tapi rapi)
  document.querySelectorAll("[data-status-filter]").forEach((btn) => {
    btn.classList.remove("ring-2", "ring-offset-2");
  });

  const activeBtn = document.querySelector(`[data-status-filter="${status}"]`);
  if (activeBtn) {
    activeBtn.classList.add("ring-2", "ring-offset-2");
  }
}

/* ===============================
   KALENDER KERJASAMA (FINAL)
================================ */
function renderKalenderKerjasama() {
  const el = document.getElementById("kalenderKerjasama");
  if (!el) return;

  if (kalenderKerjasama) {
    kalenderKerjasama.destroy();
  }

  /* ===============================
   MAP DATA → EVENT (START + END)
================================ */
  const events = [];

  (window.KERJASAMA || [])
    .filter((d) => d.tglMulai && d.tglBerakhir)
    .forEach((d) => {
      const sisaBulan = hitungSisaBulan(d.tglBerakhir);

      let warnaAkhir = "#10b981"; // hijau
      if (sisaBulan <= 3)
        warnaAkhir = "#ef4444"; // merah
      else if (sisaBulan <= 6) warnaAkhir = "#f59e0b"; // kuning

      // 🔵 EVENT TANGGAL MULAI
      events.push({
        start: d.tglMulai,
        allDay: true,
        backgroundColor: "#2563eb", // 🔵 biru
        borderColor: "#2563eb",
        extendedProps: {
          ...d,
          tipe: "mulai",
          sisaBulan,
        },
      });

      // 🔴🟡🟢 EVENT TANGGAL BERAKHIR
      events.push({
        start: d.tglBerakhir,
        allDay: true,
        backgroundColor: warnaAkhir,
        borderColor: warnaAkhir,
        extendedProps: {
          ...d,
          tipe: "berakhir",
          sisaBulan,
        },
      });
    });

  /* ===============================
     HITUNG BADGE PER TANGGAL
  ================================ */
  const eventCountMap = {};
  events.forEach((e) => {
    const tgl =
      typeof e.start === "string"
        ? e.start
        : e.start.toISOString().slice(0, 10);

    eventCountMap[tgl] = (eventCountMap[tgl] || 0) + 1;
  });

  /* ===============================
     INIT FULLCALENDAR
  ================================ */
  kalenderKerjasama = new FullCalendar.Calendar(el, {
    initialView: "dayGridMonth",
    locale: "id",
    height: "auto",

    showNonCurrentDates: false, // ❌ sembunyikan tanggal luar bulan
    fixedWeekCount: false, // ❌ jangan paksa 6 baris minggu

    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek",
    },

    events,
    eventDisplay: "block",
    displayEventTime: false,

    /* ===============================
       TITIK + BADGE ANGKA
    ================================ */
    eventContent(arg) {
      const tgl = arg.event.startStr;
      const jumlah = eventCountMap[tgl] || 0;

      return {
        html: `
      <div class="fc-dot-wrapper">
        <div class="fc-dot"
             style="background:${arg.event.backgroundColor}">
        </div>
        ${jumlah > 1 ? `<span class="fc-dot-badge">${jumlah}</span>` : ""}
      </div>
    `,
      };
    },

    /* ===============================
       TOOLTIP HOVER
    ================================ */
    eventMouseEnter(info) {
      const d = info.event.extendedProps;

      tooltipEl = document.createElement("div");
      tooltipEl.className = "fc-tooltip";

      tooltipEl.innerHTML = `
       <div class="text-xs font-semibold mb-1 ${
         d.tipe === "mulai" ? "text-blue-600" : "text-red-600"
       }">
      ${d.tipe === "mulai" ? "Mulai Kerjasama" : "Akhir Kerjasama"}
    </div>
        <div class="font-semibold mb-1">🏢 ${d.mitra || "-"}</div>
        <div>📄 ${d.jenisDokumen || "-"}</div>
        <div>📅 ${new Date(d.tglMulai).toLocaleDateString("id-ID")}
          – ${new Date(d.tglBerakhir).toLocaleDateString("id-ID")}</div>
        <div class="mt-1 font-semibold">⏳ Sisa ${d.sisaBulan} bulan</div>
      `;

      document.body.appendChild(tooltipEl);

      const rect = info.el.getBoundingClientRect();
      tooltipEl.style.left = rect.left + window.scrollX + "px";
      tooltipEl.style.top =
        rect.top + window.scrollY - tooltipEl.offsetHeight - 8 + "px";
    },

    eventMouseLeave() {
      if (tooltipEl) {
        tooltipEl.remove();
        tooltipEl = null;
      }
    },
    // 🔥 WAJIB DI DALAM INI
    datesSet(info) {
      renderTabelStatusFromEvents(events, info.view.currentStart);
    },
  });

  kalenderKerjasama.render();
}

/* ===============================
   HITUNG SISA BULAN
================================ */
function hitungSisaBulan(tglBerakhir) {
  const end = new Date(tglBerakhir);
  const now = new Date();

  return (
    (end.getFullYear() - now.getFullYear()) * 12 +
    (end.getMonth() - now.getMonth())
  );
}

/* ===============================
   CHART DONUT (MoU / MoA / IA)
================================ */
function renderChartStatus() {
  const canvas = document.getElementById("chartStatusDokumen");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (chartStatus) chartStatus.destroy();

  const stat = hitungStatusPerJenis(window.KERJASAMA || []);

  const labels = ["MoU", "MoA", "IA"];
  const totals = labels.map((j) => stat[j].aktif + stat[j].tidakAktif);

  chartStatus = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: totals,
          backgroundColor: ["#2563eb", "#f59e0b", "#10b981"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // 🔥 WAJIB supaya full container
      cutout: "65%",
      layout: {
        padding: 10,
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 12,
          },
        },

        tooltip: {
          callbacks: {
            label(ctx) {
              const jenis = ctx.label;
              const d = stat[jenis];

              return [`Aktif : ${d.aktif}`, `Tidak Aktif : ${d.tidakAktif}`];
            },
          },
        },
      },

      onClick(_, elements) {
        if (!elements.length) return;
        const index = elements[0].index;
        renderDetailStatus(labels[index], stat[labels[index]]);
      },
    },
  });
}

function renderDetailStatus(jenis, data) {
  const box = document.getElementById("chart-detail");
  if (!box) return;

  box.classList.remove("hidden");

  box.innerHTML = `
    <div style="font-weight:600; font-size:16px; margin-bottom:8px">
      ${jenis}
    </div>

    <table style="width:100%; font-size:14px">
      <tr>
        <td>Aktif</td>
        <td style="text-align:right; font-weight:600; color:green">
          ${data.aktif}
        </td>
      </tr>
      <tr>
        <td>Tidak Aktif</td>
        <td style="text-align:right; font-weight:600; color:red">
          ${data.tidakAktif}
        </td>
      </tr>
    </table>
  `;
}

function hitungChartStatusAktif(data = []) {
  const result = {
    aktif: 0,
    tidakAktif: 0,
  };

  data.forEach((d) => {
    const status = (d.status || "").toLowerCase();

    if (status === "tidak aktif") {
      result.tidakAktif++;
    } else if (status) {
      result.aktif++;
    }
  });

  return result;
}
function hitungStatusPerJenis(data = []) {
  const result = {
    MoU: { aktif: 0, tidakAktif: 0 },
    MoA: { aktif: 0, tidakAktif: 0 },
    IA: { aktif: 0, tidakAktif: 0 },
  };

  data.forEach((d) => {
    const jenis = (d.jenisDokumen || "").toUpperCase();
    const status = (d.status || "").toLowerCase();

    let key = null;
    if (jenis.includes("MOU")) key = "MoU";
    else if (jenis.includes("MOA")) key = "MoA";
    else if (jenis.includes("IA")) key = "IA";

    if (!key) return;

    if (status === "tidak aktif") {
      result[key].tidakAktif++;
    } else {
      result[key].aktif++;
    }
  });

  return result;
}

/* ===============================
   BAR SEBARAN DOKUMEN
================================ */
function getStatusDokumen(d) {
  const ket = (d.keterangan || "").toLowerCase();

  if (ket.includes("tidak aktif")) return "Tidak Aktif";
  if (ket.includes("berakhir")) return "Tidak Aktif";
  if (ket.includes("aktif")) return "Aktif";

  return "Tidak Aktif";
}

function filterKerjasamaByStatus(status) {
  if (status === "all") return window.KERJASAMA || [];

  return (window.KERJASAMA || []).filter((d) => getStatusDokumen(d) === status);
}

function hitungSebaranDokumen(data = []) {
  const jenisList = ["MoU", "MoA", "IA"];
  const tingkatSet = new Set();

  // kumpulkan semua tingkat yang ada
  data.forEach((d) => {
    if (d.tingkat) tingkatSet.add(d.tingkat);
  });

  const tingkatList = Array.from(tingkatSet);

  // init struktur
  const result = {};
  jenisList.forEach((j) => {
    result[j] = {};
    tingkatList.forEach((t) => (result[j][t] = 0));
  });

  // hitung
  data.forEach((d) => {
    const jenis = (d.jenisDokumen || "").toUpperCase();
    const tingkat = d.tingkat;

    let key = null;
    if (jenis.includes("MOU")) key = "MoU";
    else if (jenis.includes("MOA")) key = "MoA";
    else if (jenis.includes("IA")) key = "IA";

    if (key && tingkat) {
      result[key][tingkat]++;
    }
  });

  return { jenisList, tingkatList, data: result };
}

function renderChartSebaran() {
  console.log("FILTER:", currentStatusFilter);
  const canvas = document.getElementById("chartSebaranDokumen");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (chartSebaran) chartSebaran.destroy();

  const filteredData = filterKerjasamaByStatus(currentStatusFilter);
  const hasil = hitungSebaranDokumen(filteredData);

  const { jenisList, tingkatList, data } = hasil;

  const colors = ["#2563eb", "#22c55e", "#f59e0b", "#ef4444"];

  const datasets = tingkatList.map((tingkat, i) => ({
    label: tingkat,
    data: jenisList.map((j) => data[j][tingkat]),
    backgroundColor: colors[i % colors.length],
  }));

  chartSebaran = new Chart(ctx, {
    type: "bar",
    data: {
      labels: jenisList,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // 🔥 WAJIB
      indexAxis: "y",
      layout: {
        padding: 10,
      },
      scales: {
        x: {
          stacked: true,
          beginAtZero: true,
        },
        y: {
          stacked: true,
        },
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 12,
          },
        },
      },
    },
  });
}
/* ===============================
   RENDER TABEL STATUS (RINGAN)
================================ */
function renderTabelStatusFromEvents(events, currentDate) {
  const tb = document.getElementById("statusKerjasamaBody");
  if (!tb) return;

  tb.innerHTML = "";

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // 🔎 filter hanya event di bulan aktif
  const filtered = events.filter((e) => {
    const date = new Date(e.start);
    return (
      date.getMonth() === currentMonth && date.getFullYear() === currentYear
    );
  });

  if (filtered.length === 0) {
    tb.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-6 text-gray-400">
          Tidak ada kerjasama bulan ini
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach((e, i) => {
    const d = e.extendedProps;

    // 🎨 Tentukan status dari warna
    let status = "Aktif";
    let badgeClass = "bg-green-100 text-green-700";

    if (e.backgroundColor === "#ef4444") {
      status = "Berakhir (≤3 bulan)";
      badgeClass = "bg-red-100 text-red-700";
    } else if (e.backgroundColor === "#f59e0b") {
      status = "Segera Berakhir (≤6 bulan)";
      badgeClass = "bg-yellow-100 text-yellow-700";
    } else if (e.backgroundColor === "#2563eb") {
      status = "Mulai Kerjasama";
      badgeClass = "bg-blue-100 text-blue-700";
    }

    tb.innerHTML += `
  <tr>
    <td class="border px-3 py-2 text-center">${i + 1}</td>
    <td class="border px-3 py-2">${d.mitra || "-"}</td>
    <td class="border px-3 py-2 text-center">${d.jenisDokumen || "-"}</td>
    <td class="border px-3 py-2 text-center">
      ${new Date(d.tglMulai).toLocaleDateString("id-ID")}
      -
      ${new Date(d.tglBerakhir).toLocaleDateString("id-ID")}
    </td>
    <td class="border px-3 py-2 text-center">
      <span class="px-2 py-1 rounded text-xs ${badgeClass}">
        ${status}
      </span>
    </td>
  </tr>
`;
  });
}
/* ===============================
   ENTRY POINT ANALITIK STATUS
================================ */
function initAnalitikStatus() {
  // 🔄 RESET STATE FILTER
  currentStatusFilter = "all";

  // 🔘 RESET TAMPILAN TOMBOL FILTER
  document.querySelectorAll("[data-status-filter]").forEach((btn) => {
    btn.classList.remove("ring-2", "ring-offset-2");
  });

  const defaultBtn = document.querySelector('[data-status-filter="all"]');
  if (defaultBtn) {
    defaultBtn.classList.add("ring-2", "ring-offset-2");
  }

  // 📦 LOAD DATA JIKA BELUM ADA
  if (!Array.isArray(window.KERJASAMA) || window.KERJASAMA.length === 0) {
    loadKerjasamaFromSheet().then(renderAllAnalitikStatus);
  } else {
    renderAllAnalitikStatus();
  }
}

/* ===============================
   RENDER SEMUA KOMPONEN
================================ */
function renderAllAnalitikStatus() {
  renderKalenderKerjasama();
  renderChartStatus();
  renderChartSebaran();
}
