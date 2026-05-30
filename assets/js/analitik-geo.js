/*********************************
 * CONFIG
 *********************************/
const GEO_MODE = "leaflet";
// ganti ke "chart" kalau mau balik ke ChartGeo

/*********************************
 * GLOBAL
 *********************************/
let leafletMap = null;
let geoChart = null;
/* ===============================
   GEO PAGINATION CONFIG
=============================== */
let GEO_CURRENT_PAGE = 1;
const GEO_PER_PAGE = 10; // 🔧 ubah sesuai selera

/*********************************
 * INIT (SATU PINTU)
 *********************************/
async function initAnalitikGeo() {
  // 🔥 Pastikan data ada dulu
  if (!Array.isArray(window.KERJASAMA) || window.KERJASAMA.length === 0) {
    await loadKerjasamaFromSheet();
  }

  if (GEO_MODE === "leaflet") {
    renderLeafletMap();
  } else {
    renderChartGeo();
  }

  renderGeoSummary();
}

/*********************************
 * UTIL: NORMALISASI NEGARA
 *********************************/
function normalizeCountry(n) {
  return n
    .toLowerCase()
    .trim()
    .replace("united states", "united states of america")
    .replace("south korea", "korea, republic of")
    .replace("north korea", "korea, democratic people's republic of")
    .replace("russia", "russian federation")
    .replace("laos", "lao people's democratic republic")
    .replace("vietnam", "viet nam");
}

/*********************************
 * LEAFLET (PRO MODE)
 *********************************/
function renderLeafletMap() {
  const el = document.getElementById("map");
  if (!el) return;

  if (leafletMap) {
    leafletMap.remove();
    leafletMap = null;
  }

  // 🌍 TAMPILKAN SELURUH DUNIA
  const initialCenter = [20, 0];  // ✅ Pusat dunia (Afrika/Eropa)
  const initialZoom = 2;           // ✅ Zoom out untuk lihat semua benua

  leafletMap = L.map("map", {
    zoomControl: false,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    touchZoom: true,
    attributionControl: false,
    // ✅ Batasi zoom minimum agar tetap bisa lihat dunia penuh
    minZoom: 1,
    maxZoom: 10,
  }).setView(initialCenter, initialZoom);

  // 🎨 PREMIUM TILE LAYER
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(leafletMap);

  // Add zoom control in top-right
  L.control.zoom({
    position: 'topright'
  }).addTo(leafletMap);

  // 📊 COUNT DATA
  const count = {};
  window.KERJASAMA.forEach((d) => {
    const n = (d.negara || "Indonesia").trim();
    count[n] = (count[n] || 0) + 1;
  });

  // 🌍 LOAD GEOJSON
  fetch("https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json")
    .then((r) => r.json())
    .then((geo) => {
      const geoLayer = L.geoJSON(geo, {
        interactive: true,
        style: (f) => {
          const value = count[f.properties.name] || 0;
          const color = getColor(value);
          return {
            fillColor: color,
            weight: 1,
            color: "#ffffff",
            fillOpacity: value > 0 ? 0.85 : 0.3,
            className: value >= 10 ? 'high-activity' : 'geo-country'
          };
        },
        onEachFeature: (f, l) => {
          const value = count[f.properties.name] || 0;
          
          const popupContent = `
            <div class="custom-popup-header">
              <span class="country-flag">${getCountryFlag(f.properties.name)}</span>
              ${f.properties.name}
            </div>
            <div class="custom-popup-body">
              <div class="stat-row">
                <span class="stat-label">📊 Total Kerjasama</span>
                <span class="stat-value">${value}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">🌟 Status</span>
                <span class="stat-value" style="background: ${value >= 10 ? '#fee2e2' : value >= 5 ? '#fef3c7' : '#f0fdf4'}; color: ${value >= 10 ? '#dc2626' : value >= 5 ? '#f59e0b' : '#10b981'}">
                  ${value >= 10 ? 'Sangat Aktif' : value >= 5 ? 'Aktif' : value > 0 ? 'Moderat' : 'Tidak Ada'}
                </span>
              </div>
              ${value > 0 ? `
              <div class="stat-row">
                <span class="stat-label">📈 Aktivitas</span>
                <span class="stat-value">${getActivityLevel(value)}</span>
              </div>
              ` : ''}
            </div>
          `;

          l.bindPopup(popupContent, {
            closeButton: true,
            autoClose: true,
            closeOnEscapeKey: true,
            maxWidth: 300,
            className: 'custom-popup'
          });

          l.on('mouseover', function() {
            this.setStyle({
              weight: 2,
              color: '#10b981',
              fillOpacity: 0.95
            });
            this.bringToFront();
          });

          l.on('mouseout', function() {
            const val = count[this.feature.properties.name] || 0;
            this.setStyle({
              weight: 1,
              color: "#ffffff",
              fillOpacity: val > 0 ? 0.85 : 0.3
            });
          });
        },
      }).addTo(leafletMap);

      // ❌ HAPUS ATAU KOMENTARI BAGIAN INI (yang auto zoom ke negara)
      // leafletMap.fitBounds(geoLayer.getBounds(), {
      //   animate: true,
      //   padding: [20, 20],
      //   duration: 1.5
      // });

      // ❌ JANGAN RESET KE VIEW INDONESIA
      // setTimeout(() => {
      //   leafletMap.setView(initialCenter, initialZoom, {
      //     animate: true,
      //     duration: 1
      //   });
      // }, 1000);
      
      // ✅ TETAPKAN VIEW DUNIA PENUH
      leafletMap.setView(initialCenter, initialZoom);
    });

  // ADD CUSTOM LEGEND
  addLegend();
}

