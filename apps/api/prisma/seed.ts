import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ========================================================================
  // USERS
  // ========================================================================
  const adminPassword = await bcrypt.hash('mudar123', 12);
  const advPassword = await bcrypt.hash('mudar123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@juris.local' },
    update: {},
    create: {
      email: 'admin@juris.local',
      passwordHash: adminPassword,
      name: 'Administrador',
      role: 'ADMIN',
      mustChangePassword: true,
    },
  });

  const adv1 = await prisma.user.upsert({
    where: { email: 'carlos@juris.local' },
    update: {},
    create: {
      email: 'carlos@juris.local',
      passwordHash: advPassword,
      name: 'Dr. Carlos Eduardo Silva',
      role: 'ADVOGADO',
      oabNumber: 'OAB/SP 123.456',
      phone: '11999001001',
      mustChangePassword: true,
    },
  });

  const adv2 = await prisma.user.upsert({
    where: { email: 'ana@juris.local' },
    update: {},
    create: {
      email: 'ana@juris.local',
      passwordHash: advPassword,
      name: 'Dra. Ana Paula Oliveira',
      role: 'ADVOGADO',
      oabNumber: 'OAB/SP 789.012',
      phone: '11999002002',
      mustChangePassword: true,
    },
  });

  console.log('Users created');

  // ========================================================================
  // PERSONS
  // ========================================================================
  const person1 = await prisma.person.upsert({
    where: { cpfCnpj: '123.456.789-00' },
    update: {},
    create: {
      type: 'FISICA',
      name: 'Maria da Silva Santos',
      cpfCnpj: '123.456.789-00',
      email: 'maria.santos@email.com',
      phone: '11988001001',
      whatsapp: '11988001001',
      address: 'Rua das Flores, 123',
      city: 'Guarulhos',
      state: 'SP',
      zipCode: '07000-000',
      status: 'CLIENTE_ATIVO',
      origin: 'indicacao',
      responsibleId: adv1.id,
      tags: ['trabalhista', 'urgente'],
      createdById: admin.id,
    },
  });

  const person2 = await prisma.person.upsert({
    where: { cpfCnpj: '987.654.321-00' },
    update: {},
    create: {
      type: 'FISICA',
      name: 'Joao Pedro Oliveira',
      cpfCnpj: '987.654.321-00',
      email: 'joao.oliveira@email.com',
      phone: '11988002002',
      whatsapp: '11988002002',
      address: 'Av. Brasil, 456',
      city: 'Guarulhos',
      state: 'SP',
      zipCode: '07100-000',
      status: 'CLIENTE_ATIVO',
      origin: 'whatsapp',
      responsibleId: adv2.id,
      tags: ['civil', 'consumidor'],
      createdById: admin.id,
    },
  });

  const person3 = await prisma.person.upsert({
    where: { cpfCnpj: '111.222.333-44' },
    update: {},
    create: {
      type: 'FISICA',
      name: 'Ana Beatriz Ferreira',
      cpfCnpj: '111.222.333-44',
      email: 'ana.ferreira@email.com',
      phone: '11988003003',
      whatsapp: '11988003003',
      city: 'Guarulhos',
      state: 'SP',
      status: 'POTENCIAL_CLIENTE',
      origin: 'site',
      tags: ['previdenciario'],
      createdById: adv1.id,
    },
  });

  const person4 = await prisma.person.upsert({
    where: { cpfCnpj: '12.345.678/0001-90' },
    update: {},
    create: {
      type: 'JURIDICA',
      name: 'Comercio ABC Ltda',
      cpfCnpj: '12.345.678/0001-90',
      email: 'contato@comercioabc.com.br',
      phone: '1140001000',
      address: 'Rua do Comercio, 789',
      city: 'Guarulhos',
      state: 'SP',
      zipCode: '07200-000',
      status: 'CLIENTE_ATIVO',
      origin: 'indicacao',
      responsibleId: adv1.id,
      tags: ['trabalhista', 'empresa'],
      createdById: admin.id,
    },
  });

  const person5 = await prisma.person.upsert({
    where: { cpfCnpj: '555.666.777-88' },
    update: {},
    create: {
      type: 'FISICA',
      name: 'Roberto Carlos Mendes',
      cpfCnpj: '555.666.777-88',
      phone: '11988005005',
      whatsapp: '11988005005',
      city: 'Sao Paulo',
      state: 'SP',
      status: 'NAO_CLASSIFICADO',
      origin: 'whatsapp',
      tags: [],
      createdById: adv2.id,
    },
  });

  console.log('Persons created');

  // ========================================================================
  // MATTERS
  // ========================================================================
  const matter1 = await prisma.matter.create({
    data: {
      title: 'Reclamacao Trabalhista - Maria Silva vs Empresa XYZ',
      description:
        'Reclamacao trabalhista por verbas rescisorias, FGTS, horas extras e danos morais.',
      personId: person1.id,
      status: 'ATIVO',
      legalArea: 'TRABALHISTA',
      courtNumber: '1234567-89.2024.5.02.0314',
      court: 'TRT-2 - 14a Vara do Trabalho de Guarulhos',
      jurisdiction: 'Guarulhos',
      nextSteps: 'Audiencia de instrucao agendada para 15/03/2025',
      responsibleId: adv1.id,
      createdById: admin.id,
    },
  });

  const matter2 = await prisma.matter.create({
    data: {
      title: 'Acao de Indenizacao - Joao Oliveira vs Loja Virtual',
      description:
        'Acao de indenizacao por danos materiais e morais por produto com defeito.',
      personId: person2.id,
      status: 'ATIVO',
      legalArea: 'CONSUMIDOR',
      courtNumber: '9876543-21.2024.8.26.0224',
      court: 'TJSP - 3a Vara Civel de Guarulhos',
      jurisdiction: 'Guarulhos',
      nextSteps: 'Aguardando contestacao da re',
      responsibleId: adv2.id,
      createdById: admin.id,
    },
  });

  console.log('Matters created');

  // ========================================================================
  // DOCUMENT TEMPLATES
  // ========================================================================
  await prisma.documentTemplate.createMany({
    data: [
      {
        name: 'Procuracao Ad Judicia',
        description:
          'Procuracao para representacao judicial padrao',
        category: 'procuracao',
        content: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Procuracao Ad Judicia</title>
<style>body{font-family:Times New Roman,serif;font-size:12pt;margin:40px 60px;line-height:1.8}h1{text-align:center;font-size:14pt;text-transform:uppercase}p{text-indent:40px;text-align:justify}.assinatura{margin-top:60px;text-align:center;border-top:1px solid #000;width:300px;margin-left:auto;margin-right:auto;padding-top:5px}</style>
</head>
<body>
<h1>Procuracao Ad Judicia</h1>
<p>Pelo presente instrumento particular de mandato, <strong>{{clienteNome}}</strong>, {{clienteNacionalidade}}, {{clienteEstadoCivil}}, {{clienteProfissao}}, portador(a) do RG n. {{clienteRg}} e inscrito(a) no CPF sob o n. {{clienteCpf}}, residente e domiciliado(a) em {{clienteEndereco}}, {{clienteCidade}}/{{clienteEstado}}, nomeia e constitui seu bastante procurador(a) o(a) advogado(a) <strong>{{advogadoNome}}</strong>, inscrito(a) na {{advogadoOab}}, com escritorio na {{escritorioEndereco}}, para o foro em geral, com os poderes da clausula "ad judicia et extra", podendo propor acoes, contestar, transigir, desistir, acordar, recorrer, substabelecer com ou sem reserva de poderes, e praticar todos os atos necessarios ao fiel cumprimento do presente mandato.</p>
<p>{{cidade}}, {{data}}.</p>
<div class="assinatura">{{clienteNome}}</div>
</body>
</html>`,
      },
      {
        name: 'Declaracao de Hipossuficiencia',
        description:
          'Declaracao de hipossuficiencia para justica gratuita',
        category: 'hipossuficiencia',
        content: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Declaracao de Hipossuficiencia</title>
<style>body{font-family:Times New Roman,serif;font-size:12pt;margin:40px 60px;line-height:1.8}h1{text-align:center;font-size:14pt;text-transform:uppercase}p{text-indent:40px;text-align:justify}.assinatura{margin-top:60px;text-align:center;border-top:1px solid #000;width:300px;margin-left:auto;margin-right:auto;padding-top:5px}</style>
</head>
<body>
<h1>Declaracao de Hipossuficiencia Economica</h1>
<p>Eu, <strong>{{clienteNome}}</strong>, portador(a) do RG n. {{clienteRg}}, inscrito(a) no CPF sob o n. {{clienteCpf}}, residente e domiciliado(a) em {{clienteEndereco}}, {{clienteCidade}}/{{clienteEstado}}, declaro, sob as penas da lei, que nao tenho condicoes financeiras de arcar com as custas processuais e honorarios advocaticios sem prejuizo do sustento proprio e de minha familia, nos termos do art. 98 e seguintes do Codigo de Processo Civil e art. 5o, LXXIV, da Constituicao Federal.</p>
<p>{{cidade}}, {{data}}.</p>
<div class="assinatura">{{clienteNome}}</div>
</body>
</html>`,
      },
      {
        name: 'Contrato de Honorarios Advocaticios',
        description:
          'Contrato padrao de prestacao de servicos advocaticios',
        category: 'contrato',
        content: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Contrato de Honorarios</title>
<style>body{font-family:Times New Roman,serif;font-size:12pt;margin:40px 60px;line-height:1.8}h1{text-align:center;font-size:14pt;text-transform:uppercase}h2{font-size:12pt;margin-top:20px}p{text-indent:40px;text-align:justify}.assinatura{margin-top:40px;display:flex;justify-content:space-around}.assinatura div{text-align:center;border-top:1px solid #000;width:250px;padding-top:5px}</style>
</head>
<body>
<h1>Contrato de Prestacao de Servicos Advocaticios</h1>
<p>Pelo presente instrumento particular, de um lado <strong>{{clienteNome}}</strong>, {{clienteQualificacao}}, doravante denominado(a) CONTRATANTE, e de outro lado <strong>{{advogadoNome}}</strong>, inscrito(a) na {{advogadoOab}}, doravante denominado(a) CONTRATADO(A), tem entre si justo e contratado o seguinte:</p>
<h2>CLAUSULA PRIMEIRA - DO OBJETO</h2>
<p>O presente contrato tem por objeto a prestacao de servicos advocaticios referentes a: {{objetoContrato}}</p>
<h2>CLAUSULA SEGUNDA - DOS HONORARIOS</h2>
<p>Pelos servicos prestados, o CONTRATANTE pagara ao CONTRATADO o valor de R$ {{valorTotal}} ({{valorExtenso}}), na forma: {{formaPagamento}}</p>
<h2>CLAUSULA TERCEIRA - DAS OBRIGACOES</h2>
<p>O CONTRATADO se obriga a representar o CONTRATANTE em juizo e fora dele, praticando todos os atos necessarios a defesa de seus interesses no caso descrito na clausula primeira.</p>
<p>{{cidade}}, {{data}}.</p>
<div class="assinatura"><div>CONTRATANTE<br>{{clienteNome}}</div><div>CONTRATADO(A)<br>{{advogadoNome}}<br>{{advogadoOab}}</div></div>
</body>
</html>`,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Document templates created');

  // ========================================================================
  // FORENSIC CALENDAR (2024-2027)
  // ========================================================================
  const holidays: { date: string; description: string; type: string; state?: string; city?: string }[] = [];

  // Helper to add for years 2024-2027
  const years = [2024, 2025, 2026, 2027];

  for (const year of years) {
    // Feriados Nacionais
    holidays.push(
      { date: `${year}-01-01`, description: 'Confraternizacao Universal', type: 'FERIADO_NACIONAL' },
      { date: `${year}-04-21`, description: 'Tiradentes', type: 'FERIADO_NACIONAL' },
      { date: `${year}-05-01`, description: 'Dia do Trabalho', type: 'FERIADO_NACIONAL' },
      { date: `${year}-09-07`, description: 'Independencia do Brasil', type: 'FERIADO_NACIONAL' },
      { date: `${year}-10-12`, description: 'Nossa Senhora Aparecida', type: 'FERIADO_NACIONAL' },
      { date: `${year}-11-02`, description: 'Finados', type: 'FERIADO_NACIONAL' },
      { date: `${year}-11-15`, description: 'Proclamacao da Republica', type: 'FERIADO_NACIONAL' },
      { date: `${year}-12-25`, description: 'Natal', type: 'FERIADO_NACIONAL' },
    );

    // Feriado Estadual SP
    holidays.push(
      { date: `${year}-07-09`, description: 'Revolucao Constitucionalista', type: 'FERIADO_ESTADUAL', state: 'SP' },
    );

    // Feriado Municipal Guarulhos
    holidays.push(
      { date: `${year}-12-08`, description: 'Dia de Nossa Senhora da Conceicao (Guarulhos)', type: 'FERIADO_MUNICIPAL', state: 'SP', city: 'Guarulhos' },
    );

    // Recesso Forense
    holidays.push(
      { date: `${year}-12-20`, description: 'Recesso Forense', type: 'SUSPENSAO' },
      { date: `${year}-12-21`, description: 'Recesso Forense', type: 'SUSPENSAO' },
      { date: `${year}-12-22`, description: 'Recesso Forense', type: 'SUSPENSAO' },
      { date: `${year}-12-23`, description: 'Recesso Forense', type: 'SUSPENSAO' },
      { date: `${year}-12-24`, description: 'Recesso Forense', type: 'SUSPENSAO' },
      { date: `${year}-12-26`, description: 'Recesso Forense', type: 'SUSPENSAO' },
      { date: `${year}-12-27`, description: 'Recesso Forense', type: 'SUSPENSAO' },
      { date: `${year}-12-28`, description: 'Recesso Forense', type: 'SUSPENSAO' },
      { date: `${year}-12-29`, description: 'Recesso Forense', type: 'SUSPENSAO' },
      { date: `${year}-12-30`, description: 'Recesso Forense', type: 'SUSPENSAO' },
      { date: `${year}-12-31`, description: 'Recesso Forense', type: 'SUSPENSAO' },
    );
  }

  // Carnival and Easter (variable dates)
  const variableDates: Record<number, { carnival: string[]; corpusChristi: string; goodFriday: string }> = {
    2024: {
      carnival: ['2024-02-12', '2024-02-13'],
      goodFriday: '2024-03-29',
      corpusChristi: '2024-05-30',
    },
    2025: {
      carnival: ['2025-03-03', '2025-03-04'],
      goodFriday: '2025-04-18',
      corpusChristi: '2025-06-19',
    },
    2026: {
      carnival: ['2026-02-16', '2026-02-17'],
      goodFriday: '2026-04-03',
      corpusChristi: '2026-06-04',
    },
    2027: {
      carnival: ['2027-02-08', '2027-02-09'],
      goodFriday: '2027-03-26',
      corpusChristi: '2027-05-27',
    },
  };

  for (const year of years) {
    const dates = variableDates[year];
    for (const carnaval of dates.carnival) {
      holidays.push({ date: carnaval, description: 'Carnaval', type: 'FERIADO_NACIONAL' });
    }
    holidays.push(
      { date: dates.goodFriday, description: 'Sexta-feira Santa', type: 'FERIADO_NACIONAL' },
      { date: dates.corpusChristi, description: 'Corpus Christi', type: 'FERIADO_NACIONAL' },
    );
    // Recesso inicio do ano
    holidays.push(
      { date: `${year}-01-02`, description: 'Recesso Forense', type: 'SUSPENSAO' },
      { date: `${year}-01-03`, description: 'Recesso Forense', type: 'SUSPENSAO' },
      { date: `${year}-01-04`, description: 'Recesso Forense', type: 'SUSPENSAO' },
      { date: `${year}-01-05`, description: 'Recesso Forense', type: 'SUSPENSAO' },
      { date: `${year}-01-06`, description: 'Recesso Forense', type: 'SUSPENSAO' },
    );
  }

  for (const h of holidays) {
    await prisma.forensicCalendar.upsert({
      where: { date: new Date(h.date + 'T00:00:00.000Z') },
      update: {},
      create: {
        date: new Date(h.date + 'T00:00:00.000Z'),
        description: h.description,
        type: h.type,
        state: h.state,
        city: h.city,
      },
    });
  }

  console.log('Forensic calendar created');

  // ========================================================================
  // TIMELINE EVENTS
  // ========================================================================
  await prisma.timelineEvent.createMany({
    data: [
      {
        personId: person1.id,
        matterId: matter1.id,
        type: 'STATUS_CHANGE',
        title: 'Processo criado',
        description: 'Reclamacao Trabalhista ajuizada',
        createdById: adv1.id,
      },
      {
        personId: person2.id,
        matterId: matter2.id,
        type: 'STATUS_CHANGE',
        title: 'Processo criado',
        description: 'Acao de Indenizacao distribuida',
        createdById: adv2.id,
      },
    ],
  });

  // ========================================================================
  // TASKS
  // ========================================================================
  await prisma.task.createMany({
    data: [
      {
        title: 'Preparar peca inicial - Maria Silva',
        description: 'Elaborar reclamacao trabalhista com todos os pedidos',
        matterId: matter1.id,
        personId: person1.id,
        assignedToId: adv1.id,
        priority: 'ALTA',
        status: 'CONCLUIDA',
        dueDate: new Date('2024-12-15'),
        completedAt: new Date('2024-12-14'),
        createdById: admin.id,
      },
      {
        title: 'Reunir documentos para audiencia',
        description:
          'CTPS, holerites, controle de ponto, carta de demissao',
        matterId: matter1.id,
        personId: person1.id,
        assignedToId: adv1.id,
        priority: 'URGENTE',
        status: 'PENDENTE',
        dueDate: new Date('2025-03-10'),
        createdById: adv1.id,
      },
      {
        title: 'Elaborar contestacao - Joao Oliveira',
        description: 'Preparar defesa para acao de indenizacao',
        matterId: matter2.id,
        personId: person2.id,
        assignedToId: adv2.id,
        priority: 'MEDIA',
        status: 'EM_ANDAMENTO',
        dueDate: new Date('2025-02-28'),
        createdById: admin.id,
      },
      {
        title: 'Contatar Ana Beatriz sobre caso previdenciario',
        personId: person3.id,
        assignedToId: adv1.id,
        priority: 'MEDIA',
        status: 'PENDENTE',
        dueDate: new Date('2025-02-15'),
        createdById: adv1.id,
      },
    ],
  });

  console.log('Tasks created');

  // ========================================================================
  // ALERTS
  // ========================================================================
  await prisma.alert.createMany({
    data: [
      {
        type: 'PRAZO',
        severity: 'CRITICAL',
        title: 'Prazo de audiencia proximo',
        message:
          'A audiencia de instrucao do processo Maria Silva esta agendada para 15/03/2025. Faltam menos de 30 dias.',
        entityType: 'Matter',
        entityId: matter1.id,
        userId: adv1.id,
      },
      {
        type: 'CONVERSA',
        severity: 'WARNING',
        title: 'Conversa nao classificada',
        message:
          'Existem conversas de WhatsApp que ainda nao foram classificadas. Verifique a caixa de entrada.',
        userId: admin.id,
      },
      {
        type: 'FINANCEIRO',
        severity: 'INFO',
        title: 'Parcela vencendo em breve',
        message:
          'A parcela 2/6 do acordo de honorarios do cliente Joao Oliveira vence em 5 dias.',
        entityType: 'Person',
        entityId: person2.id,
        userId: adv2.id,
      },
      {
        type: 'SISTEMA',
        severity: 'INFO',
        title: 'Bem-vindo ao Juris Sistema',
        message:
          'O sistema esta configurado e pronto para uso. Altere sua senha no primeiro acesso.',
        userId: admin.id,
      },
    ],
  });

  console.log('Alerts created');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
