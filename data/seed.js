import { haversineKm } from "../js/geo.js";

const CDS = [
  { id: "cd-ac", nome: "Rio Branco", lat: -9.9754, lng: -67.8243 },
  { id: "cd-al", nome: "Maceió", lat: -9.6658, lng: -35.7353 },
  { id: "cd-ap", nome: "Macapá", lat: 0.0349, lng: -51.0694 },
  { id: "cd-am", nome: "Manaus", lat: -3.119, lng: -60.0217 },
  { id: "cd-ba", nome: "Salvador", lat: -12.9714, lng: -38.5014 },
  { id: "cd-ce", nome: "Fortaleza", lat: -3.7172, lng: -38.5433 },
  { id: "cd-df", nome: "Brasília", lat: -15.7942, lng: -47.8822 },
  { id: "cd-es", nome: "Vitória", lat: -20.3155, lng: -40.3128 },
  { id: "cd-go", nome: "Goiânia", lat: -16.6869, lng: -49.2643 },
  { id: "cd-ma", nome: "São Luís", lat: -2.5387, lng: -44.2825 },
  { id: "cd-mt", nome: "Cuiabá", lat: -15.6014, lng: -56.0979 },
  { id: "cd-ms", nome: "Campo Grande", lat: -20.4428, lng: -54.6464 },
  { id: "cd-mg", nome: "Belo Horizonte", lat: -19.9167, lng: -43.9345 },
  { id: "cd-pa", nome: "Belém", lat: -1.4554, lng: -48.4898 },
  { id: "cd-pb", nome: "João Pessoa", lat: -7.1217, lng: -34.8829 },
  { id: "cd-pr", nome: "Curitiba", lat: -25.4284, lng: -49.2733 },
  { id: "cd-pe", nome: "Recife", lat: -8.0476, lng: -34.877 },
  { id: "cd-pi", nome: "Teresina", lat: -5.0919, lng: -42.8034 },
  { id: "cd-rj", nome: "Rio de Janeiro", lat: -22.9068, lng: -43.1729 },
  { id: "cd-rn", nome: "Natal", lat: -5.7945, lng: -35.211 },
  { id: "cd-rs", nome: "Porto Alegre", lat: -30.0346, lng: -51.2177 },
  { id: "cd-ro", nome: "Porto Velho", lat: -8.7619, lng: -63.9039 },
  { id: "cd-rr", nome: "Boa Vista", lat: 2.8235, lng: -60.6758 },
  { id: "cd-sc", nome: "Florianópolis", lat: -27.5954, lng: -48.548 },
  { id: "cd-sp", nome: "São Paulo", lat: -23.5505, lng: -46.6333 },
  { id: "cd-se", nome: "Aracaju", lat: -10.9092, lng: -37.0678 },
  { id: "cd-to", nome: "Palmas", lat: -10.2491, lng: -48.3243 },
];

function buildSeed() {
  const vertices = [];
  const edgeKeys = new Set();
  const edges = [];

  function addUndirected(from, to) {
    if (from === to) return;
    const key = from < to ? `${from}|${to}` : `${to}|${from}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push({ from, to });
  }

  for (const c of CDS) {
    vertices.push({
      id: c.id,
      tipo: "CD",
      lat: c.lat,
      lng: c.lng,
      nome: c.nome,
    });
  }

  const kCd = 6;
  for (const c of CDS) {
    const ranked = CDS.filter((x) => x.id !== c.id)
      .map((x) => ({
        id: x.id,
        d: haversineKm(c.lat, c.lng, x.lat, x.lng),
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, kCd);
    for (const r of ranked) {
      addUndirected(c.id, r.id);
    }
  }

  const extras = [
    ["cd-rr", "cd-ap"],
    ["cd-ap", "cd-pa"],
    ["cd-ro", "cd-am"],
    ["cd-to", "cd-go"],
    ["cd-pi", "cd-ce"],
    ["cd-ma", "cd-pi"],
    ["cd-se", "cd-al"],
    ["cd-es", "cd-mg"],
    ["cd-sc", "cd-pr"],
    ["cd-rs", "cd-sc"],
  ];
  for (const [a, b] of extras) {
    addUndirected(a, b);
  }

  return { vertices, edges };
}

export default buildSeed();
