import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  // Client statuses
  ATIVO: { label: "Ativo", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  POTENCIAL: { label: "Potencial", className: "bg-blue-100 text-blue-800 border-blue-200" },
  ENCERRADO: { label: "Encerrado", className: "bg-slate-100 text-slate-600 border-slate-200" },
  INATIVO: { label: "Inativo", className: "bg-slate-100 text-slate-500 border-slate-200" },

  // Case statuses
  EM_ANDAMENTO: { label: "Em Andamento", className: "bg-blue-100 text-blue-800 border-blue-200" },
  AGUARDANDO: { label: "Aguardando", className: "bg-amber-100 text-amber-800 border-amber-200" },
  CONCLUIDO: { label: "Concluido", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  ARQUIVADO: { label: "Arquivado", className: "bg-slate-100 text-slate-600 border-slate-200" },
  SUSPENSO: { label: "Suspenso", className: "bg-orange-100 text-orange-800 border-orange-200" },

  // Financial statuses
  PENDENTE: { label: "Pendente", className: "bg-amber-100 text-amber-800 border-amber-200" },
  PAGO: { label: "Pago", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  VENCIDO: { label: "Vencido", className: "bg-red-100 text-red-800 border-red-200" },
  CANCELADO: { label: "Cancelado", className: "bg-slate-100 text-slate-500 border-slate-200" },

  // Conversation statuses
  NAO_TRIADA: { label: "Nao Triada", className: "bg-red-100 text-red-800 border-red-200" },
  TRIADA: { label: "Triada", className: "bg-blue-100 text-blue-800 border-blue-200" },
  RESPONDIDA: { label: "Respondida", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },

  // Deadline statuses
  CONFIRMADO: { label: "Confirmado", className: "bg-blue-100 text-blue-800 border-blue-200" },
  CUMPRIDO: { label: "Cumprido", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  PERDIDO: { label: "Perdido", className: "bg-red-100 text-red-800 border-red-200" },

  // Publication statuses
  NOVA: { label: "Nova", className: "bg-blue-100 text-blue-800 border-blue-200" },
  EM_ANALISE: { label: "Em Analise", className: "bg-amber-100 text-amber-800 border-amber-200" },
  ANALISADA: { label: "Analisada", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  IGNORADA: { label: "Ignorada", className: "bg-slate-100 text-slate-500 border-slate-200" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <Badge
      variant="outline"
      className={cn(config.className, "font-medium", className)}
    >
      {config.label}
    </Badge>
  );
}
