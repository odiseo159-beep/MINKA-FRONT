#!/bin/bash
# dev-clean.sh — Limpia cache y reinicia dev server
# Uso: npm run dev:clean

echo "Limpiando cache de Next.js..."
rm -rf .next

echo "Iniciando dev server..."
npx next dev
