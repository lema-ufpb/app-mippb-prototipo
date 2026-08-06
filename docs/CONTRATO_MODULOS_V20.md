# Contrato de módulos - v20

Este documento define o padrão mínimo que um novo módulo deve seguir para entrar no painel sem afetar os módulos já existentes.

## 1. Ideia central

Um módulo deve ser uma peça acoplável. Ele pode entrar ou sair do painel por configuração, mas deve declarar com clareza:

- o que calcula ou exibe;
- quais campos do formulário consome;
- quais bases de dados consome;
- em qual aba ou seção aparece;
- qual tipo visual usa;
- como deve ser testado.

Essa regra existe para evitar que a plataforma vire um script único difícil de auditar.

## 2. Arquivo do indicador

Cada indicador deve ter um arquivo próprio em:

`mip_pb_v20/indicadores/modulos/`

O nome do arquivo deve ser igual ao `id` do indicador.

Exemplo:

`mip_pb_v20/indicadores/modulos/impacto_emprego.py`

```python
INDICADOR = {
    "id": "impacto_emprego",
    "nome": "Impacto no emprego",
    "familia": "multiplicadores",
    "fonte_calculo": "empregos diretos informados e multiplicador aberto de emprego",
    "descricao": "Empregos diretos e indiretos associados ao projeto.",
    "depende_de_campos": ["macrossegmento", "tipo_analise"],
    "depende_de_um_dos": [
        ["tru", "tru_com"],
        ["valor", "valor_com", "ret_producao_pleito_atendido"],
        ["empregos", "empregos_com", "ret_empregos_pleito"],
    ],
    "depende_de_dados": ["multiplicadores_abertos"],
}
```

## 3. Chaves obrigatórias

| Chave | O que significa |
|---|---|
| `id` | Identificador único do módulo. Deve coincidir com o nome do arquivo e com o item em `config/painel_v20.py`. |
| `nome` | Nome legível do indicador. |
| `familia` | Grupo conceitual: multiplicadores, território, retorno tributário, conformidade etc. |
| `fonte_calculo` | Fonte metodológica ou base de cálculo usada. |
| `descricao` | Explicação curta do que o módulo comunica. |

## 4. Chaves de dependência

As dependências são o principal mecanismo para evitar quebra silenciosa.

| Chave | Uso |
|---|---|
| `depende_de_campos` | Lista de campos obrigatórios. Todos precisam existir e estar ativos. |
| `depende_de_um_dos` | Lista de grupos alternativos. Em cada grupo, pelo menos um campo deve existir e estar ativo. |
| `depende_de_dados` | Lista de fontes de dados obrigatórias. Todas precisam existir e estar ativas. |
| `depende_de_modulos` | Lista de módulos conceitualmente necessários. Usar quando um indicador depende de outro resultado. |

Exemplo de dependência alternativa:

```python
"depende_de_um_dos": [["valor", "valor_com", "ret_producao_pleito_atendido"]]
```

Interpretação: o indicador pode funcionar com valor industrial, valor comercial ou valor de retenção. Se todos forem retirados da configuração, o indicador é bloqueado.

## 5. Configuração visual

Depois de criar o arquivo do indicador, ele deve ser declarado em:

`config/painel_v20.py`

Exemplo:

```python
{
    "id": "impacto_emprego",
    "ativo": True,
    "secao": "impactos_economicos",
    "tipo_visual": "tile",
    "posicao": 30,
}
```

Essa declaração controla apenas a exibição. A existência técnica do indicador continua no arquivo próprio.

## 6. Regra de acoplamento

Um módulo ativo só entra na interface se:

1. existir em `mip_pb_v20/indicadores/modulos/`;
2. estiver declarado em `config/painel_v20.py`;
3. o tipo visual existir em `mip_pb_v20/componentes/base.py`;
4. suas dependências de campos e dados forem atendidas;
5. houver bloco visual compatível no HTML/JS quando ele tiver interface.

Se uma dependência falhar, o módulo fica registrado como bloqueado no objeto `window.PAINEL_MODULAR`, e o validador acusa o problema.

## 7. Teste mínimo de um módulo novo

Antes de aceitar um novo módulo, rode:

```bash
python3 validar_modulos_v20.py
./rodar_testes_v20.command
```

O módulo deve passar por estes testes:

- contrato do indicador carregável;
- dependências declaradas existentes;
- painel gerado sem erro;
- HTML standalone gerado;
- JavaScript com sintaxe válida;
- módulo ocultável com `ativo=False`;
- nenhum módulo já existente alterado sem justificativa.

## 8. Critério de aceite

Um módulo está pronto quando um pesquisador consegue responder, em linguagem simples:

- que pergunta ele responde;
- qual dado entra;
- qual base externa ou interna usa;
- qual resultado sai;
- como interpretar;
- quais limitações existem;
- o que acontece se ele for desligado.
