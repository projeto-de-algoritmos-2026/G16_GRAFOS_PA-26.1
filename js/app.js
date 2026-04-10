import { Graph } from "./graph.js";
<<<<<<< Updated upstream
import {
  dijkstra,
  kruskalMSTAmongCDs,
  reachableFromSources,
  dfsOrderFrom,
} from "./algorithms.js";
import seedData from "../data/seed.js";
=======
import { dijkstra, kruskalMSTAmongCDs } from "./algorithms.js";
import seedData from "../data/seed.js";
import { haversineKm } from "./geo.js";
>>>>>>> Stashed changes

const L = globalThis.L;

const statusEl = document.getElementById("status");
const selectOrigin = document.getElementById("select-origin");
const selectDest = document.getElementById("select-dest");
<<<<<<< Updated upstream
const metricDijkstra = document.getElementById("metric-dijkstra");
const metricMst = document.getElementById("metric-mst");
const metricBfs = document.getElementById("metric-bfs");
const metricDfs = document.getElementById("metric-dfs");

const COL_EDGE = "#3d4f66";
const COL_EDGE_INACTIVE = "#2d3540";
const COL_MST = "#d4a84b";
const COL_DIJKSTRA = "#3ddc97";
=======
const btnCalcRoute = document.getElementById("btn-calc-route");
const btnToggleMst = document.getElementById("btn-toggle-mst");
const selectMode = document.getElementById("select-mode");
const selectEdge = document.getElementById("select-edge");
const btnEdgeRemove = document.getElementById("btn-edge-remove");
const metricDijkstra = document.getElementById("metric-dijkstra");
const metricMst = document.getElementById("metric-mst");

const COL_EDGE = "#3d4f66";
const COL_MST = "#d4a84b";
const COL_DIJKSTRA = "#3ddc97";

const ICON_CD = new URL("../assets/cd.png", import.meta.url).href;
const ICON_ENTREGA = new URL("../assets/entrega.png", import.meta.url).href;
>>>>>>> Stashed changes

let graph;
let map;
let edgesLayer;
let mstLayer;
let routeLayer;
let markersLayer;
const markerById = new Map();
<<<<<<< Updated upstream
let originId = "";
let destId = "";
let reachableFromCDs = new Set();
=======
let interactionMode = "nav";
let linkPendingId = null;
let showMST = false;
let routeFrom = "";
let routeTo = "";
>>>>>>> Stashed changes

function loadGraph() {
  return Promise.resolve(Graph.fromJSON(seedData, { recomputeWeights: true }));
}

function summarize(g) {
  const n = g.vertices.size;
  const m = g.edgeCount;
  const cds = g.listCDs().length;
  const ent = g.listEntregas().length;
  return `${n} nós (${cds} CDs capitais, ${ent} entregas), ${m} arestas — km (Haversine).`;
}

function vertexLabel(v) {
  if (v.nome) return `${v.nome} (${v.tipo})`;
  return `${v.id.replace(/^(cd-|ent-)/, "")} (${v.tipo})`;
}

