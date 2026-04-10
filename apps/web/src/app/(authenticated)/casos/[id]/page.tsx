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
import { StatusBadge } from "@/components/status-badge";
import { Timeline } from "@/components/timeline";
import { DataTable } from "@/components/data-table";
import { Loading } from "@/components/loading";
import { EmptyState } from "@/components/empty-state";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Edit,
  User,
  Calendar,
  Briefcase,
  FileText,
  Plus,
} from "lucide-react";

interface CaseDetail {
  id: string;
  title: string;
  caseNumber?: string;
  area?: string;
  status: string;
  description?: string;
  court?: string;
  judge?: string;
  client?: { id: string; name: string };
  responsible?: { id: string; name: string };
  opposingParty?: string;
  opposingLawyer?: string;
  createdAt: string;
  timeline?: any[];
  documents?: any[];
  deadlines?: any[];
  installments?: any[];
  tasks?: any[];
}

export default function CasoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/matters/${params.id}`)
      .then((res) => setCaseData(res.data))
      .catch((err) => { console.error('Erro caso:', err); router.push("/casos"); })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  if (loading) return <Loading />;
  if (!caseData) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {caseData.title}
              </h1>
              <StatusBadge status={caseData.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {caseData.caseNumber && `${caseData.caseNumber} - `}
              {caseData.area || "Sem area definida"}
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <User className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p
                className="text-sm font-medium cursor-pointer text-blue-600 hover:underline"
                onClick={() =>
                  caseData.client &&
                  router.push(`/clientes/${caseData.client.id}`)
                }
              >
                {caseData.client?.name || "-"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Briefcase className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs text-muted-foreground">Responsavel</p>
              <p className="text-sm font-medium">
                {caseData.responsible?.name || "-"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Calendar className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs text-muted-foreground">Criado em</p>
              <p className="text-sm font-medium">
                {formatDate(caseData.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {caseData.description && (
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Descricao
            </p>
            <p className="text-sm">{caseData.description}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="prazos">Prazos</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card>
            <CardContent className="pt-6">
              <Timeline events={caseData.timeline || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Documentos</CardTitle>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </CardHeader>
            <CardContent>
              {caseData.documents && caseData.documents.length > 0 ? (
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
                  data={caseData.documents}
                  keyExtractor={(d: any) => d.id}
                />
              ) : (
                <EmptyState
                  title="Nenhum documento"
                  icon={<FileText className="h-8 w-8 text-slate-400" />}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prazos">
          <Card>
            <CardContent className="pt-6">
              {caseData.deadlines && caseData.deadlines.length > 0 ? (
                <DataTable
                  columns={[
                    {
                      key: "description",
                      header: "Descricao",
                      render: (d: any) => (
                        <span className="font-medium">{d.description}</span>
                      ),
                    },
                    {
                      key: "dueDate",
                      header: "Vencimento",
                      render: (d: any) => formatDate(d.dueDate),
                    },
                    {
                      key: "status",
                      header: "Status",
                      render: (d: any) => <StatusBadge status={d.status} />,
                    },
                    { key: "legalBasis", header: "Base Legal" },
                  ]}
                  data={caseData.deadlines}
                  keyExtractor={(d: any) => d.id}
                />
              ) : (
                <EmptyState title="Nenhum prazo registrado" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro">
          <Card>
            <CardContent className="pt-6">
              {caseData.installments && caseData.installments.length > 0 ? (
                <DataTable
                  columns={[
                    { key: "description", header: "Descricao" },
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
                      render: (i: any) => <StatusBadge status={i.status} />,
                    },
                  ]}
                  data={caseData.installments}
                  keyExtractor={(i: any) => i.id}
                />
              ) : (
                <EmptyState title="Nenhum registro financeiro" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tarefas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Tarefas</CardTitle>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nova Tarefa
              </Button>
            </CardHeader>
            <CardContent>
              {caseData.tasks && caseData.tasks.length > 0 ? (
                <DataTable
                  columns={[
                    {
                      key: "title",
                      header: "Tarefa",
                      render: (t: any) => (
                        <span className="font-medium">{t.title}</span>
                      ),
                    },
                    {
                      key: "assignee",
                      header: "Responsavel",
                      render: (t: any) => t.assignee?.name || "-",
                    },
                    {
                      key: "dueDate",
                      header: "Prazo",
                      render: (t: any) =>
                        t.dueDate ? formatDate(t.dueDate) : "-",
                    },
                    {
                      key: "status",
                      header: "Status",
                      render: (t: any) => <StatusBadge status={t.status} />,
                    },
                  ]}
                  data={caseData.tasks}
                  keyExtractor={(t: any) => t.id}
                />
              ) : (
                <EmptyState title="Nenhuma tarefa" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