/*********************************
 * CHART.JS GEO (LEGACY MODE)
 *********************************/

// register chart geo (aman walau tidak dipakai)
const { ChoroplethController, GeoFeature, ProjectionScale, ColorScale } =
  ChartGeo || {};
if (ChartGeo) {
  Chart.register(ChoroplethController, GeoFeature, ProjectionScale, ColorScale);
}

async function renderChartGeo() {
  const ctx = document.getElementById("geoChart");
  if (!ctx) return;

  const map = {};
  window.KERJASAMA.forEach((d) => {
    const negara = normalizeCountry(d.negara || "Indonesia");
    map[negara] = (map[negara] || 0) + 1;
  });

  const world = await fetch(
    "https://unpkg.com/world-atlas/countries-110m.json",
  ).then((r) => r.json());

  const countries = topojson.feature(world, world.objects.countries).features;

  const dataset = countries.map((c) => ({
    feature: c,
    value: map[normalizeCountry(c.properties.name || "")] || 0,
  }));

  if (geoChart) geoChart.destroy();

  geoChart = new Chart(ctx, {
    type: "choropleth",
    data: {
      labels: countries.map((d) => d.properties.name),
      datasets: [
        {
          data: dataset,
          borderWidth: 0.4,
          borderColor: "#e5e7eb",
          backgroundColor: (ctx) => {
            const v = ctx.raw?.value ?? 0;
            if (v >= 20) return "#7f1d1d";
            if (v >= 10) return "#dc2626";
            if (v >= 5) return "#f97316";
            if (v >= 1) return "#fde68a";
            return "#f8fafc";
          },
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        projection: {
          axis: "x",
          projection: "equalEarth",
          projectionScale: 1.6,
          center: [90, 5],
        },
      },
    },
  });
}

/*********************************
 * COLOR SCALE
 *********************************/
function getColor(v) {
  if (v >= 20) return "#dc2626";      // Red-600
  if (v >= 10) return "#ea580c";      // Orange-600
  if (v >= 5) return "#f59e0b";       // Amber-500
  if (v >= 1) return "#10b981";       // Emerald-500
  return "#cbd5e1";                   // Slate-300
}
// 📊 Get Activity Level Text
function getActivityLevel(value) {
  if (value >= 20) return "🔥 Sangat Tinggi";
  if (value >= 10) return "⭐ Tinggi";
  if (value >= 5) return "📈 Sedang";
  return "📊 Rendah";
}
// 🏳️ Simple Country Flag Emoji (You can enhance this)
function getCountryFlag(countryName) {
  const flagMap = {
    "Indonesia": "🇮",
    "Malaysia": "🇲",
    "Singapore": "🇸🇬",
    "Thailand": "🇹",
    "Philippines": "🇵🇭",
    "Vietnam": "🇻🇳",
    "Japan": "🇯🇵",
    "South Korea": "🇰🇷",
    "China": "🇨🇳",
    "Australia": "🇦🇺",
    "United States": "🇺",
    "United Kingdom": "🇬🇧",
    "Germany": "🇩",
    "Netherlands": "🇳",
    "France": "🇫🇷",
    "Saudi Arabia": "🇸🇦",
    "United Arab Emirates": "🇦🇪",
  };
  return flagMap[countryName] || "🌍";
}
// 📍 Add Legend Control
function addLegend() {
  const legend = L.control({ position: 'bottomleft' });
  
  legend.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = `
      <div class="legend-title">📊 Intensitas Kerjasama</div>
      <div class="legend-item">
        <div class="legend-color" style="background: #dc2626"></div>
        <span>≥ 20 (Sangat Tinggi)</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #ea580c"></div>
        <span>10 - 19 (Tinggi)</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #f59e0b"></div>
        <span>5 - 9 (Sedang)</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #10b981"></div>
        <span>1 - 4 (Rendah)</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #cbd5e1"></div>
        <span>Tidak Ada Data</span>
      </div>
    `;
    return div;
  };
  
  legend.addTo(leafletMap);
}
/*********************************
 * SUMMARY & TOP COUNTRY
 *********************************/
