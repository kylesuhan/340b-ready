#!/bin/bash
# Usage: SUPABASE_PROJECT_ID=your-project-ref bash scripts/generate-types.sh
set -e

if [ -z "$SUPABASE_PROJECT_ID" ]; then
  echo "Error: SUPABASE_PROJECT_ID env var is required"
  exit 1
fi

echo "Generating Supabase TypeScript types..."
npx supabase gen types typescript \
  --project-id "$SUPABASE_PROJECT_ID" \
  --schema public \
  > types/database.ts

echo "✅ Types written to types/database.ts"
