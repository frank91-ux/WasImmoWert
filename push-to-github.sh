#!/bin/bash
# WasImmoWert → GitHub Push Script
# Einfach im Terminal ausführen: ./push-to-github.sh

cd "$(dirname "$0")"

echo "🏠 WasImmoWert → GitHub Push"
echo "=============================="

# Check if git is initialized
if [ ! -d ".git" ]; then
  echo "📦 Git-Repository initialisieren..."
  git init
  git branch -m main
fi

# Set remote if not set
if ! git remote | grep -q origin; then
  echo "🔗 GitHub-Remote hinzufügen..."
  git remote add origin https://github.com/frank91-ux/WasImmoWert.git
fi

# Stage all files
echo "📁 Dateien hinzufügen..."
git add -A

# Check if there's anything to commit
if git diff --cached --quiet 2>/dev/null; then
  echo "✅ Keine neuen Änderungen zum Committen."
else
  echo "💾 Commit erstellen..."
  git commit -m "feat: WasImmoWert SaaS-Dashboard für Immobilienbewertung

Komplette Webapp mit React 19, TypeScript, Vite 6 und Tailwind CSS 4.

Features:
- Figma-basiertes Dashboard-Design (Dark Indigo Sidebar, Gradient KPIs)
- Zod-Validierung + DOMPurify für Input-Sicherheit
- decimal.js für präzise Finanzberechnungen (Annuität, Steuer, KPIs)
- Framer Motion Animationen + Sonner Toast-Benachrichtigungen
- Supabase-Integration (Auth, OAuth, PostgreSQL mit RLS)
- Deutsche Steuerberechnung (§32a EStG, Soli-Gleitzone, AfA)
- Kaufnebenkosten, Cashflow, Tilgungsplan, Sensitivitätsanalyse
- Zustand State Management mit localStorage + Cloud-Sync

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
fi

# Push
echo "🚀 Pushe zu GitHub..."
git push -u origin main

echo ""
echo "✅ Fertig! Dein Code ist jetzt auf GitHub:"
echo "   https://github.com/frank91-ux/WasImmoWert"
