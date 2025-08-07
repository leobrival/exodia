"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FileText, MessageSquare, Paperclip, Send, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: Array<{
    name: string;
    type: string;
    size: number;
  }>;
}

interface ChatInterfaceProps {
  hasSources: boolean;
  onAddSource: () => void;
  className?: string;
}

export default function ChatInterface({
  hasSources,
  onAddSource,
  className,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    if (!hasSources) {
      toast.error("Ajoutez d'abord des sources pour commencer la conversation");
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Simuler une réponse de l'IA
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: `Je comprends votre question : "${inputValue}". Basé sur les documents que vous avez fournis, voici ma réponse...

Cette fonctionnalité de chat avec l'IA sera implémentée prochainement avec une intégration RAG complète.`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        scrollToBottom();
      }, 1500);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erreur lors de l'envoi du message");
      setIsLoading(false);
    }

    scrollToBottom();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        toast.info("Glissez les fichiers vers la zone d'import des sources");
        onAddSource();
      }
    },
    [onAddSource]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/msword": [".doc"],
      "text/plain": [".txt"],
    },
    multiple: true,
  });

  if (!hasSources) {
    return (
      <div
        {...getRootProps()}
        className={cn(
          "min-h-full flex-1 flex flex-col items-center bg-white/50 rounded-3xl text-black justify-center text-center p-8 border-2 border-dashed transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25",
          className
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-muted">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">
              Commencez une conversation avec l'IA
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {isDragActive
                ? "Déposez vos fichiers ici pour les ajouter comme sources"
                : "Ajoutez d'abord des sources (PDF, DOCX, TXT) pour commencer à discuter avec l'IA sur vos documents"}
            </p>
          </div>

          {!isDragActive && (
            <div className="flex items-center gap-2">
              <Button onClick={onAddSource} className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Importer une source
              </Button>
              <p className="text-xs text-muted-foreground">
                ou glissez-déposez des fichiers
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-full flex-1 flex flex-col bg-white text-black rounded-3xl",
        className
      )}
    >
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Prêt à discuter !</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Vos sources sont chargées. Posez une question ou demandez une
              analyse de vos documents.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.type === "user" ? "justify-end" : "justify-start"
                )}
              >
                <Card
                  className={cn(
                    "max-w-[85%]",
                    message.type === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <CardContent className="p-3">
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p className="text-xs opacity-60 mt-2">
                      {message.timestamp.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <Card className="bg-muted">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        L'IA réfléchit...
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                hasSources
                  ? "Tapez votre message..."
                  : "Ajoutez d'abord des sources pour commencer"
              }
              className="resize-none min-h-[60px] pr-12"
              disabled={!hasSources || isLoading}
              rows={2}
            />

            <Button
              variant="ghost"
              size="sm"
              className="absolute bottom-2 right-2 h-8 w-8 p-0"
              onClick={onAddSource}
              title="Ajouter des documents"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || !hasSources || isLoading}
            className="self-end h-[60px] aspect-square p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <FileText className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Sources disponibles pour l'IA
          </span>
        </div>
      </div>
    </div>
  );
}
