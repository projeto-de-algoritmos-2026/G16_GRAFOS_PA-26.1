import { Graph } from "./graph.js";
import { dijkstra, kruskalMSTAmongCDs } from "./algorithms.js";
import seedData from "../data/seed.js";
import { haversineKm, bearingDeg } from "./geo.js";

const L = globalThis.L;

const statusEl = document.getElementById("status");
const selectOrigin = document.getElementById("select-origin");
const selectDest = document.getElementById("select-dest");
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
const ICON_TRUCK = new URL("../assets/caminhao.png", import.meta.url).href;

let graph;
let map;
let edgesLayer;
let mstLayer;
let routeLayer;
let markersLayer;
const markerById = new Map();
let interactionMode = "nav";
let linkPendingId = null;
let showMST = false;
let routeFrom = "";
let routeTo = "";
/** Só atualizado em «Calcular»; evita limpar a rota em eventos espúrios de change. */
let routeCommittedO = "";
let routeCommittedD = "";

let routeAnimGen = 0;
let routeAnimRaf = null;
let truckMarker = null;

function baseMarkerPx(zoom) {
  const z = Number.isFinite(zoom) ? zoom : 4;
  return Math.max(24, Math.min(72, Math.round(12 + z * 5.5)));
}

function cdIconPixelSize(zoom) {
  return baseMarkerPx(zoom);
}

function truckIconPixelSize(zoom) {
  return Math.round(baseMarkerPx(zoom) * 1.28);
}

function cancelRouteAnimation() {
  if (routeAnimRaf !== null) {
    cancelAnimationFrame(routeAnimRaf);
    routeAnimRaf = null;
  }
  routeAnimGen += 1;
  if (truckMarker && routeLayer && routeLayer.hasLayer(truckMarker)) {
    routeLayer.removeLayer(truckMarker);
  }
  truckMarker = null;
}

function densifyPathLatLngs(g, pathIds) {
  const out = [];
  if (!pathIds.length) return out;
  const first = g.vertices.get(pathIds[0]);
  if (!first) return out;
  out.push([first.lat, first.lng]);
  for (let i = 1; i < pathIds.length; i++) {
    const prev = g.vertices.get(pathIds[i - 1]);
    const v = g.vertices.get(pathIds[i]);
    if (!prev || !v) continue;
    const km = haversineKm(prev.lat, prev.lng, v.lat, v.lng);
    const steps = Math.min(160, Math.max(28, Math.round(km * 14)));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      out.push([
        prev.lat + (v.lat - prev.lat) * t,
        prev.lng + (v.lng - prev.lng) * t,
      ]);
    }
  }
  return out;
}

function smoothProgress(u) {
  return u * u * (3 - 2 * u);
}

function sampleAlongPolyline(points, u) {
  const n = points.length;
  if (n < 2) {
    const p = points[0];
    return {
      lat: p[0],
      lng: p[1],
      bearing: 0,
      trail: points.slice(),
    };
  }
  const su = smoothProgress(Math.min(1, Math.max(0, u)));
  const f = su * (n - 1);
  const i = Math.min(n - 2, Math.floor(f));
  const segT = f - i;
  const [la0, lo0] = points[i];
  const [la1, lo1] = points[i + 1];
  const lat = la0 + (la1 - la0) * segT;
  const lng = lo0 + (lo1 - lo0) * segT;
  const bearing = bearingDeg(la0, lo0, la1, lo1);
  const trail = points.slice(0, i + 1);
  trail.push([lat, lng]);
  return { lat, lng, bearing, trail };
}

function setTruckRotation(marker, deg) {
  const root = marker?.getElement?.();
  if (!root) return;
  const rot = root.querySelector(".map-truck-rot");
  if (rot) rot.style.transform = `rotate(${deg}deg)`;
}

