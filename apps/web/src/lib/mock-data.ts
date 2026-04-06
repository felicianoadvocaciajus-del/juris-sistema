// Dados mock para desenvolvimento sem backend
// Removar quando o backend estiver rodando

export const mockUser = {
  id: '1',
  name: 'Dr. Carlos Silva',
  email: 'admin@juris.local',
  role: 'ADMIN',
  oabNumber: 'OAB/SP 123.456',
};

export const mockDashboard = {
  unresolvedAlerts: 3,
  pendingTasks: 7,
  overdueDeadlines: 2,
  upcomingDeadlines: 5,
  pendingPayments: 4,
  unclassifiedConversations: 8,
  activeMatters: 12,
  totalClients: 45,
  recentTimeline: [
    { id: '1', type: 'MENSAGEM', title: 'Nova mensagem de Maria Santos', description: 'Boa tarde, doutor. Preciso marcar uma reuniao...', createdAt: new Date().toISOString() },
    { id: '2', type: 'PRAZO', title: 'Prazo de contestacao - Proc. 1234567-89.2024', description: 'Vence em 3 dias uteis', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: '3', type: 'PAGAMENTO', title: 'Pagamento recebido - Joao Oliveira', description: 'R$ 1.500,00 via PIX', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: '4', type: 'DOCUMENTO', title: 'Procuracao gerada - Ana Souza', description: 'Procuracao ad judicia gerada automaticamente', createdAt: new Date(Date.now() - 14400000).toISOString() },
    { id: '5', type: 'NOTA', title: 'Nota interna - Caso Ferreira', description: 'Cliente informou novo endereco', createdAt: new Date(Date.now() - 28800000).toISOString() },
  ],
};

export const mockClients = [
  { id: '1', name: 'Maria Santos da Silva', cpfCnpj: '123.456.789-00', phone: '(11) 99999-1111', whatsapp: '(11) 99999-1111', status: 'CLIENTE_ATIVO', type: 'FISICA', email: 'maria@email.com', city: 'Guarulhos', state: 'SP', responsibleId: '1', responsible: { name: 'Dr. Carlos Silva' }, tags: ['trabalhista', 'indicacao'], createdAt: '2024-01-15T10:00:00Z', _count: { matters: 2 } },
  { id: '2', name: 'Joao Oliveira', cpfCnpj: '987.654.321-00', phone: '(11) 98888-2222', whatsapp: '(11) 98888-2222', status: 'CLIENTE_ATIVO', type: 'FISICA', email: 'joao@email.com', city: 'Guarulhos', state: 'SP', responsibleId: '1', responsible: { name: 'Dr. Carlos Silva' }, tags: ['civil'], createdAt: '2024-02-10T14:00:00Z', _count: { matters: 1 } },
  { id: '3', name: 'Ana Paula Souza', cpfCnpj: '456.789.123-00', phone: '(11) 97777-3333', whatsapp: '(11) 97777-3333', status: 'CLIENTE_ATIVO', type: 'FISICA', email: 'ana@email.com', city: 'Sao Paulo', state: 'SP', responsibleId: '2', responsible: { name: 'Dra. Patricia Lima' }, tags: ['familia', 'urgente'], createdAt: '2024-03-05T09:00:00Z', _count: { matters: 1 } },
  { id: '4', name: 'Empresa ABC Ltda', cpfCnpj: '12.345.678/0001-90', phone: '(11) 3333-4444', whatsapp: null, status: 'CLIENTE_ATIVO', type: 'JURIDICA', email: 'contato@abc.com.br', city: 'Guarulhos', state: 'SP', responsibleId: '1', responsible: { name: 'Dr. Carlos Silva' }, tags: ['empresarial', 'trabalhista'], createdAt: '2024-01-20T16:00:00Z', _count: { matters: 3 } },
  { id: '5', name: 'Pedro Ferreira Lima', cpfCnpj: null, phone: '(11) 96666-5555', whatsapp: '(11) 96666-5555', status: 'POTENCIAL_CLIENTE', type: 'FISICA', email: null, city: 'Guarulhos', state: 'SP', responsibleId: null, responsible: null, tags: ['indicacao'], createdAt: '2024-06-01T11:00:00Z', _count: { matters: 0 } },
  { id: '6', name: 'Lucia Mendes', cpfCnpj: null, phone: '(11) 95555-6666', whatsapp: '(11) 95555-6666', status: 'NAO_CLASSIFICADO', type: 'FISICA', email: null, city: null, state: null, responsibleId: null, responsible: null, tags: [], createdAt: '2024-06-10T08:00:00Z', _count: { matters: 0 } },
  { id: '7', name: 'Roberto Costa', cpfCnpj: '111.222.333-44', phone: '(11) 94444-7777', whatsapp: '(11) 94444-7777', status: 'ENCERRADO', type: 'FISICA', email: 'roberto@email.com', city: 'Sao Paulo', state: 'SP', responsibleId: '2', responsible: { name: 'Dra. Patricia Lima' }, tags: ['criminal'], createdAt: '2023-06-15T10:00:00Z', _count: { matters: 1 } },
];

