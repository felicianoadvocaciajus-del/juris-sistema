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

        if (tab === "prazos_hoje") {
          setDeadlines(
            allDeadlines.filter((d) => {
              const due = (d.confirmedEndDate || d.suggestedEndDate || d.dueDate || "").split("T")[0];
              return due === today;
            })
          );
        } else if (tab === "prazos_semana") {
          setDeadlines(
            allDeadlines.filter((d) => {
              const due = (d.confirmedEndDate || d.suggestedEndDate || d.dueDate || "").split("T")[0];
              return due >= today && due <= endOfWeekStr;
            })
          );
        } else if (tab === "vencidos") {
          setDeadlines(
            allDeadlines.filter((d) => {
              const due = (d.confirmedEndDate || d.suggestedEndDate || d.dueDate || "").split("T")[0];
              return due < today && d.status !== "CONFIRMADO";
            })
          );
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
    if (!importText.trim()) return;
    setImporting(true);
    try {
      await api.post("/publications/import", { text: importText });
      toast({ title: "Publicacao importada e processada!" });
      setImportOpen(false);
      setImportText("");
      fetchData();
    } catch {
      toast({
        title: "Erro ao importar publicacao",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const confirmDeadline = async (deadlineId: string) => {
    try {
      await api.patch(`/deadlines/${deadlineId}`, { status: "CONFIRMADO" });
      toast({ title: "Prazo confirmado!" });
      fetchData();
    } catch {
      toast({ title: "Erro ao confirmar prazo", variant: "destructive" });
    }
  };

  const markAsAnalyzed = async (pubId: string) => {
    try {
      await api.patch(`/publications/${pubId}`, { status: "ANALISADA" });
      toast({ title: "Publicacao marcada como analisada!" });
      fetchData();
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const isPublicationTab = tab === "novas" || tab === "em_analise";

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
                <Label>Texto da publicacao</Label>
                <Textarea
                  rows={10}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Cole o texto da publicacao do diario oficial aqui..."
                />
              </div>
              <p className="text-xs text-muted-foreground">
                O sistema ira extrair automaticamente numero do processo,
                partes, tribunal e prazos.
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

                    {!pub.relevantText && pub.content && (
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {pub.content}
                      </p>
                    )}

                    {pub.matter && (
                      <Badge variant="outline">
                        Caso: {pub.matter.title}
                      </Badge>
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
                  className={
                    tab === "vencidos" ? "border-red-200 bg-red-50/50" : ""
                  }
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
                            Vencimento:{" "}
                            {formatDate(
                              deadline.confirmedEndDate ||
                                deadline.suggestedEndDate ||
                                deadline.dueDate ||
                                ""
                            )}
                          </div>
                          {deadline.suggestedEndDate && !deadline.confirmedEndDate && (
                            <span className="text-xs text-muted-foreground">
                              Sugerido: {formatDate(deadline.suggestedEndDate)}
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
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={deadline.status} />
                        {deadline.status === "SUGERIDO" && (
                          <Button
                            size="sm"
                            onClick={() => confirmDeadline(deadline.id)}
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Confirmar
                          </Button>
                        )}
                      </div>
                    </div>
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
