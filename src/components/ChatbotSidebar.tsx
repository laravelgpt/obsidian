import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, Note, ThemeSettings } from "../types";
import { 
  Bot, 
  Send, 
  Sparkles, 
  Plus, 
  Check, 
  Loader2, 
  RotateCcw, 
  Map, 
  BookOpen, 
  FileCheck 
} from "lucide-react";

interface ChatbotSidebarProps {
  activeNote: Note | null;
  notes: Note[];
  onAddNote: (title: string, content: string) => void;
  theme: ThemeSettings;
}

export default function ChatbotSidebar({
  activeNote,
  notes,
  onAddNote,
  theme,
}: ChatbotSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-chat",
      role: "assistant",
      content: `Hello! I'm your Obsidian Knowledge Co-Writer. 

I can assist your note-taking:
- **Analyze connections:** Link headers like [[Backlinking Guide]] to expand your notes map.
- **Draft content:** Select a suggestion template below to auto-complete outlines or paragraphs.
- **Generate Roadmap plans:** Switch to the **Plan Vault** tab above to generate modular note-taking setups.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "plan">("chat");
  const [isLoading, setIsLoading] = useState(false);
  const [planTopic, setPlanTopic] = useState("");
  const [planType, setPlanType] = useState<"standard" | "fullstack">("standard");
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  
  // Storing generated plan details
  const [generatedPlan, setGeneratedPlan] = useState<{
    vaultName: string;
    recommendedNotes: { title: string; content: string; category: string }[];
    roadmapDescription: string;
  } | null>(null);

  const [appliedNotes, setAppliedNotes] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Standard chat submit
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          activeNote,
          allNotesList: notes,
        }),
      });

      const data = await resp.json();
      if (resp.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content: data.text || "I was unable to formulate a response.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        throw new Error(data.error || "Failed API response");
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ Error connecting to AI: ${err.message || "Unknown error"}. Ensure your GEMINI_API_KEY is configured in the Settings > Secrets.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle preset templates inside writing interface
  async function handleTriggerPreset(preset: "summary" | "links" | "outline") {
    if (isLoading || !activeNote) return;

    let prompt = "";
    if (preset === "summary") {
      prompt = `Provide a beautiful, highly synthesized 2-bullet point summary of my current active note content. Start immediately with heading "### AI Note Summary".`;
    } else if (preset === "links") {
      prompt = `Analyze my active note "${activeNote.title}" and suggest 2-3 links or backlinked statements matching existing note terms or suggesting logical new notes in double brackets like [[New Idea Title]].`;
    } else if (preset === "outline") {
      prompt = `Draft an elegant 4-step structural blueprint for expand content in this note. Format cleanly as sequential bullet flows like "- Concept A -> Concept B" to visual diagramming.`;
    }

    const triggerMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: `[AI Helper Preset]: ${prompt}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, triggerMsg]);
    setIsLoading(true);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, triggerMsg],
          activeNote,
          allNotesList: notes,
        }),
      });

      const data = await resp.json();
      if (resp.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        throw new Error(data.error || "Response failed");
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ Preset trigger failed: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // Generate Obsidian Plan
  async function handleGeneratePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!planTopic.trim() || isGeneratingPlan) return;

    setIsGeneratingPlan(true);
    setGeneratedPlan(null);
    setAppliedNotes([]);
    setPlanError(null);

    try {
      const resp = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: planTopic, planType }),
      });

      const data = await resp.json();
      if (resp.ok) {
        setGeneratedPlan(data);
      } else {
        throw new Error(data.error || "Plan endpoint returned error");
      }
    } catch (err: any) {
      setPlanError(`Error generating plan: ${err.message}. Make sure GEMINI_API_KEY is configured in Settings > Secrets.`);
    } finally {
      setIsGeneratingPlan(false);
    }
  }

  // Inject Plan Note into User Vault
  function handleAddPlanNote(title: string, content: string) {
    if (appliedNotes.includes(title)) return;
    onAddNote(title, content);
    setAppliedNotes((prev) => [...prev, title]);
  }

  // Mass Auto-Inject All Plan Notes
  function handleImportAllPlanNotes() {
    if (!generatedPlan) return;
    generatedPlan.recommendedNotes.forEach((n) => {
      handleAddPlanNote(n.title, n.content);
    });
  }

  return (
    <div
      className="flex flex-col h-full border rounded-lg overflow-hidden"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.border,
      }}
    >
      {/* Sidebar Tabs */}
      <div
        className="flex border-b text-xs font-mono font-medium"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.sidebarBg,
        }}
      >
        <button
          onClick={() => setActiveTab("chat")}
          className="flex-1 py-3 text-center border-r transition"
          style={{
            borderColor: theme.border,
            color: activeTab === "chat" ? theme.accent : theme.sidebarText,
            borderBottom: activeTab === "chat" ? `2.5px solid ${theme.accent}` : "none",
            fontWeight: activeTab === "chat" ? "600" : "400",
          }}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Bot size={13} />
            Co-Writer Assist
          </div>
        </button>
        <button
          onClick={() => setActiveTab("plan")}
          className="flex-1 py-3 text-center transition"
          style={{
            color: activeTab === "plan" ? theme.accent : theme.sidebarText,
            borderBottom: activeTab === "plan" ? `2.5px solid ${theme.accent}` : "none",
            fontWeight: activeTab === "plan" ? "600" : "400",
          }}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Map size={13} />
            Obisidian Plan Builder
          </div>
        </button>
      </div>

      {activeTab === "chat" ? (
        // Tab 1: Chat interface
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Preset Helper Shortcuts */}
          {activeNote && (
            <div
              className="p-2 border-b flex justify-between gap-1 text-[10px] font-medium"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.sidebarBg,
              }}
            >
              <button
                onClick={() => handleTriggerPreset("summary")}
                disabled={isLoading}
                className="flex-1 p-1 shadow-sm rounded flex items-center justify-center gap-1 border hover:opacity-85"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.border,
                  color: theme.accent,
                }}
              >
                <Sparkles size={9} />
                Summarize Note
              </button>
              <button
                onClick={() => handleTriggerPreset("links")}
                disabled={isLoading}
                className="flex-1 p-1 shadow-sm rounded flex items-center justify-center gap-1 border hover:opacity-85"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.border,
                  color: theme.accent,
                }}
              >
                <Plus size={9} />
                Find Backlinks
              </button>
              <button
                onClick={() => handleTriggerPreset("outline")}
                disabled={isLoading}
                className="flex-1 p-1 shadow-sm rounded flex items-center justify-center gap-1 border hover:opacity-85"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.border,
                  color: theme.accent,
                }}
              >
                <Bot size={9} />
                Draft Flowchart
              </button>
            </div>
          )}

          {/* Message Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col max-w-[85%] ${
                  message.role === "user" ? "ml-auto" : "mr-auto"
                }`}
              >
                <div
                  className="p-3 rounded-lg text-xs leading-relaxed"
                  style={{
                    backgroundColor:
                      message.role === "user" ? theme.accent : theme.editorBg,
                    color: message.role === "user" ? "#000000" : theme.text,
                    border: message.role === "user" ? "none" : `1px solid ${theme.border}`,
                    borderLeft: message.role !== "user" ? `3px solid ${theme.accent}` : "none",
                  }}
                >
                  <p className="whitespace-pre-wrap font-sans">{message.content}</p>
                </div>
                <div
                  className="text-[9px] mt-1 text-right font-mono"
                  style={{ color: theme.sidebarText }}
                >
                  {message.role === "user" ? "You" : "Obsidian Bot"} • {message.timestamp}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs font-mono py-2" style={{ color: theme.accent }}>
                <Loader2 size={12} className="animate-spin" />
                Thinking & digesting note map...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Form */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t flex gap-2"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.sidebarBg,
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask for text outline or backlink suggestions..."
              disabled={isLoading}
              className="flex-1 text-xs p-2.5 rounded-lg border outline-none transition"
              style={{
                backgroundColor: theme.editorBg,
                color: theme.text,
                borderColor: theme.border,
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="p-2.5 rounded-lg flex items-center justify-center cursor-pointer transition hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: theme.accent,
                color: "#121214",
              }}
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      ) : (
        // Tab 2: Planning / Roadmapping vault
        <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-xs py-0.5 tracking-tight" style={{ color: theme.text }}>
                Obsidian Note-Taking Roadmaps
              </h3>
              <p className="text-[10px]" style={{ color: theme.sidebarText }}>
                Enter any knowledge subject to let Gemini generate a structured blueprint of interconnected notes you can automatically construct.
              </p>
            </div>

            <form onSubmit={handleGeneratePlan} className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  value={planTopic}
                  onChange={(e) => setPlanTopic(e.target.value)}
                  placeholder="e.g., Computer Science 101, Ancient Civilizations"
                  disabled={isGeneratingPlan}
                  required
                  className="w-full text-xs p-2.5 rounded border outline-none font-sans"
                  style={{
                    backgroundColor: theme.editorBg,
                    color: theme.text,
                    borderColor: theme.border,
                  }}
                />
              </div>

              {/* High-Tech Plan Strategy Chooser */}
              <div className="flex items-center justify-between gap-1 p-1 bg-black/15 rounded-md border text-[10px]" style={{ borderColor: theme.border }}>
                <span className="pl-1 font-semibold" style={{ color: theme.sidebarText }}>Model Flow:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setPlanType("standard")}
                    className={`px-2 py-1 rounded cursor-pointer transition text-[10px] ${
                      planType === "standard" 
                        ? "font-semibold bg-neutral-800 text-white" 
                        : "opacity-60 text-zinc-400"
                    }`}
                    style={{ 
                      color: planType === "standard" ? theme.accent : undefined
                    }}
                  >
                    Brain Vault (Notes)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanType("fullstack")}
                    className={`px-2 py-1 rounded cursor-pointer transition text-[10px] ${
                      planType === "fullstack" 
                        ? "font-semibold bg-neutral-800 text-white" 
                        : "opacity-60 text-zinc-400"
                    }`}
                    style={{ 
                      color: planType === "fullstack" ? theme.accent : undefined
                    }}
                  >
                    Full-Stack (DB → API → FE View)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isGeneratingPlan || !planTopic.trim()}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded text-xs font-semibold cursor-pointer transition hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: theme.accent,
                  color: "#121214",
                }}
              >
                {isGeneratingPlan ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Assembling Knowledge Blueprint...
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    Compile Vault Roadmap
                  </>
                )}
              </button>
            </form>

            {planError && (
              <div 
                className="p-3 text-[10px] rounded border leading-relaxed text-red-400 bg-red-500/10 border-red-500/30 font-sans"
              >
                {planError}
              </div>
            )}

            {/* Generated Plan Display */}
            {generatedPlan && (
              <div className="space-y-3.5 border-t pt-3.5" style={{ borderColor: theme.border }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold" style={{ color: theme.accent }}>
                      📁 Vault: {generatedPlan.vaultName}
                    </h4>
                    <p className="text-[10px]" style={{ color: theme.sidebarText }}>
                      Analyzed {generatedPlan.recommendedNotes.length} structural files.
                    </p>
                  </div>
                  <button
                    onClick={handleImportAllPlanNotes}
                    className="p-1 px-2.5 rounded text-[10px] borer flex items-center gap-1 text-white bg-[#10b981] hover:bg-[#059669] transition"
                  >
                    <Plus size={11} />
                    Import All
                  </button>
                </div>

                <p className="text-[10px] leading-relaxed italic p-2 border rounded font-mono" style={{ borderColor: theme.border, backgroundColor: theme.editorBg, color: theme.sidebarText }}>
                  {generatedPlan.roadmapDescription}
                </p>

                <div className="space-y-1.5">
                  <p className="text-[9px] uppercase font-mono tracking-wider" style={{ color: theme.sidebarText }}>
                    Generated Nodes
                  </p>
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {generatedPlan.recommendedNotes.map((noteItem, index) => {
                      const isImported = appliedNotes.includes(noteItem.title) || notes.some(n => n.title.toLowerCase() === noteItem.title.toLowerCase());
                      return (
                        <div
                          key={`plan-note-${index}`}
                          className="flex items-center justify-between p-2 rounded border text-xs"
                          style={{
                            borderColor: theme.border,
                            backgroundColor: theme.editorBg,
                          }}
                        >
                          <div className="max-w-[70%]">
                            <span className="font-semibold block truncate" style={{ color: theme.text }}>
                              {noteItem.title}
                            </span>
                            <span
                              className="text-[9px] uppercase px-1 rounded inline-block mt-0.5"
                              style={{
                                backgroundColor: theme.border,
                                color: theme.sidebarText,
                              }}
                            >
                              {noteItem.category}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => handleAddPlanNote(noteItem.title, noteItem.content)}
                            disabled={isImported}
                            className={`p-1 px-2 rounded text-[10px] font-sans flex items-center gap-0.5 transition ${
                              isImported 
                                ? "bg-opacity-20 cursor-not-allowed" 
                                : "hover:opacity-80"
                            }`}
                            style={{
                              backgroundColor: isImported ? theme.border : theme.accent,
                              color: isImported ? theme.sidebarText : "#121214",
                            }}
                          >
                            {isImported ? (
                              <>
                                <FileCheck size={11} className="text-emerald-500" />
                                Added
                              </>
                            ) : (
                              <>
                                <Plus size={11} />
                                Create
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-[9px] font-mono select-none text-center opacity-40 mt-8" style={{ color: theme.sidebarText }}>
            Build Connected Knowledge
          </div>
        </div>
      )}
    </div>
  );
}
