#!/bin/bash
# upload-resources.sh - Bulk upload PDFs to Cloudflare R2 with verification

set -e  # Exit on error

RESOURCES_DIR="/home/simond3414/projects/top_barks/tb_resources"
BUCKET="topbarks-resources"

echo "======================================"
echo "Top Barks Resources Upload Script"
echo "======================================"
echo ""

# Check if CLOUDFLARE_API_TOKEN is set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ ERROR: CLOUDFLARE_API_TOKEN environment variable is not set"
    echo ""
    echo "Please set it first with:"
    echo "export CLOUDFLARE_API_TOKEN=your_token_here"
    echo ""
    exit 1
fi

echo "🔑 API Token: ${CLOUDFLARE_API_TOKEN:0:10}... (set)"
echo ""

# Step 1: Create bucket if it doesn't exist
echo "🪣 Checking if bucket '$BUCKET' exists..."
if npx wrangler r2 bucket list 2>&1 | grep -q "$BUCKET"; then
    echo "   ✅ Bucket already exists"
else
    echo "   ⚠️  Bucket not found. Creating..."
    if npx wrangler r2 bucket create "$BUCKET" 2>&1; then
        echo "   ✅ Bucket created successfully"
    else
        echo "   ❌ Failed to create bucket"
        exit 1
    fi
fi

# Check if resources directory exists
if [ ! -d "$RESOURCES_DIR" ]; then
    echo "❌ ERROR: Resources directory not found at $RESOURCES_DIR"
    exit 1
fi

# Count PDF files
PDF_COUNT=$(ls -1 "$RESOURCES_DIR"/*.pdf 2>/dev/null | wc -l)
if [ "$PDF_COUNT" -eq 0 ]; then
    echo "❌ ERROR: No PDF files found in $RESOURCES_DIR"
    exit 1
fi

echo ""
echo "📁 Resources directory: $RESOURCES_DIR"
echo "📄 Files to upload: $PDF_COUNT"
echo ""

# Ask for confirmation
read -p "Do you want to proceed with upload? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Upload cancelled."
    exit 0
fi

echo ""
echo "Starting upload..."
echo ""

# Counter for progress
UPLOADED=0
FAILED=0

# Loop through all PDFs
for file in "$RESOURCES_DIR"/*.pdf; do
    filename=$(basename "$file")
    
    echo -n "⏳ Uploading: $filename ... "
    
    # Upload with verbose error output
    if npx wrangler r2 object put "$BUCKET/$filename" --file="$file" 2>&1 | grep -q "Uploaded"; then
        echo "✅ Done"
        ((UPLOADED++))
    else
        # Check if file actually exists by trying to get it
        if npx wrangler r2 object get "$BUCKET/$filename" --local 2>&1 | grep -q "Error"; then
            echo "❌ Failed (file not found after upload)"
            ((FAILED++))
        else
            echo "✅ Done (verified)"
            ((UPLOADED++))
        fi
    fi
done

echo ""
echo "======================================"
echo "Upload Summary"
echo "======================================"
echo "✅ Successfully uploaded: $UPLOADED files"
if [ $FAILED -gt 0 ]; then
    echo "❌ Failed uploads: $FAILED files"
fi

# Verify bucket contents
echo ""
echo "📋 Verifying bucket contents..."
if npx wrangler r2 object list "$BUCKET" 2>&1 | head -20; then
    echo ""
    echo "✅ Bucket verification complete"
else
    echo ""
    echo "⚠️  Could not list bucket contents for verification"
fi

echo ""
echo "Next steps:"
echo "1. Check Cloudflare Dashboard → R2 → topbarks-resources"
echo "2. Verify all files are listed there"
echo "3. Re-deploy the site if needed"
echo ""
