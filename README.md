# Painel MIP-PB - pacote modular enxuto V20_B

Esta pasta contem uma versao enxuta e modular do formulario de avaliacao ex ante de beneficios tributarios. O HTML principal nao contem os dados embutidos: ele carrega arquivos externos de dados, configuracoes, estilos e scripts.

Essa organizacao facilita auditoria, manutencao e evolucao por modulos. Um pesquisador pode examinar o payload, os pesos, os scripts de calculo, o mapa territorial e o registro de componentes sem abrir um unico arquivo gigante.

## Como abrir

Abra no navegador:

```text
index.html
```

Se algum navegador bloquear arquivos locais carregados por `file://`, inicie o painel na raiz `/` com o comando local (copia o HTML para `index.html` e serve na porta 8780):

```bash
./iniciar_painel.command
```

Depois acesse:

```text
http://127.0.0.1:8780/
```

Para outra porta:

```bash
PAINEL_PORT=9000 ./iniciar_painel.command
```

### Docker

Construa a imagem e rode na raiz `/` (mesma porta e mesmo script `iniciar_painel.command` usado como entrypoint):

```bash
docker build -t painel-mip-pb:latest .
docker run -d --name painel-mip-pb -p 8780:8780 painel-mip-pb:latest
```

Acesse `http://127.0.0.1:8780/`. Para parar e remover:

```bash
docker stop painel-mip-pb && docker rm painel-mip-pb
```

## Organizacao dos arquivos

| Pasta/arquivo | Funcao |
|---|---|
| `index.html` | Estrutura da interface. Nao contem payload, mapa ou scripts embutidos. |
| `dados/payload_mip_pb_v20_b.js` | Payload usado pelo navegador para calcular os resultados. |
| `dados/payload_mip_pb_v20_b.json` | Mesmo payload em formato legivel para auditoria. |
| `dados/painel_mip_pb_v20_b.js` | Registro modular dos componentes ativos no painel. |
| `dados/map_svg_v20.js` | Malha SVG da Paraiba usada no mapa territorial. |
| `config/pesos_pontuacao_v1.js` | Pesos e parametros de pontuacao lidos pelo frontend. |
| `config/painel_v20_b.py` | Configuracao auditavel dos modulos exibidos. |
| `config/etapas_v20_b.py` | Configuracao auditavel das etapas de entrada de dados. |
| `config/campos_v20.py` | Dicionario tecnico de campos do formulario. |
| `config/fontes_dados_v20.py` | Declaracao das fontes de dados esperadas pelos modulos. |
| `config/parametros_indices_v20.json` | Parametros dos indices setoriais e territoriais. |
| `static/v20/` | Scripts e estilo do painel, separados por responsabilidade. |
| `servico_ia_contratos.py` | Servico local opcional para leitura documental e redacao analitica. |
| `docs/` | Documentacao de uso, fluxo modular e assistente local. |

## Camadas independentes

O pacote separa a aplicacao em quatro camadas principais:

1. **Interface**: `index.html` e `static/v20/styles.css`.
2. **Dados**: arquivos em `dados/`, especialmente o payload e o mapa.
3. **Logica de calculo e exibicao**: scripts em `static/v20/`.
4. **Configuracao e governanca**: arquivos em `config/` e `docs/`.

Essa separacao nao elimina as dependencias entre modulos, mas torna essas dependencias mais visiveis. Por exemplo, o mapa territorial depende dos campos de municipio, dos setores impactados e dos indicadores territoriais presentes no payload.

## Assistente local de IA

O assistente de leitura documental e redacao analitica depende de um servico local em Python. Para instalar as dependencias uma unica vez:

```bash
./instalar_dependencias_ia.command
```

Para iniciar o servico local sem Ollama:

```bash
./iniciar_servico_ia.command
```

Para iniciar usando Ollama/Llama local, quando disponivel:

```bash
./iniciar_servico_ia_llama.command
```

Enquanto estiver usando o assistente no painel, mantenha a janela do Terminal aberta. O painel procura o servico em:

```text
http://127.0.0.1:8771
```

## Teste rapido

1. Abra `index.html` (ou `http://127.0.0.1:8780/` via `./iniciar_painel.command`).
2. Preencha os dados principais do projeto.
3. Gere os resultados.
4. Confirme que o mapa territorial aparece e que o municipio de instalacao e destacado.
5. Para testar a IA, inicie `./iniciar_servico_ia.command` e acesse:

```text
http://127.0.0.1:8771/health
```

Se o servico estiver ativo, sera exibida uma resposta JSON com `ok: true`.

