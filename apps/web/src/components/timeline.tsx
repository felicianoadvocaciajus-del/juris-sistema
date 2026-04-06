"use client";

import { cn, formatDateTime } from "@/lib/utils";
import { Circle } from "lucide-react";

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description?: string;
  type?: "info" | "success" | "warning" | "error";
  user?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const typeColors = {
  info: "text-blue-500 bg-blue-50 border-blue-200",
  success: "text-emerald-500 bg-emerald-50 border-emerald-200",
  warning: "text-amber-500 bg-amber-50 border-amber-200",
  error: "text-red-500 bg-red-50 border-red-200",
};

export function Timeline({ events, className }: TimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Nenhum evento registrado.
      </p>
    );
  }

  return (
    <div className={cn("space-y-0", className)}>
      {events.map((event, index) => {
        const colors = typeColors[event.type || "info"];
        return (
          <div key={event.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border",
                  colors
                )}
              >
                <Circle className="h-3 w-3 fill-current" />
              </div>
              {index < events.length - 1 && (
                <div className="w-px flex-1 bg-border min-h-[24px]" />
              )}
            </div>
            <div className="flex-1 pb-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{event.title}</p>
                <time className="text-xs text-muted-foreground">
                  {formatDateTime(event.date)}
                </time>
              </div>
              {event.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {event.description}
                </p>
              )}
              {event.user && (
                <p className="text-xs text-muted-foreground mt-1">
                  por {event.user}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
