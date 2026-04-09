class UnionFind {
  constructor(ids) {
    this.parent = new Map();
    this.rank = new Map();
    for (const id of ids) {
      this.parent.set(id, id);
      this.rank.set(id, 0);
    }
  }

  find(x) {
    let p = this.parent.get(x);
    if (p !== x) {
      p = this.find(p);
      this.parent.set(x, p);
    }
    return p;
  }

  union(a, b) {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return false;
    if (this.rank.get(ra) < this.rank.get(rb)) [ra, rb] = [rb, ra];
    this.parent.set(rb, ra);
    if (this.rank.get(ra) === this.rank.get(rb)) this.rank.set(ra, this.rank.get(ra) + 1);
    return true;
  }

  componentCount() {
    const roots = new Set();
    for (const id of this.parent.keys()) roots.add(this.find(id));
    return roots.size;
  }
}

export function dijkstra(graph, sourceId, targetId) {
  if (sourceId === targetId) {
    return { ok: true, distance: 0, path: [sourceId] };
  }
  const dist = new Map();
  const prev = new Map();
  const inf = Infinity;
  for (const id of graph.vertices.keys()) dist.set(id, inf);
  dist.set(sourceId, 0);
  const unvisited = new Set(graph.vertices.keys());

  while (unvisited.size) {
    let u = null;
    let best = inf;
    for (const id of unvisited) {
      const d = dist.get(id);
      if (d < best) {
        best = d;
        u = id;
      }
    }
    if (u === null || best === inf) break;
    unvisited.delete(u);
    if (u === targetId) break;

    for (const { to, pesoKm, ativa } of graph.adj.get(u) || []) {
      if (!ativa) continue;
      const nd = dist.get(u) + pesoKm;
      if (nd < dist.get(to)) {
        dist.set(to, nd);
        prev.set(to, u);
      }
    }
  }

  const dFinal = dist.get(targetId);
  if (dFinal === inf) return { ok: false, distance: null, path: [] };

  const path = [];
  for (let cur = targetId; cur != null; cur = prev.get(cur)) {
    path.push(cur);
    if (cur === sourceId) break;
  }
  if (path[path.length - 1] !== sourceId) {
    return { ok: false, distance: null, path: [] };
  }
  path.reverse();
  return { ok: true, distance: dFinal, path };
}

export function kruskalMSTAmongCDs(graph) {
  const cds = graph.listCDs();
  const cdSet = new Set(cds.map((v) => v.id));
  if (cdSet.size === 0) {
    return { edges: [], totalKm: 0, cdsConnected: true, cdCount: 0 };
  }
  const edges = graph
    .listEdges()
    .filter((e) => e.ativa && cdSet.has(e.from) && cdSet.has(e.to));
  edges.sort((a, b) => a.pesoKm - b.pesoKm);

  const uf = new UnionFind(cdSet);
  const mst = [];
  let totalKm = 0;
  for (const e of edges) {
    if (uf.union(e.from, e.to)) {
      mst.push(e);
      totalKm += e.pesoKm;
    }
  }

  const cdsConnected = uf.componentCount() === 1;
  return {
    edges: mst,
    totalKm,
    cdsConnected,
    cdCount: cdSet.size,
  };
}

export function reachableFromSources(graph, sourceIds) {
  const seen = new Set();
  const q = [];
  for (const s of sourceIds) {
    if (graph.vertices.has(s)) {
      seen.add(s);
      q.push(s);
    }
  }
  while (q.length) {
    const u = q.shift();
    for (const { to, ativa } of graph.adj.get(u) || []) {
      if (!ativa || seen.has(to)) continue;
      seen.add(to);
      q.push(to);
    }
  }
  return seen;
}

export function dfsOrderFrom(graph, startId) {
  const order = [];
  const seen = new Set();
  function visit(u) {
    seen.add(u);
    order.push(u);
    const nbrs = [...(graph.adj.get(u) || [])].filter((x) => x.ativa);
    nbrs.sort((a, b) => a.to.localeCompare(b.to));
    for (const { to } of nbrs) {
      if (seen.has(to)) continue;
      visit(to);
    }
  }
  if (graph.vertices.has(startId)) visit(startId);
  return order;
}
