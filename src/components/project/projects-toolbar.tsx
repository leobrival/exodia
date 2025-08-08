"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjectsParams, type SortBy, type ViewMode } from "@/hooks/use-projects-params";
import {
  ChevronDown,
  Grid3X3,
  List,
  Plus,
  SortAsc,
  SortDesc,
} from "lucide-react";

interface ProjectsToolbarProps {
  projectsCount: number;
  onCreateProject: () => void;
  className?: string;
}

export default function ProjectsToolbar({
  projectsCount,
  onCreateProject,
  className,
}: ProjectsToolbarProps) {
  const {
    viewMode,
    sortBy,
    sortOrder,
    sortLabel,
    isCardView,
    isDescending,
    setViewMode,
    setSorting,
  } = useProjectsParams();

  const handleSortChange = (newSortBy: SortBy) => {
    // Si on clique sur le même critère, on inverse l'ordre
    if (newSortBy === sortBy) {
      setSorting(newSortBy, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Sinon, on utilise l'ordre par défaut pour ce critère
      const defaultOrder = newSortBy === 'date' ? 'desc' : 'asc';
      setSorting(newSortBy, defaultOrder);
    }
  };

  const handleViewToggle = () => {
    const newView: ViewMode = isCardView ? 'list' : 'card';
    setViewMode(newView);
  };

  return (
    <div className={`flex items-center justify-between gap-4 ${className || ""}`}>
      {/* Section gauche : Bouton créer */}
      <div className="flex items-center gap-4">
        <Button onClick={onCreateProject} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Créer
        </Button>
      </div>

      {/* Section droite : Filtres et vue */}
      <div className="flex items-center gap-3">
        {/* Compteur de projets */}
        <span className="text-sm text-muted-foreground">
          {projectsCount === 0 
            ? "Aucun projet" 
            : projectsCount === 1 
            ? "1 projet" 
            : `${projectsCount} projets`
          }
        </span>

        {/* Menu de tri */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              {isDescending ? (
                <SortDesc className="h-4 w-4" />
              ) : (
                <SortAsc className="h-4 w-4" />
              )}
              Trier par : {sortLabel}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleSortChange('title')}
              className="cursor-pointer flex items-center gap-2"
            >
              <span>Titre</span>
              {sortBy === 'title' && (
                <div className="ml-auto">
                  {sortOrder === 'asc' ? (
                    <SortAsc className="h-3 w-3" />
                  ) : (
                    <SortDesc className="h-3 w-3" />
                  )}
                </div>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleSortChange('date')}
              className="cursor-pointer flex items-center gap-2"
            >
              <span>Date</span>
              {sortBy === 'date' && (
                <div className="ml-auto">
                  {sortOrder === 'asc' ? (
                    <SortAsc className="h-3 w-3" />
                  ) : (
                    <SortDesc className="h-3 w-3" />
                  )}
                </div>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Toggle vue Card/List */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleViewToggle}
          aria-label={isCardView ? "Passer à la vue liste" : "Passer à la vue cartes"}
        >
          {isCardView ? (
            <List className="h-4 w-4" />
          ) : (
            <Grid3X3 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}