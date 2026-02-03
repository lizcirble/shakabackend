#!/bin/bash

echo "🔍 DataRand Supabase Configuration Checker"
echo "=========================================="

# Check if .env.local exists
if [ -f "dataRand_front-end/.env.local" ]; then
    echo "✅ .env.local file found"
    
    # Check for required variables
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" dataRand_front-end/.env.local; then
        echo "✅ NEXT_PUBLIC_SUPABASE_URL is set"
    else
        echo "❌ NEXT_PUBLIC_SUPABASE_URL is missing"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" dataRand_front-end/.env.local; then
        echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
    else
        echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing"
    fi
else
    echo "❌ .env.local file not found"
    echo ""
    echo "📝 Create dataRand_front-end/.env.local with:"
    echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
fi

echo ""
echo "📋 Example .env.local file can be found at:"
echo "   dataRand_front-end/.env.example"
echo ""
echo "🔗 Get your Supabase credentials from:"
echo "   https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api"
