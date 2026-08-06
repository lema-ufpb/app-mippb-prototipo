# Como usar o Assistente de IA em outro computador

O painel principal (`formulario_avaliacao_ex_ante.html`) funciona como uma página local. Já o **Assistente de IA para coleta documental** depende de um pequeno serviço local em Python.

Esse serviço precisa estar rodando no computador do usuário para que o painel consiga ler contratos, extrair campos e gerar análise textual/PDF.

O endereço usado pelo painel é:

```text
http://127.0.0.1:8771
```

Esse endereço significa: “serviço rodando neste próprio computador, na porta 8771”.

## 1. Antes de começar

Ao copiar a pasta enxuta para outro computador, confirme que ela contém estes arquivos:

```text
formulario_avaliacao_ex_ante.html
dados/
static/
config/
servico_ia_contratos.py
requirements_ia.txt
instalar_dependencias_ia.command
iniciar_servico_ia.command
iniciar_servico_ia_llama.command
docs/INSTRUCOES_ASSISTENTE_IA.md
```

Nesta pasta enxuta, os dados necessários ao painel principal ficam separados na pasta `dados/`, e os scripts/estilos ficam em `static/`. Portanto, não é necessário copiar `resultados/` ou `arquivos auxiliares/` para usar o formulário, mas é necessário manter `dados/`, `static/` e `config/` ao lado do HTML.

Também é necessário ter o **Python 3** instalado.

Para conferir, abra o Terminal ou Prompt de Comando e digite:

```bash
python3 --version
```

No Windows, pode ser:

```bat
python --version
```

ou:

```bat
py --version
```

## 2. Como usar no Mac

### Passo 1: abrir o Terminal na pasta do projeto

Entre na pasta onde está o projeto. Exemplo:

```bash
cd "/Users/seu_usuario/ProjetosLocais/MIP-PB/MODULO CONCESSOES"
```

Se você estiver usando a pasta enxuta, adapte o caminho para o nome da pasta copiada, por exemplo `github_formulario_mip_pb_v20_b`.

### Passo 2: instalar as dependências da IA

Execute uma vez:

```bash
./instalar_dependencias_ia.command
```

Esse comando cria um ambiente Python local chamado `.venv_ia` e instala as bibliotecas necessárias:

```text
python-docx
pypdf
reportlab
```

Se o Mac disser que não tem permissão para executar, rode:

```bash
chmod +x instalar_dependencias_ia.command
chmod +x iniciar_servico_ia.command
```

Depois repita:

```bash
./instalar_dependencias_ia.command
```

### Passo 3: iniciar o serviço de IA

Depois da instalação, rode:

```bash
./iniciar_servico_ia.command
```

Se estiver funcionando, o Terminal ficará aberto com uma mensagem parecida com:

```text
Servico de IA para contratos em http://127.0.0.1:8771
```

Importante: **deixe essa janela do Terminal aberta** enquanto estiver usando o Assistente de IA no painel.

### Passo 4: testar

Abra no navegador:

```text
http://127.0.0.1:8771/health
```

Se aparecer algo como abaixo, está funcionando:

```json
{"ok": true, "service": "servico_ia_contratos", "port": 8771}
```

## 3. Como usar no Windows

No Windows, os arquivos `.command` do Mac não são usados diretamente. O procedimento é feito pelo Prompt de Comando ou PowerShell.

### Passo 1: abrir o Prompt ou PowerShell na pasta do projeto

Entre na pasta do projeto. Exemplo:

```bat
cd "C:\Users\SeuUsuario\ProjetosLocais\MIP-PB\MODULO CONCESSOES"
```

Se você estiver usando a pasta enxuta, adapte o caminho para o nome da pasta copiada, por exemplo `github_formulario_mip_pb_v20_b`.

### Passo 2: criar o ambiente local

Tente primeiro:

```bat
py -m venv .venv_ia
```

Se `py` não funcionar, use:

```bat
python -m venv .venv_ia
```

### Passo 3: instalar as dependências

Com `py`:

```bat
.venv_ia\Scripts\python -m pip install --upgrade pip
.venv_ia\Scripts\python -m pip install -r requirements_ia.txt
```

Se estiver usando `python`, o comando é o mesmo:

```bat
.venv_ia\Scripts\python -m pip install --upgrade pip
.venv_ia\Scripts\python -m pip install -r requirements_ia.txt
```

### Passo 4: iniciar o serviço de IA

Rode:

```bat
.venv_ia\Scripts\python servico_ia_contratos.py
```

Se estiver funcionando, a janela ficará aberta com mensagem parecida com:

```text
Servico de IA para contratos em http://127.0.0.1:8771
```

Importante: **deixe essa janela aberta** enquanto estiver usando o Assistente de IA no painel.

### Passo 5: testar

Abra no navegador:

```text
http://127.0.0.1:8771/health
```

Se aparecer algo como:

```json
{"ok": true, "service": "servico_ia_contratos", "port": 8771}
```

o serviço está pronto.

## 4. Como usar no painel

Depois que o serviço estiver rodando:

1. Abra o arquivo:

```text
formulario_avaliacao_ex_ante.html
```

2. Vá até a seção:

```text
Assistente de IA para coleta documental
```

3. Confira se o endereço do serviço local está como:

```text
http://127.0.0.1:8771
```

4. Carregue um contrato ou documento oficial em PDF, DOCX ou TXT.

5. Clique em:

```text
Ler contrato
```

6. Revise os campos sugeridos e marque apenas os que devem ser usados.

7. Clique em:

```text
Aplicar campos sugeridos
```

8. Gere o relatório normalmente.

## 5. Problemas comuns

### O painel mostra erro ao usar a IA

Provavelmente o serviço local não está rodando. Abra:

```text
http://127.0.0.1:8771/health
```

Se não abrir, inicie o serviço novamente.

### A porta 8771 já está em uso

Feche a janela antiga do serviço ou encerre o processo que está usando a porta.

### O Mac ou Windows bloqueou o arquivo

No Mac, use:

```bash
chmod +x instalar_dependencias_ia.command
chmod +x iniciar_servico_ia.command
```

No Windows, execute os comandos manualmente pelo Prompt/PowerShell.

### O documento PDF não é lido corretamente

Alguns PDFs são imagens digitalizadas. Nesse caso, o arquivo precisa passar por OCR antes de ser lido pela IA local.

## 6. Observação metodológica

A IA funciona como **assistente de leitura documental e redação analítica**.

Ela pode:

- ler documentos;
- sugerir preenchimento de campos;
- mostrar evidência documental;
- gerar uma minuta de análise textual;
- gerar PDF da análise.

Ela não substitui:

- os cálculos da matriz de insumo-produto;
- a nota preliminar;
- a validação documental pelo auditor;
- a decisão administrativa.

Os impactos econômicos, multiplicadores, pontuação e critérios do relatório continuam sendo calculados pelo motor determinístico do painel.
