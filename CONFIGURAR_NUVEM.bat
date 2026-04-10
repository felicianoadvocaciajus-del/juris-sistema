@echo off
echo Configurando banco de dados na nuvem...
echo.

:: Criar .env com banco Neon
echo DATABASE_URL=postgresql://neondb_owner:npg_cHo0QhTD6Bnb@ep-restless-bar-acc2dupb.sa-east-1.aws.neon.tech/neondb?sslmode=require> .env
type .env.example >> .env

:: Copiar pra apps/api
copy .env apps\api\.env /Y

:: Gerar Prisma Client
cd apps\api
call npx prisma generate

echo.
echo Configuracao concluida! Banco na nuvem ativo.
echo Rode: npm run dev
pause
