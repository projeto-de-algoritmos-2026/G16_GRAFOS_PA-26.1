# Amazon Logística — Web Graph Visualizer

Grafo ponderado (km, Haversine) com **27 CDs nas capitais dos estados + DF** e **50+ pontos de entrega** pelo Brasil. A malha inicial é gerada em [`data/seed.js`](data/seed.js) (cada CD ligado aos **6 CDs mais próximos** + trechos extras; cada entrega aos **2 CDs mais próximos**).

## Como executar

```bash
npm start
```

Abra `http://localhost:3000`.

## Uso

- **Dijkstra:** listas de CD e entrega começam vazias. Escolha as duas e clique em **Calcular menor caminho**. Trocar a seleção zera a rota até nova confirmação.
- **MST (Kruskal):** por padrão **não** desenha no mapa; use **Mostrar MST (Kruskal)** para exibir a árvore mínima entre CDs e ver o custo no painel.
- **Arestas:** modo **Ligar dois nós** (dois cliques em marcadores) ou **Remover aresta** (clique na linha ou lista + botão). Novas arestas entram nos cálculos na hora.

## Arquivos principais

- `js/app.js`, `js/graph.js`, `js/algorithms.js`, `js/geo.js`
- `data/seed.js` — dados gerados (o antigo `seed.json` foi removido).
- `assets/cd.png`, `assets/entrega.png` — ícones dos marcadores.

## Licença

Projeto acadêmico.