function renderGeoSummary() {
  if (!window.KERJASAMA || !window.KERJASAMA.length) return;

const map = {};
  let totalKerjasama = 0;

  window.KERJASAMA.forEach((d) => {
    const negara = (d.negara || "Indonesia").trim();
    const jenisRaw = (d.jenisDokumen || "").toLowerCase();

    if (!map[negara]) {
      map[negara] = { MoU: 0, MoA: 0, IA: 0 };
    }

    totalKerjasama++;

    if (jenisRaw.includes("memorandum of understanding") || jenisRaw === "mou") {
      map[negara].MoU++;
    } else if (jenisRaw.includes("memorandum of agreement") || jenisRaw === "moa") {
      map[negara].MoA++;
    } else if (jenisRaw.includes("implementation arrangement") || jenisRaw === "ia") {
      map[negara].IA++;
    }
  });

  // Update mini stats
  const totalNegara = Object.keys(map).length;
  const negaraAktif = Object.values(map).filter(v => (v.MoU + v.MoA + v.IA) >= 5).length;
  
  
  document.getElementById("statTotalNegara").innerText = totalNegara;
  document.getElementById("statAktif").innerText = negaraAktif;
  document.getElementById("statTotalKerjasama").innerText = totalKerjasama;

  // FLATTEN + SORT
  const rows = Object.entries(map)
    .map(([negara, v]) => ({
      negara,
      ...v,
      total: v.MoU + v.MoA + v.IA,
    }))
    .sort((a, b) => b.total - a.total);

  // ===============================
  // PAGINATION
  // ===============================
  const total = rows.length;
  const start = (GEO_CURRENT_PAGE - 1) * GEO_PER_PAGE;
  const pageRows = rows.slice(start, start + GEO_PER_PAGE);

  const tbody = document.getElementById("topNegaraBody");
  tbody.innerHTML = "";

  if (!pageRows.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-4 text-center text-gray-500">
          Data tidak ditemukan
        </td>
      </tr>
    `;
    renderGeoPagination(0);
    return;
  }

  pageRows.forEach((d, i) => {
    tbody.innerHTML += `
      <tr class="border-b last:border-0">
        <td class="py-1">${start + i + 1}</td>
        <td class="py-1">${d.negara}</td>
        <td class="py-1 text-right">${d.MoU}</td>
        <td class="py-1 text-right">${d.MoA}</td>
        <td class="py-1 text-right">${d.IA}</td>
        <td class="py-1 text-right font-semibold">${d.total}</td>
      </tr>
    `;
  });

  renderGeoPagination(total);
}
function renderGeoPagination(total) {
  const pagination = document.getElementById("geo-pagination");
  const info = document.getElementById("geo-pagination-info");
  if (!pagination || !info) return;

  const pageCount = Math.ceil(total / GEO_PER_PAGE);
  pagination.innerHTML = "";

  info.textContent = total
    ? `Menampilkan ${(GEO_CURRENT_PAGE - 1) * GEO_PER_PAGE + 1}
       - ${Math.min(GEO_CURRENT_PAGE * GEO_PER_PAGE, total)} dari ${total} negara`
    : "Menampilkan 0 negara";

  if (pageCount <= 1) return;

  const maxVisible = 5;
  let start = Math.max(1, GEO_CURRENT_PAGE - Math.floor(maxVisible / 2));
  let end = Math.min(pageCount, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  // ⬅ Prev
  pagination.innerHTML += `
    <button onclick="goToGeoPage(${Math.max(1, GEO_CURRENT_PAGE - 1)})"
      class="px-3 py-1 border rounded-lg hover:bg-gray-100">
      ◀
    </button>
  `;

  // Page 1
  if (start > 1) {
    pagination.innerHTML += geoPageButton(1);
    if (start > 2) pagination.innerHTML += geoEllipsis();
  }

  // Middle
  for (let i = start; i <= end; i++) {
    pagination.innerHTML += geoPageButton(i);
  }

  // Last
  if (end < pageCount) {
    if (end < pageCount - 1) pagination.innerHTML += geoEllipsis();
    pagination.innerHTML += geoPageButton(pageCount);
  }

  // Next ➡
  pagination.innerHTML += `
    <button onclick="goToGeoPage(${Math.min(pageCount, GEO_CURRENT_PAGE + 1)})"
      class="px-3 py-1 border rounded-lg hover:bg-gray-100">
      ▶
    </button>
  `;
}

function geoPageButton(page) {
  return `
    <button onclick="goToGeoPage(${page})"
      class="px-3 py-1 rounded-lg border
      ${
        page === GEO_CURRENT_PAGE
          ? "bg-emerald-600 text-white"
          : "hover:bg-gray-100"
      }">
      ${page}
    </button>
  `;
}

function geoEllipsis() {
  return `<span class="px-2 text-gray-400">...</span>`;
}

function goToGeoPage(page) {
  GEO_CURRENT_PAGE = page;
  renderGeoSummary();
}
/*********************************
 * 📥 DOWNLOAD FUNCTIONS
 *********************************/

// 📊 Download Table sebagai CSV
function downloadTableCSV() {
  if (!window.KERJASAMA || !window.KERJASAMA.length) {
    alert("⚠️ Data belum tersedia");
    return;
  }

  // Ambil data lengkap (bukan hanya yang tampil di pagination)
  const dataMap = {};
  window.KERJASAMA.forEach((d) => {
    const negara = (d.negara || "Indonesia").trim();
    const jenisRaw = (d.jenisDokumen || "").toLowerCase();
    
    if (!dataMap[negara]) {
      dataMap[negara] = { MoU: 0, MoA: 0, IA: 0 };
    }
    
    if (jenisRaw.includes("memorandum of understanding") || jenisRaw === "mou") {
      dataMap[negara].MoU++;
    } else if (jenisRaw.includes("memorandum of agreement") || jenisRaw === "moa") {
      dataMap[negara].MoA++;
    } else if (jenisRaw.includes("implementation arrangement") || jenisRaw === "ia") {
      dataMap[negara].IA++;
    }
  });

  // Format ke CSV
  const headers = ["No", "Negara", "MoU", "MoA", "IA", "Total"];
  const rows = Object.entries(dataMap)
    .map(([negara, v], i) => {
      const total = v.MoU + v.MoA + v.IA;
      return [i + 1, negara, v.MoU, v.MoA, v.IA, total];
    })
    .sort((a, b) => b[5] - a[5]); // Sort by Total DESC

  let csv = headers.join(",") + "\n";
  rows.forEach(row => {
    // Escape koma dan quote di nama negara
    const escaped = row.map(cell => 
      typeof cell === "string" && (cell.includes(",") || cell.includes('"')) 
        ? `"${cell.replace(/"/g, '""')}"` 
        : cell
    );
    csv += escaped.join(",") + "\n";
  });

  // Trigger download
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `top-negara-mitra-${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
}

// 📈 Download Table sebagai Excel (HTML-based, kompatibel dengan Excel)
function downloadTableExcel() {
  if (!window.KERJASAMA || !window.KERJASAMA.length) {
    alert("⚠️ Data belum tersedia");
    return;
  }

  // Reuse logic CSV untuk dapat data lengkap
  const dataMap = {};
  window.KERJASAMA.forEach((d) => {
    const negara = (d.negara || "Indonesia").trim();
    const jenisRaw = (d.jenisDokumen || "").toLowerCase();
    
    if (!dataMap[negara]) {
      dataMap[negara] = { MoU: 0, MoA: 0, IA: 0 };
    }
    
    if (jenisRaw.includes("memorandum of understanding") || jenisRaw === "mou") {
      dataMap[negara].MoU++;
    } else if (jenisRaw.includes("memorandum of agreement") || jenisRaw === "moa") {
      dataMap[negara].MoA++;
    } else if (jenisRaw.includes("implementation arrangement") || jenisRaw === "ia") {
      dataMap[negara].IA++;
    }
  });

  const rows = Object.entries(dataMap)
    .map(([negara, v], i) => {
      const total = v.MoU + v.MoA + v.IA;
      return [i + 1, negara, v.MoU, v.MoA, v.IA, total];
    })
    .sort((a, b) => b[5] - a[5]);

  // Format HTML Table untuk Excel
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>
      <x:ExcelWorksheet>
        <x:Name>Data</x:Name>
        <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
      </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
    </head>
    <body>
      <table border="1">
        <thead style="background:#f1f5f9;font-weight:bold">
          <tr>
            <th>No</th><th>Negara</th><th>MoU</th><th>MoA</th><th>IA</th><th>Total</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  rows.forEach(row => {
    html += `<tr>
      <td>${row[0]}</td>
      <td>${row[1]}</td>
      <td style="text-align:right">${row[2]}</td>
      <td style="text-align:right">${row[3]}</td>
      <td style="text-align:right">${row[4]}</td>
      <td style="text-align:right;font-weight:bold">${row[5]}</td>
    </tr>`;
  });
  
  html += `</tbody></table></body></html>`;

  // Trigger download
  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `top-negara-mitra-${new Date().toISOString().slice(0,10)}.xls`;
  link.click();
}