<<<<<<< Updated upstream
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
=======
function makeMarkerIcon(v, selected, linkPending) {
  const src = v.tipo === "CD" ? ICON_CD : ICON_ENTREGA;
  const w = selected ? 18 : 15;
  const h = w;
  const cls = [
    "map-glyph",
    v.tipo === "CD" ? "map-glyph--cd" : "map-glyph--ent",
    selected ? "map-glyph--selected" : "",
    linkPending ? "map-glyph--pending" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return L.icon({
    iconUrl: src,
    iconSize: [w, h],
    iconAnchor: [w / 2, h / 2],
    className: cls,
>>>>>>> Stashed changes
  });
}

function pickOrigin() {
  return selectOrigin?.value?.trim() || "";
}

function pickDest() {
  return selectDest?.value?.trim() || "";
}

function markerSelected(id) {
  const po = pickOrigin();
  const pd = pickDest();
  return id === po || id === pd;
}

function fillSelects(g) {
  const savedO = pickOrigin();
  const savedD = pickDest();
  selectOrigin.innerHTML = "";
  selectDest.innerHTML = "";

  const optEmptyO = document.createElement("option");
  optEmptyO.value = "";
  optEmptyO.textContent = "— Escolha o CD —";
  selectOrigin.appendChild(optEmptyO);

  const optEmptyD = document.createElement("option");
  optEmptyD.value = "";
  optEmptyD.textContent = "— Escolha a entrega —";
  selectDest.appendChild(optEmptyD);

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

  selectOrigin.value = cds.some((c) => c.id === savedO) ? savedO : "";
  selectDest.value = ents.some((e) => e.id === savedD) ? savedD : "";
}

function populateEdgeSelect() {
  if (!selectEdge) return;
  selectEdge.innerHTML = "";
  const edges = graph.listEdges().sort((a, b) => {
    const sa = `${a.from}-${a.to}`;
    const sb = `${b.from}-${b.to}`;
    return sa.localeCompare(sb);
  });
  for (const e of edges) {
    const opt = document.createElement("option");
    opt.value = `${e.from}\t${e.to}`;
    opt.textContent = `${e.from} ↔ ${e.to} · ${e.pesoKm.toFixed(1)} km`;
    selectEdge.appendChild(opt);
  }
}

function parseEdgeSelectValue() {
  const v = selectEdge?.value;
  if (!v || !v.includes("\t")) return null;
  const [from, to] = v.split("\t");
  return from && to ? { from, to } : null;
}

function refreshMarkerIcons() {
  for (const [id, m] of markerById) {
    const v = graph.vertices.get(id);
    if (!v) continue;
<<<<<<< Updated upstream
    const sel = id === originId || id === destId;
    const unr = v.tipo === "ENTREGA" && !reachableFromCDs.has(id);
    m.setIcon(makeDivIcon(v, sel, unr));
=======
    const sel = markerSelected(id);
    const pend = id === linkPendingId;
    m.setIcon(makeMarkerIcon(v, sel, pend));
>>>>>>> Stashed changes
  }
}

function renderVertices(g, fitBounds) {
  markersLayer.clearLayers();
  markerById.clear();
  const latlngs = [];
  for (const v of g.vertices.values()) {
    const ll = [v.lat, v.lng];
    latlngs.push(ll);
<<<<<<< Updated upstream
    const sel = v.id === originId || v.id === destId;
    const unr = v.tipo === "ENTREGA" && !reachableFromCDs.has(v.id);
    const mk = L.marker(ll, {
      icon: makeDivIcon(v, sel, unr),
=======
    const sel = markerSelected(v.id);
    const pend = v.id === linkPendingId;
    const mk = L.marker(ll, {
      icon: makeMarkerIcon(v, sel, pend),
>>>>>>> Stashed changes
      title: vertexLabel(v),
    });
    mk.on("click", (ev) => {
      L.DomEvent.stopPropagation(ev);
      if (interactionMode === "link") {
        handleLinkClick(v.id);
        return;
      }
      if (interactionMode === "nav") {
        if (v.tipo === "CD") {
          selectOrigin.value = v.id;
        } else {
          selectDest.value = v.id;
        }
        refreshMarkerIcons();
      } else if (interactionMode === "remove-edge") {
        /* só por clique na linha */
      }
<<<<<<< Updated upstream
      recalcAlgorithms();
=======
>>>>>>> Stashed changes
    });
    markersLayer.addLayer(mk);
    markerById.set(v.id, mk);
  }
  if (fitBounds && latlngs.length) {
<<<<<<< Updated upstream
    map.fitBounds(L.latLngBounds(latlngs), { padding: [28, 28], maxZoom: 8 });
=======
    map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: 4 });
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        color: e.ativa ? COL_EDGE : COL_EDGE_INACTIVE,
        weight: e.ativa ? 2 : 2,
        opacity: e.ativa ? 0.55 : 0.3,
        dashArray: e.ativa ? null : "6 8",
=======
        color: COL_EDGE,
        weight: 2,
        opacity: 0.55,
>>>>>>> Stashed changes
      }
    );
    poly.bindTooltip(`${e.from} ↔ ${e.to} · ${e.pesoKm.toFixed(1)} km`, {
      sticky: true,
    });
    poly.on("click", (ev) => {
      L.DomEvent.stopPropagation(ev);
      if (interactionMode === "remove-edge") {
        graph.removeEdge(e.from, e.to);
        linkPendingId = null;
        invalidateRouteIfNeeded();
        fullRefresh();
      }
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

<<<<<<< Updated upstream
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
=======
function invalidateRouteIfNeeded() {
  if (routeFrom && !graph.vertices.has(routeFrom)) {
    routeFrom = "";
    routeTo = "";
  }
  if (routeTo && !graph.vertices.has(routeTo)) {
    routeTo = "";
  }
}

function recalcAlgorithms() {
  routeLayer.clearLayers();
  mstLayer.clearLayers();

  if (metricDijkstra) {
    if (!routeFrom || !routeTo) {
      metricDijkstra.textContent =
        "Selecione o CD, a entrega e clique em «Calcular menor caminho».";
    } else if (!graph.vertices.has(routeFrom) || !graph.vertices.has(routeTo)) {
      metricDijkstra.textContent = "Rota inválida após alteração no grafo.";
      routeFrom = "";
      routeTo = "";
    } else {
      const dk = dijkstra(graph, routeFrom, routeTo);
      metricDijkstra.textContent = dk.ok
        ? `${dk.distance.toFixed(2)} km · ${dk.path.join(" → ")}`
        : "Sem rota entre o CD e a entrega (grafo desconexo).";
      if (dk.ok && dk.path.length >= 2) {
        drawPathOnLayer(routeLayer, dk.path, {
          color: COL_DIJKSTRA,
          weight: 6,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
        });
      }
    }
>>>>>>> Stashed changes
  }

  const mst = kruskalMSTAmongCDs(graph);
  if (metricMst) {
<<<<<<< Updated upstream
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
=======
    if (!showMST) {
      metricMst.textContent =
        mst.cdCount <= 1
          ? "—"
          : "Oculto no mapa — use «Mostrar MST (Kruskal)» para ver e obter o custo.";
    } else if (mst.cdCount <= 1) {
      metricMst.textContent = "— (apenas um CD)";
    } else if (!mst.cdsConnected) {
      metricMst.textContent = `${mst.totalKm.toFixed(2)} km — floresta (CDs em mais de um componente)`;
    } else {
      metricMst.textContent = `${mst.totalKm.toFixed(2)} km · ${mst.edges.length} arestas (Kruskal entre CDs)`;
    }
  }

  if (showMST) {
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
>>>>>>> Stashed changes
  }

  refreshMarkerIcons();
}

<<<<<<< Updated upstream
=======
function fullRefresh(fitBounds = false) {
  invalidateRouteIfNeeded();
  fillSelects(graph);
  populateEdgeSelect();
  renderEdges(graph);
  renderVertices(graph, fitBounds);
  if (statusEl) statusEl.textContent = summarize(graph);
  recalcAlgorithms();
}

function handleLinkClick(id) {
  if (!linkPendingId) {
    linkPendingId = id;
    refreshMarkerIcons();
    return;
  }
  if (linkPendingId === id) {
    linkPendingId = null;
    refreshMarkerIcons();
    return;
  }
  const vA = graph.vertices.get(linkPendingId);
  const vB = graph.vertices.get(id);
  if (!vA || !vB) {
    linkPendingId = null;
    refreshMarkerIcons();
    return;
  }
  if (graph.getEdge(linkPendingId, id)) {
    linkPendingId = null;
    refreshMarkerIcons();
    return;
  }
  const w = haversineKm(vA.lat, vA.lng, vB.lat, vB.lng);
  graph.addEdge(linkPendingId, id, w, true);
  linkPendingId = null;
  fullRefresh();
}

>>>>>>> Stashed changes
function initMap(g) {
  graph = g;
  const center = [-14.5, -54];
  map = L.map("map", { zoomControl: true }).setView(center, 4);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  edgesLayer = L.layerGroup().addTo(map);
  mstLayer = L.layerGroup().addTo(map);
  routeLayer = L.layerGroup().addTo(map);
  markersLayer = L.layerGroup().addTo(map);

<<<<<<< Updated upstream
  fillSelects(g);
  reachableFromCDs = reachableFromSources(graph, graph.listCDs().map((v) => v.id));
  renderEdges(g);
  renderVertices(g, true);
  recalcAlgorithms();

  const onSelectionChange = () => {
    originId = selectOrigin.value;
    destId = selectDest.value;
=======
  routeFrom = "";
  routeTo = "";
  showMST = false;
  if (btnToggleMst) btnToggleMst.textContent = "Mostrar MST (Kruskal)";

  fullRefresh(true);

  const onPickChange = () => {
    routeFrom = "";
    routeTo = "";
    refreshMarkerIcons();
>>>>>>> Stashed changes
    recalcAlgorithms();
  };
  selectOrigin.addEventListener("change", onPickChange);
  selectDest.addEventListener("change", onPickChange);

  if (btnCalcRoute) {
    btnCalcRoute.addEventListener("click", () => {
      const o = pickOrigin();
      const d = pickDest();
      if (!o || !d) {
        if (metricDijkstra) {
          metricDijkstra.textContent = "Selecione CD e entrega antes de confirmar.";
        }
        return;
      }
      const vo = graph.vertices.get(o);
      const vd = graph.vertices.get(d);
      if (!vo || !vd || vo.tipo !== "CD" || vd.tipo !== "ENTREGA") {
        if (metricDijkstra) {
          metricDijkstra.textContent = "Origem deve ser um CD e destino uma entrega.";
        }
        return;
      }
      routeFrom = o;
      routeTo = d;
      recalcAlgorithms();
    });
  }

  if (btnToggleMst) {
    btnToggleMst.addEventListener("click", () => {
      showMST = !showMST;
      btnToggleMst.textContent = showMST ? "Ocultar MST" : "Mostrar MST (Kruskal)";
      recalcAlgorithms();
    });
  }

  if (selectMode) {
    selectMode.addEventListener("change", () => {
      interactionMode = selectMode.value;
      linkPendingId = null;
      refreshMarkerIcons();
    });
    interactionMode = selectMode.value;
  }

  if (btnEdgeRemove) {
    btnEdgeRemove.addEventListener("click", () => {
      const p = parseEdgeSelectValue();
      if (!p) return;
      graph.removeEdge(p.from, p.to);
      linkPendingId = null;
      invalidateRouteIfNeeded();
      fullRefresh();
    });
  }
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
