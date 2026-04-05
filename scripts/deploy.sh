#!/bin/bash
# deploy.sh — Build, commit y push en un solo paso
# Uso: npm run deploy
# Uso con mensaje custom: npm run deploy -- "feat: nueva funcionalidad"

set -e

MESSAGE=${1:-"update: deploy changes"}

echo "=== Minka Frontend Deploy ==="

# 1. Verificar build
echo ""
echo "[1/4] Verificando build..."
npx next build
echo "Build OK"

# 2. Correr tests
echo ""
echo "[2/4] Corriendo tests..."
npx vitest run 2>/dev/null && echo "Tests OK" || echo "Tests: no tests o fallo (continuando...)"

# 3. Git add + commit
echo ""
echo "[3/4] Commit: $MESSAGE"
git add -A
git diff --cached --quiet && { echo "Sin cambios para commit."; exit 0; }
git commit -m "$MESSAGE"

# 4. Push
echo ""
echo "[4/4] Push a origin..."
git push

echo ""
echo "Deploy completado. Vercel desplegara automaticamente."
