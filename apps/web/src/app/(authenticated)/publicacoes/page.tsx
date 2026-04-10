"use client";

import { useEffect, useState, useCallback } from "react";
import { getPublications, getDeadlines } from "@/lib/data-provider";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/loading";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import {
  BookOpen,
  Upload,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Loader2,
  Eye,
} from "lucide-react";

interface Publication {
  id: string;
  status: string;
  source?: string;
  processNumber?: string;
  court?: string;
  actType?: string;
  relevantText?: string;
  publishedAt?: string;
  keywords?: string[];
  matter?: { title: string };
  person?: { name: string };
  rawContent?: string;
  mentionedDeadline?: string;
  parties?: string;
  // Legacy fields
  content?: string;
  parsedInfo?: {
    processNumber?: string;
    parties?: string;
    court?: string;
    summary?: string;
  };
  case?: { id: string; title: string };
  createdAt?: string;
}

interface Deadline {
  id: string;
  description: string;
  status: string;
  procedureType?: string;
  dayCountType?: string;
  dayCount?: number;
  startDate?: string;
  suggestedEndDate?: string;
  confirmedEndDate?: string | null;
  legalBasis?: string;
  matter?: { title: string };
  person?: { name: string };
  publication?: { processNumber?: string };
  // Legacy fields
  dueDate?: string;
  suggestedDate?: string;
  case?: { id: string; title: string };
}

