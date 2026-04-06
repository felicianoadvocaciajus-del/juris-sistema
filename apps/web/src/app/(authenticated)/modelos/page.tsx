"use client";

import { useEffect, useState } from "react";
import { getTemplates, getClients } from "@/lib/data-provider";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/loading";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/ui/use-toast";
import {
  FileCode,
  FileText,
  Download,
  Eye,
  Plus,
  Loader2,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  description?: string;
  category?: string;
  isActive?: boolean;
  // Legacy fields
  area?: string;
  fields?: string[];
  createdAt?: string;
}

interface Client {
  id: string;
  name: string;
}

export default function ModelosPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [selectedClientId, setSelectedClientId] = useState("");
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getTemplates(), getClients()])
      .then(([templatesRes, clientsRes]) => {
        setTemplates(templatesRes.data || []);
        setClients(
          (clientsRes.data || []).map((c: any) => ({
            id: c.id,
            name: c.name,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openGenerate = (template: Template) => {
    setSelectedTemplate(template);
    setSelectedClientId("");
    setExtraFields({});
    setPreviewUrl(null);
    setGenerateOpen(true);
  };

  const handleGenerate = async () => {
    if (!selectedTemplate || !selectedClientId) return;
    setGenerating(true);
    try {
      const res = await api.post("/documents/generate", {
        templateId: selectedTemplate.id,
        clientId: selectedClientId,
        fields: extraFields,
      });
      if (res.data.previewUrl) {
        setPreviewUrl(res.data.previewUrl);
      }
      if (res.data.downloadUrl) {
        window.open(res.data.downloadUrl, "_blank");
      }
      toast({ title: "Documento gerado com sucesso!" });
    } catch {
      toast({
        title: "Erro ao gerar documento",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  // Category label helper
  const getCategoryLabel = (cat?: string) => {
    const labels: Record<string, string> = {
      procuracao: "Procuracao",
      declaracao: "Declaracao",
      contrato: "Contrato",
      peticao: "Peticao",
      recurso: "Recurso",
      outros: "Outros",
    };
    return cat ? labels[cat] || cat : null;
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Modelos de Documentos
        </h1>
        <p className="text-sm text-muted-foreground">
          Gere documentos a partir de modelos pre-definidos
        </p>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              title="Nenhum modelo cadastrado"
              description="Modelos de documentos serao exibidos aqui."
              icon={<FileCode className="h-8 w-8 text-slate-400" />}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    <FileCode className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {template.name}
                    </CardTitle>
                    {template.description && (
                      <CardDescription className="text-xs mt-1">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(template.category || template.area) && (
                  <Badge variant="secondary" className="mb-3">
                    {getCategoryLabel(template.category) || template.area}
                  </Badge>
                )}
                {template.fields && template.fields.length > 0 && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Campos: {template.fields.join(", ")}
                  </p>
                )}
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => openGenerate(template)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Gerar Documento
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Generate dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Gerar: {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select
                value={selectedClientId}
                onValueChange={setSelectedClientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate?.fields?.map((field) => (
              <div key={field} className="space-y-2">
                <Label>{field}</Label>
                <Input
                  value={extraFields[field] || ""}
                  onChange={(e) =>
                    setExtraFields((prev) => ({
                      ...prev,
                      [field]: e.target.value,
                    }))
                  }
                  placeholder={`Informe ${field.toLowerCase()}`}
                />
              </div>
            ))}

            {previewUrl && (
              <div className="border rounded p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Documento gerado!
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.open(previewUrl, "_blank")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar PDF
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGenerateOpen(false)}
            >
              Fechar
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!selectedClientId || generating}
            >
              {generating && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Gerar Documento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