export const mockMatters = [
  { id: '1', title: 'Reclamacao Trabalhista - Horas Extras', personId: '1', person: { name: 'Maria Santos da Silva' }, status: 'ATIVO', legalArea: 'TRABALHISTA', courtNumber: '1234567-89.2024.5.02.0001', court: 'TRT-2', responsibleId: '1', responsible: { name: 'Dr. Carlos Silva' }, createdAt: '2024-01-20T10:00:00Z', _count: { documents: 5, tasks: 3 } },
  { id: '2', title: 'Divorcio Consensual', personId: '3', person: { name: 'Ana Paula Souza' }, status: 'ATIVO', legalArea: 'FAMILIA', courtNumber: '9876543-21.2024.8.26.0100', court: 'TJSP', responsibleId: '2', responsible: { name: 'Dra. Patricia Lima' }, createdAt: '2024-03-10T14:00:00Z', _count: { documents: 3, tasks: 1 } },
  { id: '3', title: 'Cobranca de Divida', personId: '2', person: { name: 'Joao Oliveira' }, status: 'ATIVO', legalArea: 'CIVIL', courtNumber: null, court: null, responsibleId: '1', responsible: { name: 'Dr. Carlos Silva' }, createdAt: '2024-04-05T09:00:00Z', _count: { documents: 2, tasks: 2 } },
  { id: '4', title: 'Defesa Trabalhista - Empresa ABC', personId: '4', person: { name: 'Empresa ABC Ltda' }, status: 'ATIVO', legalArea: 'TRABALHISTA', courtNumber: '5555555-55.2024.5.02.0001', court: 'TRT-2', responsibleId: '1', responsible: { name: 'Dr. Carlos Silva' }, createdAt: '2024-02-15T16:00:00Z', _count: { documents: 8, tasks: 4 } },
  { id: '5', title: 'Defesa Criminal', personId: '7', person: { name: 'Roberto Costa' }, status: 'ENCERRADO', legalArea: 'CRIMINAL', courtNumber: '7777777-77.2023.8.26.0100', court: 'TJSP', responsibleId: '2', responsible: { name: 'Dra. Patricia Lima' }, createdAt: '2023-07-01T10:00:00Z', _count: { documents: 12, tasks: 0 } },
];

