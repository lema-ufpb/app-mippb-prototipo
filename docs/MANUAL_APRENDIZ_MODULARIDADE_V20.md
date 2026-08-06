# Manual prático para alterar o painel modular v20

Este manual foi escrito para quem ainda está aprendendo a trabalhar com arquitetura modular. A regra de ouro é: mexa em uma peça por vez, rode o validador, rode os testes e só depois avance.

## 1. O que você precisa entender primeiro

O painel tem quatro tipos de arquivos importantes:

1. arquivos de configuração;
2. arquivos de indicadores;
3. arquivos de visualização;
4. arquivos de teste.

Você não deve começar abrindo o HTML gigante. A maior parte das mudanças deve começar nos arquivos de configuração e nos módulos.

## 2. Onde mexer para ligar ou desligar um resultado

Use:

`config/painel_v20.py`

Exemplo:

```python
{
    "id": "impacto_emprego",
    "ativo": True,
    "secao": "impactos_economicos",
    "tipo_visual": "tile",
    "posicao": 8,
}
```

Para retirar da tela:

```python
"ativo": False
```

Depois rode:

```bash
python3 gerar_formulario_avaliacao_ex_ante_v20.py --single-file
cp formulario_avaliacao_ex_ante_v20_standalone.html formulario_avaliacao_ex_ante.html
```

## 3. Onde mexer para retirar uma aba inteira

As abas também são módulos.

Exemplo:

```python
{
    "id": "indicadores_tributarios",
    "ativo": False,
    "secao": "impactos_tributarios",
    "tipo_visual": "aba",
    "posicao": 1,
}
```

Isso retira o macroelemento da interface. Os indicadores internos continuam documentados e podem voltar depois.

## 4. Onde declarar um campo novo

Use:

`config/campos_v20.py`

Exemplo:

```python
{
    "id": "novo_campo",
    "rotulo": "Novo campo",
    "tipo": "percentual",
    "etapa": "qualificacao",
    "ativo": True,
    "macrosegmentos": ["industria", "comercio"],
    "alimenta": ["novo_indicador"],
}
```

Depois inclua esse campo em:

`config/etapas_v20.py`

na etapa em que ele deve aparecer.

## 5. Onde declarar uma base de dados nova

Use:

`config/fontes_dados_v20.py`

Exemplo:

```python
{
    "id": "nova_base",
    "nome": "Nova base de apoio",
    "ativo": True,
    "origem": "arquivos auxiliares/nova_base.xlsx",
}
```

Se um indicador depender dessa base, inclua no arquivo do indicador:

```python
"depende_de_dados": ["nova_base"]
```

## 6. Como criar um indicador novo

### Passo 1 - Criar o arquivo

Crie:

`mip_pb_v20/indicadores/modulos/novo_indicador.py`

### Passo 2 - Escrever o contrato

```python
INDICADOR = {
    "id": "novo_indicador",
    "nome": "Novo indicador",
    "familia": "multiplicadores",
    "fonte_calculo": "Descrever a fonte ou lógica usada",
    "descricao": "Explicar o que o indicador significa.",
    "depende_de_campos": ["novo_campo"],
    "depende_de_dados": ["nova_base"],
}
```

### Passo 3 - Colocar o indicador no painel

Edite:

`config/painel_v20.py`

## 7. Onde colocar a fórmula do indicador

Se o indicador tiver uma fórmula econômica, tributária ou territorial, coloque a fórmula em:

`mip_pb_v20/calculos/`

Exemplo já implementado:

`mip_pb_v20/calculos/impactos_mip.py`

Esse arquivo contém a função:

```python
calcular_impactos_economicos(...)
```

Ela calcula o bloco de impactos econômicos sem depender do HTML. Essa é a forma correta: primeiro a fórmula fica testável em Python; depois o painel apenas exibe o resultado.

Quando o cálculo continuar sendo aplicado no navegador, crie uma função JavaScript pequena que siga a mesma lógica e teste a paridade com Python. Na v20, esse papel é feito por:

`static/v20/calculos.js`

função:

```javascript
economicImpactAnalysis(...)
```

Depois rode:

```bash
python3 -m pytest tests_v20
./rodar_testes_v20.command
```

