import { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ChartCard({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
      <CardHeader>
        <div>
          {eyebrow && <p className="text-xs font-semibold uppercase text-primary">{eyebrow}</p>}
          <h3 className="font-semibold tracking-tight">{title}</h3>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