export const mockConversations = [
  { id: '1', contactName: 'Maria Santos', contactPhone: '(11) 99999-1111', channel: 'WHATSAPP', classification: 'CLIENTE', subject: 'Audiencia trabalhista', lastMessageAt: new Date(Date.now() - 1800000).toISOString(), isArchived: false, person: { id: '1', name: 'Maria Santos da Silva' }, messages: [
    { id: '1', direction: 'INBOUND', content: 'Bom dia doutor! Quando e a proxima audiencia?', senderName: 'Maria Santos', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: '2', direction: 'OUTBOUND', content: 'Bom dia Maria! A audiencia esta marcada para o dia 15/07. Vou te enviar os detalhes por email.', senderName: 'Dr. Carlos', createdAt: new Date(Date.now() - 1800000).toISOString() },
  ]},
  { id: '2', contactName: '(11) 96666-5555', contactPhone: '(11) 96666-5555', channel: 'WHATSAPP', classification: 'NAO_CLASSIFICADO', subject: null, lastMessageAt: new Date(Date.now() - 7200000).toISOString(), isArchived: false, person: null, messages: [
    { id: '3', direction: 'INBOUND', content: 'Ola, um amigo me indicou o escritorio. Preciso de um advogado trabalhista. Podem me atender?', senderName: null, createdAt: new Date(Date.now() - 7200000).toISOString() },
  ]},
  { id: '3', contactName: 'Ana Souza', contactPhone: '(11) 97777-3333', channel: 'WHATSAPP', classification: 'CLIENTE', subject: 'Documentos divorcio', lastMessageAt: new Date(Date.now() - 86400000).toISOString(), isArchived: false, person: { id: '3', name: 'Ana Paula Souza' }, messages: [
    { id: '4', direction: 'INBOUND', content: 'Dra Patricia, ja tenho todos os documentos que a senhora pediu.', senderName: 'Ana Souza', createdAt: new Date(Date.now() - 90000000).toISOString() },
    { id: '5', direction: 'OUTBOUND', content: 'Otimo Ana! Pode trazer no escritorio amanha de manha.', senderName: 'Dra. Patricia', createdAt: new Date(Date.now() - 86400000).toISOString() },
  ]},
  { id: '4', contactName: 'Primo Ricardo', contactPhone: '(11) 91111-8888', channel: 'WHATSAPP', classification: 'PESSOAL', subject: 'Churrasco sabado', lastMessageAt: new Date(Date.now() - 172800000).toISOString(), isArchived: false, person: null, messages: [
    { id: '6', direction: 'INBOUND', content: 'E ai primo, confirma no churrasco sabado?', senderName: 'Ricardo', createdAt: new Date(Date.now() - 172800000).toISOString() },
  ]},
  { id: '5', contactName: 'Numero desconhecido', contactPhone: '(11) 92222-9999', channel: 'WHATSAPP', classification: 'NAO_CLASSIFICADO', subject: null, lastMessageAt: new Date(Date.now() - 600000).toISOString(), isArchived: false, person: null, messages: [
    { id: '7', direction: 'INBOUND', content: 'Dr Carlos, sou o Marcos, preciso urgente de uma orientacao sobre um problema no meu trabalho. Me mandaram embora hoje sem justa causa.', senderName: null, createdAt: new Date(Date.now() - 600000).toISOString() },
  ]},
];

export const mockInstallments = [
  { id: '1', feeAgreement: { person: { name: 'Maria Santos da Silva' }, matter: { title: 'Reclamacao Trabalhista' }, type: 'PARCELADO', totalAmount: 6000 }, number: 1, amount: 2000, dueDate: '2024-01-20', status: 'PAGO', paidAmount: 2000, paidAt: '2024-01-20' },
  { id: '2', feeAgreement: { person: { name: 'Maria Santos da Silva' }, matter: { title: 'Reclamacao Trabalhista' }, type: 'PARCELADO', totalAmount: 6000 }, number: 2, amount: 2000, dueDate: '2024-02-20', status: 'PAGO', paidAmount: 2000, paidAt: '2024-02-22' },
  { id: '3', feeAgreement: { person: { name: 'Maria Santos da Silva' }, matter: { title: 'Reclamacao Trabalhista' }, type: 'PARCELADO', totalAmount: 6000 }, number: 3, amount: 2000, dueDate: '2024-03-20', status: 'VENCIDO', paidAmount: 0, paidAt: null },
  { id: '4', feeAgreement: { person: { name: 'Ana Paula Souza' }, matter: { title: 'Divorcio Consensual' }, type: 'AVISTA', totalAmount: 3500 }, number: 1, amount: 3500, dueDate: '2024-03-15', status: 'PAGO', paidAmount: 3500, paidAt: '2024-03-15' },
  { id: '5', feeAgreement: { person: { name: 'Empresa ABC Ltda' }, matter: { title: 'Defesa Trabalhista' }, type: 'MENSAL', totalAmount: 24000 }, number: 4, amount: 2000, dueDate: '2024-06-05', status: 'PENDENTE', paidAmount: 0, paidAt: null },
  { id: '6', feeAgreement: { person: { name: 'Joao Oliveira' }, matter: { title: 'Cobranca de Divida' }, type: 'EXITO', totalAmount: 5000 }, number: 1, amount: 1500, dueDate: '2024-04-10', status: 'PENDENTE', paidAmount: 0, paidAt: null },
];

