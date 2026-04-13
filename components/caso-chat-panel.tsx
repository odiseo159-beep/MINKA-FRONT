"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, User, AlertCircle, FileText } from "lucide-react";
import { casoChatApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CasoChatPanelProps {
  casoId: number;
  tieneDocumento: boolean;
}

const SUGERENCIAS = [
  "¿Cuáles son los próximos pasos en este caso?",
  "¿Qué documentos necesito preparar?",
  "¿Cuál es el plazo legal para la siguiente etapa?",
  "¿Qué artículos del código aplican aquí?",
];

export function CasoChatPanel({ casoId, tieneDocumento }: CasoChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const token = useAuthStore((state) => state.token);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const enviarMensaje = useCallback(async (texto: string) => {
    const pregunta = texto.trim();
    if (!pregunta || isLoading) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: pregunta }]);
    setIsLoading(true);

    try {
      const { respuesta } = await casoChatApi.preguntar(casoId, pregunta, token || undefined);
      setMessages((prev) => [...prev, { role: "assistant", content: respuesta }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al consultar la IA. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [casoId, isLoading, token]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje(input);
    }
  }, [enviarMensaje, input]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ minHeight: "420px" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className="w-8 h-8 bg-minka-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-minka-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900">Consultar caso con IA</h2>
          <p className="text-xs text-gray-400">
            {tieneDocumento
              ? "Minka tiene acceso al documento del caso"
              : "Haz preguntas sobre el proceso, plazos y estrategia"}
          </p>
        </div>
        {tieneDocumento && (
          <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full flex-shrink-0">
            <FileText className="w-3 h-3" />
            <span>Doc. cargado</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ maxHeight: "380px" }}>
        {messages.length === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 text-center pt-2">
              Pregunta sobre el caso, los próximos pasos o la normativa aplicable.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => enviarMensaje(s)}
                  className="text-left text-xs text-gray-600 bg-gray-50 hover:bg-minka-50 hover:text-minka-700 border border-gray-200 hover:border-minka-200 rounded-lg px-3 py-2 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 bg-minka-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-minka-600" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-minka-500 text-white rounded-tr-sm"
                  : "bg-gray-100 text-gray-800 rounded-tl-sm"
              }`}
            >
              {msg.content}
            </div>

            {msg.role === "user" && (
              <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 bg-minka-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-minka-600" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-100">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
            placeholder="Escribe tu pregunta... (Enter para enviar)"
            className="flex-1 resize-none px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none disabled:opacity-50 max-h-28 overflow-y-auto"
            style={{ lineHeight: "1.5" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
            }}
          />
          <button
            type="button"
            onClick={() => enviarMensaje(input)}
            disabled={isLoading || !input.trim()}
            className="p-2.5 bg-minka-500 text-white rounded-xl hover:bg-minka-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            title="Enviar (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          Las respuestas son orientativas. Verifica siempre con las fuentes oficiales.
        </p>
      </div>
    </div>
  );
}
