"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useProjectDocumentsCount } from "@/hooks/useProjectDocuments";
import { Project } from "@/lib/actions/projects";
import {
  formatProjectDate,
  formatSourcesCount,
  getProjectTheme,
} from "@/lib/project-themes";
import Link from "next/link";
import { useState } from "react";
import ProjectActionsMenu from "./project-actions-menu";
import ProjectDeleteModal from "./project-delete-modal";
import ProjectEditModal from "./project-edit-modal";

interface ProjectCardProps {
  project: Project;
  onProjectUpdated?: (updatedProject: Project) => void;
  onProjectDeleted?: (project: Project) => void;
}

// TODO : Ajouter un bouton actions sur la card du projet (supprimer le projet, modifier le nom via une modal)
// TODO : La card doit être cliquable et rediriger vers la page du projet via son id
// TODO : Un emoji doit être défini en fonction du projet (défaut : 📄)
// TODO : Le titre doit être sur 2 ligne max avec ...
// TODO : Ne pas afficher la description
// TODO : Le nombre de sources doit être affiché
// TODO : Ne pas faire d'état de hover sur la card
// TODO : Définie une liste d'emoji pour les projets avec les couleurs tailwind complémentaire en -100 (ex : 📄 -> bg-red-100 text-black) (Tech, Science, Business, etc.)

export default function ProjectCard({
  project,
  onProjectUpdated,
  onProjectDeleted,
}: ProjectCardProps) {
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
    onProjectUpdated?.(updatedProject);
  };

  const handleProjectDeleted = (deletedProject: Project) => {
    onProjectDeleted?.(deletedProject);
  };

  return (
    <>
      <Link
        href={`/projects/${project.id}`}
        className="block aspect-[3/2] h-full w-full"
      >
        <Card
          className={`cursor-pointer w-full h-full select-none border-none rounded-xl aspect-[3/2] shadow-none ${theme.bgLight} ${theme.bgDark}`}
        >
          <CardHeader className="flex-1 flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-5xl">{theme.emoji}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <ProjectActionsMenu
                project={project}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          </CardHeader>
          <div className="flex-1 flex flex-col justify-between">
            <CardContent className="px-6 pt-0 pb-2">
              <div className="min-w-0 flex-1">
                <h3
                  className={`text-foreground font-medium text-2xl line-clamp-2 leading-tight`}
                >
                  {project.name}
                </h3>
              </div>
            </CardContent>
            <CardFooter>
              <div className={`text-sm opacity-75 text-foreground`}>
                {/* ✅ TODO : Si le nombre de sources est de 0 ou 1 mettre les textes au singulier */}
                {/* ✅ TODO : Le format de date sera 18 mai 2025 */}
                {formatProjectDate(project.created_at)} •{" "}
                {formatSourcesCount(documentsCount)}
              </div>
            </CardFooter>
          </div>
        </Card>
      </Link>

      <ProjectEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        project={selectedProject}
        onProjectUpdated={handleProjectUpdated}
      />

      <ProjectDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        project={selectedProject}
        onProjectDeleted={handleProjectDeleted}
      />
    </>
  );
}
