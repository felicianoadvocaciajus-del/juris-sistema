"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CnisAnalyzer } from "./cnis-analyzer";
import { HistoricoCalculos } from "./historico-calculos";
import { ContribuicoesCalculator } from "./contribuicoes-calculator";
import { GerarParecer } from "./gerar-parecer";
import { FileText, Calculator, Coins, FileDown } from "lucide-react";

// ── Interfaces ───────────────────────────────────────────────

interface PrevidenciarioTabProps {
  personId: string;
  personName: string;
  personCpf?: string;
}

// ── Component ────────────────────────────────────────────────

export function PrevidenciarioTab({
  personId,
  personName,
  personCpf,
}: PrevidenciarioTabProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="cnis" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cnis" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Extrato CNIS</span>
            <span className="sm:hidden">CNIS</span>
          </TabsTrigger>
          <TabsTrigger value="calculos" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Calculos e Planejamentos</span>
            <span className="sm:hidden">Calculos</span>
          </TabsTrigger>
          <TabsTrigger value="contribuicoes" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            <span className="hidden sm:inline">Contribuicoes Atrasadas</span>
            <span className="sm:hidden">Contrib.</span>
          </TabsTrigger>
          <TabsTrigger value="parecer" className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Parecer</span>
            <span className="sm:hidden">Parecer</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cnis" className="mt-6">
          <CnisAnalyzer personId={personId} personCpf={personCpf} />
        </TabsContent>

        <TabsContent value="calculos" className="mt-6">
          <HistoricoCalculos personId={personId} />
        </TabsContent>

        <TabsContent value="contribuicoes" className="mt-6">
          <ContribuicoesCalculator personId={personId} />
        </TabsContent>

        <TabsContent value="parecer" className="mt-6">
          <GerarParecer personId={personId} personName={personName} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