function startRouteAnimation(pathIds) {
  const myGen = routeAnimGen;
  const points = densifyPathLatLngs(graph, pathIds);
  if (points.length < 2 || !map || !routeLayer) return;

  const px = truckIconPixelSize(map.getZoom());
  const s0 = sampleAlongPolyline(points, 0);

  const poly = L.polyline([], {
    color: COL_DIJKSTRA,
    weight: 6,
    opacity: 0.95,
    lineCap: "round",
    lineJoin: "round",
  }).addTo(routeLayer);

  truckMarker = L.marker([s0.lat, s0.lng], {
    icon: L.divIcon({
      className: "map-truck-marker",
      html: `<div class="map-truck-rot" style="transform:rotate(${s0.bearing}deg);width:${px}px;height:${px}px"><img class="map-truck-img" src="${ICON_TRUCK}" width="${px}" height="${px}" alt="" /></div>`,
      iconSize: [px, px],
      iconAnchor: [px / 2, px / 2],
    }),
    zIndexOffset: 800,
  }).addTo(routeLayer);

  const totalMs = Math.min(11000, Math.max(4000, points.length * 10));
  const t0 = performance.now();

  function frame(now) {
    if (myGen !== routeAnimGen) return;
    const elapsed = now - t0;
    const u = Math.min(1, elapsed / totalMs);
    const { lat, lng, bearing, trail } = sampleAlongPolyline(points, u);
    poly.setLatLngs(trail);
    truckMarker.setLatLng([lat, lng]);
    setTruckRotation(truckMarker, bearing);

    if (u < 1) {
      routeAnimRaf = requestAnimationFrame(frame);
    } else {
      routeAnimRaf = null;
      poly.setLatLngs(points);
      const end = points[points.length - 1];
      truckMarker.setLatLng(end);
      if (points.length >= 2) {
        const bEnd = bearingDeg(
          points[points.length - 2][0],
          points[points.length - 2][1],
          end[0],
          end[1]
        );
        setTruckRotation(truckMarker, bEnd);
      }
    }
  }

  routeAnimRaf = requestAnimationFrame(frame);
}

function loadGraph() {
  return Promise.resolve(Graph.fromJSON(seedData, { recomputeWeights: true }));
}

function summarize(g) {
  const n = g.vertices.size;
  const m = g.edgeCount;
  return `${n} CDs (capitais), ${m} arestas — km (Haversine).`;
}

function vertexLabel(v) {
  if (v.nome) return `${v.nome} (${v.tipo})`;
  return `${v.id.replace(/^(cd-|ent-)/, "")} (${v.tipo})`;
}

