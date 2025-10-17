#!/bin/bash
# Fix all manager API routes to use verifyApiSession instead of verifySession

cd /Users/dietmar/Desktop/ray2

files=(
  "app/api/manager/billing/portal/route.ts"
  "app/api/manager/policies/route.ts"
  "app/api/manager/shifts/bulk/route.ts"
  "app/api/manager/stripe/connect/route.ts"
  "app/api/manager/subscriptions/checkout/route.ts"
  "app/api/manager/integrations/lightspeed/oauth/route.ts"
  "app/api/manager/locations/publish/route.ts"
  "app/api/manager/tables/bulk/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Replace import
    sed -i '' 's/import { verifySession }/import { verifyApiSession }/g' "$file"
    # Replace usage
    sed -i '' 's/await verifySession()/await verifyApiSession()/g' "$file"
    echo "✅ Fixed $file"
  else
    echo "❌ File not found: $file"
  fi
done

echo ""
echo "🎉 All manager API routes fixed!"

