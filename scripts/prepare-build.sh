#!/usr/bin/env bash
# ============================================================
# ACUTE AGENT — Prepare build for Electron packaging
# This script runs before electron-builder to set up the standalone
# Next.js build properly.
# ============================================================

set -euo pipefail

echo "=== ACUTE AGENT Build Preparation ==="

# 1. Ensure standalone output exists
if [ ! -d ".next/standalone" ]; then
  echo "❌ .next/standalone not found. Run 'next build' first."
  exit 1
fi

# 2. Copy static files into standalone
echo "📦 Copying static files..."
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

# 3. Copy Prisma schema and client
echo "📦 Copying Prisma files..."
mkdir -p .next/standalone/prisma
cp -r prisma/schema.prisma .next/standalone/prisma/ 2>/dev/null || true

# 4. Ensure node_modules/.prisma is available
echo "📦 Copying Prisma client..."
mkdir -p .next/standalone/node_modules/.prisma
cp -r node_modules/.prisma/* .next/standalone/node_modules/.prisma/ 2>/dev/null || true

# 5. Copy required node_modules that standalone might miss
echo "📦 Ensuring runtime dependencies..."
# These are needed at runtime by the standalone server
for mod in prisma @prisma/client sharp; do
  if [ -d "node_modules/$mod" ] && [ ! -d ".next/standalone/node_modules/$mod" ]; then
    cp -r "node_modules/$mod" ".next/standalone/node_modules/"
  fi
done

# 6. Create a database directory in the app data folder
echo "📦 Setting up database directory..."

# 7. Create/ensure the resources directory for Electron icons
mkdir -p electron/resources

echo "✅ Build preparation complete!"
echo "   - .next/standone: $(du -sh .next/standalone | cut -f1)"
echo "   - Ready for electron-builder"
