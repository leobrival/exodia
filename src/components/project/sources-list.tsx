"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { deleteDocument, type Document } from "@/lib/actions/documents";
import {
  AlertCircle,
  Download,
  FileText,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import SourcesListSkeleton from "./sources-list-skeleton";

interface SourcesListProps {
  documents: Document[];
  loading: boolean;
  error: string | null;
  onAddSource: () => void;
}

export default function SourcesList({
  documents,
  loading,
  error,
  onAddSource,
}: SourcesListProps) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

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
    switch (fileType.toLowerCase()) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-500" />;
      case "docx":
      case "doc":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "txt":
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground/70" />;
    }
  };

  const getStatusBadge = (status: Document["status"]) => {
    switch (status) {
      case "ready":
        return (
          <Badge variant="default" className="bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300">
            Prêt
          </Badge>
        );
      case "processing":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 flex items-center gap-1"
          >
            <Loader2 className="h-3 w-3 animate-spin" />
            Traitement
          </Badge>
        );
      case "error":
        return (
          <Badge
            variant="destructive"
            className="bg-destructive/10 text-destructive dark:bg-destructive/20 flex items-center gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            Erreur
          </Badge>
        );
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const handleDelete = async (documentId: string, documentName: string) => {
    if (
      !window.confirm(`Êtes-vous sûr de vouloir supprimer "${documentName}" ?`)
    ) {
      return;
    }

    setDeletingIds((prev) => new Set([...prev, documentId]));

    try {
      const { error } = await deleteDocument(documentId);

      if (error) {
        console.error("Error deleting document:", error);
        toast.error("Erreur lors de la suppression du document");
        return;
      }

      toast.success("Document supprimé avec succès");
      // Realtime will handle the document removal automatically
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Erreur lors de la suppression du document");
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  if (loading) {
    return <SourcesListSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Les documents seront rechargés automatiquement
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col w-1/4 bg-card rounded-3xl text-card-foreground">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold">Sources</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune source</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ajoutez des documents pour commencer à travailler avec l'IA
            </p>
            <Button onClick={onAddSource} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Importer une source
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getFileIcon(doc.file_type)}
                      <div className="min-w-0 flex-1">
                        <h4
                          className="text-sm font-medium truncate"
                          title={doc.name}
                        >
                          {doc.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {doc.file_type.toUpperCase()} •{" "}
                          {formatFileSize(doc.file_size)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Ajouté le{" "}
                      {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                    </p>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Télécharger"
                        disabled={doc.status !== "ready"}
                      >
                        <Download className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                        title="Supprimer"
                        onClick={() => handleDelete(doc.id, doc.name)}
                        disabled={deletingIds.has(doc.id)}
                      >
                        {deletingIds.has(doc.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {doc.status === "error" && doc.error_message && (
                    <>
                      <Separator className="my-2" />
                      <p className="text-xs text-red-600">
                        {doc.error_message}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
