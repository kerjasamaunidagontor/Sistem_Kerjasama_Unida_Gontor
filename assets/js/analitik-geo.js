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
function initAnalitikGeo() {
  setTimeout(() => {
    if (!window.KERJASAMA || !window.KERJASAMA.length) return;

    if (GEO_MODE === "leaflet") {
      renderLeafletMap();
    } else {
      renderChartGeo();
    }

    renderGeoSummary(); // ⬅️ TAMBAHAN
  }, 0);
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

  // 🔒 FIXED INITIAL VIEW
  const initialCenter = [-2, 118];
  const initialZoom = 4;

  leafletMap = L.map("map", {
    zoomControl: true,
    scrollWheelZoom: false, // ⛔ no accidental zoom
    doubleClickZoom: false, // ⛔ no jump zoom
    touchZoom: true,
  }).setView(initialCenter, initialZoom);

  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    { attribution: "&copy; OpenStreetMap" },
  ).addTo(leafletMap);

  const count = {};
  window.KERJASAMA.forEach((d) => {
    const n = (d.negara || "Indonesia").trim();
    count[n] = (count[n] || 0) + 1;
  });

  fetch(
    "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json",
  )
    .then((r) => r.json())
    .then((geo) => {
      const geoLayer = L.geoJSON(geo, {
        interactive: true,
        style: (f) => ({
          fillColor: getColor(count[f.properties.name] || 0),
          weight: 0.6,
          color: "#94a3b8",
          fillOpacity: 0.85,
        }),
        onEachFeature: (f, l) => {
          // ❌ NO CLICK ZOOM
          l.on("click", (e) => {
            L.DomEvent.stop(e);
          });

          l.bindTooltip(
            `<b>${f.properties.name}</b><br/>Kerjasama: ${
              count[f.properties.name] || 0
            }`,
            {
              sticky: false, // ⛔ stop auto pan
              direction: "top",
              opacity: 0.95,
            },
          );
        },
      }).addTo(leafletMap);

      // 🔒 PREVENT MAP RECENTERING
      leafletMap.fitBounds(geoLayer.getBounds(), {
        animate: false,
        padding: [0, 0],
      });

      // balik ke view awal (INI KUNCI)
      leafletMap.setView(initialCenter, initialZoom, {
        animate: false,
      });
    });
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
  if (v >= 20) return "#7f1d1d";
  if (v >= 10) return "#dc2626";
  if (v >= 5) return "#f97316";
  if (v >= 1) return "#fde68a";
  return "#f8fafc";
}
/*********************************
 * SUMMARY & TOP COUNTRY
 *********************************/
function renderGeoSummary() {
  if (!window.KERJASAMA || !window.KERJASAMA.length) return;

  const map = {};

  window.KERJASAMA.forEach((d) => {
    const negara = (d.negara || "Indonesia").trim();
    const jenisRaw = (d.jenisDokumen || "").toLowerCase();

    if (!map[negara]) {
      map[negara] = { MoU: 0, MoA: 0, IA: 0 };
    }

    if (
      jenisRaw.includes("memorandum of understanding") ||
      jenisRaw === "mou"
    ) {
      map[negara].MoU++;
    } else if (
      jenisRaw.includes("memorandum of agreement") ||
      jenisRaw === "moa"
    ) {
      map[negara].MoA++;
    } else if (
      jenisRaw.includes("implementation arrangement") ||
      jenisRaw === "ia"
    ) {
      map[negara].IA++;
    }
  });

  // TOTAL NEGARA
  document.getElementById("totalNegara").innerText = Object.keys(map).length;

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
