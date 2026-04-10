"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { formatDate, formatDateTime } from "@/lib/utils";
import { FileDown, FileText, Download, Loader2 } from "lucide-react";

// ── Interfaces ───────────────────────────────────────────────

interface CalculationOption {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
}

interface ParecerSection {
  key: string;
  label: string;
  checked: boolean;
}

interface ParecerHistorico {
  id: string;
  calculationId: string;
  calculationTitle: string;
  fileName: string;
  generatedAt: string;
  downloadUrl: string;
}

interface GerarParecerProps {
  personId: string;
  personName: string;
}

// ── Default sections ─────────────────────────────────────────

const defaultSections: ParecerSection[] = [
  { key: "qualificacao", label: "Qualificacao do Segurado", checked: true },
  { key: "historico", label: "Historico Contributivo", checked: true },
  { key: "enquadramento", label: "Enquadramento Legal", checked: true },
  { key: "regras", label: "Regras de Aposentadoria", checked: true },
  { key: "contribuicoes", label: "Contribuicoes Pendentes", checked: true },
  { key: "jurisprudencia", label: "Jurisprudencia Aplicavel", checked: true },
  { key: "estrategia", label: "Estrategia Previdenciaria", checked: true },
  { key: "conclusao", label: "Conclusao e Recomendacoes", checked: true },
];

// ── Component ────────────────────────────────────────────────

export function GerarParecer({ personId, personName }: GerarParecerProps) {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [calculations, setCalculations] = useState<CalculationOption[]>([]);
  const [selectedCalculationId, setSelectedCalculationId] = useState("");
  const [sections, setSections] = useState<ParecerSection[]>(defaultSections);
  const [pareceres, setPareceres] = useState<ParecerHistorico[]>([]);

  useEffect(() => {
    loadData();
  }, [personId]);

  async function loadData() {
    try {
      setLoading(true);
      const [calcRes, parecerRes] = await Promise.all([
        api.get(`/previdenciario/calculations?personId=${personId}`),
        api.get(`/previdenciario/pareceres?personId=${personId}`),
      ]);

      const calcData = calcRes.data.data || calcRes.data;
      setCalculations(Array.isArray(calcData) ? calcData : []);

      const parecerData = parecerRes.data.data || parecerRes.data;
      setPareceres(Array.isArray(parecerData) ? parecerData : []);
    } catch {
      toast({
        title: "Erro ao carregar dados",
        description: "Nao foi possivel buscar calculos e pareceres.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function toggleSection(key: string) {
    setSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, checked: !s.checked } : s))
    );
  }

  async function handleGenerate() {
    if (!selectedCalculationId) {
      toast({
        title: "Selecione um calculo",
        description: "Escolha o calculo base para gerar o parecer.",
        variant: "destructive",
      });
      return;
    }

    const selectedSections = sections
      .filter((s) => s.checked)
      .map((s) => s.key);

    if (selectedSections.length === 0) {
      toast({
        title: "Selecione pelo menos uma secao",
        description: "Marque as secoes que deseja incluir no parecer.",
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerating(true);
      const res = await api.post(
        "/previdenciario/parecer",
        {
          personId,
          personName,
          calculationId: selectedCalculationId,
          sections: selectedSections,
        },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `parecer-${personName.replace(/\s+/g, "-").toLowerCase()}.docx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: "Parecer gerado com sucesso" });
      await loadData();
    } catch {
      toast({
        title: "Erro ao gerar parecer",
        description: "Falha ao gerar o documento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownloadParecer(parecer: ParecerHistorico) {
    try {
      const res = await api.get(
        `/previdenciario/pareceres/${parecer.id}/download`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", parecer.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({
        title: "Erro ao baixar parecer",
        variant: "destructive",
      });
    }
  }

  // ── History columns ────────────────────────────────────────

  const historyColumns = [
    {
      key: "fileName",
      header: "Arquivo",
      render: (p: ParecerHistorico) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-500" />
          <span className="text-sm">{p.fileName}</span>
        </div>
      ),
    },
    {
      key: "calculationTitle",
      header: "Calculo Base",
      render: (p: ParecerHistorico) => (
        <span className="text-sm">{p.calculationTitle}</span>
      ),
    },
    {
      key: "generatedAt",
      header: "Gerado em",
      render: (p: ParecerHistorico) => (
        <span className="text-sm">{formatDateTime(p.generatedAt)}</span>
      ),
    },
    {
      key: "acoes",
      header: "Acoes",
      className: "w-[100px]",
      render: (p: ParecerHistorico) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(ev) => {
            ev.stopPropagation();
            handleDownloadParecer(p);
          }}
        >
          <Download className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────

  if (loading) return <Loading text="Carregando dados para parecer..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium">Gerar Parecer Previdenciario</h3>
        <p className="text-sm text-muted-foreground">
          Gere um parecer completo em formato Word (.docx)
        </p>
      </div>

      {/* Generation form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configurar Parecer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calculation selector */}
          <div className="space-y-2">
            <Label htmlFor="parecer-calc">Calculo Base *</Label>
            {calculations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum calculo disponivel. Crie um calculo na aba "Calculos e
                Planejamentos" primeiro.
              </p>
            ) : (
              <Select
                value={selectedCalculationId}
                onValueChange={setSelectedCalculationId}
              >
                <SelectTrigger id="parecer-calc">
                  <SelectValue placeholder="Selecione o calculo base" />
                </SelectTrigger>
                <SelectContent>
                  {calculations.map((calc) => (
                    <SelectItem key={calc.id} value={calc.id}>
                      {calc.title} - {formatDate(calc.createdAt)} ({calc.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Section checkboxes */}
          <div className="space-y-2">
            <Label>Secoes do Parecer</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sections.map((section) => (
                <label
                  key={section.key}
                  className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={section.checked}
                    onChange={() => toggleSection(section.key)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{section.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <div className="flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={generating || calculations.length === 0}
              className="min-w-[200px]"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  Gerar Parecer (.docx)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Previous pareceres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pareceres Gerados</CardTitle>
        </CardHeader>
        <CardContent>
          {pareceres.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8 text-slate-400" />}
              title="Nenhum parecer gerado"
              description="Gere o primeiro parecer previdenciario acima."
            />
          ) : (
            <DataTable
              columns={historyColumns}
              data={pareceres}
              keyExtractor={(p) => p.id}
              emptyMessage="Nenhum parecer gerado."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
