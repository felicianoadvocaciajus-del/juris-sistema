import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  className?: string;
  text?: string;
}

export function Loading({ className, text = "Carregando..." }: LoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 gap-3",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
