"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import { env } from "@/env";
import { createDocument } from "@/lib/actions/documents";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

interface FileUpload {
  file: File;
  id: string;
  status: "pending" | "uploading" | "processing" | "success" | "error";
  progress: number;
  error?: string;
}

interface NewSourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  currentSourcesCount?: number;
  onUploadComplete?: () => void;
}

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/msword": [".doc"],
  "text/plain": [".txt"],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_SOURCES = 10; // Limite du nombre de sources par projet

export default function NewSourceModal({
  open,
  onOpenChange,
  projectId,
  currentSourcesCount = 0,
  onUploadComplete,
}: NewSourceModalProps) {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Calcul du quota utilisé
  const pendingFilesCount = files.filter((f) => f.status === "pending").length;
  const totalSources = currentSourcesCount + pendingFilesCount;
  const remainingSources = Math.max(0, MAX_SOURCES - totalSources);
  const isAtLimit = totalSources >= MAX_SOURCES;

  const formatFileSize = (bytes: number): string => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "application/pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      case "application/msword":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "text/plain":
        return <FileText className="h-5 w-5 text-muted-foreground" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground/70" />;
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Gérer les fichiers rejetés
      rejectedFiles.forEach((rejected) => {
        const error = rejected.errors[0];
        if (error.code === "file-too-large") {
          toast.error(
            `${rejected.file.name}: Fichier trop volumineux (max 10MB)`
          );
        } else if (error.code === "file-invalid-type") {
          toast.error(`${rejected.file.name}: Type de fichier non supporté`);
        } else {
          toast.error(`${rejected.file.name}: Erreur inconnue`);
        }
      });

      // Vérifier la limite de sources
      const currentPendingCount = files.filter(
        (f) => f.status === "pending"
      ).length;
      const wouldExceedLimit =
        currentSourcesCount + currentPendingCount + acceptedFiles.length >
        MAX_SOURCES;

      if (wouldExceedLimit) {
        const availableSlots = Math.max(
          0,
          MAX_SOURCES - currentSourcesCount - currentPendingCount
        );
        toast.error(
          `Limite de ${MAX_SOURCES} sources atteinte. ${
            availableSlots > 0
              ? `Vous ne pouvez ajouter que ${availableSlots} source(s) supplémentaire(s).`
              : "Supprimez des sources pour en ajouter de nouvelles."
          }`
        );

        // Prendre seulement les fichiers qui rentrent dans la limite
        const allowedFiles = acceptedFiles.slice(0, availableSlots);
        if (allowedFiles.length === 0) return;
        acceptedFiles = allowedFiles;
      }

      // Ajouter les fichiers acceptés
      const newFiles: FileUpload[] = acceptedFiles.map((file) => ({
        file,
        id: `${Date.now()}-${Math.random()}`,
        status: "pending",
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files, currentSourcesCount]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const simulateUpload = async (fileUpload: FileUpload) => {
    const { file, id } = fileUpload;

    // Simuler l'upload avec progression
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: "uploading" as const } : f
      )
    );

    // Progression de l'upload
    for (let progress = 0; progress <= 100; progress += 20) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, progress } : f))
      );
    }

    // Simuler la création en base de données
    if (projectId) {
      try {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, status: "processing" as const } : f
          )
        );

        const { data, error } = await createDocument({
          project_id: projectId,
          name: file.name,
          file_type: file.name.split(".").pop() || "unknown",
          file_size: file.size,
          file_path: `/uploads/${projectId}/${Date.now()}-${file.name}`,
          metadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
          },
        });

        if (error) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === id
                ? {
                    ...f,
                    status: "error" as const,
                    error: "Erreur lors de la création du document",
                  }
                : f
            )
          );
          return false;
        }

        setFiles((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, status: "success" as const } : f
          )
        );
        return true;
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  status: "error" as const,
                  error: "Erreur lors de l'upload",
                }
              : f
          )
        );
        return false;
      }
    }

    return false;
  };

  const handleUpload = async () => {
    if (!projectId) {
      toast.error("ID de projet manquant");
      return;
    }

    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    try {
      const results = await Promise.all(
        pendingFiles.map((file) => simulateUpload(file))
      );

      const successCount = results.filter(Boolean).length;
      const errorCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} document(s) uploadé(s) avec succès`);
        onUploadComplete?.();
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} document(s) ont échoué`);
      }

      // Fermer la modal si tous les uploads ont réussi
      if (errorCount === 0) {
        setTimeout(() => {
          onOpenChange(false);
          setFiles([]);
        }, 1500);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    onOpenChange(false);
    setFiles([]);
  };

  const getStatusIcon = (status: FileUpload["status"]) => {
    switch (status) {
      case "uploading":
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: FileUpload["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">En attente</Badge>;
      case "uploading":
        return <Badge variant="default">Upload...</Badge>;
      case "processing":
        return <Badge variant="default">Traitement...</Badge>;
      case "success":
        return (
          <Badge variant="default" className="bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300">
            Succès
          </Badge>
        );
      case "error":
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[70vw] max-h-[80vh] flex flex-col rounded-3xl">
        <DialogHeader>
          <DialogTitle>Importer des sources</DialogTitle>
          <DialogDescription className="text-base">
            Les sources permettent à {env.NEXT_PUBLIC_APP_NAME} de baser ses ses
            réponses sur les informations qui vous intéressent le plus. <br />
            Exemples : plans marketing, ressources de cours, notes de recherche,
            transcriptions de réunions, documents commerciaux, etc.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Zone de drop */}
          <div
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-muted-foreground cursor-pointer transition-colors",
              isDragActive && !isAtLimit
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary",
              (isUploading || isAtLimit) && "pointer-events-none opacity-50",
              isAtLimit && "cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mb-4 text-muted-foreground" />
            {isAtLimit ? (
              <div className="text-center space-y-2">
                <p className="font-medium text-red-600">
                  Limite de sources atteinte
                </p>
                <p className="text-sm text-red-500">
                  Supprimez des sources existantes pour en ajouter de nouvelles
                </p>
              </div>
            ) : isDragActive ? (
              <p className="text-center">Déposez les fichiers ici...</p>
            ) : (
              <div className="text-center space-y-2">
                <p className="font-medium">Glissez-déposez vos fichiers ici</p>
                <p className="text-sm">ou cliquez pour sélectionner</p>
                <div className="flex flex-wrap justify-center gap-1 mt-2">
                  <Badge variant="outline">.PDF</Badge>
                  <Badge variant="outline">.DOCX</Badge>
                  <Badge variant="outline">.DOC</Badge>
                  <Badge variant="outline">.TXT</Badge>
                </div>
                {remainingSources < 5 && (
                  <p className="text-xs text-orange-600 mt-2">
                    Plus que {remainingSources} source
                    {remainingSources !== 1 ? "s" : ""} possible
                    {remainingSources !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Liste des fichiers */}
          {files.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="flex-1 overflow-y-auto space-y-2">
                <h4 className="font-medium text-sm">
                  Fichiers à uploader ({files.length})
                </h4>
                {files.map((fileUpload) => (
                  <div
                    key={fileUpload.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      {getFileIcon(fileUpload.file.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className="text-sm font-medium truncate"
                          title={fileUpload.file.name}
                        >
                          {fileUpload.file.name}
                        </p>
                        {getStatusIcon(fileUpload.status)}
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(fileUpload.file.size)}
                        </p>
                        {getStatusBadge(fileUpload.status)}
                      </div>

                      {(fileUpload.status === "uploading" ||
                        fileUpload.status === "processing") && (
                        <Progress
                          value={fileUpload.progress}
                          className="mt-2 h-1"
                        />
                      )}

                      {fileUpload.error && (
                        <p className="text-xs text-red-600 mt-1">
                          {fileUpload.error}
                        </p>
                      )}
                    </div>

                    {fileUpload.status === "pending" && !isUploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0"
                        onClick={() => removeFile(fileUpload.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Indicateur de quota des sources */}
        <div className="space-y-3 px-4">
          <div className="space-y-2 flex items-center gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              <p className="text-sm font-medium">Limite des sources</p>
            </div>
            <Progress
              value={(totalSources / MAX_SOURCES) * 100}
              className={cn(
                "w-full h-2",
                totalSources >= MAX_SOURCES - 1 && "[&_.bg-primary]:bg-red-500",
                totalSources >= MAX_SOURCES - 3 &&
                  totalSources < MAX_SOURCES - 1 &&
                  "[&_.bg-primary]:bg-orange-500"
              )}
            />
            <span className={cn("text-sm font-medium block")}>
              {totalSources} / {MAX_SOURCES}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            {files.some((f) => f.status === "success") ? "Fermer" : "Annuler"}
          </Button>

          <Button
            onClick={handleUpload}
            disabled={
              !files.some((f) => f.status === "pending") ||
              isUploading ||
              !projectId
            }
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Uploader ({files.filter((f) => f.status === "pending").length})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
