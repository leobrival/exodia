"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { updateProject } from "@/lib/actions/projects";
import {
  ArrowLeft,
  Check,
  Edit2,
  ExternalLink,
  Globe,
  HelpCircle,
  MessageCircle,
  Monitor,
  Moon,
  Settings,
  Sun,
  User,
  X,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
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
  const { setTheme, theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(project.name);
  const [language, setLanguage] = useState<"fr" | "en">("fr");

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push("/projects")}
          className="flex items-center gap-2 rounded-full bg-card hover:bg-card/90 duration-300 cursor-pointer border-none transition-all shadow-none"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 rounded-full bg-card hover:bg-card/90 duration-300 cursor-pointer border-none transition-all shadow-none"
            >
              <Settings className="h-4 w-4" />
              Paramètres
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() =>
                window.open("https://notebooklm.google.com", "_blank")
              }
              className="cursor-pointer flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Aide NotebookLM</span>
              <ExternalLink className="h-3 w-3 ml-auto" />
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => toast.info("Fonctionnalité de feedback à venir")}
              className="cursor-pointer flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Envoyer des commentaires</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => window.open("https://discord.gg/exodia", "_blank")}
              className="cursor-pointer flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Discord</span>
              <ExternalLink className="h-3 w-3 ml-auto" />
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Langue de sortie</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => {
                    setLanguage("fr");
                    toast.success("Langue changée vers Français");
                  }}
                  className="cursor-pointer flex items-center gap-2"
                >
                  <span className="text-base">🇫🇷</span>
                  <span>Français</span>
                  {language === "fr" && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setLanguage("en");
                    toast.success("Language changed to English");
                  }}
                  className="cursor-pointer flex items-center gap-2"
                >
                  <span className="text-base">🇺🇸</span>
                  <span>English</span>
                  {language === "en" && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer flex items-center gap-2">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span>Mode sombre</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => setTheme("light")}
                  className="cursor-pointer flex items-center gap-2"
                >
                  <Sun className="h-4 w-4" />
                  <span>Mode clair</span>
                  {theme === "light" && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("dark")}
                  className="cursor-pointer flex items-center gap-2"
                >
                  <Moon className="h-4 w-4" />
                  <span>Mode sombre</span>
                  {theme === "dark" && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("system")}
                  className="cursor-pointer flex items-center gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  <span>Système</span>
                  {theme === "system" && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() =>
                toast.info("Upgrade vers Plus - Fonctionnalité à venir")
              }
              className="cursor-pointer flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              <span>Passer à Plus</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Avatar className="h-10 w-10">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
