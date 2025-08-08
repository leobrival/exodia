import { useCallback, useEffect, useRef, useState } from 'react';
import { getProjectNotes, type ProjectNote } from '@/lib/actions/project-notes';

export interface UseProjectNotesReturn {
  notes: ProjectNote[];
  loading: boolean;
  error: string | null;
  activeNotesCount: number;
  totalNotesCount: number;
  refreshNotes: (showToast?: boolean) => Promise<void>;
}

export function useProjectNotes(projectId: string | null): UseProjectNotesReturn {
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Utiliser useRef pour maintenir une référence stable à projectId
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;

  // Log seulement quand les états importants changent
  useEffect(() => {
    console.log('[DEBUG] useProjectNotes state changed:', {
      projectId,
      currentNotesCount: notes.length,
      loading,
      hasError: !!error
    });
  }, [projectId, notes.length, loading, error]);

  const fetchNotes = useCallback(async (showToast = false) => {
    const currentProjectId = projectIdRef.current;
    
    console.log('[DEBUG] fetchNotes called:', {
      projectId: currentProjectId,
      showToast
    });
    
    if (!currentProjectId) {
      console.log('[DEBUG] No projectId provided, resetting notes state');
      setNotes([]);
      setError(null);
      return;
    }
    
    console.log('[DEBUG] Starting to fetch notes, setting loading state');
    setLoading(true);
    setError(null);

    try {
      console.log('[DEBUG] Calling getProjectNotes API for project:', currentProjectId);
      
      const { data, error: fetchError } = await getProjectNotes(currentProjectId);
      
      console.log('[DEBUG] getProjectNotes API response:', {
        hasData: !!data,
        dataLength: data?.length || 0,
        hasError: !!fetchError,
        errorType: fetchError ? typeof fetchError : 'none'
      });
      
      if (fetchError) {
        console.error('[useProjectNotes] Error fetching notes:', fetchError);
        setError('Erreur lors du chargement des notes');
        return;
      }

      const notesList = data || [];
      setNotes(notesList);

      console.log('[useProjectNotes] Notes loaded:', {
        total: notesList.length,
        active: notesList.filter(note => note.is_active).length
      });

      if (showToast && notesList.length > 0) {
        // Toast optionnel pour indiquer le rechargement
        console.log('[useProjectNotes] Notes refreshed successfully');
      }

    } catch (err) {
      console.error('[useProjectNotes] Unexpected error:', err);
      setError('Erreur inattendue lors du chargement des notes');
    } finally {
      setLoading(false);
    }
  }, []); // Pas de dépendances pour stabiliser la fonction

  // Charger automatiquement les notes quand projectId change
  useEffect(() => {
    if (projectId) {
      fetchNotes();
    } else {
      // Reset state si pas de projectId
      setNotes([]);
      setError(null);
    }
  }, [projectId]); // Seulement projectId dans les dépendances

  // Calculer les statistiques
  const activeNotesCount = notes.filter(note => note.is_active).length;
  const totalNotesCount = notes.length;

  return {
    notes,
    loading,
    error,
    activeNotesCount,
    totalNotesCount,
    refreshNotes: fetchNotes,
  };
}