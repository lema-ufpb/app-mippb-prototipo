#!/bin/zsh
set -e
cd "$(dirname "$0")"

echo "Criando ambiente local para o serviço de IA..."
python3 -m venv .venv_ia

echo "Atualizando pip..."
.venv_ia/bin/python -m pip install --upgrade pip

echo "Instalando dependências..."
.venv_ia/bin/python -m pip install -r requirements_ia.txt

echo
echo "Dependências instaladas. Agora execute:"
echo "./iniciar_servico_ia.command"
