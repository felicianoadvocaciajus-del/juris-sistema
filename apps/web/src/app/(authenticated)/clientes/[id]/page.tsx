"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { Timeline } from "@/components/timeline";
import { DataTable } from "@/components/data-table";
import { Loading } from "@/components/loading";
import { EmptyState } from "@/components/empty-state";
import {
  formatCpfCnpj,
  formatPhone,
  formatDate,
  formatCurrency,
} from "@/lib/utils";
import {
  ArrowLeft,
  Edit,
  Plus,
  Briefcase,
  FileText,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  User,
} from "lucide-react";

interface ClientDetail {
  id: string;
  name: string;
  type: string;
  cpfCnpj?: string;
  rg?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  birthDate?: string;
  occupation?: string;
  maritalStatus?: string;
  status: string;
  responsible?: { id: string; name: string };
  tags?: string[];
  notes?: string;
  cases?: any[];
  documents?: any[];
  conversations?: any[];
  timeline?: any[];
  installments?: any[];
  createdAt: string;
}

export default function ClienteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/clients/${params.id}`)
      .then((res) => setClient(res.data))
      .catch(() => router.push("/clientes"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  if (loading) return <Loading />;
  if (!client) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {client.name}
              </h1>
              <StatusBadge status={client.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {client.type === "FISICA" ? "Pessoa Fisica" : "Pessoa Juridica"}
              {client.cpfCnpj && ` - ${formatCpfCnpj(client.cpfCnpj)}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/casos?clientId=${client.id}`)}
          >
            <Briefcase className="mr-2 h-4 w-4" />
            Novo Caso
          </Button>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      {/* Contact info bar */}
      <Card>
        <CardContent className="flex flex-wrap gap-6 py-4">
          {client.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-slate-400" />
              {client.email}
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-slate-400" />
              {formatPhone(client.phone)}
            </div>
          )}
          {client.city && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-slate-400" />
              {client.city}
              {client.state && `/${client.state}`}
            </div>
          )}
          {client.responsible && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-slate-400" />
              {client.responsible.name}
            </div>
          )}
          {client.tags && client.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {client.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="casos">Casos</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="conversas">Conversas</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <Card>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
              <InfoItem label="Nome" value={client.name} />
              <InfoItem
                label="CPF/CNPJ"
                value={
                  client.cpfCnpj ? formatCpfCnpj(client.cpfCnpj) : "-"
                }
              />
              <InfoItem label="RG" value={client.rg || "-"} />
              <InfoItem label="E-mail" value={client.email || "-"} />
              <InfoItem
                label="Telefone"
                value={client.phone ? formatPhone(client.phone) : "-"}
              />
              <InfoItem
                label="Data de Nascimento"
                value={
                  client.birthDate ? formatDate(client.birthDate) : "-"
                }
              />
              <InfoItem label="Profissao" value={client.occupation || "-"} />
              <InfoItem
                label="Estado Civil"
                value={client.maritalStatus || "-"}
              />
              <InfoItem
                label="Endereco"
                value={client.address || "-"}
              />
              <InfoItem
                label="Cidade/Estado"
                value={
                  client.city
                    ? `${client.city}/${client.state || ""}`
                    : "-"
                }
              />
              <InfoItem label="CEP" value={client.zipCode || "-"} />
              <InfoItem
                label="Cadastrado em"
                value={formatDate(client.createdAt)}
              />
              {client.notes && (
                <div className="md:col-span-2">
                  <InfoItem label="Observacoes" value={client.notes} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="casos">
          <Card>
            <CardContent className="pt-6">
              {client.cases && client.cases.length > 0 ? (
                <DataTable
                  columns={[
                    {
                      key: "title",
                      header: "Titulo",
                      render: (c: any) => (
                        <span className="font-medium">{c.title}</span>
                      ),
                    },
                    { key: "area", header: "Area" },
                    {
                      key: "status",
                      header: "Status",
                      render: (c: any) => (
                        <StatusBadge status={c.status} />
                      ),
                    },
                  ]}
                  data={client.cases}
                  keyExtractor={(c: any) => c.id}
                  onRowClick={(c: any) => router.push(`/casos/${c.id}`)}
                />
              ) : (
                <EmptyState
                  title="Nenhum caso vinculado"
                  description="Este cliente ainda nao possui casos registrados."
                  action={
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Caso
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardContent className="pt-6">
              <Timeline events={client.timeline || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos">
          <Card>
            <CardContent className="pt-6">
              {client.documents && client.documents.length > 0 ? (
                <DataTable
                  columns={[
                    {
                      key: "title",
                      header: "Documento",
                      render: (d: any) => (
                        <span className="font-medium">{d.title}</span>
                      ),
                    },
                    { key: "type", header: "Tipo" },
                    {
                      key: "createdAt",
                      header: "Data",
                      render: (d: any) => formatDate(d.createdAt),
                    },
                  ]}
                  data={client.documents}
                  keyExtractor={(d: any) => d.id}
                />
              ) : (
                <EmptyState
                  title="Nenhum documento"
                  description="Nenhum documento vinculado a este cliente."
                  icon={<FileText className="h-8 w-8 text-slate-400" />}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro">
          <Card>
            <CardContent className="pt-6">
              {client.installments && client.installments.length > 0 ? (
                <DataTable
                  columns={[
                    {
                      key: "description",
                      header: "Descricao",
                    },
                    {
                      key: "amount",
                      header: "Valor",
                      render: (i: any) => formatCurrency(i.amount),
                    },
                    {
                      key: "dueDate",
                      header: "Vencimento",
                      render: (i: any) => formatDate(i.dueDate),
                    },
                    {
                      key: "status",
                      header: "Status",
                      render: (i: any) => (
                        <StatusBadge status={i.status} />
                      ),
                    },
                  ]}
                  data={client.installments}
                  keyExtractor={(i: any) => i.id}
                />
              ) : (
                <EmptyState
                  title="Nenhum registro financeiro"
                  description="Nenhuma parcela ou pagamento registrado."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversas">
          <Card>
            <CardContent className="pt-6">
              {client.conversations && client.conversations.length > 0 ? (
                <DataTable
                  columns={[
                    {
                      key: "channel",
                      header: "Canal",
                    },
                    {
                      key: "lastMessageAt",
                      header: "Ultima Mensagem",
                      render: (c: any) => formatDate(c.lastMessageAt),
                    },
                    {
                      key: "status",
                      header: "Status",
                      render: (c: any) => (
                        <StatusBadge status={c.status} />
                      ),
                    },
                  ]}
                  data={client.conversations}
                  keyExtractor={(c: any) => c.id}
                  onRowClick={(c: any) => router.push(`/conversas?id=${c.id}`)}
                />
              ) : (
                <EmptyState
                  title="Nenhuma conversa"
                  description="Nenhuma conversa registrada com este cliente."
                  icon={
                    <MessageSquare className="h-8 w-8 text-slate-400" />
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm text-slate-900 mt-1">{value}</p>
    </div>
  );
}
