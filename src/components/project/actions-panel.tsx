"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  MessageSquare,
  Pencil,
  Play,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";

interface ActionsPanelProps {
  projectId: string;
  projectName: string;
  hasSources: boolean;
  documentsCount: number;
  className?: string;
}

export default function ActionsPanel({
  projectId,
  projectName,
  hasSources,
  documentsCount,
  className,
}: ActionsPanelProps) {
  const handleCreateDocument = (type: string) => {
    if (!hasSources) {
      toast.error("Ajoutez d'abord des sources pour générer des documents");
      return;
    }

    // TODO: Implémenter la génération de documents
    toast.info(`Génération de ${type} - Fonctionnalité à venir`);
  };

  const handleExportProject = () => {
    if (!hasSources) {
      toast.error("Aucune source à exporter");
      return;
    }

    // TODO: Implémenter l'export du projet
    toast.info("Export du projet - Fonctionnalité à venir");
  };

  const handleAnalyzeProject = () => {
    if (!hasSources) {
      toast.error("Ajoutez des sources pour analyser le projet");
      return;
    }

    // TODO: Implémenter l'analyse du projet
    toast.info("Analyse du projet - Fonctionnalité à venir");
  };

  return (
    <div
      className={`min-h-full flex flex-col w-1/4 rounded-3xl bg-card relative text-card-foreground ${
        className || ""
      }`}
    >
      <div className="p-4 border-b border-border">
        <h2 className="text-base font-semibold">Actions</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4">
        <Card className="flex aspect-video p-3 justify-center shadow-none">
          <h3 className="font-normal text-base flex flex-col gap-2">
            <Play className="h-6 w-6" />
            Résumé audio
          </h3>
        </Card>
        <Card className="flex aspect-video p-3 justify-center shadow-none">
          <h3 className="font-normal text-base flex flex-col gap-2">
            <MessageSquare className="h-6 w-6" />
            Questions
          </h3>
        </Card>
        <Card className="flex aspect-video p-3 justify-center shadow-none">
          <h3 className="font-normal text-base flex flex-col gap-2">
            <FileText className="h-6 w-6" />
            Rapport
          </h3>
        </Card>
        <Card className="flex aspect-video p-3 justify-center shadow-none">
          <h3 className="font-normal text-base flex flex-col gap-2">
            <FileText className="h-6 w-6" />
            Synthèse
          </h3>
        </Card>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto p-4 gap-2 flex flex-col items-center justify-center">
        {!hasSources && (
          <>
            <WandSparkles className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              La sortie Studio sera enregistrée ici. Après avoir ajouté des
              sources, cliquez pour ajouter un résumé audio, un guide d'étude,
              une carte mentale et bien plus !
            </p>
          </>
        )}
      </div>
      <Button
        variant="secondary"
        className="absolute bottom-4 left-1/2 -translate-x-1/2 justify-start gap-2 rounded-full"
      >
        <Pencil className="h-4 w-4" />
        Ajouter une notes
      </Button>
    </div>
  );
}
