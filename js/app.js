import { Graph } from "./graph.js";

const statusEl = document.getElementById("status");

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

loadGraph()
  .then((g) => {
    if (statusEl) statusEl.textContent = summarize(g);
  })
  .catch((err) => {
    if (statusEl) {
      statusEl.textContent =
        "Erro ao carregar o grafo. Use um servidor HTTP local (ex.: npx serve).";
      statusEl.classList.add("status--error");
    }
    console.error(err);
  });
