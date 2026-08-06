#!/bin/zsh
set -e

cd "$(dirname "$0")"

MODEL="${OLLAMA_MODEL:-llama3.2}"
PYTHON="python3"
if [ -x ".venv_ia/bin/python" ]; then
  PYTHON=".venv_ia/bin/python"
fi

echo "Iniciando serviço local de IA com Ollama/Llama..."
echo "Modelo: $MODEL"
echo ""

if ! curl -s http://127.0.0.1:11434/api/tags >/dev/null; then
  echo "Ollama não está respondendo em http://127.0.0.1:11434."
  echo "Abra o Ollama e baixe um modelo, por exemplo:"
  echo "  ollama pull $MODEL"
  exit 1
fi

OLLAMA_MODEL="$MODEL" "$PYTHON" servico_ia_contratos.py
