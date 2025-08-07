"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteProject, updateProject } from "@/lib/actions/projects";
import {
  ArrowLeft,
  Check,
  Edit2,
  Settings,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface ProjectHeaderProps {
  project: {
    id: string;
    name: string;
    description?: string;
  };
  onProjectUpdate?: (updatedProject: {
    name: string;
    description?: string;
  }) => void;
}

export default function ProjectHeader({
  project,
  onProjectUpdate,
}: ProjectHeaderProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(project.name);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedName(project.name);
  };

  const handleSave = async () => {
    if (!editedName.trim()) {
      toast.error("Le nom du projet ne peut pas être vide");
      return;
    }

    if (editedName === project.name) {
      setIsEditing(false);
      return;
    }

    try {
      const { data, error } = await updateProject(project.id, {
        name: editedName,
      });

      if (error) {
        console.error("Error updating project:", error);
        toast.error("Erreur lors de la mise à jour du projet");
        return;
      }

      if (data) {
        toast.success("Projet mis à jour avec succès");
        onProjectUpdate?.({
          name: editedName,
          description: project.description,
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Erreur lors de la mise à jour du projet");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName(project.name);
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible."
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      const { error } = await deleteProject(project.id);

      if (error) {
        console.error("Error deleting project:", error);
        toast.error("Erreur lors de la suppression du projet");
        setIsDeleting(false);
        return;
      }

      toast.success("Projet supprimé avec succès");
      router.push("/projects");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Erreur lors de la suppression du projet");
      setIsDeleting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <header className="border-b bg-card/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/projects")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux projets
          </Button>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-xl font-bold min-w-[300px]"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  className="text-green-600 hover:text-green-700"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="opacity-60 hover:opacity-100"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Suppression..." : "Supprimer"}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.info("Paramètres du projet - Fonctionnalité à venir")
            }
            className="flex items-center gap-2 rounded-full"
          >
            <Settings className="h-4 w-4" />
            Paramètres
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
