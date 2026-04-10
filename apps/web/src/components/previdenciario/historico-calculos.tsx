"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTable } from "@/components/data-table";
import { Loading } from "@/components/loading";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  Plus,
  Eye,
  Pencil,
  FileDown,
  Trash2,
  Calculator,
  CalendarDays,
} from "lucide-react";

// ── Interfaces ───────────────────────────────────────────────

interface RegraAposentadoria {
  nome: string;
  descricao: string;
  idadeMinima: number | null;
  tempoContribuicaoMinimo: number | null;
  carenciaMinima: number | null;
  pontuacaoMinima: number | null;
  elegivel: boolean;
  dataElegibilidade: string | null;
  observacoes: string;
}

interface Calculation {
  id: string;
  personId: string;
  title: string;
  type: string;
  date: string;
  status: "RASCUNHO" | "FINALIZADO" | "ARQUIVADO";
  eligibilityDate: string | null;
  rmi: number | null;
  notes: string;
  regras: RegraAposentadoria[];
  createdAt: string;
  updatedAt: string;
}

interface NewCalculationForm {
  title: string;
  type: string;
  notes: string;
}

interface HistoricoCalculosProps {
  personId: string;
}

// ── Status config ────────────────────────────────────────────

const statusConfig: Record<string, { label: string; className: string }> = {
  RASCUNHO: {
    label: "Rascunho",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  FINALIZADO: {
    label: "Finalizado",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  ARQUIVADO: {
    label: "Arquivado",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

const calculationTypes = [
  { value: "APOSENTADORIA_IDADE", label: "Aposentadoria por Idade" },
  { value: "APOSENTADORIA_TEMPO", label: "Aposentadoria por Tempo de Contribuicao" },
  { value: "APOSENTADORIA_ESPECIAL", label: "Aposentadoria Especial" },
  { value: "REGRA_TRANSICAO_PONTOS", label: "Regra de Transicao - Pontos" },
  { value: "REGRA_TRANSICAO_PEDAGIO_50", label: "Regra de Transicao - Pedagio 50%" },
  { value: "REGRA_TRANSICAO_PEDAGIO_100", label: "Regra de Transicao - Pedagio 100%" },
  { value: "REGRA_TRANSICAO_IDADE", label: "Regra de Transicao - Idade Minima" },
  { value: "PLANEJAMENTO", label: "Planejamento Previdenciario" },
  { value: "REVISAO", label: "Revisao de Beneficio" },
];

// ── Component ────────────────────────────────────────────────

export function HistoricoCalculos({ personId }: HistoricoCalculosProps) {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCalc, setSelectedCalc] = useState<Calculation | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingDoc, setGeneratingDoc] = useState<string | null>(null);
  const [form, setForm] = useState<NewCalculationForm>({
    title: "",
    type: "",
    notes: "",
  });

  useEffect(() => {
    loadCalculations();
  }, [personId]);

  async function loadCalculations() {
    try {
      setLoading(true);
      const res = await api.get(`/previdenciario/calculations?personId=${personId}`);
      const data = res.data.data || res.data;
      setCalculations(Array.isArray(data) ? data : []);
    } catch {
      toast({
        title: "Erro ao carregar calculos",
        description: "Nao foi possivel buscar o historico de calculos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCalculation() {
    if (!form.title || !form.type) {
      toast({
        title: "Preencha os campos obrigatorios",
        description: "Titulo e tipo sao obrigatorios.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      await api.post("/previdenciario/calculations", {
        personId,
        title: form.title,
        type: form.type,
        notes: form.notes,
      });
      toast({ title: "Calculo criado com sucesso" });
      setDialogOpen(false);
      setForm({ title: "", type: "", notes: "" });
      await loadCalculations();
    } catch {
      toast({
        title: "Erro ao criar calculo",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCalculation(calcId: string) {
    try {
      await api.delete(`/previdenciario/calculations/${calcId}`);
      toast({ title: "Calculo removido com sucesso" });
      await loadCalculations();
    } catch {
      toast({
        title: "Erro ao remover calculo",
        variant: "destructive",
      });
    }
  }

  async function handleGenerateParecer(calcId: string) {
    try {
      setGeneratingDoc(calcId);
      const res = await api.post(
        `/previdenciario/calculations/${calcId}/parecer`,
        {},
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `parecer-${calcId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Parecer gerado com sucesso" });
    } catch {
      toast({
        title: "Erro ao gerar parecer",
        variant: "destructive",
      });
    } finally {
      setGeneratingDoc(null);
    }
  }

  function handleViewDetails(calc: Calculation) {
    setSelectedCalc(calc);
    setDetailDialogOpen(true);
  }

  function getTypeLabel(type: string): string {
    return calculationTypes.find((t) => t.value === type)?.label || type;
  }

  // ── Table columns ─────────────────────────────────────────

  const columns = [
    {
      key: "title",
      header: "Titulo",
      render: (c: Calculation) => (
        <div>
          <p className="font-medium text-sm">{c.title}</p>
          <p className="text-xs text-muted-foreground">{getTypeLabel(c.type)}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      render: (c: Calculation) => (
        <span className="text-sm">{getTypeLabel(c.type)}</span>
      ),
    },
    {
      key: "date",
      header: "Data",
      render: (c: Calculation) => (
        <span className="text-sm">{formatDate(c.createdAt || c.date)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (c: Calculation) => {
        const cfg = statusConfig[c.status] || statusConfig.RASCUNHO;
        return (
          <Badge variant="outline" className={`font-medium ${cfg.className}`}>
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      key: "eligibilityDate",
      header: "Data Elegibilidade",
      render: (c: Calculation) => (
        <span className="text-sm">
          {c.eligibilityDate ? formatDate(c.eligibilityDate) : "-"}
        </span>
      ),
    },
    {
      key: "rmi",
      header: "RMI",
      render: (c: Calculation) => (
        <span className="text-sm font-medium">
          {c.rmi != null ? formatCurrency(c.rmi) : "-"}
        </span>
      ),
    },
    {
      key: "acoes",
      header: "Acoes",
      className: "w-[180px]",
      render: (c: Calculation) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            title="Visualizar"
            onClick={(ev) => {
              ev.stopPropagation();
              handleViewDetails(c);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Editar"
            onClick={(ev) => {
              ev.stopPropagation();
              window.location.href = `/previdenciario/calculo/${c.id}`;
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Gerar Parecer Word"
            disabled={generatingDoc === c.id}
            onClick={(ev) => {
              ev.stopPropagation();
              handleGenerateParecer(c.id);
            }}
          >
            <FileDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Excluir"
            onClick={(ev) => {
              ev.stopPropagation();
              handleDeleteCalculation(c.id);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────

  if (loading) return <Loading text="Carregando calculos..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Calculos e Planejamentos</h3>
          <p className="text-sm text-muted-foreground">
            Historico de calculos previdenciarios
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Calculo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Calculo Previdenciario</DialogTitle>
              <DialogDescription>
                Crie um novo calculo. Calculos anteriores serao mantidos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="calc-title">Titulo *</Label>
                <Input
                  id="calc-title"
                  placeholder="Ex: Aposentadoria por idade - Simulacao 1"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calc-type">Tipo *</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger id="calc-type">
                    <SelectValue placeholder="Selecione o tipo de calculo" />
                  </SelectTrigger>
                  <SelectContent>
                    {calculationTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="calc-notes">Observacoes</Label>
                <Textarea
                  id="calc-notes"
                  placeholder="Observacoes adicionais..."
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCalculation} disabled={saving}>
                {saving ? "Criando..." : "Criar Calculo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      {calculations.length === 0 ? (
        <EmptyState
          icon={<Calculator className="h-8 w-8 text-slate-400" />}
          title="Nenhum calculo encontrado"
          description="Crie um novo calculo previdenciario para comecar."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Calculo
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <DataTable
              columns={columns}
              data={calculations}
              keyExtractor={(c) => c.id}
              emptyMessage="Nenhum calculo encontrado."
            />
          </CardContent>
        </Card>
      )}

      {/* Detail dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCalc?.title}</DialogTitle>
            <DialogDescription>
              {selectedCalc ? getTypeLabel(selectedCalc.type) : ""} -{" "}
              {selectedCalc?.createdAt ? formatDate(selectedCalc.createdAt) : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedCalc && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    variant="outline"
                    className={`font-medium mt-1 ${
                      statusConfig[selectedCalc.status]?.className || ""
                    }`}
                  >
                    {statusConfig[selectedCalc.status]?.label || selectedCalc.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data Elegibilidade</p>
                  <p className="text-sm font-medium mt-1">
                    {selectedCalc.eligibilityDate
                      ? formatDate(selectedCalc.eligibilityDate)
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">RMI</p>
                  <p className="text-sm font-medium mt-1">
                    {selectedCalc.rmi != null ? formatCurrency(selectedCalc.rmi) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Criado em</p>
                  <p className="text-sm font-medium mt-1">
                    {formatDate(selectedCalc.createdAt)}
                  </p>
                </div>
              </div>

              {selectedCalc.notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Observacoes</p>
                  <p className="text-sm bg-slate-50 p-3 rounded-md">
                    {selectedCalc.notes}
                  </p>
                </div>
              )}

              {/* Regras table */}
              {selectedCalc.regras && selectedCalc.regras.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Regras de Aposentadoria</p>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Regra</TableHead>
                          <TableHead>Idade Min.</TableHead>
                          <TableHead>TC Min.</TableHead>
                          <TableHead>Carencia</TableHead>
                          <TableHead>Pontos</TableHead>
                          <TableHead>Elegivel</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCalc.regras.map((regra, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{regra.nome}</p>
                                <p className="text-xs text-muted-foreground">
                                  {regra.descricao}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {regra.idadeMinima != null ? `${regra.idadeMinima} anos` : "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {regra.tempoContribuicaoMinimo != null
                                ? `${regra.tempoContribuicaoMinimo} anos`
                                : "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {regra.carenciaMinima != null
                                ? `${regra.carenciaMinima} meses`
                                : "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {regra.pontuacaoMinima != null
                                ? regra.pontuacaoMinima
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  regra.elegivel
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    : "bg-red-100 text-red-800 border-red-200"
                                }
                              >
                                {regra.elegivel ? "Sim" : "Nao"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {regra.dataElegibilidade
                                ? formatDate(regra.dataElegibilidade)
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
