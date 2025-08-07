"use client";

import { useState, useEffect, useCallback } from "react";
import { getProjectDocuments } from "@/lib/actions/documents";

export interface UseProjectDocumentsReturn {
  documentsCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProjectDocuments(projectId: string | null): UseProjectDocumentsReturn {
  const [documentsCount, setDocumentsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!projectId) {
      setDocumentsCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[useProjectDocuments] Fetching documents for project:', projectId);

      const { data, error: fetchError } = await getProjectDocuments(projectId);

      if (fetchError) {
        console.error('[useProjectDocuments] Error fetching documents:', fetchError);
        setError("Erreur lors du chargement des documents");
        return;
      }

      const count = data?.length || 0;
      setDocumentsCount(count);

      console.log('[useProjectDocuments] Documents count:', count);

    } catch (err) {
      console.error('[useProjectDocuments] Unexpected error:', err);
      setError("Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const refresh = useCallback(async () => {
    await fetchDocuments();
  }, [fetchDocuments]);

  // Charger les documents au montage et quand le projectId change
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documentsCount,
    loading,
    error,
    refresh
  };
}

/**
 * Hook simplifiée pour récupérer uniquement le count des documents
 * Optimisé pour les ProjectCard où on n'a besoin que du nombre
 */
export function useProjectDocumentsCount(projectId: string | null): number {
  const { documentsCount } = useProjectDocuments(projectId);
  return documentsCount;
}