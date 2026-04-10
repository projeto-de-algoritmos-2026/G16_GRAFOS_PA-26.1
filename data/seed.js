<<<<<<< Updated upstream
export default {
  vertices: [
    { id: "cd-sp", tipo: "CD", lat: -23.5505, lng: -46.6333 },
    { id: "cd-rj", tipo: "CD", lat: -22.9068, lng: -43.1729 },
    { id: "cd-bh", tipo: "CD", lat: -19.9167, lng: -43.9345 },
    { id: "ent-campinas", tipo: "ENTREGA", lat: -22.9056, lng: -47.0608 },
    { id: "ent-santos", tipo: "ENTREGA", lat: -23.9608, lng: -46.3334 },
    { id: "ent-volta-redonda", tipo: "ENTREGA", lat: -22.5231, lng: -44.1042 },
    { id: "ent-juiz-fora", tipo: "ENTREGA", lat: -21.7642, lng: -43.3496 },
  ],
  edges: [
    { from: "cd-sp", to: "ent-campinas" },
    { from: "cd-sp", to: "ent-santos" },
    { from: "cd-sp", to: "cd-rj" },
    { from: "cd-rj", to: "ent-santos" },
    { from: "cd-rj", to: "ent-volta-redonda" },
    { from: "cd-rj", to: "cd-bh" },
    { from: "cd-bh", to: "ent-juiz-fora" },
    { from: "cd-bh", to: "ent-volta-redonda" },
    { from: "ent-campinas", to: "cd-bh" },
  ],
};
=======
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

const ENTREGAS = [
  { id: "ent-campinas", lat: -22.9056, lng: -47.0608 },
  { id: "ent-santos", lat: -23.9608, lng: -46.3334 },
  { id: "ent-ribeirao-preto", lat: -21.1775, lng: -47.8103 },
  { id: "ent-sorocaba", lat: -23.5015, lng: -47.4526 },
  { id: "ent-guarulhos", lat: -23.4538, lng: -46.5331 },
  { id: "ent-niteroi", lat: -22.8833, lng: -43.1036 },
  { id: "ent-volta-redonda", lat: -22.5231, lng: -44.1042 },
  { id: "ent-campos", lat: -21.7523, lng: -41.3304 },
  { id: "ent-juiz-de-fora", lat: -21.7642, lng: -43.3496 },
  { id: "ent-uberlandia", lat: -18.9186, lng: -48.2772 },
  { id: "ent-contagem", lat: -19.9321, lng: -44.0539 },
  { id: "ent-vila-velha", lat: -20.3477, lng: -40.2925 },
  { id: "ent-anapolis", lat: -16.3287, lng: -48.9534 },
  { id: "ent-taguatinga", lat: -15.834, lng: -48.0515 },
  { id: "ent-catalao", lat: -18.1656, lng: -47.944 },
  { id: "ent-rondonopolis", lat: -16.4703, lng: -54.6358 },
  { id: "ent-sinop", lat: -11.8604, lng: -55.5091 },
  { id: "ent-caceres", lat: -16.0714, lng: -57.6811 },
  { id: "ent-dourados", lat: -22.2231, lng: -54.812 },
  { id: "ent-ponta-pora", lat: -22.5366, lng: -55.7256 },
  { id: "ent-londrina", lat: -23.3045, lng: -51.1696 },
  { id: "ent-maringa", lat: -23.4205, lng: -51.9333 },
  { id: "ent-cascavel", lat: -24.9555, lng: -53.4552 },
  { id: "ent-foz-iguacu", lat: -25.5163, lng: -54.5854 },
  { id: "ent-joinville", lat: -26.3044, lng: -48.8461 },
  { id: "ent-blumenau", lat: -26.9194, lng: -49.0661 },
  { id: "ent-chapeco", lat: -27.0964, lng: -52.618 },
  { id: "ent-pelotas", lat: -31.7719, lng: -52.3425 },
  { id: "ent-caxias-sul", lat: -29.1678, lng: -51.1784 },
  { id: "ent-santa-maria", lat: -29.6842, lng: -53.8069 },
  { id: "ent-passo-fundo", lat: -28.2627, lng: -52.4067 },
  { id: "ent-petrolina", lat: -9.3929, lng: -40.5008 },
  { id: "ent-juazeiro", lat: -9.4167, lng: -40.5033 },
  { id: "ent-mossoro", lat: -5.1875, lng: -37.3441 },
  { id: "ent-sobral", lat: -3.6881, lng: -40.3496 },
  { id: "ent-teresina-sat", lat: -5.0653, lng: -42.8049 },
  { id: "ent-imperatriz", lat: -5.5185, lng: -47.4777 },
  { id: "ent-maraba", lat: -5.3686, lng: -49.1174 },
  { id: "ent-redencao", lat: -8.0295, lng: -50.0312 },
  { id: "ent-vitoria-conquista", lat: -14.8615, lng: -40.8442 },
  { id: "ent-ilheus", lat: -14.793, lng: -39.046 },
  { id: "ent-teixeira-de-freitas", lat: -17.5351, lng: -39.7423 },
  { id: "ent-cariacica", lat: -20.2632, lng: -40.4165 },
  { id: "ent-macapa-oriximina", lat: -1.7658, lng: -55.8617 },
  { id: "ent-boa-vista-ror", lat: 2.8195, lng: -60.6719 },
  { id: "ent-manacapuru", lat: -3.2907, lng: -60.6206 },
  { id: "ent-parintins", lat: -2.6283, lng: -56.7358 },
  { id: "ent-coari", lat: -4.085, lng: -63.1414 },
  { id: "ent-porto-velho-sub", lat: -8.7612, lng: -63.9039 },
  { id: "ent-ji-parana", lat: -10.8853, lng: -61.9517 },
  { id: "ent-rio-branco-sub", lat: -9.9747, lng: -67.8243 },
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

  for (const e of ENTREGAS) {
    vertices.push({
      id: e.id,
      tipo: "ENTREGA",
      lat: e.lat,
      lng: e.lng,
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

  for (const e of ENTREGAS) {
    const ranked = CDS.map((c) => ({
      id: c.id,
      d: haversineKm(e.lat, e.lng, c.lat, c.lng),
    }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (const r of ranked) {
      addUndirected(e.id, r.id);
    }
  }

  return { vertices, edges };
}

export default buildSeed();
>>>>>>> Stashed changes
