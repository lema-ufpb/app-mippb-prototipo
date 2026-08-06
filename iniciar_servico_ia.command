#!/bin/zsh
set -e
cd "$(dirname "$0")"

echo "Iniciando serviço local de IA para coleta documental..."
echo "Pasta do projeto: $(pwd)"
echo

PYTHON="python3"
if [ -x ".venv_ia/bin/python" ]; then
  PYTHON=".venv_ia/bin/python"
fi

$PYTHON - <<'PY'
missing = []
for package, module in [
    ("python-docx", "docx"),
    ("pypdf", "pypdf"),
    ("reportlab", "reportlab"),
]:
    try:
        __import__(module)
    except Exception:
        missing.append(package)

if missing:
    print("Bibliotecas ausentes: " + ", ".join(missing))
    print("Instale com:")
    print("./instalar_dependencias_ia.command")
    raise SystemExit(1)
PY

$PYTHON servico_ia_contratos.py
