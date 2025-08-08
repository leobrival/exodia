"use client";

import { Project } from "@/lib/actions/projects";
import { useMemo } from "react";
import ProjectListItem from "./project-list-item";

interface ProjectsListProps {
  projects: Project[];
  sortBy: "title" | "date";
  sortOrder: "asc" | "desc";
  onProjectUpdated?: (updatedProject: Project) => void;
  onProjectDeleted?: (project: Project) => void;
  className?: string;
}

export default function ProjectsList({
  projects,
  sortBy,
  sortOrder,
  onProjectUpdated,
  onProjectDeleted,
  className,
}: ProjectsListProps) {
  // Tri des projets selon les critères
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

  if (projects.length === 0) {
    return (
      <div className={`text-center py-12 ${className || ""}`}>
        <p className="text-muted-foreground">Aucun projet à afficher</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className || ""}`}>
      {sortedProjects.map((project) => (
        <ProjectListItem
          key={project.id}
          project={project}
          onProjectUpdated={onProjectUpdated}
          onProjectDeleted={onProjectDeleted}
        />
      ))}
    </div>
  );
}