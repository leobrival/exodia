"use client";

import { useParams, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const { id } = params;

  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  // Check if this is an optimistic (temporary) project being created
  const isOptimisticProject = id.startsWith('temp_');
  const isCreating = searchParams.get('creating') === 'true';

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

      // If this is an optimistic project being created, show loading state but don't fetch
      if (isOptimisticProject) {
        console.log('[ProjectDetailsPage] Optimistic project detected, showing creation loading...');
        setProjectLoading(true);
        setProjectError(null);
        // Create a temporary project object for display
        setProject({
          id,
          name: 'Untitled project',
          description: '',
          organization_id: '',
          slug: '',
          status: 'draft',
          created_by: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        return;
      }

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
  }, [id, isOptimisticProject]);

  // Auto-open sources modal based on URL parameter or no sources
  useEffect(() => {
    const openSources = searchParams.get('openSources');
    
    // Force open if URL parameter is present
    if (openSources === 'true' && !projectLoading && project && !projectError) {
      setModalOpen(true);
      return;
    }
    
    // Default behavior: open if no sources
    if (!sourcesLoading && !hasSources && project) {
      setModalOpen(true);
    }
  }, [searchParams, projectLoading, project, projectError, sourcesLoading, hasSources]);

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
        <div className="min-h-screen bg-background flex items-center justify-center">
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

      <div className="min-h-screen bg-background flex flex-col">
        {/* Creation loading banner */}
        {(isOptimisticProject || isCreating) && (
          <div className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800 px-6 py-3">
            <div className="flex items-center gap-3 text-sm text-blue-700 dark:text-blue-300">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full"></div>
              <span>Création du projet en cours...</span>
            </div>
          </div>
        )}
        {/* TODO ✅ RÉALISÉ: Nav bar avec le nom du projet (avec possibilité de modifier le nom) et le bouton pour revenir à la liste des projets, avec un bouton action (supprimer le projet) */}
        <ProjectHeader
          project={project}
          onProjectUpdate={handleProjectUpdate}
        />

        {/* TODO ✅ RÉALISÉ: Afficher le projet dans la page */}
        {/* TODO ✅ RÉALISÉ: Diviser la page en 3 colonnes : */}
        <main className="flex flex-1 w-full overflow-hidden px-6 gap-6">
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
