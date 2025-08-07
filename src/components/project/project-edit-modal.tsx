"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Project, updateProject } from "@/lib/actions/projects";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProjectEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onProjectUpdated: (updatedProject: Project) => void;
}

export default function ProjectEditModal({
  open,
  onOpenChange,
  project,
  onProjectUpdated,
}: ProjectEditModalProps) {
  const [name, setName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Mettre à jour le nom quand le projet change
  useState(() => {
    if (project && open) {
      setName(project.name);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!project) return;
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Le nom du projet ne peut pas être vide");
      return;
    }

    if (trimmedName === project.name) {
      onOpenChange(false);
      return;
    }

    setIsUpdating(true);

    try {
      const { data, error } = await updateProject(project.id, { name: trimmedName });

      if (error) {
        console.error("Error updating project:", error);
        toast.error("Erreur lors de la mise à jour du projet");
        return;
      }

      if (!data) {
        toast.error("Aucune donnée retournée lors de la mise à jour");
        return;
      }

      toast.success("Projet mis à jour avec succès");
      onProjectUpdated(data);
      onOpenChange(false);

    } catch (error) {
      console.error("Unexpected error updating project:", error);
      toast.error("Erreur inattendue lors de la mise à jour");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    if (!isUpdating) {
      onOpenChange(false);
      if (project) {
        setName(project.name); // Reset au nom original
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !isUpdating) {
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" onKeyDown={handleKeyDown}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Modifier le projet</DialogTitle>
            <DialogDescription>
              Modifiez le nom de votre projet. Cliquez sur Enregistrer quand vous avez terminé.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="project-name" className="text-sm font-medium">
              Nom du projet
            </Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Entrez le nom du projet"
              className="mt-2"
              disabled={isUpdating}
              autoFocus
              maxLength={100}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUpdating}
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              disabled={isUpdating || !name.trim() || name.trim() === project?.name}
              className="min-w-[100px]"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}