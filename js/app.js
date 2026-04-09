import { Graph } from "./graph.js";
import {
  dijkstra,
  kruskalMSTAmongCDs,
  reachableFromSources,
  dfsOrderFrom,
} from "./algorithms.js";
import seedData from "../data/seed.js";

const L = globalThis.L;

const statusEl = document.getElementById("status");
const selectOrigin = document.getElementById("select-origin");
const selectDest = document.getElementById("select-dest");
const metricDijkstra = document.getElementById("metric-dijkstra");
const metricMst = document.getElementById("metric-mst");
const metricBfs = document.getElementById("metric-bfs");
const metricDfs = document.getElementById("metric-dfs");

const COL_EDGE = "#3d4f66";
const COL_EDGE_INACTIVE = "#2d3540";
const COL_MST = "#d4a84b";
const COL_DIJKSTRA = "#3ddc97";

let graph;
let map;
let edgesLayer;
let mstLayer;
let routeLayer;
let markersLayer;
const markerById = new Map();
let originId = "";
let destId = "";
let reachableFromCDs = new Set();

function loadGraph() {
  return Promise.resolve(Graph.fromJSON(seedData, { recomputeWeights: true }));
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

function makeDivIcon(v, selected, unreachable) {
  const base = v.tipo === "CD" ? "map-marker-dot--cd" : "map-marker-dot--entrega";
  const sel = selected ? " map-marker-dot--selected" : "";
  const unr =
    v.tipo === "ENTREGA" && unreachable ? " map-marker-dot--unreachable" : "";
  return L.divIcon({
    className: "map-marker-wrap",
    html: `<div class="map-marker-dot ${base}${sel}${unr}" role="img" aria-label="${vertexLabel(v)}"></div>`,
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
    const unr = v.tipo === "ENTREGA" && !reachableFromCDs.has(id);
    m.setIcon(makeDivIcon(v, sel, unr));
  }
}

function renderVertices(g, fitBounds) {
  markersLayer.clearLayers();
  markerById.clear();
  const latlngs = [];
  for (const v of g.vertices.values()) {
    const ll = [v.lat, v.lng];
    latlngs.push(ll);
    const sel = v.id === originId || v.id === destId;
    const unr = v.tipo === "ENTREGA" && !reachableFromCDs.has(v.id);
    const mk = L.marker(ll, {
      icon: makeDivIcon(v, sel, unr),
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
      recalcAlgorithms();
    });
    markersLayer.addLayer(mk);
    markerById.set(v.id, mk);
  }
  if (fitBounds && latlngs.length) {
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
        weight: e.ativa ? 2 : 2,
        opacity: e.ativa ? 0.55 : 0.3,
        dashArray: e.ativa ? null : "6 8",
      }
    );
    poly.bindTooltip(`${e.from} ↔ ${e.to} · ${e.pesoKm.toFixed(1)} km`, {
      sticky: true,
    });
    edgesLayer.addLayer(poly);
  }
}

function drawPathOnLayer(layerGroup, path, style) {
  if (!path || path.length < 2) return;
  for (let i = 0; i < path.length - 1; i++) {
    const A = graph.vertices.get(path[i]);
    const B = graph.vertices.get(path[i + 1]);
    if (!A || !B) continue;
    const poly = L.polyline(
      [
        [A.lat, A.lng],
        [B.lat, B.lng],
      ],
      style
    );
    layerGroup.addLayer(poly);
  }
}

function recalcAlgorithms() {
  const cdIds = graph.listCDs().map((v) => v.id);
  reachableFromCDs = reachableFromSources(graph, cdIds);

  const entregas = graph.listEntregas();
  const entReach = entregas.filter((v) => reachableFromCDs.has(v.id)).length;
  const entTotal = entregas.length;
  if (metricBfs) {
    metricBfs.textContent =
      entTotal === 0
        ? "—"
        : `${entReach} / ${entTotal} entregas alcançáveis (BFS a partir dos CDs)`;
  }

  const dfsOrder = dfsOrderFrom(graph, originId);
  if (metricDfs) {
    metricDfs.textContent =
      dfsOrder.length === 0
        ? "—"
        : `${dfsOrder.length} vértice(s) na DFS a partir do CD de origem`;
  }

  const dk = dijkstra(graph, originId, destId);
  if (metricDijkstra) {
    metricDijkstra.textContent = dk.ok
      ? `${dk.distance.toFixed(2)} km · ${dk.path.join(" → ")}`
      : "Sem rota (grafo desconexo ou arestas bloqueadas)";
  }

  const mst = kruskalMSTAmongCDs(graph);
  if (metricMst) {
    if (mst.cdCount <= 1) {
      metricMst.textContent = "— (apenas um CD)";
    } else if (!mst.cdsConnected) {
      metricMst.textContent = `${mst.totalKm.toFixed(2)} km — CDs não formam um único componente (floresta)`;
    } else {
      metricMst.textContent = `${mst.totalKm.toFixed(2)} km (${mst.edges.length} arestas, Kruskal só entre CDs)`;
    }
  }

  routeLayer.clearLayers();
  mstLayer.clearLayers();

  for (const e of mst.edges) {
    const a = graph.vertices.get(e.from);
    const b = graph.vertices.get(e.to);
    if (!a || !b) continue;
    const poly = L.polyline(
      [
        [a.lat, a.lng],
        [b.lat, b.lng],
      ],
      {
        color: COL_MST,
        weight: 5,
        opacity: 0.88,
        dashArray: "10 7",
        lineCap: "round",
      }
    );
    poly.bindTooltip(`MST · ${e.from} ↔ ${e.to} · ${e.pesoKm.toFixed(1)} km`, {
      sticky: true,
    });
    mstLayer.addLayer(poly);
  }

  if (dk.ok && dk.path.length >= 2) {
    drawPathOnLayer(routeLayer, dk.path, {
      color: COL_DIJKSTRA,
      weight: 6,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
    });
  }

  refreshMarkerIcons();
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
  mstLayer = L.layerGroup().addTo(map);
  routeLayer = L.layerGroup().addTo(map);
  markersLayer = L.layerGroup().addTo(map);

  fillSelects(g);
  reachableFromCDs = reachableFromSources(graph, graph.listCDs().map((v) => v.id));
  renderEdges(g);
  renderVertices(g, true);
  recalcAlgorithms();

  const onSelectionChange = () => {
    originId = selectOrigin.value;
    destId = selectDest.value;
    recalcAlgorithms();
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
      const hint =
        err?.message?.includes("Leaflet") || !globalThis.L
          ? " Verifique a internet (CDN do Leaflet) e use um servidor HTTP na pasta do projeto: npm start"
          : " Abra o console (F12) para detalhes. Rode na pasta do projeto: npm start";
      statusEl.textContent = `Erro: ${err?.message ?? err}.${hint}`;
      statusEl.classList.add("status--error");
    }
    console.error(err);
  });