Se os dois passarem, a chance de o novo módulo ter quebrado outra parte do sistema cai bastante.

e acrescente:

```python
{
    "id": "novo_indicador",
    "ativo": True,
    "secao": "impactos_economicos",
    "tipo_visual": "card",
    "posicao": 90,
}
```

### Passo 4 - Criar a visualização

Se o indicador precisar aparecer na tela, o HTML/JS precisa ter um bloco com:

```html
data-module-id="novo_indicador"
```

Essa é a marca que permite ao sistema esconder, mostrar e ordenar o bloco.

## 6.1. Como criar uma fórmula isolada

Quando o indicador tiver cálculo próprio, crie uma função em:

`mip_pb_v20/calculos/`

Exemplo:

```python
def calcular_novo_indicador(*, valor: float, coeficiente: float) -> dict:
    return {
        "valor": valor,
        "coeficiente": coeficiente,
        "resultado": valor * coeficiente,
    }
```

Depois, no arquivo do indicador, informe:

```python
"modulo_calculo": "mip_pb_v20.calculos.novo_indicador.calcular_novo_indicador"
```

O teste automatizado confere se esse caminho existe e se é uma função.

## 7. Como saber se quebrei alguma coisa

Rode primeiro:

```bash
python3 validar_modulos_v20.py
```

Se aparecer erro, corrija antes de gerar o HTML.

Depois rode:

```bash
./rodar_testes_v20.command
```

Esse comando é mais completo e demora um pouco mais.

## 8. Como interpretar erro de dependência

Exemplo:

```text
ERRO: módulo ativo bloqueado por dependência: impacto_producao
(nenhum campo alternativo ativo: valor, valor_com, ret_producao_pleito_atendido)
```

Significa que o indicador `impacto_producao` está ligado, mas nenhum campo capaz de informar o valor do choque está disponível.

Você pode resolver de três formas:

1. ativar um dos campos exigidos;
2. alterar o contrato do indicador, se a dependência estiver errada;
3. desligar o indicador em `config/painel_v20.py`.

## 9. Como fazer uma mudança pequena com segurança

Sequência recomendada:

1. faça uma cópia mental do objetivo: “quero adicionar X” ou “quero esconder Y”;
2. altere apenas um arquivo;
3. rode `python3 validar_modulos_v20.py`;
4. se passar, rode `./rodar_testes_v20.command`;
5. abra o HTML;
6. teste um caso simples;
7. só então faça a próxima mudança.

## 10. O que evitar

Evite:

- editar o HTML inteiro para mudar um indicador;
- duplicar cálculo já existente;
- criar campo sem colocar no dicionário;
- usar base sem declarar em `fontes_dados_v20.py`;
- criar indicador sem `depende_de_campos` e `depende_de_dados`;
- desligar campo essencial sem rodar o validador;
- misturar cálculo tributário e econômico no mesmo indicador sem necessidade.

## 11. Como distribuir trabalho entre pesquisadores

Uma divisão saudável é:

- pesquisador A: indicador econômico;
- pesquisador B: indicador tributário;
- pesquisador C: indicador territorial;
- pesquisador D: checklist normativo;
- pesquisador E: testes e documentação.

Cada pesquisador entrega:

- arquivo do indicador;
- campos necessários, se houver;
- fontes usadas, se houver;
- teste mínimo;
- texto de interpretação.

Depois, a coordenação decide se o módulo entra no painel alterando apenas:

`config/painel_v20.py`

## 12. Sequência natural da refatoração

Não tente modularizar tudo de uma vez. A sequência mais prudente é:

1. registrar indicadores e componentes;
2. declarar campos, dados e etapas;
3. validar dependências;
4. separar cálculos em funções puras;
5. separar renderizadores por tipo visual;
6. criar testes unitários por indicador;
7. automatizar documentação a partir dos contratos.

A v20 avançou até o terceiro degrau. Os próximos degraus podem ser feitos sem reescrever a plataforma inteira.

Atualização: o quinto degrau foi iniciado com funções puras para impactos MIP, neutralidade fiscal, retorno fiscal e balanço interestadual. A interface ainda usa o motor JavaScript, mas as fórmulas centrais já possuem uma camada Python testável.
