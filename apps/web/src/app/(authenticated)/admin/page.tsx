"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Loading } from "@/components/loading";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { formatDateTime } from "@/lib/utils";
import {
  Users,
  Shield,
  Activity,
  Calendar,
  Plus,
  Settings,
  Loader2,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  oabNumber?: string;
  isActive: boolean;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  user?: { name: string };
  details?: string;
  createdAt: string;
}

interface ForensicCalendar {
  id: string;
  name: string;
  year: number;
  suspensions: Array<{
    startDate: string;
    endDate: string;
    reason: string;
  }>;
}

export default function AdminPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [calendars, setCalendars] = useState<ForensicCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // New user form
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADVOGADO",
    oabNumber: "",
  });
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "users") {
        const res = await api.get("/users");
        setUsers(res.data.data || res.data || []);
      } else if (tab === "audit") {
        const res = await api.get("/audit-logs", {
          params: { page, limit: 20 },
        });
        setAuditLogs(res.data.data || res.data || []);
        setTotalPages(res.data.totalPages || 1);
      } else if (tab === "calendar") {
        const res = await api.get("/forensic-calendars");
        setCalendars(res.data.data || res.data || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateUser = async () => {
    setCreating(true);
    try {
      await api.post("/users", newUser);
      toast({ title: "Usuario criado com sucesso!" });
      setNewUserOpen(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "ADVOGADO",
        oabNumber: "",
      });
      fetchData();
    } catch (err: any) {
      toast({
        title: "Erro ao criar usuario",
        description: err.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    try {
      await api.patch(`/users/${userId}`, { isActive: !isActive });
      toast({
        title: isActive ? "Usuario desativado" : "Usuario ativado",
      });
      fetchData();
    } catch {
      toast({ title: "Erro ao atualizar usuario", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Administracao</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie usuarios, configuracoes e auditoria
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="users">
            <Users className="mr-1 h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="mr-1 h-4 w-4" />
            Configuracoes
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Activity className="mr-1 h-4 w-4" />
            Auditoria
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="mr-1 h-4 w-4" />
            Calendario Forense
          </TabsTrigger>
        </TabsList>

        {/* Users */}
        <TabsContent value="users">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Usuarios do Sistema</h2>
              <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Usuario
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Usuario</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome *</Label>
                      <Input
                        value={newUser.name}
                        onChange={(e) =>
                          setNewUser({ ...newUser, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>E-mail *</Label>
                      <Input
                        type="email"
                        value={newUser.email}
                        onChange={(e) =>
                          setNewUser({ ...newUser, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Senha *</Label>
                      <Input
                        type="password"
                        value={newUser.password}
                        onChange={(e) =>
                          setNewUser({ ...newUser, password: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Perfil</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(v) =>
                          setNewUser({ ...newUser, role: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Administrador</SelectItem>
                          <SelectItem value="ADVOGADO">Advogado</SelectItem>
                          <SelectItem value="ESTAGIARIO">
                            Estagiario
                          </SelectItem>
                          <SelectItem value="SECRETARIA">
                            Secretaria
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Numero OAB</Label>
                      <Input
                        value={newUser.oabNumber}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            oabNumber: e.target.value,
                          })
                        }
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setNewUserOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateUser}
                      disabled={creating}
                    >
                      {creating && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Criar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <Loading />
            ) : (
              <DataTable
                columns={[
                  {
                    key: "name",
                    header: "Nome",
                    render: (u: User) => (
                      <span className="font-medium">{u.name}</span>
                    ),
                  },
                  { key: "email", header: "E-mail" },
                  {
                    key: "role",
                    header: "Perfil",
                    render: (u: User) => (
                      <Badge variant="secondary">{u.role}</Badge>
                    ),
                  },
                  {
                    key: "oabNumber",
                    header: "OAB",
                    render: (u: User) => u.oabNumber || "-",
                  },
                  {
                    key: "isActive",
                    header: "Status",
                    render: (u: User) => (
                      <Badge
                        variant={u.isActive ? "success" : "secondary"}
                      >
                        {u.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    ),
                  },
                  {
                    key: "actions",
                    header: "",
                    render: (u: User) => (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleUserActive(u.id, u.isActive);
                        }}
                      >
                        {u.isActive ? "Desativar" : "Ativar"}
                      </Button>
                    ),
                  },
                ]}
                data={users}
                keyExtractor={(u) => u.id}
              />
            )}
          </Card>
        </TabsContent>

        {/* Config */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Configuracoes do Sistema
              </CardTitle>
              <CardDescription>
                Ajuste as configuracoes gerais do escritorio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Escritorio</Label>
                  <Input placeholder="Nome do escritorio" />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input placeholder="00.000.000/0000-00" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input placeholder="(11) 0000-0000" />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input placeholder="contato@escritorio.com" />
                </div>
              </div>
              <Button>Salvar Configuracoes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit */}
        <TabsContent value="audit">
          <Card className="p-4">
            {loading ? (
              <Loading />
            ) : (
              <DataTable
                columns={[
                  {
                    key: "createdAt",
                    header: "Data/Hora",
                    render: (l: AuditLog) => (
                      <span className="text-xs">
                        {formatDateTime(l.createdAt)}
                      </span>
                    ),
                  },
                  {
                    key: "user",
                    header: "Usuario",
                    render: (l: AuditLog) => l.user?.name || "Sistema",
                  },
                  {
                    key: "action",
                    header: "Acao",
                    render: (l: AuditLog) => (
                      <Badge variant="outline">{l.action}</Badge>
                    ),
                  },
                  { key: "entity", header: "Entidade" },
                  {
                    key: "details",
                    header: "Detalhes",
                    render: (l: AuditLog) => (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {l.details || "-"}
                      </span>
                    ),
                  },
                ]}
                data={auditLogs}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                keyExtractor={(l) => l.id}
                emptyMessage="Nenhum registro de auditoria."
              />
            )}
          </Card>
        </TabsContent>

        {/* Forensic Calendar */}
        <TabsContent value="calendar">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Calendarios Forenses</h2>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Novo Calendario
              </Button>
            </div>

            {loading ? (
              <Loading />
            ) : calendars.length === 0 ? (
              <EmptyState
                title="Nenhum calendario cadastrado"
                description="Cadastre calendarios forenses para controle de prazos."
                icon={<Calendar className="h-8 w-8 text-slate-400" />}
              />
            ) : (
              <div className="space-y-4">
                {calendars.map((cal) => (
                  <Card key={cal.id}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {cal.name} - {cal.year}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {cal.suspensions && cal.suspensions.length > 0 ? (
                        <div className="space-y-2">
                          {cal.suspensions.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-sm bg-slate-50 rounded p-2"
                            >
                              <span>{s.reason}</span>
                              <span className="text-muted-foreground">
                                {s.startDate} a {s.endDate}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Nenhuma suspensao cadastrada.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
