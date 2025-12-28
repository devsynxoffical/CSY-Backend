# PowerShell script to setup .env file with DATABASE_URL

Write-Host "🔧 Setting up .env file..." -ForegroundColor Cyan

$envFile = ".env"
$dbUrl = "DATABASE_URL=postgresql://postgres:rdGEkKzyfuDUqsBdvwhKzaDfHdZVOtwA@metro.proxy.rlwy.net:49988/railway"

# Check if .env exists
if (Test-Path $envFile) {
    Write-Host "✅ .env file exists" -ForegroundColor Green
    
    # Check if DATABASE_URL already exists
    $content = Get-Content $envFile -Raw
    if ($content -match "DATABASE_URL\s*=") {
        Write-Host "⚠️  DATABASE_URL already exists in .env" -ForegroundColor Yellow
        Write-Host "   Current value:" -ForegroundColor Gray
        $content -split "`n" | Where-Object { $_ -match "DATABASE_URL" } | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
        
        $update = Read-Host "Do you want to update it? (y/n)"
        if ($update -eq "y" -or $update -eq "Y") {
            # Remove old DATABASE_URL line
            $newContent = $content -split "`n" | Where-Object { $_ -notmatch "DATABASE_URL\s*=" }
            $newContent = $newContent -join "`n"
            $newContent += "`n$dbUrl"
            Set-Content -Path $envFile -Value $newContent -NoNewline
            Write-Host "✅ Updated DATABASE_URL in .env" -ForegroundColor Green
        }
    } else {
        Write-Host "➕ Adding DATABASE_URL to .env..." -ForegroundColor Yellow
        Add-Content -Path $envFile -Value "`n# Database Connection`n$dbUrl"
        Write-Host "✅ Added DATABASE_URL to .env" -ForegroundColor Green
    }
} else {
    Write-Host "📝 Creating new .env file..." -ForegroundColor Yellow
    $envContent = @"
# Database Connection
$dbUrl

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3119
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173
"@
    Set-Content -Path $envFile -Value $envContent
    Write-Host "✅ Created .env file with DATABASE_URL" -ForegroundColor Green
}

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Verify DATABASE_URL in .env file" -ForegroundColor White
Write-Host "   2. Run: node check-db-connection.js" -ForegroundColor White
Write-Host "   3. Run: node scripts/seed-admin.js" -ForegroundColor White
Write-Host "   4. Start backend: npm run dev" -ForegroundColor White

