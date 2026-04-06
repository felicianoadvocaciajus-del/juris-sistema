"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getMatters } from "@/lib/data-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { SearchInput } from "@/components/search-input";
import { Loading } from "@/components/loading";
import { Plus } from "lucide-react";

interface Matter {
  id: string;
  title: string;
  courtNumber?: string | null;
  court?: string | null;
  status: string;
  legalArea?: string;
  personId?: string;
  person?: { name: string };
  responsibleId?: string;
  responsible?: { name: string };
  createdAt?: string;
  _count?: { documents?: number; tasks?: number };
  // Legacy fields
  caseNumber?: string;
  area?: string;
  client?: { id: string; name: string };
}

export default function CasosPage() {
  const router = useRouter();
  const [cases, setCases] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [areaFilter, setAreaFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (areaFilter !== "ALL") params.area = areaFilter;
      const res = await getMatters(params);
      let matters: Matter[] = res.data || [];

      // Client-side filtering for mock data
      if (search) {
        const q = search.toLowerCase();
        matters = matters.filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            (m.courtNumber && m.courtNumber.toLowerCase().includes(q)) ||
            (m.person?.name && m.person.name.toLowerCase().includes(q)) ||
            (m.client?.name && m.client.name.toLowerCase().includes(q))
        );
      }
      if (statusFilter !== "ALL") {
        matters = matters.filter((m) => m.status === statusFilter);
      }
      if (areaFilter !== "ALL") {
        matters = matters.filter(
          (m) => (m.legalArea || m.area) === areaFilter
        );
      }

      setCases(matters);
      setTotalPages(Math.ceil(matters.length / 20) || 1);
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, areaFilter]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, areaFilter]);

  // Paginate client-side
  const pageSize = 20;
  const paginatedCases = cases.slice((page - 1) * pageSize, page * pageSize);
  const computedTotalPages = Math.ceil(cases.length / pageSize) || 1;

  const columns = [
    {
      key: "title",
      header: "Titulo",
      render: (item: Matter) => (
        <div>
          <span className="font-medium text-slate-900">{item.title}</span>
          {(item.courtNumber || item.caseNumber) && (
            <p className="text-xs text-muted-foreground">
              {item.courtNumber || item.caseNumber}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "client",
      header: "Cliente",
      render: (item: Matter) =>
        item.person?.name || item.client?.name || "-",
    },
    {
      key: "area",
      header: "Area",
      render: (item: Matter) => item.legalArea || item.area || "-",
    },
    {
      key: "status",
      header: "Status",
      render: (item: Matter) => <StatusBadge status={item.status} />,
    },
    {
      key: "responsible",
      header: "Responsavel",
      render: (item: Matter) => item.responsible?.name || "-",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Casos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os processos e casos do escritorio
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Caso
        </Button>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchInput
            placeholder="Buscar por titulo, numero, cliente..."
            value={search}
            onChange={setSearch}
            className="flex-1"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Status</SelectItem>
              <SelectItem value="ATIVO">Ativo</SelectItem>
              <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
              <SelectItem value="AGUARDANDO">Aguardando</SelectItem>
              <SelectItem value="CONCLUIDO">Concluido</SelectItem>
              <SelectItem value="ENCERRADO">Encerrado</SelectItem>
              <SelectItem value="SUSPENSO">Suspenso</SelectItem>
              <SelectItem value="ARQUIVADO">Arquivado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as Areas</SelectItem>
              <SelectItem value="TRABALHISTA">Trabalhista</SelectItem>
              <SelectItem value="CIVIL">Civil</SelectItem>
              <SelectItem value="CRIMINAL">Criminal</SelectItem>
              <SelectItem value="TRIBUTARIO">Tributario</SelectItem>
              <SelectItem value="PREVIDENCIARIO">Previdenciario</SelectItem>
              <SelectItem value="FAMILIA">Familia</SelectItem>
              <SelectItem value="CONSUMIDOR">Consumidor</SelectItem>
              <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <DataTable
            columns={columns}
            data={paginatedCases}
            page={page}
            totalPages={computedTotalPages}
            onPageChange={setPage}
            onRowClick={(item) => router.push(`/casos/${item.id}`)}
            keyExtractor={(item) => item.id}
            emptyMessage="Nenhum caso encontrado."
          />
        )}
      </Card>
    </div>
  );
}
