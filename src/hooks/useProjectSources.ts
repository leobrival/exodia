"use client";

import { useState, useEffect, useCallback } from "react";
import { getProjectDocuments, checkProjectHasSources, type Document } from "@/lib/actions/documents";
import { toast } from "sonner";

export interface UseProjectSourcesReturn {
  documents: Document[];
  loading: boolean;
  error: string | null;
  hasSources: boolean;
  refreshDocuments: () => Promise<void>;
  isRefreshing: boolean;
}

export function useProjectSources(projectId: string | null): UseProjectSourcesReturn {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSources, setHasSources] = useState(false);

  const fetchDocuments = useCallback(async (showToast = false) => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('[useProjectSources] Fetching documents for project:', projectId);

      const { data, error: fetchError } = await getProjectDocuments(projectId);

      if (fetchError) {
        console.error('[useProjectSources] Error fetching documents:', fetchError);
        setError("Erreur lors du chargement des documents");
        if (showToast) {
          toast.error("Erreur lors du chargement des documents");
        }
        return;
      }

      const documentsList = data || [];
      setDocuments(documentsList);
      setHasSources(documentsList.filter(doc => doc.status === 'ready').length > 0);

      console.log('[useProjectSources] Documents loaded:', {
        total: documentsList.length,
        ready: documentsList.filter(doc => doc.status === 'ready').length
      });

      if (showToast && documentsList.length > 0) {
        toast.success(`${documentsList.length} document(s) chargé(s)`);
      }

    } catch (err) {
      console.error('[useProjectSources] Unexpected error:', err);
      const errorMessage = "Erreur inattendue lors du chargement des documents";
      setError(errorMessage);
      if (showToast) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const refreshDocuments = useCallback(async () => {
    setIsRefreshing(true);
    await fetchDocuments(true);
    setIsRefreshing(false);
  }, [fetchDocuments]);

  // Charger les documents au montage du composant
  useEffect(() => {
    if (projectId) {
      fetchDocuments();
    } else {
      setDocuments([]);
      setHasSources(false);
      setError(null);
    }
  }, [projectId, fetchDocuments]);

  // Fonction pour vérifier périodiquement les sources (utile pour les documents en traitement)
  useEffect(() => {
    if (!projectId || documents.length === 0) return;

    const hasProcessingDocs = documents.some(doc => doc.status === 'processing');
    
    if (!hasProcessingDocs) return;

    console.log('[useProjectSources] Found processing documents, setting up periodic check');

    const interval = setInterval(() => {
      console.log('[useProjectSources] Checking for document updates...');
      fetchDocuments();
    }, 10000); // Vérifier toutes les 10 secondes

    return () => {
      console.log('[useProjectSources] Clearing periodic check interval');
      clearInterval(interval);
    };
  }, [documents, projectId, fetchDocuments]);

  return {
    documents,
    loading,
    error,
    hasSources,
    refreshDocuments,
    isRefreshing
  };
}