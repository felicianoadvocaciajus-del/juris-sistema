#!/bin/bash
# ===========================================
# JurisSystem - Script de Restore do Banco
# ===========================================
# Uso: bash infra/scripts/restore.sh [arquivo_backup.sql.gz]
# Se nao passar arquivo, usa o backup mais recente.

set -e

DB_NAME="${POSTGRES_DB:-juris}"
DB_USER="${POSTGRES_USER:-juris}"
DB_PASSWORD="${POSTGRES_PASSWORD:-juris_secret_2024}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
BACKUP_DIR="./infra/backups"

echo "============================================"
echo "  JurisSystem - Restauracao do Banco"
echo "============================================"
echo ""

# Determinar arquivo de backup
if [ -n "$1" ]; then
    BACKUP_FILE="$1"
else
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/juris_backup_*.sql.gz 2>/dev/null | head -1)
    if [ -z "$BACKUP_FILE" ]; then
        echo ">> ERRO: Nenhum arquivo de backup encontrado em $BACKUP_DIR"
        echo "   Use: bash infra/scripts/restore.sh caminho/do/backup.sql.gz"
        exit 1
    fi
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo ">> ERRO: Arquivo nao encontrado: $BACKUP_FILE"
    exit 1
fi

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Arquivo: $BACKUP_FILE"
echo "Tamanho: $SIZE"
echo "Data: $(date +"%d/%m/%Y %H:%M:%S")"
echo ""
echo ">> ATENCAO: Isso vai SUBSTITUIR todos os dados atuais do banco!"
echo ""
read -p "Tem certeza que deseja continuar? (s/N): " CONFIRM

if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    echo ">> Restauracao cancelada."
    exit 0
fi

echo ""
echo ">> Restaurando banco de dados..."

if docker ps --format '{{.Names}}' | grep -q 'juris-postgres'; then
    echo "   Via Docker..."
    # Dropar e recriar o banco
    docker exec juris-postgres psql -U "$DB_USER" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" postgres 2>/dev/null || true
    docker exec juris-postgres dropdb -U "$DB_USER" "$DB_NAME" 2>/dev/null || true
    docker exec juris-postgres createdb -U "$DB_USER" "$DB_NAME"
    # Restaurar
    gunzip -c "$BACKUP_FILE" | docker exec -i juris-postgres psql -U "$DB_USER" "$DB_NAME"
else
    echo "   Via pg_restore local..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" postgres 2>/dev/null || true
    PGPASSWORD="$DB_PASSWORD" dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || true
    PGPASSWORD="$DB_PASSWORD" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
    gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
fi

echo ""
echo "============================================"
echo "  Restauracao finalizada com sucesso!"
echo "============================================"
echo ""
echo ">> O sistema ja pode ser usado normalmente."
