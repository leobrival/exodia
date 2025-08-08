"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface NewProjectCardProps {
  onClick: () => void;
}

export default function NewProjectCard({ onClick }: NewProjectCardProps) {
  return (
    <Card
      className="cursor-pointer select-none border-dashed border-2 rounded-xl w-full aspect-[3/2] shadow-none"
      onClick={onClick}
    >
      <CardContent className="p-6 flex flex-col items-center justify-center text-center rounded-2xl">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-3">
          <Plus className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="text-foreground mb-1 text-2xl font-medium">
          Créer un nouveau projet
        </h3>
      </CardContent>
    </Card>
  );
}
