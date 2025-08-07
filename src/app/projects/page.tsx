"use client";

import { AuthGuard, UserNav } from "@/components/auth/user-nav";
import { RealtimeDebug } from "@/components/debug/realtime-debug";
import ProjectCard from "@/components/project/project-card";
import ProjectCardSkeleton from "@/components/project/project-card-skeleton";
import NewProjectCard from "@/components/project/new-project-card";
import CreateProjectModal from "@/components/project/create-project-modal";
import { ConnectionIndicator } from "@/components/realtime/connection-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProjectsStore } from "@/stores/projects";
import { useAuthStore } from "@/stores/auth";
import { useEffect, useState, useMemo } from "react";

function ProjectsPage() {
  const { projects, loadProjects, isLoadingProjects, isRealtimeEnabled } = useProjectsStore();
  const { initialized, isAuthenticated, user, loading } = useAuthStore();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Load projects when user is authenticated and initialized
  useEffect(() => {
    if (initialized && isAuthenticated) {
      loadProjects();
    }
  }, [loadProjects, initialized, isAuthenticated]);

  // ✅ TODO : La liste des projets doit être triée par date de création
  const sortedProjects = useMemo(() => {
    return [...projects].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [projects]);

  const handleCreateProject = () => {
    setCreateModalOpen(true);
  };

  const handleProjectCreated = () => {
    // The project is already added through the store's createNewProject method
    // which handles optimistic updates and real-time sync
    setCreateModalOpen(false);
  };

  const handleProjectUpdated = () => {
    // Real-time updates are handled automatically by the store
    // No need to manually update the state
  };

  const handleProjectDeleted = () => {
    // Real-time updates are handled automatically by the store
    // No need to manually update the state
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">My Projects</h1>
                <p className="text-muted-foreground">
                  Manage your call-for-projects responses
                </p>
              </div>
              <ConnectionIndicator showText={false} />
            </div>
            <UserNav />
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-8 pb-40 px-[10vw]">
          <div className="grid gap-6">
            {/* Real-time Debug (Development only) */}
            {process.env.NODE_ENV === "development" && (
              <RealtimeDebug className="mb-4" />
            )}

            {/* Create Project CTA - Only show when no projects */}
            {!isLoadingProjects && projects.length === 0 && (
              <Card className="border-dashed border-2 border-muted-foreground/25">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Créez votre premier projet
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Commencez à gérer vos réponses d'appels à projets avec
                    l'analyse et la génération de documents alimentées par l'IA.
                  </p>
                  <Button size="lg" onClick={handleCreateProject}>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Nouveau projet
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Projects List */}
            {/* ✅ TODO : La liste des projets doit être triée par date de création */}
            {/* ✅ TODO : Le premier projet doit être un bouton pour "Créer un nouveau projet"  */}
            {(projects.length > 0 || isLoadingProjects) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {/* New Project Card - Always first when there are projects */}
                {!isLoadingProjects && (
                  <NewProjectCard onClick={handleCreateProject} />
                )}

                {/* Existing Projects */}
                {sortedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onProjectUpdated={handleProjectUpdated}
                    onProjectDeleted={handleProjectDeleted}
                  />
                ))}

                {isLoadingProjects && 
                  Array.from({ length: 6 }, (_, i) => (
                    <ProjectCardSkeleton key={`skeleton-${i}`} />
                  ))
                }
              </div>
            )}
          </div>
        </main>

        <CreateProjectModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onProjectCreated={handleProjectCreated}
        />
      </div>
    </AuthGuard>
  );
}

export default ProjectsPage;
