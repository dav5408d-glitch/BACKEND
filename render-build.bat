@echo off
echo Starting Render build...
npm install --production
if %errorlevel% neq 0 (
    echo npm install failed
    exit /b 1
)
npm run build
if %errorlevel% neq 0 (
    echo npm run build failed
    exit /b 1
)
npx prisma generate
if %errorlevel% neq 0 (
    echo prisma generate failed
    exit /b 1
)
echo Build completed successfully!
