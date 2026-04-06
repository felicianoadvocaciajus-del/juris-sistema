"use client";

import { useEffect, useState, useCallback } from "react";
import { getInstallments } from "@/lib/data-provider";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Loading } from "@/components/loading";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

interface Installment {
  id: string;
  number?: number;
  amount: number;
  dueDate: string;
  status: string;
  paidAmount?: number;
  paidAt?: string | null;
  feeAgreement?: {
    person?: { name: string };
    matter?: { title: string };
    type?: string;
    totalAmount?: number;
  };
  // Legacy fields
  description?: string;
  client?: { id: string; name: string };
  case?: { id: string; title: string };
}

export default function FinanceiroPage() {
  const { toast } = useToast();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [paymentDialog, setPaymentDialog] = useState<Installment | null>(null);
  const [paymentDate, setPaymentDate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      const res = await getInstallments(params);
      setInstallments(res.data || []);
      setTotalPages(Math.ceil((res.total || res.data?.length || 0) / 20) || 1);
    } catch {
      setInstallments([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const registerPayment = async () => {
    if (!paymentDialog) return;
    try {
      await api.patch(`/financial/installments/${paymentDialog.id}/pay`, {
        paidAt: paymentDate || new Date().toISOString(),
      });
      toast({ title: "Pagamento registrado!" });
      setPaymentDialog(null);
      fetchData();
    } catch {
      toast({
        title: "Erro ao registrar pagamento",
        variant: "destructive",
      });
    }
  };

  // Compute summary from installments data
  const totalGeral = installments.reduce((sum, i) => sum + i.amount, 0);
  const totalRecebido = installments
    .filter((i) => i.status === "PAGO")
    .reduce((sum, i) => sum + (i.paidAmount || i.amount), 0);
  const totalPendente = installments
    .filter((i) => i.status === "PENDENTE")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalVencido = installments
    .filter((i) => i.status === "VENCIDO")
    .reduce((sum, i) => sum + i.amount, 0);

  const summaryCards = [
    {
      title: "Total",
      value: formatCurrency(totalGeral),
      icon: DollarSign,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-200",
    },
    {
      title: "Recebido",
      value: formatCurrency(totalRecebido),
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-200",
    },
    {
      title: "Pendente",
      value: formatCurrency(totalPendente),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-200",
    },
    {
      title: "Vencido",
      value: formatCurrency(totalVencido),
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50 border-red-200",
    },
  ];

  // Helper to get display description
  const getDescription = (item: Installment) => {
    if (item.description) return item.description;
    const parts: string[] = [];
    if (item.feeAgreement?.matter?.title) parts.push(item.feeAgreement.matter.title);
    if (item.number) parts.push(`Parcela ${item.number}`);
    return parts.length > 0 ? parts.join(" - ") : `Parcela #${item.id}`;
  };

  // Helper to get client name
  const getClientName = (item: Installment) => {
    return item.client?.name || item.feeAgreement?.person?.name || "-";
  };

  // Helper to get case/matter title
  const getCaseTitle = (item: Installment) => {
    return item.case?.title || item.feeAgreement?.matter?.title || "-";
  };

  // Filter installments for current page
  const pageSize = 20;
  const filteredInstallments = installments;
  const paginatedInstallments = filteredInstallments.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
  const computedTotalPages = Math.ceil(filteredInstallments.length / pageSize) || 1;

  const columns = [
    {
      key: "description",
      header: "Descricao",
      render: (item: Installment) => (
        <span className="font-medium">{getDescription(item)}</span>
      ),
    },
    {
      key: "client",
      header: "Cliente",
      render: (item: Installment) => {
        const name = getClientName(item);
        if (item.client?.id) {
          return (
            <Link
              href={`/clientes/${item.client.id}`}
              className="text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {name}
            </Link>
          );
        }
        return <span>{name}</span>;
      },
    },
    {
      key: "case",
      header: "Caso",
      render: (item: Installment) => {
        const title = getCaseTitle(item);
        if (item.case?.id) {
          return (
            <Link
              href={`/casos/${item.case.id}`}
              className="text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {title}
            </Link>
          );
        }
        return <span>{title}</span>;
      },
    },
    {
      key: "amount",
      header: "Valor",
      render: (item: Installment) => (
        <span className="font-medium">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      key: "dueDate",
      header: "Vencimento",
      render: (item: Installment) => formatDate(item.dueDate),
    },
    {
      key: "status",
      header: "Status",
      render: (item: Installment) => <StatusBadge status={item.status} />,
    },
    {
      key: "actions",
      header: "",
      render: (item: Installment) =>
        item.status !== "PAGO" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setPaymentDialog(item);
              setPaymentDate("");
            }}
          >
            <CreditCard className="mr-1 h-3 w-3" />
            Registrar
          </Button>
        ) : item.paidAt ? (
          <span className="text-xs text-muted-foreground">
            Pago em {formatDate(item.paidAt)}
          </span>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Financeiro</h1>
        <p className="text-sm text-muted-foreground">
          Controle de pagamentos e recebimentos
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className={`${card.bg} border`}>
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg bg-white/80 ${card.color}`}
              >
                <card.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-sm font-medium text-slate-600">
                  {card.title}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Installments */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Parcelas</h2>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="PAGO">Pago</SelectItem>
              <SelectItem value="VENCIDO">Vencido</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <DataTable
            columns={columns}
            data={paginatedInstallments}
            page={page}
            totalPages={computedTotalPages}
            onPageChange={setPage}
            keyExtractor={(item) => item.id}
            emptyMessage="Nenhuma parcela encontrada."
          />
        )}
      </Card>

      {/* Payment dialog */}
      <Dialog
        open={!!paymentDialog}
        onOpenChange={() => setPaymentDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          {paymentDialog && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">
                  {getDescription(paymentDialog)}
                </p>
                <p className="text-lg font-bold">
                  {formatCurrency(paymentDialog.amount)}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Data do pagamento</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialog(null)}
            >
              Cancelar
            </Button>
            <Button onClick={registerPayment}>Confirmar Pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
