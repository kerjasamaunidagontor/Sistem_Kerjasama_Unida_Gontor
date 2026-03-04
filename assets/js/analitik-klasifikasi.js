// ================== GLOBAL CONTROL ================ //
let chartJenisDokumenInstance = null;
let chartProdiInstance = null;
let currentFilterTahun = "all";
let currentFilterFakultas = "all";

const JENIS_DOKUMEN_ALLOWED = [
  "IA (Implementation Arrangement)",
  "MoA (Memorandum of Agreement)",
  "MoU (Memorandum of Understanding)",
];

function renderChartJenisDokumen() {
  const canvas = document.getElementById("chartJenisDokumen");
  if (!canvas) return;

  const { years, jenisList, map } = groupKegiatanByJenisDokumen();

  const datasets = jenisList.map((jenis, i) => ({
    label: jenis,
    data: years.map((y) => map[y]?.[jenis] || 0),
    tension: 0.4,
    borderWidth: 2,
    fill: false,
  }));

  if (chartJenisDokumenInstance) {
    chartJenisDokumenInstance.destroy();
  }

  chartJenisDokumenInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels: years,
      datasets,
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Jumlah Kegiatan",
          },
        },
        x: {
          title: {
            display: true,
            text: "Tahun",
          },
        },
      },
    },
  });
}

function groupKegiatanByJenisDokumen() {
  const map = {}; // { tahun: { jenisDokumen: count } }
  const jenisSet = new Set();

  KEGIATAN.forEach((k) => {
    if (!k.tahun || !k.jenisDokumen) return;

    const tahun = String(k.tahun).trim();
    const jenis = k.jenisDokumen.trim();

    // 🔥 FILTER JENIS DOKUMEN
    if (!JENIS_DOKUMEN_ALLOWED.includes(jenis)) return;

    jenisSet.add(jenis);

    if (!map[tahun]) map[tahun] = {};
    if (!map[tahun][jenis]) map[tahun][jenis] = 0;

    map[tahun][jenis]++;
  });

  const years = Object.keys(map).sort();
  const jenisList = Array.from(jenisSet);

  return { years, jenisList, map };
}
// ================== Chart Prodi PJ ================ //
function groupKegiatanByProdi() {
  const prodiSet = new Set();
  const bidangSet = new Set();
  const map = {};

  KEGIATAN.forEach((k) => {
    if (!k.pj || !k.bidang) return;

    // 🔥 FILTER TAHUN
    if (
      currentFilterTahun !== "all" &&
      String(k.tahun).trim() !== currentFilterTahun
    )
      return;

    // 🔥 FILTER FAKULTAS
    if (
      currentFilterFakultas !== "all" &&
      (k.fakultas || "").trim() !== currentFilterFakultas
    )
      return;

    const prodi = k.pj.trim();
    const bidang = k.bidang.trim();

    prodiSet.add(prodi);
    bidangSet.add(bidang);

    if (!map[prodi]) map[prodi] = {};
    if (!map[prodi][bidang]) map[prodi][bidang] = 0;

    map[prodi][bidang]++;
  });

  const prodiList = Array.from(prodiSet);
  const bidangList = Array.from(bidangSet);

  return { prodiList, bidangList, map };
}

function renderChartProdi() {
  const canvas = document.getElementById("chartProdi");
  if (!canvas) return;

  const { prodiList, bidangList, map } = groupKegiatanByProdi();

  if (chartProdiInstance) {
    chartProdiInstance.destroy();
  }

  const colors = ["#2563eb", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

  const datasets = bidangList.map((bidang, i) => ({
    label: bidang,
    data: prodiList.map((prodi) => map[prodi]?.[bidang] || 0),
    backgroundColor: colors[i % colors.length],
  }));

  chartProdiInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels: prodiList,
      datasets,
    },
    options: {
      responsive: true,
      scales: {
        x: {
          stacked: true,
          title: {
            display: true,
            text: "Prodi (PJ)",
          },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          title: {
            display: true,
            text: "Jumlah Kegiatan",
          },
        },
      },
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}
function initFilterProdi() {
  const tahunSelect = document.getElementById("filterTahun");
  const fakultasSelect = document.getElementById("filterFakultas");

  if (!tahunSelect || !fakultasSelect) return;

  const tahunSet = new Set();
  const fakultasSet = new Set();

  KEGIATAN.forEach((k) => {
    if (k.tahun) tahunSet.add(String(k.tahun).trim());
    if (k.fakultas) fakultasSet.add(k.fakultas.trim());
  });

  // isi tahun
  Array.from(tahunSet)
    .sort()
    .forEach((t) => {
      tahunSelect.innerHTML += `<option value="${t}">${t}</option>`;
    });

  // isi fakultas
  Array.from(fakultasSet)
    .sort()
    .forEach((f) => {
      fakultasSelect.innerHTML += `<option value="${f}">${f}</option>`;
    });

  // event listener
  tahunSelect.addEventListener("change", (e) => {
    currentFilterTahun = e.target.value;
    renderChartProdi();
  });

  fakultasSelect.addEventListener("change", (e) => {
    currentFilterFakultas = e.target.value;
    renderChartProdi();
  });
}

// ================== INIT CHARTS ================= //
function initAnalitikKlasifikasi() {
  if (!Array.isArray(KEGIATAN) || KEGIATAN.length === 0) {
    console.warn("KEGIATAN belum siap");
    return;
  }
  initFilterProdi();
  renderChartJenisDokumen();
  renderChartProdi();
}