export const mockPublications = [
  { id: '1', status: 'NOVA', source: 'DJE-SP', processNumber: '1234567-89.2024.5.02.0001', court: 'TRT-2', actType: 'Intimacao', relevantText: 'Fica a parte reclamante intimada para se manifestar sobre os documentos juntados pela reclamada, no prazo de 5 dias uteis.', publishedAt: new Date(Date.now() - 3600000).toISOString(), keywords: ['intimacao', 'manifestacao', 'documentos'], matter: { title: 'Reclamacao Trabalhista' }, person: { name: 'Maria Santos da Silva' } },
  { id: '2', status: 'NOVA', source: 'DJE-SP', processNumber: '9876543-21.2024.8.26.0100', court: 'TJSP', actType: 'Despacho', relevantText: 'Determino a citacao da parte re para contestar a acao no prazo de 15 dias uteis.', publishedAt: new Date(Date.now() - 7200000).toISOString(), keywords: ['citacao', 'contestacao'], matter: { title: 'Divorcio Consensual' }, person: { name: 'Ana Paula Souza' } },
  { id: '3', status: 'EM_ANALISE', source: 'DJE-SP', processNumber: '5555555-55.2024.5.02.0001', court: 'TRT-2', actType: 'Sentenca', relevantText: 'Julgo parcialmente procedente o pedido para condenar a reclamada ao pagamento de horas extras...', publishedAt: new Date(Date.now() - 86400000).toISOString(), keywords: ['sentenca', 'procedente', 'horas extras'], matter: { title: 'Defesa Trabalhista' }, person: { name: 'Empresa ABC Ltda' } },
];

export const mockDeadlines = [
  { id: '1', description: 'Manifestacao sobre documentos', status: 'SUGERIDO', procedureType: 'CLT', dayCountType: 'UTEIS', dayCount: 5, startDate: new Date().toISOString(), suggestedEndDate: new Date(Date.now() + 7 * 86400000).toISOString(), confirmedEndDate: null, legalBasis: 'Art. 841, CLT', matter: { title: 'Reclamacao Trabalhista' }, person: { name: 'Maria Santos da Silva' }, publication: { processNumber: '1234567-89.2024.5.02.0001' } },
  { id: '2', description: 'Contestacao', status: 'CONFIRMADO', procedureType: 'CPC', dayCountType: 'UTEIS', dayCount: 15, startDate: new Date(Date.now() - 5 * 86400000).toISOString(), suggestedEndDate: new Date(Date.now() + 16 * 86400000).toISOString(), confirmedEndDate: new Date(Date.now() + 16 * 86400000).toISOString(), legalBasis: 'Art. 335, CPC', matter: { title: 'Divorcio Consensual' }, person: { name: 'Ana Paula Souza' }, publication: { processNumber: '9876543-21.2024.8.26.0100' } },
  { id: '3', description: 'Recurso Ordinario', status: 'SUGERIDO', procedureType: 'CLT', dayCountType: 'UTEIS', dayCount: 8, startDate: new Date(Date.now() - 2 * 86400000).toISOString(), suggestedEndDate: new Date(Date.now() + 10 * 86400000).toISOString(), confirmedEndDate: null, legalBasis: 'Art. 895, CLT', matter: { title: 'Defesa Trabalhista' }, person: { name: 'Empresa ABC Ltda' }, publication: { processNumber: '5555555-55.2024.5.02.0001' } },
];

export const mockTemplates = [
  { id: '1', name: 'Procuracao Ad Judicia', description: 'Procuracao para representacao em juizo', category: 'procuracao', isActive: true },
  { id: '2', name: 'Declaracao de Hipossuficiencia', description: 'Declaracao para justica gratuita', category: 'declaracao', isActive: true },
  { id: '3', name: 'Contrato de Honorarios', description: 'Contrato padrao de prestacao de servicos advocaticios', category: 'contrato', isActive: true },
];
