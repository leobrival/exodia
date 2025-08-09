"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  createNote,
  deleteNote,
  getProjectNotes,
  toggleNoteActive,
  updateNote,
  type ProjectNote,
} from "@/lib/actions/project-notes";
import {
  Edit3,
  FileText,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface CustomNotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

interface NoteFormData {
  title: string;
  content: string;
  tags: string[];
  is_active: boolean;
}

const initialFormData: NoteFormData = {
  title: "",
  content: "",
  tags: [],
  is_active: true,
};

export default function CustomNotesModal({
  open,
  onOpenChange,
  projectId,
}: CustomNotesModalProps) {
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // État du formulaire
  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState<ProjectNote | null>(null);
  const [formData, setFormData] = useState<NoteFormData>(initialFormData);
  const [tagInput, setTagInput] = useState("");

  // Récupérer les notes du projet
  const fetchNotes = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const { data, error } = await getProjectNotes(projectId);
      
      if (error) {
        console.error("[CustomNotesModal] Error fetching notes:", error);
        toast.error("Erreur lors du chargement des notes");
        return;
      }
      
      setNotes(data || []);
      console.log("[CustomNotesModal] Notes loaded:", data?.length || 0);
    } catch (error) {
      console.error("[CustomNotesModal] Exception fetching notes:", error);
      toast.error("Erreur inattendue lors du chargement des notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && projectId) {
      fetchNotes();
    }
  }, [open, projectId]);

  // Filtrer les notes selon la recherche
  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.tags && note.tags.some(tag => 
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      ))
  );

  // Gestionnaires du formulaire
  const resetForm = () => {
    setFormData(initialFormData);
    setTagInput("");
    setIsEditing(false);
    setEditingNote(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[DEBUG] Custom modal form submission started:', {
      projectId,
      formData: {
        title: formData.title,
        content: formData.content.substring(0, 100) + '...',
        tags: formData.tags,
        is_active: formData.is_active
      },
      isEditing,
      editingNote: editingNote?.id
    });
    
    if (!formData.title.trim() || !formData.content.trim()) {
      console.log('[DEBUG] Custom modal form validation failed:', {
        titleLength: formData.title.trim().length,
        contentLength: formData.content.trim().length
      });
      toast.error("Titre et contenu sont requis");
      return;
    }

    try {
      if (isEditing && editingNote) {
        // Modification
        const { data, error } = await updateNote(editingNote.id, {
          title: formData.title,
          content: formData.content,
          tags: formData.tags,
          is_active: formData.is_active,
        });
        
        if (error) {
          toast.error("Erreur lors de la modification de la note");
          return;
        }
        
        toast.success("Note modifiée avec succès");
      } else {
        // Création
        const noteData = {
          project_id: projectId,
          title: formData.title,
          content: formData.content,
          tags: formData.tags,
          is_active: formData.is_active,
        };
        
        console.log('[DEBUG] Custom modal calling createNote API with data:', {
          ...noteData,
          content: noteData.content.substring(0, 100) + '...'
        });
        
        const { data, error } = await createNote(noteData);
        
        console.log('[DEBUG] Custom modal createNote API response:', {
          success: !!data,
          hasError: !!error,
          errorType: error ? typeof error : 'none',
          errorMessage: error?.message || 'none',
          dataId: data?.id || 'none'
        });
        
        if (error) {
          console.error('[DEBUG] Custom modal create note error details:', {
            error,
            errorString: JSON.stringify(error, null, 2),
            noteData: {
              ...noteData,
              content: noteData.content.substring(0, 100) + '...'
            }
          });
          toast.error("Erreur lors de la création de la note");
          return;
        }
        
        console.log('[DEBUG] Custom modal note created successfully:', {
          noteId: data?.id,
          title: data?.title
        });
        toast.success("Note créée avec succès");
      }
      
      resetForm();
      fetchNotes();
    } catch (error) {
      console.error("[CustomNotesModal] Error saving note:", error);
      toast.error("Erreur inattendue lors de la sauvegarde");
    }
  };

  const handleEdit = (note: ProjectNote) => {
    setEditingNote(note);
    setIsEditing(true);
    setFormData({
      title: note.title,
      content: note.content,
      tags: note.tags || [],
      is_active: note.is_active,
    });
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette note ?")) {
      return;
    }
    
    try {
      const { error } = await deleteNote(noteId);
      
      if (error) {
        toast.error("Erreur lors de la suppression de la note");
        return;
      }
      
      toast.success("Note supprimée avec succès");
      fetchNotes();
    } catch (error) {
      console.error("[CustomNotesModal] Error deleting note:", error);
      toast.error("Erreur inattendue lors de la suppression");
    }
  };

  const handleToggleActive = async (noteId: string, isActive: boolean) => {
    try {
      const { data, error } = await toggleNoteActive(noteId, isActive);
      
      if (error) {
        toast.error("Erreur lors de la modification du statut");
        return;
      }
      
      toast.success(`Note ${isActive ? "activée" : "désactivée"} pour le RAG`);
      fetchNotes();
    } catch (error) {
      console.error("[CustomNotesModal] Error toggling note:", error);
      toast.error("Erreur inattendue lors de la modification");
    }
  };

  // Gestion des tags
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addTag();
    }
  };

  const activeCount = notes.filter(note => note.is_active).length;

  // N'afficher rien si la modal n'est pas ouverte
  if (!open) {
    return null;
  }

  return (
    <>
      {/* Overlay de fond */}
      <div 
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="w-full max-w-[90vw] max-h-[85vh] bg-card rounded-2xl shadow-xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Notes du projet</h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {activeCount} active{activeCount !== 1 ? "s" : ""} pour le RAG
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 gap-6 p-6 overflow-hidden">
            {/* Panneau gauche - Liste des notes */}
            <div className="flex flex-col w-1/2 min-h-0">
              {/* Recherche */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans les notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Liste des notes */}
              <div className="flex-1 overflow-y-auto space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "Aucune note trouvée" : "Aucune note pour ce projet"}
                  </div>
                ) : (
                  filteredNotes.map((note) => (
                    <Card 
                      key={note.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        editingNote?.id === note.id ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Checkbox
                              checked={note.is_active}
                              onCheckedChange={(checked) =>
                                handleToggleActive(note.id, checked as boolean)
                              }
                              className="mt-1"
                            />
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-medium truncate">
                                {note.title}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {new Date(note.created_at).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(note)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(note.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {note.content}
                        </p>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {note.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            <Separator orientation="vertical" />

            {/* Panneau droit - Formulaire */}
            <div className="flex flex-col w-1/2 min-h-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">
                  {isEditing ? "Modifier la note" : "Nouvelle note"}
                </h3>
                {isEditing && (
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 space-y-4">
                {/* Titre */}
                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Titre de la note..."
                    required
                  />
                </div>

                {/* Contenu */}
                <div className="space-y-2 flex-1 flex flex-col">
                  <Label htmlFor="content">Contenu *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, content: e.target.value }))
                    }
                    placeholder="Contenu de la note..."
                    className="flex-1 resize-none"
                    required
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ajouter un tag..."
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {formData.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeTag(tag)}
                        >
                          {tag} <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Statut actif */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, is_active: checked as boolean }))
                    }
                  />
                  <Label htmlFor="is_active" className="text-sm">
                    Activer pour le RAG (la note sera utilisée par l'IA)
                  </Label>
                </div>

                {/* Boutons */}
                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Fermer
                  </Button>
                  <div className="flex gap-2">
                    {isEditing && (
                      <Button type="button" variant="ghost" onClick={resetForm}>
                        Annuler
                      </Button>
                    )}
                    <Button type="submit">
                      <Plus className="h-4 w-4 mr-2" />
                      {isEditing ? "Modifier" : "Créer"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}