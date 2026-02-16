const JENIS_DOKUMEN_ALLOWED = [
  "IA (Implementation Arrangement)",
  "MoA (Memorandum Of Agreement)",
  "MoU (Memorandum Of Understanding)",
];

let chartJenisDokumenInstance = null;

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

function initAnalitikKlasifikasi() {
  if (!Array.isArray(KEGIATAN) || KEGIATAN.length === 0) {
    console.warn("KEGIATAN belum siap");
    return;
  }

  renderChartJenisDokumen();
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
