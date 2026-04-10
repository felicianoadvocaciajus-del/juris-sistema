"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { Loading } from "@/components/loading";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Trash2,
} from "lucide-react";

// ── Interfaces ───────────────────────────────────────────────

interface CnisVinculo {
  id: string;
  sequencia: number;
  nit: string;
  empregador: string;
  tipoVinculo: string;
  dataInicio: string;
  dataFim: string | null;
  ultimaRemuneracao: number | null;
  indicadores: string[];
  observacoes: string;
}

interface CnisSummary {
  totalTempoContribuicao: {
    anos: number;
    meses: number;
    dias: number;
  };
  carenciaMeses: number;
  concomitanciasDetectadas: number;
}

interface CnisExtract {
  id: string;
  personId: string;
  dataUpload: string;
  fileName: string;
  vinculos: CnisVinculo[];
  summary: CnisSummary;
}

interface CnisAnalyzerProps {
  personId: string;
  personCpf?: string;
}

// ── Helpers ──────────────────────────────────────────────────

const indicadorConfig: Record<string, { label: string; className: string }> = {
  "PMIG-DOM": {
    label: "PMIG-DOM",
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  LC123: {
    label: "LC123",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  FACULTCONC: {
    label: "FACULTCONC",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  CLEAN: {
    label: "Regular",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
};

function IndicadorBadge({ indicador }: { indicador: string }) {
  const config = indicadorConfig[indicador] || indicadorConfig["CLEAN"];
  return (
    <Badge variant="outline" className={`font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
}

// ── Component ────────────────────────────────────────────────

export function CnisAnalyzer({ personId, personCpf }: CnisAnalyzerProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [extracts, setExtracts] = useState<CnisExtract[]>([]);
  const [selectedExtract, setSelectedExtract] = useState<CnisExtract | null>(null);

  useEffect(() => {
    loadExtracts();
  }, [personId]);

  async function loadExtracts() {
    try {
      setLoading(true);
      const res = await api.get(`/previdenciario/cnis?personId=${personId}`);
      const data = res.data.data || res.data;
      setExtracts(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        setSelectedExtract(data[0]);
      }
    } catch {
      toast({
        title: "Erro ao carregar extratos CNIS",
        description: "Nao foi possivel buscar os extratos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("personId", personId);
    if (personCpf) {
      formData.append("cpf", personCpf);
    }

    try {
      setUploading(true);
      const res = await api.post("/previdenciario/cnis", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newExtract = res.data.data || res.data;
      toast({
        title: "CNIS enviado com sucesso",
        description: `${newExtract.vinculos?.length || 0} vinculos extraidos.`,
      });
      await loadExtracts();
    } catch {
      toast({
        title: "Erro ao enviar CNIS",
        description: "Falha ao processar o extrato. Verifique o arquivo e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleDeleteExtract(extractId: string) {
    try {
      await api.delete(`/previdenciario/cnis/${extractId}`);
      toast({ title: "Extrato removido com sucesso" });
      await loadExtracts();
    } catch {
      toast({
        title: "Erro ao remover extrato",
        variant: "destructive",
      });
    }
  }

  // ── Vinculo table columns ──────────────────────────────────

  const vinculoColumns = [
    {
      key: "sequencia",
      header: "Seq",
      className: "w-[50px]",
      render: (v: CnisVinculo) => (
        <span className="text-muted-foreground text-xs">{v.sequencia}</span>
      ),
    },
    {
      key: "empregador",
      header: "Empregador",
      render: (v: CnisVinculo) => (
        <div>
          <p className="font-medium text-sm">{v.empregador}</p>
          <p className="text-xs text-muted-foreground">{v.nit}</p>
        </div>
      ),
    },
    {
      key: "tipoVinculo",
      header: "Tipo",
      render: (v: CnisVinculo) => (
        <span className="text-sm">{v.tipoVinculo}</span>
      ),
    },
    {
      key: "periodo",
      header: "Periodo",
      render: (v: CnisVinculo) => (
        <span className="text-sm">
          {formatDate(v.dataInicio)} - {v.dataFim ? formatDate(v.dataFim) : "Atual"}
        </span>
      ),
    },
    {
      key: "indicadores",
      header: "Indicadores",
      render: (v: CnisVinculo) => (
        <div className="flex flex-wrap gap-1">
          {v.indicadores.length === 0 ? (
            <IndicadorBadge indicador="CLEAN" />
          ) : (
            v.indicadores.map((ind, i) => (
              <IndicadorBadge key={i} indicador={ind} />
            ))
          )}
        </div>
      ),
    },
    {
      key: "observacoes",
      header: "Obs",
      render: (v: CnisVinculo) =>
        v.observacoes ? (
          <span className="text-xs text-muted-foreground max-w-[200px] truncate block">
            {v.observacoes}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        ),
    },
  ];

  // ── Extract history columns ────────────────────────────────

  const extractColumns = [
    {
      key: "fileName",
      header: "Arquivo",
      render: (e: CnisExtract) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{e.fileName}</span>
        </div>
      ),
    },
    {
      key: "dataUpload",
      header: "Data Upload",
      render: (e: CnisExtract) => (
        <span className="text-sm">{formatDate(e.dataUpload)}</span>
      ),
    },
    {
      key: "totalVinculos",
      header: "Vinculos",
      render: (e: CnisExtract) => (
        <span className="text-sm">{e.vinculos?.length || 0}</span>
      ),
    },
    {
      key: "acoes",
      header: "Acoes",
      className: "w-[120px]",
      render: (e: CnisExtract) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(ev) => {
              ev.stopPropagation();
              setSelectedExtract(e);
            }}
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(ev) => {
              ev.stopPropagation();
              handleDeleteExtract(e.id);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────

  if (loading) return <Loading text="Carregando extratos CNIS..." />;

  return (
    <div className="space-y-6">
      {/* Upload */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Extrato CNIS</h3>
          <p className="text-sm text-muted-foreground">
            Envie o PDF do extrato CNIS para analise automatica
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            className="hidden"
            id="cnis-upload"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Processando..." : "Enviar PDF do CNIS"}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      {selectedExtract && selectedExtract.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tempo Contribuicao
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">
                  {selectedExtract.summary.totalTempoContribuicao.anos}a{" "}
                  {selectedExtract.summary.totalTempoContribuicao.meses}m{" "}
                  {selectedExtract.summary.totalTempoContribuicao.dias}d
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Carencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-2xl font-bold">
                  {selectedExtract.summary.carenciaMeses} meses
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Concomitancias Detectadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className={`h-5 w-5 ${
                    selectedExtract.summary.concomitanciasDetectadas > 0
                      ? "text-orange-500"
                      : "text-emerald-500"
                  }`}
                />
                <span className="text-2xl font-bold">
                  {selectedExtract.summary.concomitanciasDetectadas}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vinculos table */}
      {selectedExtract ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Vinculos Extraidos - {selectedExtract.fileName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={vinculoColumns}
              data={selectedExtract.vinculos || []}
              keyExtractor={(v) => v.id}
              emptyMessage="Nenhum vinculo encontrado neste extrato."
            />
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={<FileText className="h-8 w-8 text-slate-400" />}
          title="Nenhum extrato CNIS"
          description="Envie o PDF do extrato CNIS para iniciar a analise previdenciaria."
          action={
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Enviar PDF
            </Button>
          }
        />
      )}

      {/* Previous extracts */}
      {extracts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Extratos Anteriores</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={extractColumns}
              data={extracts}
              keyExtractor={(e) => e.id}
              onRowClick={(e) => setSelectedExtract(e)}
              emptyMessage="Nenhum extrato anterior."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
