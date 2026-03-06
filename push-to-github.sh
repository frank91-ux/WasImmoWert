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
  git commit -m "feat: WasImmoWert SaaS-Transformation – Landing Page, Pricing, DSGVO, KI-Berater

Komplette SaaS-Webapp mit React 19, TypeScript, Vite 6 und Tailwind CSS 4.

Neue Features:
- Attraktive Landing Page mit Schnellbewertung und Customer Journey
- Pricing-Section: Free / Pro €9,99 / Lifetime €99,99
- usePlan Hook für Feature-Gating nach Abo-Stufe
- Bundesland-Marktdaten (16 Bundesländer mit Durchschnittswerten)
- Chart-Visibility-Filter: Eigennutzung blendet irrelevante Miet-Charts aus
- Sensitivitätsanalyse filtert Miet-Parameter bei Eigennutzung
- DSGVO-konformer Cookie-Banner mit Einstellungen
- Datenmanagement-Dialog (Export + Löschung)
- 4 Legal Pages: Datenschutz, Impressum, AGB, Cookie-Richtlinie
- 4 Help Pages: Kontakt, Support, Feedback, Presse
- KI-Berater Redesign mit Pro-Only-Gate und Teal-Design
- Sidebar mit Plan-Badge und neuen Nav-Items
- Stripe-Placeholder für spätere Integration
- Supabase-Schema erweitert (Subscription, Consent, data_requests)

Bestehende Features:
- Figma-basiertes Dashboard-Design (Dark Indigo Sidebar, Gradient KPIs)
- decimal.js für präzise Finanzberechnungen
- Deutsche Steuerberechnung (§32a EStG, Soli-Gleitzone, AfA)
- Supabase-Auth (Email, OAuth, Magic Link)
- Zustand State Management mit localStorage + Cloud-Sync

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
fi

# Push
echo "🚀 Pushe zu GitHub..."
git push -u origin main

echo ""
echo "✅ Fertig! Dein Code ist jetzt auf GitHub:"
echo "   https://github.com/frank91-ux/WasImmoWert"
