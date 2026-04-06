#!/bin/bash
# ===========================================
# JurisSystem - Script de Backup do Banco
# ===========================================
# Uso: bash infra/scripts/backup.sh
# Gera um arquivo .sql.gz na pasta infra/backups/

set -e

# Configuracoes (usa .env ou valores padrao)
DB_NAME="${POSTGRES_DB:-juris}"
DB_USER="${POSTGRES_USER:-juris}"
DB_PASSWORD="${POSTGRES_PASSWORD:-juris_secret_2024}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
BACKUP_DIR="./infra/backups"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Criar pasta de backup se nao existir
mkdir -p "$BACKUP_DIR"

# Nome do arquivo com data/hora
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/juris_backup_${TIMESTAMP}.sql.gz"

echo "============================================"
echo "  JurisSystem - Backup do Banco de Dados"
echo "============================================"
echo ""
echo "Banco: $DB_NAME"
echo "Data: $(date +"%d/%m/%Y %H:%M:%S")"
echo ""

# Verificar se o container do postgres esta rodando
if docker ps --format '{{.Names}}' | grep -q 'juris-postgres'; then
    echo ">> Fazendo backup via Docker..."
    docker exec juris-postgres pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"
else
    echo ">> Fazendo backup direto (pg_dump local)..."
    PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"
fi

# Verificar se o backup foi criado
if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo ""
    echo ">> Backup criado com sucesso!"
    echo "   Arquivo: $BACKUP_FILE"
    echo "   Tamanho: $SIZE"
else
    echo ""
    echo ">> ERRO: Backup nao foi criado!"
    exit 1
fi

# Limpar backups antigos
echo ""
echo ">> Removendo backups com mais de $RETENTION_DAYS dias..."
find "$BACKUP_DIR" -name "juris_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

TOTAL=$(ls -1 "$BACKUP_DIR"/juris_backup_*.sql.gz 2>/dev/null | wc -l)
echo "   Total de backups mantidos: $TOTAL"
echo ""
echo "============================================"
echo "  Backup finalizado com sucesso!"
echo "============================================"
