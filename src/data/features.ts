import { z } from "zod";

export const featuresSchema = z.array(
  z.object({
    id: z.string().min(1).max(55),
    icon: z.string().min(1).max(55),
    title: z.string().min(1).max(55),
    description: z.string().min(1).max(200),
    // Image is optional for now
    image: z.string().min(1).max(55).optional(),
  })
);

export const features = featuresSchema.parse([
  {
    id: "1",
    icon: "FileStack",
    title: "Rédaction d'appels à projets",
    description:
      "Importez des PDF, des sites Web, des vidéos Youtube, des fichiers audio, des documents Google Docs ou des documents Google Sheets. Exodia les résumera et établira des liens intéressants.",
  },
  {
    id: "2",
    icon: "Zap",
    title: "Insights instantanés",
    description:
      "Une fois toutes vos ressources mises en place, Exodia se met au travail et devient un expert IA personnalisé dans le domaine de la rédaction d'appels à projets.",
  },
  {
    id: "3",
    icon: "Eye",
    title: "Voir la source, pas seulement la réponse",
    description:
      "Ayez confiance en chaque réponse. Exodia fournit des citations claires pour son travail, en affichant les extraits exacts de vos sources.",
  },
]);
