export interface ProjectTheme {
  emoji: string;
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
  name: string;
}

export const PROJECT_THEMES: Record<string, ProjectTheme> = {
  business: {
    emoji: "💼",
    bgLight: "bg-blue-100/75",
    bgDark: "bg-blue-950",
    textLight: "text-foreground",
    textDark: "text-foreground",
    name: "Business",
  },
  tech: {
    emoji: "💻",
    bgLight: "bg-green-100/75",
    bgDark: "bg-green-950",
    textLight: "text-black",
    textDark: "text-white",
    name: "Technology",
  },
  science: {
    emoji: "🔬",
    bgLight: "bg-purple-100/75",
    bgDark: "bg-purple-950",
    textLight: "text-black",
    textDark: "text-white",
    name: "Science",
  },
  marketing: {
    emoji: "📢",
    bgLight: "bg-orange-100/75",
    bgDark: "bg-orange-950",
    textLight: "text-black",
    textDark: "text-white",
    name: "Marketing",
  },
  education: {
    emoji: "📚",
    bgLight: "bg-yellow-100/75",
    bgDark: "bg-yellow-950",
    textLight: "text-black",
    textDark: "text-white",
    name: "Education",
  },
  health: {
    emoji: "🏥",
    bgLight: "bg-red-100/75",
    bgDark: "bg-red-950",
    textLight: "text-black",
    textDark: "text-white",
    name: "Health",
  },
  finance: {
    emoji: "💰",
    bgLight: "bg-emerald-100/75",
    bgDark: "bg-emerald-950",
    textLight: "text-black",
    textDark: "text-white",
    name: "Finance",
  },
  legal: {
    emoji: "⚖️",
    bgLight: "bg-gray-100/75",
    bgDark: "bg-gray-950",
    textLight: "text-black",
    textDark: "text-white",
    name: "Legal",
  },
  environment: {
    emoji: "🌱",
    bgLight: "bg-lime-100/75",
    bgDark: "bg-lime-950",
    textLight: "text-black",
    textDark: "text-white",
    name: "Environment",
  },
  art: {
    emoji: "🎨",
    bgLight: "bg-pink-100/75",
    bgDark: "bg-pink-950",
    textLight: "text-black",
    textDark: "text-white",
    name: "Art & Culture",
  },
  sports: {
    emoji: "⚽",
    bgLight: "bg-indigo-100/75",
    bgDark: "bg-indigo-950",
    textLight: "text-black",
    textDark: "text-white",
    name: "Sports",
  },
  food: {
    emoji: "🍽️",
    bgLight: "bg-amber-100/75",
    bgDark: "bg-amber-950",
    textLight: "text-black",
    textDark: "text-white",
    name: "Food & Beverage",
  },
  travel: {
    emoji: "✈️",
    bgLight: "bg-sky-100/75",
    bgDark: "bg-sky-950",
    textLight: "text-black",
    textDark: "text-white",
    name: "Travel & Tourism",
  },
  default: {
    emoji: "📄",
    bgLight: "bg-slate-100/75",
    bgDark: "bg-slate-950",
    textLight: "text-black",
    textDark: "text-white",
    name: "Document",
  },
};

/**
 * Get project theme based on project name or description
 * Uses simple keyword matching to determine the most appropriate theme
 */
export function getProjectTheme(
  projectName: string,
  projectDescription?: string
): ProjectTheme {
  const text = `${projectName} ${projectDescription || ""}`.toLowerCase();

  // Keywords for each theme
  const themeKeywords: Record<string, string[]> = {
    business: [
      "business",
      "entreprise",
      "company",
      "startup",
      "commercial",
      "marché",
      "strategy",
    ],
    tech: [
      "tech",
      "software",
      "development",
      "app",
      "digital",
      "ai",
      "intelligence",
      "code",
      "web",
    ],
    science: [
      "research",
      "science",
      "recherche",
      "study",
      "analysis",
      "laboratory",
      "innovation",
    ],
    marketing: [
      "marketing",
      "advertising",
      "communication",
      "brand",
      "campaign",
      "social media",
    ],
    education: [
      "education",
      "formation",
      "learning",
      "course",
      "training",
      "school",
      "university",
    ],
    health: [
      "health",
      "medical",
      "healthcare",
      "hospital",
      "medicine",
      "santé",
      "médical",
    ],
    finance: [
      "finance",
      "investment",
      "bank",
      "money",
      "budget",
      "économie",
      "financial",
    ],
    legal: [
      "legal",
      "law",
      "juridique",
      "contract",
      "compliance",
      "regulation",
      "droit",
    ],
    environment: [
      "environment",
      "green",
      "sustainable",
      "ecology",
      "climat",
      "renewable",
    ],
    art: [
      "art",
      "design",
      "creative",
      "culture",
      "music",
      "film",
      "exhibition",
    ],
    sports: ["sport", "fitness", "athletic", "competition", "team", "exercise"],
    food: ["food", "restaurant", "cooking", "culinary", "nutrition", "cuisine"],
    travel: ["travel", "tourism", "voyage", "hotel", "destination", "holiday"],
  };

  // Find the theme with the most keyword matches
  let bestTheme = "default";
  let bestScore = 0;

  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    const score = keywords.reduce((acc, keyword) => {
      return acc + (text.includes(keyword) ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestTheme = theme;
    }
  }

  return PROJECT_THEMES[bestTheme];
}

/**
 * Get all available themes for selection
 */
export function getAllThemes(): Array<{ key: string; theme: ProjectTheme }> {
  return Object.entries(PROJECT_THEMES).map(([key, theme]) => ({ key, theme }));
}

/**
 * Format project date in French format (18 mai 2025)
 */
export function formatProjectDate(dateString: string): string {
  const date = new Date(dateString);

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format sources count with proper French pluralization
 */
export function formatSourcesCount(count: number): string {
  if (count === 0) {
    return "aucune source";
  } else if (count === 1) {
    return "1 source";
  } else {
    return `${count} sources`;
  }
}
