"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProjectDocumentsCount } from "@/hooks/useProjectDocuments";
import { Project } from "@/lib/actions/projects";
import {
  formatProjectDate,
  formatSourcesCount,
  getProjectTheme,
} from "@/lib/project-themes";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import ProjectActionsMenu from "./project-actions-menu";
import ProjectDeleteModal from "./project-delete-modal";
import ProjectEditModal from "./project-edit-modal";

interface ProjectListItemProps {
  project: Project;
  onProjectUpdated?: (updatedProject: Project) => void;
  onProjectDeleted?: (project: Project) => void;
}

export default function ProjectListItem({
  project,
  onProjectUpdated,
  onProjectDeleted,
}: ProjectListItemProps) {
  const documentsCount = useProjectDocumentsCount(project.id);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const theme = getProjectTheme(project.name);

  const handleEdit = (projectToEdit: Project) => {
    setSelectedProject(projectToEdit);
    setEditModalOpen(true);
  };

  const handleDelete = (projectToDelete: Project) => {
    setSelectedProject(projectToDelete);
    setDeleteModalOpen(true);
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setEditModalOpen(false);
    setSelectedProject(null);
    onProjectUpdated?.(updatedProject);
  };

  const handleProjectDeleted = (deletedProject: Project) => {
    setDeleteModalOpen(false);
    setSelectedProject(null);
    onProjectDeleted?.(deletedProject);
  };

  return (
    <>
      <div className="group flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
        {/* Section principale cliquable */}
        <Link
          href={`/projects/${project.id}`}
          className="flex-1 flex items-center gap-4 min-w-0"
        >
          {/* Emoji et nom */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center text-lg
              ${theme.bgLight} dark:${theme.bgDark}
            `}>
              {theme.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate hover:text-primary transition-colors">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-sm text-muted-foreground truncate">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          {/* Date de création */}
          <div className="hidden sm:block text-sm text-muted-foreground whitespace-nowrap">
            {formatProjectDate(project.created_at)}
          </div>

          {/* Nombre de sources */}
          <div className="hidden md:block">
            <Badge variant="secondary" className="whitespace-nowrap">
              {formatSourcesCount(documentsCount)}
            </Badge>
          </div>
        </Link>

        {/* Menu d'actions */}
        <div className="flex items-center pl-2">
          <ProjectActionsMenu
            project={project}
            onEdit={handleEdit}
            onDelete={handleDelete}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions du projet</span>
              </Button>
            }
          />
        </div>
      </div>

      {/* Version mobile : informations supplémentaires */}
      <div className="sm:hidden px-4 pb-2 -mt-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatProjectDate(project.created_at)}</span>
          <Badge variant="secondary" className="text-xs">
            {formatSourcesCount(documentsCount)}
          </Badge>
        </div>
      </div>

      {/* Modales */}
      {selectedProject && (
        <>
          <ProjectEditModal
            project={selectedProject}
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            onProjectUpdated={handleProjectUpdated}
          />
          <ProjectDeleteModal
            project={selectedProject}
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            onProjectDeleted={handleProjectDeleted}
          />
        </>
      )}
    </>
  );
}