const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient();
const DOCS = 'C:\\Users\\Administrador\\Documents\\DOCUMENTOS_ORGANIZADOS';
const EXTS = new Set(['.pdf','.docx','.doc','.jpg','.jpeg','.png','.xlsx','.xls','.txt','.odt','.rtf']);

async function main() {
  const clients = await prisma.person.findMany();
  console.log(`Clientes: ${clients.length}`);

  // Buscar primeiro user para createdBy
  const user = await prisma.user.findFirst();
  if (!user) { console.log('Nenhum usuario!'); return; }

  let totalDocs = 0;
  let clientsComDocs = 0;

  for (const client of clients) {
    const notes = client.notes || '';
    const match = notes.match(/Pasta:\s*(.+)/);
    if (!match) continue;

    const pastaName = match[1].trim();
    const pastaPath = path.join(DOCS, pastaName);
    if (!fs.existsSync(pastaPath)) continue;

    let docsCliente = 0;

    // Listar TODOS os arquivos recursivamente
    const listar = (dir) => {
      let files = [];
      try {
        for (const item of fs.readdirSync(dir)) {
          const full = path.join(dir, item);
          const stat = fs.statSync(full);
          if (stat.isDirectory()) {
            files = files.concat(listar(full));
          } else if (EXTS.has(path.extname(item).toLowerCase())) {
            files.push({ path: full, name: item, size: stat.size });
          }
        }
      } catch {}
      return files;
    };

    const arquivos = listar(pastaPath);
    for (const arq of arquivos) {
      // Gerar hash do path para evitar duplicatas
      const fileHash = crypto.createHash('md5').update(arq.path).digest('hex');

      // Verificar se já existe
      const existe = await prisma.document.findFirst({
        where: { fileHash }
      });
      if (existe) continue;

      // Detectar tags
      const tags = [];
      const nl = arq.name.toLowerCase();
      if (nl.includes('cnis')) tags.push('CNIS');
      if (nl.includes('ppp')) tags.push('PPP');
      if (nl.includes('ltcat') || nl.includes('laudo')) tags.push('LAUDO');
      if (nl.includes('ctps')) tags.push('CTPS');
      if (nl.includes('procura')) tags.push('PROCURACAO');
      if (nl.includes('contrato')) tags.push('CONTRATO');
      if (nl.includes('peticao') || nl.includes('petição')) tags.push('PETICAO');
      if (nl.includes('sentenc')) tags.push('SENTENCA');
      if (tags.length === 0) tags.push('GERAL');

      try {
        await prisma.document.create({
          data: {
            name: arq.name,
            localPath: arq.path,
            storagePath: arq.path,
            fileSize: arq.size,
            fileHash,
            origin: 'LOCAL_PATH',
            tags,
            version: 1,
            personId: client.id,
            createdById: user.id,
          }
        });
        docsCliente++;
      } catch {}
    }

    if (docsCliente > 0) {
      clientsComDocs++;
      totalDocs += docsCliente;
      console.log(`  ${client.name}: ${docsCliente} docs`);
    }
  }

  console.log(`\nResultado: ${totalDocs} documentos em ${clientsComDocs} clientes`);
  await prisma.$disconnect();
}

main().catch(console.error);
