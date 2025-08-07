import { z } from "zod";

export const usesSchema = z.array(
  z.object({
    id: z.string().min(1).max(55),
    icon: z.string(),
    title: z.string(),
    description: z.string(),
  })
);

export const uses = usesSchema.parse([
  {
    id: "1",
    title: "Étudier en détail",
    icon: "Search",
    description:
      "Exodia est un outil moderne pour la rédaction d'appels à projets",
  },
  {
    id: "2",
    title: "Organiser vos idées",
    icon: "List",
    description:
      "Exodia est un outil moderne pour la rédaction d'appels à projets",
  },
  {
    id: "3",
    title: "Rédiger en toute simplicité",
    icon: "Lightbulb",
    description:
      "Exodia est un outil moderne pour la rédaction d'appels à projets",
  },
]);
