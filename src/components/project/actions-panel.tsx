"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useProjectNotes } from "@/hooks/useProjectNotes";
import {
  AudioLines,
  FileText,
  Pencil,
  SquaresSubtract,
  WandSparkles,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import CustomNotesModal from "./custom-notes-modal";

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
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const { activeNotesCount, totalNotesCount } = useProjectNotes(projectId);

  // Log optimisé pour éviter les re-rendus constants
  useMemo(() => {
    const info = {
      projectId,
      projectName,
      hasSources,
      documentsCount,
      activeNotesCount,
      totalNotesCount,
      isNotesModalOpen
    };
    console.log('[DEBUG] ActionsPanel props/state changed:', info);
    return info;
  }, [projectId, projectName, hasSources, documentsCount, activeNotesCount, totalNotesCount, isNotesModalOpen]);

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

  const handleNotesModalOpen = useCallback(() => {
    console.log('[DEBUG] Opening notes modal:', {
      projectId,
      currentModalState: isNotesModalOpen,
      totalNotesCount,
      activeNotesCount
    });
    
    setIsNotesModalOpen(true);
    
    console.log('[DEBUG] Notes modal state updated to open');
    // Le hook useProjectNotes charge automatiquement les notes
  }, [projectId, isNotesModalOpen, totalNotesCount, activeNotesCount]);

  return (
    <div
      className={`min-h-full flex flex-col w-1/4 rounded-2xl bg-card relative text-card-foreground ${
        className || ""
      }`}
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Actions</h2>
          {totalNotesCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {activeNotesCount} note{activeNotesCount !== 1 ? "s" : ""} active
              {activeNotesCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4">
        <Card className="flex aspect-video p-3 justify-center shadow-none border-none bg-blue-950/10 text-blue-900 hover:bg-blue-950/30 transition-colors cursor-pointer duration-300 rounded-2xl">
          <h3 className="text-xs flex flex-col gap-3 font-semibold">
            <AudioLines className="h-5 w-5" />
            Résumé audio
          </h3>
        </Card>
        <Card className="flex aspect-video p-3 justify-center shadow-none border-none bg-green-950/10 text-green-900 hover:bg-green-950/30 transition-colors cursor-pointer duration-300 rounded-2xl">
          <h3 className="text-xs flex flex-col gap-3 font-semibold">
            <SquaresSubtract className="h-5 w-5" />
            Questions
          </h3>
        </Card>
        <Card className="flex aspect-video p-3 justify-center shadow-none border-none bg-pink-950/10 text-pink-900 hover:bg-pink-950/30 transition-colors cursor-pointer duration-300 rounded-2xl">
          <h3 className="text-xs flex flex-col gap-3 font-semibold">
            <FileText className="h-5 w-5" />
            Rapport
          </h3>
        </Card>
        <Card className="flex aspect-video p-3 justify-center shadow-none border-none bg-yellow-950/10 text-yellow-900 hover:bg-yellow-950/30 transition-colors cursor-pointer duration-300 rounded-2xl">
          <h3 className="text-xs flex flex-col gap-3 font-semibold">
            <FileText className="h-5 w-5" />
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
        className="absolute bottom-4 left-1/2 -translate-x-1/2 justify-start gap-2 rounded-full cursor-pointer"
        onClick={handleNotesModalOpen}
      >
        <Pencil className="h-4 w-4" />
        {totalNotesCount > 0
          ? `${totalNotesCount} note${totalNotesCount !== 1 ? "s" : ""}`
          : "Ajouter une note"}
      </Button>

      {/* Modal des notes - Version custom sans Radix UI */}
      <CustomNotesModal
        open={isNotesModalOpen}
        onOpenChange={setIsNotesModalOpen}
        projectId={projectId}
      />
    </div>
  );
}
