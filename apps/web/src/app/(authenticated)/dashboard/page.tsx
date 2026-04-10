"use client";

import { useEffect, useState } from "react";
import { getDashboard } from "@/lib/data-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/loading";
import { Timeline } from "@/components/timeline";
import { formatCurrency } from "@/lib/utils";
import {
  AlertTriangle,
  Clock,
  CheckSquare,
  DollarSign,
  MessageSquare,
  BookOpen,
  TrendingUp,
  Users,
  Briefcase,
  FileText,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!data) return null;

  const alertCards = [
    {
      title: "Alertas Criticos",
      value: data.unresolvedAlerts ?? data.alertasCriticos ?? 0,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50 border-red-200",
      href: "/publicacoes",
    },
    {
      title: "Prazos Vencendo",
      value: Array.isArray(data.upcomingDeadlines) ? data.upcomingDeadlines.length : (data.upcomingDeadlines ?? data.prazosVencendo ?? 0),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-200",
      href: "/publicacoes",
    },
    {
      title: "Tarefas Pendentes",
      value: data.pendingTasks ?? data.tarefasPendentes ?? 0,
      icon: CheckSquare,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-200",
      href: "/casos",
    },
    {
      title: "Pagamentos Pendentes",
      value: data.pendingPayments ?? data.pagamentosPendentes ?? 0,
      icon: DollarSign,
      color: "text-orange-600",
      bg: "bg-orange-50 border-orange-200",
      href: "/financeiro",
    },
    {
      title: "Conversas Nao Triadas",
      value: data.unclassifiedConversations ?? data.conversasNaoTriadas ?? 0,
      icon: MessageSquare,
      color: "text-purple-600",
      bg: "bg-purple-50 border-purple-200",
      href: "/conversas",
    },
    {
      title: "Publicacoes Novas",
      value: data.publicacoesNovas ?? 0,
      icon: BookOpen,
      color: "text-teal-600",
      bg: "bg-teal-50 border-teal-200",
      href: "/publicacoes",
    },
  ];

  const statsCards = [
    {
      title: "Total Clientes",
      value: data.totalClients ?? data.totalClientes ?? 0,
      icon: Users,
    },
    {
      title: "Casos Ativos",
      value: data.activeMatters ?? data.totalCasos ?? 0,
      icon: Briefcase,
    },
    {
      title: "Documentos",
      value: data.totalDocumentos ?? 0,
      icon: FileText,
    },
    {
      title: "Receita do Mes",
      value: formatCurrency(data.receitaMes ?? 0),
      icon: TrendingUp,
    },
  ];

  const timelineEvents = (data.recentTimeline || data.timeline || []).map(
    (e: any) => ({
      id: e.id || String(Math.random()),
      date: e.createdAt || e.date || '',
      title: typeof e.title === 'string' ? e.title : (e.description || ''),
      description: typeof e.description === 'string' ? e.description : '',
      type:
        e.type === "PRAZO"
          ? "warning"
          : e.type === "PAGAMENTO"
            ? "success"
            : "info",
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visao geral do escritorio
        </p>
      </div>

      {/* Alert cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alertCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card
              className={`${card.bg} border hover:shadow-md transition-shadow cursor-pointer`}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg bg-white/80 ${card.color}`}
                >
                  <card.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-sm font-medium text-slate-600">
                    {card.title}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="flex items-center gap-3 p-4">
              <card.icon className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-lg font-semibold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          {timelineEvents.length > 0 ? (
            <Timeline events={timelineEvents} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma atividade recente
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
