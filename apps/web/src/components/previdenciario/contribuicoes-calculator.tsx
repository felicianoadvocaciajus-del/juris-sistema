"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import { Loading } from "@/components/loading";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  MinusCircle,
  Coins,
} from "lucide-react";

// ── Interfaces ───────────────────────────────────────────────

interface Contribuicao {
  id: string;
  personId: string;
  competencia: string;
  tipo: "PMIG-DOM" | "LC123" | "COMPLEMENTACAO" | string;
  valorOriginal: number;
  valorAtualizado: number;
  salarioMinimoEpoca: number;
  status: "PENDENTE" | "PAGO" | "DISPENSAVEL";
  dataPagamento: string | null;
  observacoes: string;
}

interface ContribuicoesSummary {
  totalPendente: number;
  totalPago: number;
  totalDispensavel: number;
  custoTotalComplementacao: number;
  qtdPendente: number;
  qtdPago: number;
  qtdDispensavel: number;
}

interface ContribuicoesCalculatorProps {
  personId: string;
}

// ── Status config ────────────────────────────────────────────

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDENTE: {
    label: "Pendente",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  PAGO: {
    label: "Pago",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  DISPENSAVEL: {
    label: "Dispensavel",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

const tipoOptions = [
  { value: "ALL", label: "Todos os tipos" },
  { value: "PMIG-DOM", label: "PMIG-DOM" },
  { value: "LC123", label: "LC123" },
  { value: "COMPLEMENTACAO", label: "Complementacao" },
];

// ── Component ────────────────────────────────────────────────

export function ContribuicoesCalculator({
  personId,
}: ContribuicoesCalculatorProps) {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [contribuicoes, setContribuicoes] = useState<Contribuicao[]>([]);
  const [filteredContribuicoes, setFilteredContribuicoes] = useState<Contribuicao[]>([]);
  const [summary, setSummary] = useState<ContribuicoesSummary>({
    totalPendente: 0,
    totalPago: 0,
    totalDispensavel: 0,
    custoTotalComplementacao: 0,
    qtdPendente: 0,
    qtdPago: 0,
    qtdDispensavel: 0,
  });
  const [filterTipo, setFilterTipo] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const pageSize = 20;

  useEffect(() => {
    loadContribuicoes();
  }, [personId]);

  useEffect(() => {
    applyFilter();
  }, [contribuicoes, filterTipo]);

  async function loadContribuicoes() {
    try {
      setLoading(true);
      const res = await api.get(
        `/previdenciario/contributions?personId=${personId}`
      );
      const data = res.data.data || res.data;
      const list: Contribuicao[] = Array.isArray(data) ? data : [];
      setContribuicoes(list);
      computeSummary(list);
    } catch {
      toast({
        title: "Erro ao carregar contribuicoes",
        description: "Nao foi possivel buscar as contribuicoes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function computeSummary(list: Contribuicao[]) {
    const s: ContribuicoesSummary = {
      totalPendente: 0,
      totalPago: 0,
      totalDispensavel: 0,
      custoTotalComplementacao: 0,
      qtdPendente: 0,
      qtdPago: 0,
      qtdDispensavel: 0,
    };
    for (const c of list) {
      if (c.status === "PENDENTE") {
        s.totalPendente += c.valorAtualizado;
        s.qtdPendente++;
      } else if (c.status === "PAGO") {
        s.totalPago += c.valorAtualizado;
        s.qtdPago++;
      } else if (c.status === "DISPENSAVEL") {
        s.totalDispensavel += c.valorAtualizado;
        s.qtdDispensavel++;
      }
      if (c.tipo === "COMPLEMENTACAO") {
        s.custoTotalComplementacao += c.valorAtualizado;
      }
    }
    setSummary(s);
  }

  function applyFilter() {
    if (filterTipo === "ALL") {
      setFilteredContribuicoes(contribuicoes);
    } else {
      setFilteredContribuicoes(
        contribuicoes.filter((c) => c.tipo === filterTipo)
      );
    }
    setPage(1);
  }

  async function handleUpdateStatus(
    contribId: string,
    newStatus: "PAGO" | "DISPENSAVEL"
  ) {
    try {
      setUpdatingId(contribId);
      await api.patch(`/previdenciario/contributions/${contribId}`, {
        status: newStatus,
      });
      toast({
        title: `Contribuicao marcada como ${
          newStatus === "PAGO" ? "paga" : "dispensavel"
        }`,
      });
      await loadContribuicoes();
    } catch {
      toast({
        title: "Erro ao atualizar contribuicao",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  // ── Paged data ─────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(filteredContribuicoes.length / pageSize));
  const pagedData = filteredContribuicoes.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // ── Totalizador ────────────────────────────────────────────

  const filteredTotalPendente = filteredContribuicoes
    .filter((c) => c.status === "PENDENTE")
    .reduce((sum, c) => sum + c.valorAtualizado, 0);
  const filteredTotalAtualizado = filteredContribuicoes.reduce(
    (sum, c) => sum + c.valorAtualizado,
    0
  );

  // ── Table columns ─────────────────────────────────────────

  const columns = [
    {
      key: "competencia",
      header: "Competencia",
      render: (c: Contribuicao) => (
        <span className="text-sm font-medium">{c.competencia}</span>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      render: (c: Contribuicao) => (
        <Badge variant="outline" className="font-medium">
          {c.tipo}
        </Badge>
      ),
    },
    {
      key: "valorOriginal",
      header: "Valor Original",
      render: (c: Contribuicao) => (
        <span className="text-sm">{formatCurrency(c.valorOriginal)}</span>
      ),
    },
    {
      key: "valorAtualizado",
      header: "Valor Atualizado",
      render: (c: Contribuicao) => (
        <span className="text-sm font-medium">
          {formatCurrency(c.valorAtualizado)}
        </span>
      ),
    },
    {
      key: "salarioMinimoEpoca",
      header: "SM Epoca",
      render: (c: Contribuicao) => (
        <span className="text-sm">
          {formatCurrency(c.salarioMinimoEpoca)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (c: Contribuicao) => {
        const cfg = statusConfig[c.status] || statusConfig.PENDENTE;
        return (
          <Badge variant="outline" className={`font-medium ${cfg.className}`}>
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      key: "acoes",
      header: "Acoes",
      className: "w-[160px]",
      render: (c: Contribuicao) => {
        if (c.status !== "PENDENTE") {
          return (
            <span className="text-xs text-muted-foreground">
              {c.dataPagamento ? formatDate(c.dataPagamento) : "-"}
            </span>
          );
        }
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={updatingId === c.id}
              onClick={(ev) => {
                ev.stopPropagation();
                handleUpdateStatus(c.id, "PAGO");
              }}
              className="text-xs"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Pago
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={updatingId === c.id}
              onClick={(ev) => {
                ev.stopPropagation();
                handleUpdateStatus(c.id, "DISPENSAVEL");
              }}
              className="text-xs"
            >
              <MinusCircle className="h-3 w-3 mr-1" />
              Disp.
            </Button>
          </div>
        );
      },
    },
  ];

  // ── Render ─────────────────────────────────────────────────

  if (loading) return <Loading text="Carregando contribuicoes..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium">Contribuicoes Atrasadas</h3>
        <p className="text-sm text-muted-foreground">
          Calculadora de debitos de contribuicoes previdenciarias
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xl font-bold">
                  {formatCurrency(summary.totalPendente)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.qtdPendente} contribuicoes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-xl font-bold">
                  {formatCurrency(summary.totalPago)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.qtdPago} contribuicoes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Dispensavel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MinusCircle className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xl font-bold">
                  {formatCurrency(summary.totalDispensavel)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.qtdDispensavel} contribuicoes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Custo Total Complementacao
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xl font-bold">
                  {formatCurrency(summary.custoTotalComplementacao)}
                </p>
                <p className="text-xs text-muted-foreground">complementacoes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="w-[250px]">
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              {tipoOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-muted-foreground">
          {filteredContribuicoes.length} contribuicoes
        </span>
      </div>

      {/* Table */}
      {filteredContribuicoes.length === 0 ? (
        <EmptyState
          icon={<Coins className="h-8 w-8 text-slate-400" />}
          title="Nenhuma contribuicao encontrada"
          description="Nao ha contribuicoes registradas para este filtro."
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <DataTable
              columns={columns}
              data={pagedData}
              keyExtractor={(c) => c.id}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              emptyMessage="Nenhuma contribuicao encontrada."
            />
          </CardContent>
        </Card>
      )}

      {/* Totalizador */}
      {filteredContribuicoes.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total atualizado (filtro atual)
                  </p>
                  <p className="text-lg font-bold">
                    {formatCurrency(filteredTotalAtualizado)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Pendente (filtro atual)
                  </p>
                  <p className="text-lg font-bold text-amber-600">
                    {formatCurrency(filteredTotalPendente)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  Registros exibidos
                </p>
                <p className="text-sm font-medium">
                  {filteredContribuicoes.length} de {contribuicoes.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
