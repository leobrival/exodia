"use client";

import { Project } from "@/lib/actions/projects";
import { useMemo } from "react";
import NewProjectCard from "./new-project-card";
import ProjectCard from "./project-card";
import ProjectCardSkeleton from "./project-card-skeleton";
import ProjectsList from "./projects-list";

interface ProjectsViewProps {
  projects: Project[];
  isLoading: boolean;
  viewMode: "card" | "list";
  sortBy: "title" | "date";
  sortOrder: "asc" | "desc";
  onCreateProject: () => void;
  onProjectUpdated?: (updatedProject: Project) => void;
  onProjectDeleted?: (project: Project) => void;
  className?: string;
}

export default function ProjectsView({
  projects,
  isLoading,
  viewMode,
  sortBy,
  sortOrder,
  onCreateProject,
  onProjectUpdated,
  onProjectDeleted,
  className,
}: ProjectsViewProps) {
  // Tri des projets pour la vue card
  const sortedProjects = useMemo(() => {
    const sorted = [...projects].sort((a, b) => {
      let comparison = 0;

      if (sortBy === "title") {
        comparison = a.name.localeCompare(b.name, "fr", { 
          numeric: true, 
          sensitivity: "base" 
        });
      } else if (sortBy === "date") {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        comparison = dateA - dateB;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    return sorted;
  }, [projects, sortBy, sortOrder]);

  // Vue liste
  if (viewMode === "list") {
    return (
      <div className={className}>
        <ProjectsList
          projects={projects}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onProjectUpdated={onProjectUpdated}
          onProjectDeleted={onProjectDeleted}
        />
      </div>
    );
  }

  // Vue card
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 ${className || ""}`}>
      {/* Carte de création - Toujours en première position */}
      {!isLoading && (
        <NewProjectCard onClick={onCreateProject} />
      )}

      {/* Projets existants */}
      {sortedProjects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onProjectUpdated={onProjectUpdated}
          onProjectDeleted={onProjectDeleted}
        />
      ))}

      {/* Skeletons pendant le chargement */}
      {isLoading && 
        Array.from({ length: 6 }, (_, i) => (
          <ProjectCardSkeleton key={`skeleton-${i}`} />
        ))
      }
    </div>
  );
}