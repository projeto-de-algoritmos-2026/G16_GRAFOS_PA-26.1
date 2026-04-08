import { haversineKm } from "./geo.js";

function edgeKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export class Graph {
  constructor() {
    this.vertices = new Map();
    this.adj = new Map();
    this._edges = new Map();
  }

  get edgeCount() {
    return this._edges.size;
  }

  addVertex(id, tipo, lat, lng) {
    this.vertices.set(id, { id, tipo, lat, lng });
    if (!this.adj.has(id)) this.adj.set(id, []);
  }

  addEdge(from, to, pesoKm, ativa = true) {
    if (!this.vertices.has(from) || !this.vertices.has(to)) {
      throw new Error(`addEdge: vértice inexistente (${from} → ${to})`);
    }
    const key = edgeKey(from, to);
    if (this._edges.has(key)) {
      const e = this._edges.get(key);
      e.pesoKm = pesoKm;
      e.ativa = ativa;
      return e;
    }
    const edge = { from, to, pesoKm, ativa, key };
    this._edges.set(key, edge);
    this.adj.get(from).push({ to, pesoKm, ativa, key });
    this.adj.get(to).push({ to: from, pesoKm, ativa, key });
    return edge;
  }

  getEdge(from, to) {
    return this._edges.get(edgeKey(from, to)) ?? null;
  }

  setEdgeActive(from, to, ativa) {
    const e = this.getEdge(from, to);
    if (!e) return false;
    e.ativa = ativa;
    for (const lst of this.adj.values()) {
      for (const x of lst) {
        if (x.key === e.key) x.ativa = ativa;
      }
    }
    return true;
  }

  removeVertex(id) {
    if (!this.vertices.has(id)) return false;
    const neighbors = [...this.adj.get(id)];
    for (const { to } of neighbors) {
      this.removeEdge(id, to);
    }
    this.adj.delete(id);
    this.vertices.delete(id);
    return true;
  }

  removeEdge(a, b) {
    const key = edgeKey(a, b);
    if (!this._edges.has(key)) return false;
    this._edges.delete(key);
    this._filterAdj(a, key);
    this._filterAdj(b, key);
    return true;
  }

  _filterAdj(v, key) {
    const lst = this.adj.get(v);
    if (!lst) return;
    this.adj.set(
      v,
      lst.filter((x) => x.key !== key)
    );
  }

  clone() {
    const g = new Graph();
    for (const v of this.vertices.values()) {
      g.addVertex(v.id, v.tipo, v.lat, v.lng);
    }
    for (const e of this._edges.values()) {
      g.addEdge(e.from, e.to, e.pesoKm, e.ativa);
    }
    return g;
  }

  static fromJSON(data, { recomputeWeights = false } = {}) {
    const g = new Graph();
    for (const v of data.vertices) {
      g.addVertex(v.id, v.tipo, v.lat, v.lng);
    }
    for (const e of data.edges) {
      let peso = e.pesoKm;
      if (recomputeWeights || peso == null) {
        const A = g.vertices.get(e.from);
        const B = g.vertices.get(e.to);
        peso = haversineKm(A.lat, A.lng, B.lat, B.lng);
      }
      g.addEdge(e.from, e.to, peso, e.ativa !== false);
    }
    return g;
  }

  listEdges() {
    return [...this._edges.values()];
  }

  listCDs() {
    return [...this.vertices.values()].filter((v) => v.tipo === "CD");
  }

  listEntregas() {
    return [...this.vertices.values()].filter((v) => v.tipo === "ENTREGA");
  }
}
