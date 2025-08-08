"use client";

import { AuthGuard, UserNav } from "@/components/auth/user-nav";
import { RealtimeDebug } from "@/components/debug/realtime-debug";
import ProjectsToolbar from "@/components/project/projects-toolbar";
import ProjectsView from "@/components/project/projects-view";
import { ConnectionIndicator } from "@/components/realtime/connection-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProjectsParams } from "@/hooks/use-projects-params";
import { useProjectsStore } from "@/stores/projects";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function ProjectsPage() {
  const { projects, loadProjects, isLoadingProjects, isRealtimeEnabled, createQuickProject, isCreatingProject } = useProjectsStore();
  const { initialized, isAuthenticated, user, loading } = useAuthStore();
  const { viewMode, sortBy, sortOrder } = useProjectsParams();
  const router = useRouter();

  // Load projects when user is authenticated and initialized
  useEffect(() => {
    if (initialized && isAuthenticated) {
      loadProjects();
    }
  }, [loadProjects, initialized, isAuthenticated]);


  const handleCreateProject = async () => {
    console.log('[ProjectsPage] handleCreateProject called, isCreatingProject:', isCreatingProject)
    
    if (isCreatingProject) {
      console.log('[ProjectsPage] Project creation already in progress, ignoring click')
      return; // Prevent double clicks
    }
    
    try {
      console.log('[ProjectsPage] Starting optimistic project creation...')
      
      // Generate optimistic ID and navigate immediately for better UX
      const optimisticId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const targetUrl = `/projects/${optimisticId}?openSources=true&creating=true`
      
      console.log('[ProjectsPage] Navigating optimistically to:', targetUrl)
      router.push(targetUrl);
      
      // Start project creation in background
      const result = await createQuickProject();
      
      console.log('[ProjectsPage] Project creation result:', {
        success: result.success,
        projectId: result.project?.id,
        error: result.error
      })
      
      if (result.success && result.project) {
        // Replace the optimistic URL with the real project ID
        const realUrl = `/projects/${result.project.id}?openSources=true`
        console.log('[ProjectsPage] Replacing URL with real project ID:', realUrl)
        router.replace(realUrl);
        toast.success("Projet créé avec succès !");
      } else {
        console.error('[ProjectsPage] Project creation failed:', result.error)
        // Navigate back to projects page on failure
        router.replace('/projects');
        toast.error(result.error || "Erreur lors de la création du projet");
      }
    } catch (error) {
      console.error("[ProjectsPage] Exception in handleCreateProject:", error);
      // Navigate back to projects page on exception
      router.replace('/projects');
      toast.error("Erreur inattendue lors de la création du projet");
    }
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
          <div className="space-y-6">
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

            {/* Toolbar - Only show when there are projects or loading */}
            {(projects.length > 0 || isLoadingProjects) && (
              <ProjectsToolbar
                projectsCount={projects.length}
                onCreateProject={handleCreateProject}
              />
            )}

            {/* Projects View */}
            {(projects.length > 0 || isLoadingProjects) && (
              <ProjectsView
                projects={projects}
                isLoading={isLoadingProjects}
                viewMode={viewMode}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onCreateProject={handleCreateProject}
                onProjectUpdated={handleProjectUpdated}
                onProjectDeleted={handleProjectDeleted}
              />
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

export default ProjectsPage;
