#!/bin/bash
# Railway One-Off Command Script
# Run this via Railway CLI: railway run bash scripts/run-seed-reservations-railway.sh

echo "📅 Running Business Reservations Seeding on Railway..."
npm run db:seed:reservations