export default function PublicacoesPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("novas");
  const [publications, setPublications] = useState<Publication[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [selectedDeadline, setSelectedDeadline] = useState<string | null>(null);
  const [deadlineNote, setDeadlineNote] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "novas" || tab === "em_analise") {
        const res = await getPublications();
        const allPubs: Publication[] = res.data || [];
        const status = tab === "novas" ? "NOVA" : "EM_ANALISE";
        setPublications(allPubs.filter((p) => p.status === status));
      } else {
        const res = await getDeadlines();
        const allDeadlines: Deadline[] = res.data || [];
        const now = new Date();
        const today = now.toISOString().split("T")[0];

        // Calculate end of week (Sunday)
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
        const endOfWeekStr = endOfWeek.toISOString().split("T")[0];

        const getDueDate = (d: any) => {
          const raw = d.confirmedEndDate || d.suggestedEndDate || d.dueDate || "";
          return String(raw).split("T")[0];
        };

        if (tab === "prazos_hoje") {
          setDeadlines(allDeadlines.filter((d) => getDueDate(d) === today));
        } else if (tab === "prazos_semana") {
          setDeadlines(allDeadlines.filter((d) => {
            const due = getDueDate(d);
            return due >= today && due <= endOfWeekStr;
          }));
        } else if (tab === "vencidos") {
          setDeadlines(allDeadlines.filter((d) => {
            const due = getDueDate(d);
            return (due < today || d.status === "PERDIDO") && d.status !== "CUMPRIDO";
          }));
        } else if (tab === "cumpridos") {
          setDeadlines(allDeadlines.filter((d) => d.status === "CUMPRIDO"));
        } else {
          setDeadlines(allDeadlines);
        }
      }
    } catch {
      setPublications([]);
      setDeadlines([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleImport = async () => {
    if (!importText.trim() && !importFile) return;
    setImporting(true);
    try {
      let textToImport = importText;

      // Se tem PDF, extrair texto primeiro
      if (importFile) {
        const formData = new FormData();
        formData.append("file", importFile);
        toast({ title: "Extraindo texto do PDF... pode demorar" });
        const extractRes = await api.post("/publications/extract-pdf", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000,
        });
        textToImport = extractRes.data?.text || "";
        if (extractRes.data?.error) {
          toast({ title: extractRes.data.error, variant: "destructive" });
          if (!textToImport && importText) textToImport = importText;
        }
      }

      if (!textToImport.trim()) {
        toast({ title: "Nenhum texto extraido. Cole o texto manualmente.", variant: "destructive" });
        return;
      }

      // Dividir em publicações individuais se texto grande
      const publicacoes = textToImport.split(/PUBLICAÇÃO:\s*\d+\s*de\s*\d+/i).filter((p: string) => p.trim().length > 50);

      if (publicacoes.length > 1) {
        toast({ title: `Importando ${publicacoes.length} publicacoes...` });
        let ok = 0;
        for (const pub of publicacoes) {
          try {
            await api.post("/publications/import", { rawContent: pub.trim().substring(0, 10000) });
            ok++;
          } catch {}
        }
        toast({ title: `${ok} de ${publicacoes.length} publicacoes importadas!` });
      } else {
        await api.post("/publications/import", { rawContent: textToImport.substring(0, 50000) });
        toast({ title: "Publicacao importada!" });
      }

      setImportOpen(false);
      setImportText("");
      setImportFile(null);
      fetchData();
    } catch (err: any) {
      toast({
        title: "Erro ao importar publicacao",
        description: err?.response?.data?.message || err?.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const confirmDeadline = async (deadlineId: string) => {
    try {
      // Buscar o prazo para pegar a data sugerida
      const deadlineData = deadlines.find((d: any) => d.id === deadlineId);
      const confirmedDate = deadlineData?.suggestedEndDate || deadlineData?.suggestedDate || new Date().toISOString();
      await api.patch(`/deadlines/${deadlineId}/confirm`, { confirmedEndDate: confirmedDate });
      toast({ title: "Prazo confirmado!" });
      fetchData();
    } catch (err: any) {
      console.error('Erro ao confirmar prazo:', err?.response?.data);
      toast({ title: "Erro ao confirmar prazo", description: err?.response?.data?.message || "", variant: "destructive" });
    }
  };

  const markAsAnalyzed = async (pubId: string) => {
    try {
      await api.patch(`/publications/${pubId}/process`, { status: "PROCESSADA" });
      toast({ title: "Publicacao marcada como analisada!" });
      fetchData();
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const markDeadlineCompleted = async (deadlineId: string) => {
    try {
      await api.patch(`/deadlines/${deadlineId}/complete`);
      if (deadlineNote.trim()) {
        await api.patch(`/deadlines/${deadlineId}`, { calculationNotes: deadlineNote });
      }
      toast({ title: "Prazo marcado como cumprido!" });
      setSelectedDeadline(null);
      setDeadlineNote("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Erro ao atualizar prazo", description: err?.response?.data?.message || "", variant: "destructive" });
    }
  };

  const markDeadlineLost = async (deadlineId: string) => {
    try {
      await api.patch(`/deadlines/${deadlineId}/lost`);
      toast({ title: "Prazo marcado como perdido" });
      setSelectedDeadline(null);
      fetchData();
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const isPublicationTab = tab === "novas" || tab === "em_analise";
  const isDeadlineTab = !isPublicationTab;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Publicacoes e Prazos
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe publicacoes do diario e prazos processuais
          </p>
        </div>
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Importar Publicacao
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Importar Publicacao</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-bold">Opcao 1: Upload de PDF</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="text-sm"
                  />
                  {importFile && (
                    <p className="mt-2 text-sm text-green-600 font-medium">
                      Arquivo: {importFile.name} ({(importFile.size / 1024).toFixed(0)} KB)
                    </p>
                  )}
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">ou</span></div>
              </div>
              <div className="space-y-2">
                <Label>Opcao 2: Colar texto</Label>
                <Textarea
                  rows={8}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Cole o texto da publicacao do diario oficial aqui..."
                />
              </div>
              <p className="text-xs text-muted-foreground">
                O sistema extrai automaticamente numero do processo, partes, tribunal e prazos.
                PDFs de ate 50MB sao aceitos.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setImportOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Importar e Processar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="novas">
            <BookOpen className="mr-1 h-4 w-4" />
            Novas
          </TabsTrigger>
          <TabsTrigger value="em_analise">
            <Eye className="mr-1 h-4 w-4" />
            Em Analise
          </TabsTrigger>
          <TabsTrigger value="prazos_hoje">
            <Clock className="mr-1 h-4 w-4" />
            Prazos Hoje
          </TabsTrigger>
          <TabsTrigger value="prazos_semana">
            <Calendar className="mr-1 h-4 w-4" />
            Prazos Semana
          </TabsTrigger>
          <TabsTrigger value="vencidos">
            <AlertTriangle className="mr-1 h-4 w-4" />
            Vencidos
          </TabsTrigger>
          <TabsTrigger value="cumpridos">
            <CheckCircle className="mr-1 h-4 w-4" />
            Cumpridos
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="mt-4">
            <Loading />
          </div>
        ) : isPublicationTab ? (
          <div className="mt-4 space-y-4">
            {publications.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <EmptyState
                    title={
                      tab === "novas"
                        ? "Nenhuma publicacao nova"
                        : "Nenhuma publicacao em analise"
                    }
                    icon={<BookOpen className="h-8 w-8 text-slate-400" />}
                  />
                </CardContent>
              </Card>
            ) : (
              publications.map((pub) => (
                <Card key={pub.id}>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {(pub.processNumber || pub.parsedInfo?.processNumber) && (
                          <p className="text-sm font-medium">
                            Processo: {pub.processNumber || pub.parsedInfo?.processNumber}
                          </p>
                        )}
                        {(pub.court || pub.parsedInfo?.court) && (
                          <p className="text-xs text-muted-foreground">
                            {pub.court || pub.parsedInfo?.court}
                          </p>
                        )}
                        {pub.actType && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {pub.actType}
                          </Badge>
                        )}
                        {pub.person && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {pub.person.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={pub.status} />
                        {pub.source && (
                          <Badge variant="secondary" className="text-xs">
                            {pub.source}
                          </Badge>
                        )}
                        {pub.publishedAt && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(pub.publishedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {pub.relevantText && (
                      <p className="text-sm bg-slate-50 p-3 rounded">
                        {pub.relevantText}
                      </p>
                    )}

                    {!pub.relevantText && (pub.content || pub.rawContent) && (
                      <p className="text-xs text-muted-foreground line-clamp-4">
                        {pub.content || pub.rawContent?.substring(0, 500)}
                      </p>
                    )}

                    {pub.matter && (
                      <Badge variant="outline">
                        Caso: {pub.matter.title}
                      </Badge>
                    )}

                    {pub.mentionedDeadline && (
                      <div className="bg-red-50 border border-red-200 rounded p-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        <span className="text-sm font-bold text-red-700">
                          PRAZO: {pub.mentionedDeadline}
                        </span>
                      </div>
                    )}

                    {pub.keywords && pub.keywords.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {pub.keywords.map((kw) => (
                          <Badge key={kw} variant="secondary" className="text-xs">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsAnalyzed(pub.id)}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Marcar como Analisada
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {deadlines.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <EmptyState
                    title="Nenhum prazo encontrado"
                    icon={<Clock className="h-8 w-8 text-slate-400" />}
                  />
                </CardContent>
              </Card>
            ) : (
              deadlines.map((deadline) => (
                <Card
                  key={deadline.id}
                  className={`cursor-pointer transition-all ${
                    tab === "vencidos" ? "border-red-200 bg-red-50/50" : ""
                  } ${selectedDeadline === deadline.id ? "ring-2 ring-blue-500" : "hover:shadow-md"}`}
                  onClick={() => setSelectedDeadline(selectedDeadline === deadline.id ? null : deadline.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          {deadline.description}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="h-3 w-3" />
                            <span className="font-bold text-red-600">
                              Vencimento:{" "}
                              {formatDate(
                                deadline.confirmedEndDate ||
                                  deadline.suggestedEndDate ||
                                  deadline.dueDate ||
                                  ""
                              )}
                            </span>
                          </div>
                          {deadline.dayCount && (
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                              {deadline.dayCount} dias {deadline.dayCountType === "UTEIS" ? "úteis" : "corridos"}
                            </span>
                          )}
                        </div>
                        {deadline.legalBasis && (
                          <p className="text-xs text-muted-foreground">
                            Base legal: {deadline.legalBasis}
                          </p>
                        )}
                        {deadline.matter && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {deadline.matter.title}
                          </Badge>
                        )}
                        {deadline.publication?.processNumber && (
                          <p className="text-xs text-muted-foreground">
                            Processo: {deadline.publication.processNumber}
                          </p>
                        )}
                        {deadline.calculationNotes && (
                          <p className="text-xs text-blue-600 italic mt-1">
                            Obs: {deadline.calculationNotes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={deadline.status} />
                      </div>
                    </div>

                    {/* Painel expandido ao clicar */}
                    {selectedDeadline === deadline.id && (
                      <div className="mt-4 pt-4 border-t space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-muted-foreground">Tipo:</span> {deadline.procedureType || "CPC"}</div>
                          <div><span className="text-muted-foreground">Contagem:</span> {deadline.dayCountType === "UTEIS" ? "Dias úteis" : "Dias corridos"}</div>
                          <div><span className="text-muted-foreground">Início:</span> {formatDate(deadline.startDate || "")}</div>
                          <div><span className="text-muted-foreground">Prazo Fatal:</span> <span className="font-bold text-red-600">{formatDate(deadline.suggestedEndDate || "")}</span></div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Observações / O que foi feito:</label>
                          <Textarea
                            rows={2}
                            value={deadlineNote}
                            onChange={(e) => setDeadlineNote(e.target.value)}
                            placeholder="Ex: Petição protocolada em 10/04/2026, protocolo nº 12345..."
                            className="mt-1 text-sm"
                          />
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {deadline.status !== "CUMPRIDO" && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => markDeadlineCompleted(deadline.id)}>
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Marcar Cumprido
                            </Button>
                          )}
                          {deadline.status === "SUGERIDO" && (
                            <Button size="sm" variant="outline" onClick={() => confirmDeadline(deadline.id)}>
                              Confirmar Prazo
                            </Button>
                          )}
                          {deadline.status !== "PERDIDO" && deadline.status !== "CUMPRIDO" && (
                            <Button size="sm" variant="destructive" onClick={() => markDeadlineLost(deadline.id)}>
                              Marcar Perdido
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </Tabs>
    </div>
  );
}
