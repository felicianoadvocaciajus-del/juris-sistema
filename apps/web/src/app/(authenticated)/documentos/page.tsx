"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { DataTable } from "@/components/data-table";
import { SearchInput } from "@/components/search-input";
import { Loading } from "@/components/loading";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import {
  Upload,
  FileText,
  FileCode,
  Download,
  Grid,
  List,
  Plus,
  Loader2,
  Eye,
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  type?: string;
  mimeType?: string;
  tags?: string[];
  client?: { id: string; name: string };
  case?: { id: string; title: string };
  createdAt: string;
  url?: string;
}

export default function DocumentosPage() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      const res = await api.get("/documents", { params });
      setDocuments(res.data.data || res.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle || uploadFile.name);
      await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast({ title: "Documento enviado com sucesso!" });
      setUploadOpen(false);
      setUploadFile(null);
      setUploadTitle("");
      fetchDocuments();
    } catch {
      toast({
        title: "Erro ao enviar documento",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      key: "title",
      header: "Documento",
      render: (item: Document) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          <span className="font-medium">{item.title}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      render: (item: Document) => item.type || "-",
    },
    {
      key: "client",
      header: "Cliente",
      render: (item: Document) => item.client?.name || "-",
    },
    {
      key: "case",
      header: "Caso",
      render: (item: Document) => item.case?.title || "-",
    },
    {
      key: "tags",
      header: "Tags",
      render: (item: Document) =>
        item.tags && item.tags.length > 0 ? (
          <div className="flex gap-1">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          "-"
        ),
    },
    {
      key: "createdAt",
      header: "Data",
      render: (item: Document) => formatDate(item.createdAt),
    },
    {
      key: "actions",
      header: "",
      render: (item: Document) => (
        <div className="flex gap-1">
          {item.url && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                window.open(item.url, "_blank");
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documentos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie documentos do escritorio
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}>
            {viewMode === "list" ? (
              <Grid className="h-4 w-4" />
            ) : (
              <List className="h-4 w-4" />
            )}
          </Button>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Enviar Documento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar Documento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Titulo</Label>
                  <Input
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Nome do documento"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Arquivo</Label>
                  <Input
                    type="file"
                    onChange={(e) =>
                      setUploadFile(e.target.files?.[0] || null)
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setUploadOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleUpload} disabled={!uploadFile || uploading}>
                  {uploading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Enviar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="p-4 space-y-4">
        <SearchInput
          placeholder="Buscar documentos..."
          value={search}
          onChange={setSearch}
        />

        {loading ? (
          <Loading />
        ) : viewMode === "list" ? (
          <DataTable
            columns={columns}
            data={documents}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            keyExtractor={(item) => item.id}
            emptyMessage="Nenhum documento encontrado."
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {documents.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  title="Nenhum documento"
                  icon={<FileText className="h-8 w-8 text-slate-400" />}
                />
              </div>
            ) : (
              documents.map((doc) => (
                <Card
                  key={doc.id}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex flex-col items-center gap-3 text-center">
                    <FileText className="h-10 w-10 text-slate-400" />
                    <p className="text-sm font-medium line-clamp-2">
                      {doc.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(doc.createdAt)}
                    </p>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
