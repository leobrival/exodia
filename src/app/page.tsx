import { UserNav } from "@/components/auth/user-nav";
import { Button } from "@/components/ui/button";
import { features } from "@/data/features";
import { uses } from "@/data/uses";
import { env } from "@/env";
import * as Icons from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { z } from "zod";

// Render a Lucide icon by its name string
// Example: <Icon name="FileStack" />

type IconName = keyof typeof Icons;

type IconProps = {
  name: keyof typeof Icons | string;
  className?: string;
  size?: number | string;
};

function Icon({ name, className, size = 24, ...props }: IconProps) {
  // @ts-ignore - dynamic access
  const LucideIcon = (Icons as Record<string, any>)[name];
  if (!LucideIcon) return null;
  return <LucideIcon className={className} size={size} {...props} />;
}

const metadataSchema = z.object({
  title: z.string().min(1).max(55),
  description: z.string().min(1).max(160),
});

const metadata = metadataSchema.parse({
  title: "Exodia",
  description:
    "Exodia est un outil moderne pour la rédaction d'appels à projets",
});

export default function Home() {
  return (
    <>
      <nav className="flex flex-row w-full justify-between items-center p-4">
        <div className="flex items-center gap-2">
          <Image src="/images/exodia.png" alt="Exodia" width={32} height={32} />
          <span className="font-bold text-xl">Exodia</span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="#features"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Fonctionnalités
          </Link>
          <Link
            href="#pricing"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Tarifs
          </Link>
          <UserNav />
        </div>
      </nav>
      <header>
        <h1>Vous allez tout comprendre</h1>
        <p>Votre partenaire pour la rédaction d'appels à projets</p>
        <Button asChild>
          <Link href="/projects">Try {env.NEXT_PUBLIC_APP_NAME}</Link>
        </Button>
      </header>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div>
          {features.map((feature) => (
            <div key={feature.id} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Icon name={feature.icon} />
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
              <div className="relative w-full h-full">
                <Image src="/images/exodia.png" alt="Exodia" fill />
              </div>
            </div>
          ))}

          <div className="grid grid-cols-3 gap-4">
            {uses.map((item) => (
              <div key={item.id} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Icon name={item.icon} />
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <footer></footer>
    </>
  );
}
