"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthGuard } from "@/components/auth/user-nav";
import ActionsPanel from "@/components/project/actions-panel";
import ChatInterface from "@/components/project/chat-interface";
import NewSourceModal from "@/components/project/new-source-modal";
import ProjectDetailSkeleton from "@/components/project/project-detail-skeleton";
import ProjectHeader from "@/components/project/project-header";
import SourcesList from "@/components/project/sources-list";

import { useProjectSources } from "@/hooks/useProjectSources";
import { getProjectById, type Project } from "@/lib/actions/projects";

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;

  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  // Hook pour gérer les sources du projet
  const {
    documents,
    loading: sourcesLoading,
    error: sourcesError,
    hasSources,
    refreshDocuments,
  } = useProjectSources(id);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      try {
        setProjectLoading(true);
        setProjectError(null);

        const { data, error } = await getProjectById(id);

        if (error) {
          console.error("Error fetching project:", error);
          setProjectError("Erreur lors du chargement du projet");
          toast.error("Erreur lors du chargement du projet");
          return;
        }

        if (!data) {
          setProjectError("Projet non trouvé");
          toast.error("Projet non trouvé");
          return;
        }

        setProject(data);
      } catch (error) {
        console.error("Unexpected error fetching project:", error);
        setProjectError("Erreur inattendue");
        toast.error("Erreur inattendue lors du chargement du projet");
      } finally {
        setProjectLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  // TODO ✅ RÉALISÉ: check if project has sources; for now always open on first render
  // TODO ✅ RÉALISÉ: Dès l'ouverture de la page, ouvrir la modal d'ajout de source dans le cas ou aucune source n'est présente (60vw)
  useEffect(() => {
    if (!sourcesLoading && !hasSources && project) {
      setModalOpen(true);
    }
  }, [sourcesLoading, hasSources, project]);

  const handleProjectUpdate = (updatedProject: {
    name: string;
    description?: string;
  }) => {
    if (project) {
      setProject((prev) => (prev ? { ...prev, ...updatedProject } : null));
    }
  };

  const handleAddSource = () => {
    setModalOpen(true);
  };

  const handleUploadComplete = () => {
    refreshDocuments();
  };

  if (projectLoading) {
    return (
      <AuthGuard>
        <ProjectDetailSkeleton />
      </AuthGuard>
    );
  }

  if (projectError || !project) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#edeffa] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Erreur</h1>
            <p className="text-muted-foreground">
              {projectError || "Projet non trouvé"}
            </p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      {/* TODO ✅ RÉALISÉ: La modal doit permettre l'import de documents (pdf, docx, txt, etc.) directement depuis le navigateur et via drag and drop ou sélection de fichier à importer */}
      <NewSourceModal
        open={isModalOpen}
        onOpenChange={setModalOpen}
        projectId={id}
        currentSourcesCount={documents.length}
        onUploadComplete={handleUploadComplete}
      />

      <div className="min-h-screen bg-[#edeffa] flex flex-col">
        {/* TODO ✅ RÉALISÉ: Nav bar avec le nom du projet (avec possibilité de modifier le nom) et le bouton pour revenir à la liste des projets, avec un bouton action (supprimer le projet) */}
        <ProjectHeader
          project={project}
          onProjectUpdate={handleProjectUpdate}
        />

        {/* TODO ✅ RÉALISÉ: Afficher le projet dans la page */}
        {/* TODO ✅ RÉALISÉ: Diviser la page en 3 colonnes : */}
        <main className="flex flex-1 w-full overflow-hidden px-6 pt-6 gap-6">
          {/* TODO ✅ RÉALISÉ: 1/4 : Liste des sources (à gauche) */}
          <SourcesList
            documents={documents}
            loading={sourcesLoading}
            error={sourcesError}
            onAddSource={handleAddSource}
          />
          {/* TODO ✅ RÉALISÉ: 2/4 : Chat de discussion avec l'IA (au milieu) */}
          {/* TODO ✅ RÉALISÉ: Drag and drop pour ajouter des documents */}
          {/* TODO ✅ RÉALISÉ: Interface (Icon, message : Ajoutez une source pour commencer, bouton : Importer une source) */}
          <ChatInterface
            hasSources={hasSources}
            onAddSource={handleAddSource}
          />
          {/* TODO ✅ RÉALISÉ: 1/4 : Actions (à droite) (créer un document) */}
          <ActionsPanel
            projectId={project.id}
            projectName={project.name}
            hasSources={hasSources}
            documentsCount={documents.length}
          />
        </main>

        <footer className="h-6 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">
            Exodia peut se tromper. Veuillez donc vérifier ses réponses.
          </p>
        </footer>
      </div>
    </AuthGuard>
  );
}
