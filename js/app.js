import { Graph } from "./graph.js";

const L = globalThis.L;

const statusEl = document.getElementById("status");
const selectOrigin = document.getElementById("select-origin");
const selectDest = document.getElementById("select-dest");

const COL_EDGE = "#4a6fa5";
const COL_EDGE_INACTIVE = "#3d4654";

let graph;
let map;
let markersLayer;
let edgesLayer;
const markerById = new Map();
let originId = "";
let destId = "";

async function loadGraph() {
  const res = await fetch("data/seed.json");
  if (!res.ok) throw new Error(`Falha ao carregar seed: ${res.status}`);
  const data = await res.json();
  return Graph.fromJSON(data, { recomputeWeights: true });
}

function summarize(g) {
  const n = g.vertices.size;
  const m = g.edgeCount;
  const cds = g.listCDs().length;
  const ent = g.listEntregas().length;
  return `${n} nós (${cds} CDs, ${ent} entregas), ${m} arestas — pesos em km (Haversine).`;
}

function vertexLabel(v) {
  return `${v.id.replace(/^(cd-|ent-)/, "")} (${v.tipo})`;
}

function makeDivIcon(v, selected) {
  const base = v.tipo === "CD" ? "map-marker-dot--cd" : "map-marker-dot--entrega";
  const sel = selected ? " map-marker-dot--selected" : "";
  return L.divIcon({
    className: "map-marker-wrap",
    html: `<div class="map-marker-dot ${base}${sel}" role="img" aria-label="${vertexLabel(v)}"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function fillSelects(g) {
  selectOrigin.innerHTML = "";
  selectDest.innerHTML = "";
  const cds = g.listCDs().sort((a, b) => a.id.localeCompare(b.id));
  const ents = g.listEntregas().sort((a, b) => a.id.localeCompare(b.id));
  for (const v of cds) {
    const opt = document.createElement("option");
    opt.value = v.id;
    opt.textContent = vertexLabel(v);
    selectOrigin.appendChild(opt);
  }
  for (const v of ents) {
    const opt = document.createElement("option");
    opt.value = v.id;
    opt.textContent = vertexLabel(v);
    selectDest.appendChild(opt);
  }
  originId = cds[0]?.id ?? "";
  destId = ents[0]?.id ?? "";
  selectOrigin.value = originId;
  selectDest.value = destId;
}

function refreshMarkerIcons() {
  for (const [id, m] of markerById) {
    const v = graph.vertices.get(id);
    if (!v) continue;
    const sel = id === originId || id === destId;
    m.setIcon(makeDivIcon(v, sel));
  }
}

function renderVertices(g) {
  markersLayer.clearLayers();
  markerById.clear();
  const latlngs = [];
  for (const v of g.vertices.values()) {
    const ll = [v.lat, v.lng];
    latlngs.push(ll);
    const sel = v.id === originId || v.id === destId;
    const mk = L.marker(ll, {
      icon: makeDivIcon(v, sel),
      title: vertexLabel(v),
    });
    mk.on("click", () => {
      if (v.tipo === "CD") {
        originId = v.id;
        selectOrigin.value = originId;
      } else {
        destId = v.id;
        selectDest.value = destId;
      }
      refreshMarkerIcons();
    });
    markersLayer.addLayer(mk);
    markerById.set(v.id, mk);
  }
  if (latlngs.length) {
    map.fitBounds(L.latLngBounds(latlngs), { padding: [28, 28], maxZoom: 8 });
  }
}

function renderEdges(g) {
  edgesLayer.clearLayers();
  for (const e of g.listEdges()) {
    const a = g.vertices.get(e.from);
    const b = g.vertices.get(e.to);
    if (!a || !b) continue;
    const poly = L.polyline(
      [
        [a.lat, a.lng],
        [b.lat, b.lng],
      ],
      {
        color: e.ativa ? COL_EDGE : COL_EDGE_INACTIVE,
        weight: e.ativa ? 3 : 2,
        opacity: e.ativa ? 0.85 : 0.45,
        dashArray: e.ativa ? null : "6 8",
      }
    );
    poly.bindTooltip(`${e.from} ↔ ${e.to} · ${e.pesoKm.toFixed(1)} km`, {
      sticky: true,
    });
    edgesLayer.addLayer(poly);
  }
}

function initMap(g) {
  graph = g;
  const center = [-22.5, -45.5];
  map = L.map("map", { zoomControl: true }).setView(center, 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  edgesLayer = L.layerGroup().addTo(map);
  markersLayer = L.layerGroup().addTo(map);

  fillSelects(g);
  renderEdges(g);
  renderVertices(g);

  const onSelectionChange = () => {
    originId = selectOrigin.value;
    destId = selectDest.value;
    refreshMarkerIcons();
  };
  selectOrigin.addEventListener("change", onSelectionChange);
  selectDest.addEventListener("change", onSelectionChange);
}

loadGraph()
  .then((g) => {
    if (!L) {
      throw new Error("Leaflet não carregou (verifique a ordem dos scripts).");
    }
    if (statusEl) statusEl.textContent = summarize(g);
    initMap(g);
  })
  .catch((err) => {
    if (statusEl) {
      statusEl.textContent =
        "Erro ao carregar. Use um servidor HTTP local (ex.: npx serve).";
      statusEl.classList.add("status--error");
    }
    console.error(err);
  });
