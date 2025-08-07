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
import { Project, deleteProject } from "@/lib/actions/projects";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";

interface ProjectDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onProjectDeleted: (project: Project) => void;
}

export default function ProjectDeleteModal({
  open,
  onOpenChange,
  project,
  onProjectDeleted,
}: ProjectDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!project) return;

    setIsDeleting(true);

    try {
      const { error } = await deleteProject(project.id);

      if (error) {
        console.error("Error deleting project:", error);
        toast.error("Erreur lors de la suppression du projet");
        return;
      }

      toast.success("Projet supprimé avec succès");
      onProjectDeleted(project);
      onOpenChange(false);

    } catch (error) {
      console.error("Unexpected error deleting project:", error);
      toast.error("Erreur inattendue lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Supprimer le projet</DialogTitle>
              <DialogDescription className="mt-1">
                Cette action est irréversible
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer le projet{" "}
            <span className="font-medium text-foreground">
              "{project?.name}"
            </span>
            ? 
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Toutes les sources et données associées seront définitivement perdues.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="min-w-[120px]"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              "Supprimer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}