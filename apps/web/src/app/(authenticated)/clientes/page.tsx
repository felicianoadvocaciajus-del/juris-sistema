"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getClients } from "@/lib/data-provider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { SearchInput } from "@/components/search-input";
import { Loading } from "@/components/loading";
import { formatCpfCnpj, formatPhone } from "@/lib/utils";
import { Plus } from "lucide-react";

interface Client {
  id: string;
  name: string;
  cpfCnpj?: string;
  phone?: string;
  email?: string;
  status: string;
  responsible?: { name: string };
  _count?: { matters: number };
}

export default function ClientesPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  useEffect(() => {
    getClients()
      .then((res: any) => {
        const data = res.data || res || [];
        setAllClients(data);
        setClients(data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filtro local (funciona com mock e com API)
  useEffect(() => {
    let filtered = [...allClients];
    if (status !== "ALL") {
      filtered = filtered.filter((c) => c.status === status);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          c.cpfCnpj?.includes(s) ||
          c.phone?.includes(s) ||
          c.email?.toLowerCase().includes(s)
      );
    }
    setClients(filtered);
  }, [search, status, allClients]);

  const columns = [
    {
      key: "name",
      header: "Nome",
      render: (item: Client) => (
        <span className="font-medium text-slate-900">{item.name}</span>
      ),
    },
    {
      key: "cpfCnpj",
      header: "CPF/CNPJ",
      render: (item: Client) =>
        item.cpfCnpj ? formatCpfCnpj(item.cpfCnpj) : "-",
    },
    {
      key: "phone",
      header: "Telefone",
      render: (item: Client) =>
        item.phone ? formatPhone(item.phone) : "-",
    },
    {
      key: "status",
      header: "Status",
      render: (item: Client) => <StatusBadge status={item.status} />,
    },
    {
      key: "responsible",
      header: "Responsavel",
      render: (item: Client) => item.responsible?.name || "-",
    },
    {
      key: "matters",
      header: "Casos",
      render: (item: Client) => item._count?.matters ?? 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os clientes do escritorio
          </p>
        </div>
        <Button onClick={() => router.push("/clientes/novo")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchInput
            placeholder="Buscar por nome, CPF/CNPJ, email..."
            value={search}
            onChange={setSearch}
            className="flex-1"
          />
          <Tabs value={status} onValueChange={setStatus}>
            <TabsList>
              <TabsTrigger value="ALL">Todos</TabsTrigger>
              <TabsTrigger value="CLIENTE_ATIVO">Ativos</TabsTrigger>
              <TabsTrigger value="POTENCIAL_CLIENTE">Potenciais</TabsTrigger>
              <TabsTrigger value="ENCERRADO">Encerrados</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <DataTable
            columns={columns}
            data={clients}
            page={1}
            totalPages={1}
            onPageChange={() => {}}
            onRowClick={(item) => router.push(`/clientes/${item.id}`)}
            keyExtractor={(item) => item.id}
            emptyMessage="Nenhum cliente encontrado."
          />
        )}
      </Card>
    </div>
  );
}