function makeMarkerIcon(v, selected, linkPending, zoom) {
  const z = Number.isFinite(zoom) ? zoom : 4;
  const base = cdIconPixelSize(z);
  const w = selected ? Math.round(base * 1.12) : base;
  const h = w;
  const cls = [
    "map-glyph",
    "map-glyph--cd",
    selected ? "map-glyph--selected" : "",
    linkPending ? "map-glyph--pending" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return L.icon({
    iconUrl: ICON_CD,
    iconSize: [w, h],
    iconAnchor: [w / 2, h / 2],
    className: cls,
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
  optEmptyD.textContent = "— Escolha o CD —";
  selectDest.appendChild(optEmptyD);

  const cds = g.listCDs().sort((a, b) => a.id.localeCompare(b.id));
  for (const v of cds) {
    const o1 = document.createElement("option");
    o1.value = v.id;
    o1.textContent = vertexLabel(v);
    selectOrigin.appendChild(o1);
    const o2 = document.createElement("option");
    o2.value = v.id;
    o2.textContent = vertexLabel(v);
    selectDest.appendChild(o2);
  }

  selectOrigin.value = cds.some((c) => c.id === savedO) ? savedO : "";
  selectDest.value = cds.some((c) => c.id === savedD) ? savedD : "";
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
    const sel = markerSelected(id);
    const pend = id === linkPendingId;
    m.setIcon(makeMarkerIcon(v, sel, pend, map?.getZoom?.() ?? 4));
  }
}

function renderVertices(g, fitBounds) {
  markersLayer.clearLayers();
  markerById.clear();
  const latlngs = [];
  for (const v of g.vertices.values()) {
    const ll = [v.lat, v.lng];
    latlngs.push(ll);
    const sel = markerSelected(v.id);
    const pend = v.id === linkPendingId;
    const mk = L.marker(ll, {
      icon: makeMarkerIcon(v, sel, pend, map.getZoom()),
      title: vertexLabel(v),
    });
    mk.on("click", (ev) => {
      L.DomEvent.stopPropagation(ev);
      if (interactionMode === "link") {
        handleLinkClick(v.id);
        return;
      }
      if (interactionMode === "nav" && v.tipo === "CD") {
        const o = pickOrigin();
        if (!o || o === v.id) {
          selectOrigin.value = v.id;
        } else {
          selectDest.value = v.id;
        }
        onPickChange();
      }
    });
    markersLayer.addLayer(mk);
    markerById.set(v.id, mk);
  }
  if (fitBounds && latlngs.length) {
    map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: 4 });
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
        color: COL_EDGE,
        weight: 2,
        opacity: 0.55,
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

function invalidateRouteIfNeeded() {
  if (routeFrom && !graph.vertices.has(routeFrom)) {
    routeFrom = "";
    routeTo = "";
    routeCommittedO = "";
    routeCommittedD = "";
  }
  if (routeTo && !graph.vertices.has(routeTo)) {
    routeFrom = "";
    routeTo = "";
    routeCommittedO = "";
    routeCommittedD = "";
  }
}

function recalcAlgorithms() {
  cancelRouteAnimation();
  routeLayer.clearLayers();
  mstLayer.clearLayers();

  let pathToAnimate = null;

  if (metricDijkstra) {
    if (!routeFrom || !routeTo) {
      metricDijkstra.textContent =
        "Escolha dois CDs e clique em «Calcular menor caminho» (apenas rede entre capitais).";
    } else if (!graph.vertices.has(routeFrom) || !graph.vertices.has(routeTo)) {
      metricDijkstra.textContent = "Rota inválida após alteração no grafo.";
      routeFrom = "";
      routeTo = "";
      routeCommittedO = "";
      routeCommittedD = "";
    } else {
      const vo = graph.vertices.get(routeFrom);
      const vd = graph.vertices.get(routeTo);
      if (vo.tipo !== "CD" || vd.tipo !== "CD") {
        metricDijkstra.textContent = "Dijkstra configurado só entre CDs.";
      } else if (routeFrom === routeTo) {
        metricDijkstra.textContent = "Origem e destino devem ser CDs diferentes.";
      } else {
        const dk = dijkstra(graph, routeFrom, routeTo);
        metricDijkstra.textContent = dk.ok
          ? `${dk.distance.toFixed(2)} km · ${dk.path.join(" → ")}`
          : "Sem rota entre os dois CDs neste grafo.";
        if (dk.ok && dk.path.length >= 2) {
          pathToAnimate = dk.path;
        }
      }
    }
  }

  const mst = kruskalMSTAmongCDs(graph);
  if (metricMst) {
    if (!showMST) {
      metricMst.textContent =
        mst.cdCount <= 1
          ? "—"
          : "Oculto — use «Mostrar MST (Kruskal)». Árvore mínima entre CDs usando só arestas CD–CD do grafo.";
    } else if (mst.cdCount <= 1) {
      metricMst.textContent = "— (apenas um CD)";
    } else if (!mst.cdsConnected) {
      metricMst.textContent = `${mst.totalKm.toFixed(2)} km — floresta (CDs em mais de um componente)`;
    } else {
      metricMst.textContent = `${mst.totalKm.toFixed(2)} km · ${mst.edges.length} arestas · ${mst.cdCount} CDs`;
    }
  }

  if (showMST && mst.edges.length) {
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
      poly.bindTooltip(`MST CDs · ${e.from} ↔ ${e.to} · ${e.pesoKm.toFixed(1)} km`, {
        sticky: true,
      });
      mstLayer.addLayer(poly);
    }
  }

  refreshMarkerIcons();

  if (pathToAnimate) {
    const snapGen = routeAnimGen;
    requestAnimationFrame(() => {
      if (routeAnimGen !== snapGen) return;
      startRouteAnimation(pathToAnimate);
    });
  }
}

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

function onPickChange() {
  const o = pickOrigin();
  const d = pickDest();
  if (
    routeCommittedO &&
    routeCommittedD &&
    (o !== routeCommittedO || d !== routeCommittedD)
  ) {
    routeFrom = "";
    routeTo = "";
    routeCommittedO = "";
    routeCommittedD = "";
  }
  refreshMarkerIcons();
  recalcAlgorithms();
}

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

  routeFrom = "";
  routeTo = "";
  routeCommittedO = "";
  routeCommittedD = "";
  showMST = false;
  if (btnToggleMst) btnToggleMst.textContent = "Mostrar MST (Kruskal)";

  fullRefresh(true);

  map.on("zoomend", () => {
    refreshMarkerIcons();
  });

  selectOrigin.addEventListener("change", onPickChange);
  selectDest.addEventListener("change", onPickChange);

  if (btnCalcRoute) {
    btnCalcRoute.addEventListener("click", () => {
      const o = pickOrigin();
      const d = pickDest();
      if (!o || !d) {
        if (metricDijkstra) {
          metricDijkstra.textContent = "Selecione dois CDs antes de confirmar.";
        }
        return;
      }
      const vo = graph.vertices.get(o);
      const vd = graph.vertices.get(d);
      if (!vo || !vd || vo.tipo !== "CD" || vd.tipo !== "CD") {
        if (metricDijkstra) {
          metricDijkstra.textContent = "Origem e destino devem ser CDs.";
        }
        return;
      }
      if (o === d) {
        if (metricDijkstra) {
          metricDijkstra.textContent = "Escolha dois CDs diferentes.";
        }
        return;
      }
      routeCommittedO = o;
      routeCommittedD = d;
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
