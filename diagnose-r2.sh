#!/bin/bash
# diagnose-r2.sh - Check R2 bucket status

echo "======================================"
echo "R2 Bucket Diagnostics"
echo "======================================"
echo ""

# Check token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ ERROR: CLOUDFLARE_API_TOKEN not set"
    exit 1
fi

echo "🔑 API Token is set: ${CLOUDFLARE_API_TOKEN:0:10}..."
echo ""

# List all buckets
echo "🪣 Listing all R2 buckets:"
echo "--------------------------"
npx wrangler r2 bucket list 2>&1 || echo "Failed to list buckets"
echo ""

# Try to list objects in topbarks-resources
echo "📁 Trying to list objects in 'topbarks-resources':"
echo "---------------------------------------------------"
npx wrangler r2 object list topbarks-resources 2>&1 || echo "Failed to list objects"
echo ""

# Check if bucket exists by trying to get info
echo "🔍 Checking bucket info:"
echo "----------------------"
npx wrangler r2 bucket info topbarks-resources 2>&1 || echo "Failed to get bucket info"
echo ""

echo "======================================"
echo "Diagnostics complete"
echo "======================================"
