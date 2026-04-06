"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getConversations } from "@/lib/data-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/search-input";
import { Loading } from "@/components/loading";
import { EmptyState } from "@/components/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Send,
  Upload,
  Tag,
  Loader2,
} from "lucide-react";

interface Conversation {
  id: string;
  contactName?: string;
  contactPhone?: string;
  channel: string;
  classification: string;
  lastMessageAt?: string;
  isArchived: boolean;
  person?: { id: string; name: string } | null;
  messages?: Message[];
}

interface Message {
  id: string;
  content: string;
  direction: string;
  senderName?: string;
  createdAt: string;
}

export default function ConversasPage() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filtered, setFiltered] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importChannel, setImportChannel] = useState("WHATSAPP");

  useEffect(() => {
    getConversations()
      .then((res: any) => {
        const data = res.data || res || [];
        setConversations(data);
        setFiltered(data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search) {
      setFiltered(conversations);
    } else {
      const s = search.toLowerCase();
      setFiltered(
        conversations.filter(
          (c) =>
            c.contactName?.toLowerCase().includes(s) ||
            c.contactPhone?.includes(s) ||
            c.person?.name.toLowerCase().includes(s)
        )
      );
    }
  }, [search, conversations]);

  const selectConversation = (conv: Conversation) => {
    setSelected(conv);
  };

  const getDisplayName = (conv: Conversation) => {
    return conv.person?.name || conv.contactName || conv.contactPhone || "Desconhecido";
  };

  const getPreview = (conv: Conversation) => {
    if (conv.messages && conv.messages.length > 0) {
      return conv.messages[conv.messages.length - 1].content;
    }
    return "Sem mensagens";
  };

  const classificationColors: Record<string, string> = {
    CLIENTE: "bg-green-100 text-green-800",
    POTENCIAL_CLIENTE: "bg-blue-100 text-blue-800",
    PESSOAL: "bg-slate-100 text-slate-800",
    PARCEIRO: "bg-purple-100 text-purple-800",
    IGNORAR: "bg-gray-100 text-gray-500",
    NAO_CLASSIFICADO: "bg-amber-100 text-amber-800",
  };

  const classificationLabels: Record<string, string> = {
    CLIENTE: "Cliente",
    POTENCIAL_CLIENTE: "Potencial",
    PESSOAL: "Pessoal",
    PARCEIRO: "Parceiro",
    IGNORAR: "Ignorar",
    NAO_CLASSIFICADO: "Nao triado",
  };

  const classifyConversation = (convId: string, classification: string) => {
    // Atualiza localmente (quando a API estiver rodando, tambem salva no servidor)
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, classification } : c))
    );
    if (selected?.id === convId) {
      setSelected((prev) => (prev ? { ...prev, classification } : null));
    }
    toast({ title: `Conversa classificada como ${classificationLabels[classification] || classification}` });

    // Tenta salvar na API
    api.patch(`/conversations/${convId}`, { classification }).catch(() => {});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Conversas</h1>
          <p className="text-sm text-muted-foreground">
            Inbox de mensagens e atendimentos
          </p>
        </div>
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Importar Conversa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Canal</Label>
                <Select value={importChannel} onValueChange={setImportChannel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="EMAIL">E-mail</SelectItem>
                    <SelectItem value="TELEFONE">Telefone</SelectItem>
                    <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Texto da conversa</Label>
                <Textarea
                  rows={8}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Cole o texto da conversa aqui..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setImportOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                toast({ title: "Conversa importada (modo demo)" });
                setImportOpen(false);
                setImportText("");
              }}>
                Importar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
        {/* Left - conversation list */}
        <Card className="lg:col-span-1 flex flex-col">
          <div className="p-3 border-b">
            <SearchInput
              placeholder="Buscar conversas..."
              value={search}
              onChange={setSearch}
            />
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <Loading />
            ) : filtered.length === 0 ? (
              <EmptyState
                title="Nenhuma conversa"
                icon={<MessageSquare className="h-8 w-8 text-slate-400" />}
              />
            ) : (
              <div className="divide-y">
                {filtered.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      "p-3 cursor-pointer hover:bg-slate-50 transition-colors",
                      selected?.id === conv.id && "bg-blue-50 border-l-2 border-l-blue-600"
                    )}
                    onClick={() => selectConversation(conv)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-900 truncate">
                        {getDisplayName(conv)}
                      </span>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          classificationColors[conv.classification] || "bg-slate-100"
                        )}
                      >
                        {classificationLabels[conv.classification] || conv.classification}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {getPreview(conv)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {conv.channel}
                      </Badge>
                      {conv.lastMessageAt && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDateTime(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Right - messages */}
        <Card className="lg:col-span-2 flex flex-col">
          {selected ? (
            <>
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{getDisplayName(selected)}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selected.channel} {selected.contactPhone && `- ${selected.contactPhone}`}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => classifyConversation(selected.id, "CLIENTE")}>
                      <Tag className="mr-1 h-3 w-3" />Cliente
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => classifyConversation(selected.id, "POTENCIAL_CLIENTE")}>
                      <Tag className="mr-1 h-3 w-3" />Potencial
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => classifyConversation(selected.id, "PESSOAL")}>
                      <Tag className="mr-1 h-3 w-3" />Pessoal
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => classifyConversation(selected.id, "IGNORAR")}>
                      <Tag className="mr-1 h-3 w-3" />Ignorar
                    </Button>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {(selected.messages || []).map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "max-w-[80%] rounded-lg p-3",
                        msg.direction === "INBOUND"
                          ? "bg-slate-100 mr-auto"
                          : msg.direction === "INTERNAL_NOTE"
                          ? "bg-amber-50 border border-amber-200 ml-auto"
                          : "bg-blue-50 ml-auto"
                      )}
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {msg.senderName || (msg.direction === "INBOUND" ? "Cliente" : "Advogado")}
                        {msg.direction === "INTERNAL_NOTE" && " (nota interna)"}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        {formatDateTime(msg.createdAt)}
                      </p>
                    </div>
                  ))}
                  {(!selected.messages || selected.messages.length === 0) && (
                    <p className="text-sm text-center text-muted-foreground py-8">
                      Nenhuma mensagem nesta conversa
                    </p>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Adicionar nota interna..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (newMessage.trim()) {
                          toast({ title: "Nota adicionada (modo demo)" });
                          setNewMessage("");
                        }
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      if (newMessage.trim()) {
                        toast({ title: "Nota adicionada (modo demo)" });
                        setNewMessage("");
                      }
                    }}
                    disabled={!newMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                title="Selecione uma conversa"
                description="Escolha uma conversa na lista ao lado para visualizar as mensagens."
                icon={<MessageSquare className="h-8 w-8 text-slate-400" />}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
