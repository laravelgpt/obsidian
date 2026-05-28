import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Markdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Search, 
  SlidersHorizontal, 
  HelpCircle, 
  Edit3, 
  Eye, 
  Play, 
  Save, 
  Calendar, 
  Hash, 
  Settings, 
  Network, 
  Activity, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  Sparkles, 
  Maximize2,
  Minimize2,
  Check,
  Code,
  RotateCcw,
  Globe,
  Folder,
  FolderPlus,
  ChevronDown,
  Edit2,
  FolderClosed,
  ArrowRightLeft
} from "lucide-react";
import { Note, ThemeSettings, PluginSettings } from "./types";
import { defaultNotes } from "./defaultNotes";
import KnowledgeGraph from "./components/KnowledgeGraph";
import VisualDiagrammer from "./components/VisualDiagrammer";
import ChatbotSidebar from "./components/ChatbotSidebar";
import GoogleWorkspacePanel from "./components/GoogleWorkspacePanel";

// Unique list of theme presets
const standardPresets: ThemeSettings[] = [
  {
    name: "Obsidian Slate Dark",
    isDark: true,
    background: "#0f0f11",
    text: "#e4e4e7",
    sidebarBg: "#17171a",
    sidebarText: "#9ca3af",
    accent: "#8b5cf6", // Purple
    accentHover: "#7c3aed",
    border: "#27272a",
    cardBg: "#1e1b29",
    editorBg: "#09090b"
  },
  {
    name: "Corporate Ocean Deep",
    isDark: true,
    background: "#08101d",
    text: "#cbd5e1",
    sidebarBg: "#050b14",
    sidebarText: "#38bdf8",
    accent: "#0284c7", // Deep Sky Blue
    accentHover: "#0369a1",
    border: "#1e293b",
    cardBg: "#0f172a",
    editorBg: "#030712"
  },
  {
    name: "Classic Minimalist Paper",
    isDark: false,
    background: "#fafafa",
    text: "#18181b",
    sidebarBg: "#f4f4f5",
    sidebarText: "#71717a",
    accent: "#1e1b4b", // Midnight Indigo
    accentHover: "#312e81",
    border: "#e4e4e7",
    cardBg: "#ffffff",
    editorBg: "#ffffff"
  },
  {
    name: "Cyber Algae Matrix",
    isDark: true,
    background: "#091209",
    text: "#a7f3d0",
    sidebarBg: "#040904",
    sidebarText: "#10b981",
    accent: "#10b981", // Matrix Green
    accentHover: "#059669",
    border: "#064e3b",
    cardBg: "#0b1c0e",
    editorBg: "#020502"
  },
  {
    name: "Warm Autumn Sepia",
    isDark: false,
    background: "#fcf8f2",
    text: "#451a03",
    sidebarBg: "#f6ede2",
    sidebarText: "#9a3412",
    accent: "#b45309", // Warm Amber
    accentHover: "#92400e",
    border: "#ebd6bf",
    cardBg: "#fdfbf7",
    editorBg: "#fcfcfc"
  }
];

// Visual Diagram parser and generator for the link hover preview
function NoteHoverDiagramContent({ note, theme }: { note: Note; theme: ThemeSettings }) {
  const content = note?.content || "";
  
  // Extract arrow flows: e.g. "- Define Topic -> Research Context"
  const arrowFlowNodes = useMemo(() => {
    const nodes: { id: string; label: string }[] = [];
    const lines = content.split("\n");

    lines.forEach((line) => {
      const trimmed = line.trim();
      if ((trimmed.startsWith("-") || trimmed.startsWith("*")) && trimmed.includes("->")) {
        let cleanText = trimmed.replace(/^[-*]\s*/, "");
        const parts = cleanText.split("->").map((p) => p.trim());
        parts.forEach((part) => {
          const nodeId = part.toLowerCase().replace(/[^a-z0-9]/g, "-");
          if (nodeId && !nodes.some((n) => n.id === nodeId)) {
            nodes.push({ id: nodeId, label: part });
          }
        });
      }
    });
    return nodes;
  }, [content]);

  // Extract outlines
  const bulletOutline = useMemo(() => {
    const items: string[] = [];
    const lines = content.split("\n");
    lines.forEach((line) => {
      const match = line.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
      if (match) {
        const text = match[3].trim();
        if (!text.includes("->") && items.length < 4) {
          items.push(text);
        }
      }
    });
    return items;
  }, [content]);

  // Extract note text excerpt (first 100 characters strip markdown)
  const excerpt = useMemo(() => {
    const clean = content
      .replace(/\[\[(.*?)\]\]/g, "$1") // strip brackets
      .replace(/[#*`\-]/g, "") // strip markdown noise
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) return "No text description.";
    return clean.length > 100 ? clean.substring(0, 100) + "..." : clean;
  }, [content]);

  return (
    <div className="flex flex-col gap-2 text-left">
      <p className="text-[10px] opacity-75 font-sans leading-relaxed text-zinc-300 line-clamp-3" style={{ color: theme.text }}>
        {excerpt}
      </p>

      {arrowFlowNodes.length > 0 ? (
        <div className="space-y-1 my-1.5">
          <span className="text-[8px] uppercase tracking-wider font-mono font-bold text-yellow-500 block">
            ▲ Diagram Link Flow:
          </span>
          <div className="flex flex-col gap-1 p-2 rounded bg-black/35 border text-[9px]" style={{ borderColor: theme.border }}>
            {arrowFlowNodes.slice(0, 4).map((node, i) => (
              <React.Fragment key={node.id}>
                <div 
                  className="px-2 py-1 rounded text-[9px] font-medium text-center truncate border shadow-xs"
                  style={{ 
                    backgroundColor: theme.sidebarBg, 
                    borderColor: theme.accent + "44", 
                    color: theme.text,
                    borderLeft: `2.5px solid ${theme.accent}`
                  }}
                >
                  {node.label}
                </div>
                {i < arrowFlowNodes.slice(0, 4).length - 1 && (
                  <div className="text-center text-[8px] font-mono leading-none py-0.5" style={{ color: theme.accent }}>
                    ↓
                  </div>
                )}
              </React.Fragment>
            ))}
            {arrowFlowNodes.length > 4 && (
              <div className="text-[8px] text-zinc-500 font-mono text-center">
                + {arrowFlowNodes.length - 4} more steps
              </div>
            )}
          </div>
        </div>
      ) : bulletOutline.length > 0 ? (
        <div className="space-y-1.5 my-1.5">
          <span className="text-[8px] uppercase tracking-wider font-mono font-bold text-sky-400 block">
            ▲ Document Outline Schema:
          </span>
          <div className="space-y-1 p-2 rounded bg-black/25 border text-[9px]" style={{ borderColor: theme.border }}>
            {bulletOutline.map((item, idx) => (
              <div key={idx} className="truncate flex items-center gap-1.5" style={{ color: theme.text }}>
                <span style={{ color: theme.accent }} className="font-bold">•</span>
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-[9px] opacity-40 italic font-mono pt-1 text-center">
          Write "A -{">"} B" inside notes to compile flowcharts!
        </div>
      )}
    </div>
  );
}

export default function App() {
  // NOTES Vault State loaded from LocalStorage
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem("obsidian_notes");
    if (saved) return JSON.parse(saved);
    // Enrich default notes with initial folders
    return defaultNotes.map(n => {
      if (n.id === "welcome-note" || n.id === "backlinking-guide") {
        return { ...n, folder: "Guides" };
      }
      if (n.id === "visual-diagramming") {
        return { ...n, folder: "Research" };
      }
      return n;
    });
  });

  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    return notes[0]?.id || "";
  });

  // FOLDERS list state
  const [folders, setFolders] = useState<string[]>(() => {
    const saved = localStorage.getItem("obsidian_folders");
    if (saved) return JSON.parse(saved);
    return ["Guides", "Drafts", "Research"];
  });

  // Track collapsed folders in sidebar
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("obsidian_collapsed_folders");
    return saved ? JSON.parse(saved) : {};
  });

  // Dialog Overlay States for Folder & File creation/renaming
  const [createNoteDialog, setCreateNoteDialog] = useState<{
    isOpen: boolean;
    title: string;
    folder: string;
  }>({ isOpen: false, title: "", folder: "" });

  const [createFolderDialog, setCreateFolderDialog] = useState<{
    isOpen: boolean;
    name: string;
  }>({ isOpen: false, name: "" });

  const [renameNoteDialog, setRenameNoteDialog] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
  }>({ isOpen: false, id: "", title: "" });

  const [renameFolderDialog, setRenameFolderDialog] = useState<{
    isOpen: boolean;
    oldName: string;
    newName: string;
  }>({ isOpen: false, oldName: "", newName: "" });

  // Custom delete dialog state controls (eliminates non-functional iframe confirm overlays)
  const [deleteNoteDialog, setDeleteNoteDialog] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
  }>({ isOpen: false, id: "", title: "" });

  const [deleteFolderDialog, setDeleteFolderDialog] = useState<{
    isOpen: boolean;
    name: string;
  }>({ isOpen: false, name: "" });

  // Dropdown menus states for directories/file repositioning
  const [activeFolderAddExisting, setActiveFolderAddExisting] = useState<string | null>(null);
  const [activeNoteMoveDropdown, setActiveNoteMoveDropdown] = useState<string | null>(null);
  
  // Custom interactive toasting notifications
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }[]>([]);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);
  
  // Track hovered backlinks for the visual diagram overlay card preview
  const [hoveredLink, setHoveredLink] = useState<{
    title: string;
    clientX: number;
    clientY: number;
  } | null>(null);

  // Editor mode: false = Editor Mode, true = Live Preview Mode
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Focus mode / Full-width editor state
  const [isFullWidth, setIsFullWidth] = useState<boolean>(() => {
    const saved = localStorage.getItem("obsidian_is_full_width");
    return saved ? JSON.parse(saved) : true;
  });

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"updated" | "title">("updated");

  // Collapsible lists - responsiveness starting state
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth >= 1024 : true;
  });
  const [rightSidebarOpen, setRightSidebarOpen] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth >= 1024 : true;
  });

  // Actively selected user customized theme
  const [theme, setTheme] = useState<ThemeSettings>(() => {
    const saved = localStorage.getItem("obsidian_custom_theme");
    return saved ? JSON.parse(saved) : standardPresets[0];
  });

  // Active simulated plugins settings
  const [plugins, setPlugins] = useState<PluginSettings>({
    wordCount: true,
    dailyNotes: true,
    outline: true,
    visualDiagram: true,
    emojiPicker: false,
  });

  // Right sidebar active tab: "insights" (Graph & Diagrams) | "ai" (Co-Writer) | "google" (Cloud/Workspace)
  const [rightSidebarTab, setRightSidebarTab] = useState<"insights" | "ai" | "google">("insights");

  // Modal / Drawer open states
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Sync state back to local storage
  useEffect(() => {
    localStorage.setItem("obsidian_notes", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem("obsidian_folders", JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem("obsidian_collapsed_folders", JSON.stringify(collapsedFolders));
  }, [collapsedFolders]);

  useEffect(() => {
    localStorage.setItem("obsidian_custom_theme", JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("obsidian_is_full_width", JSON.stringify(isFullWidth));
  }, [isFullWidth]);

  // Responsive event handler to collapse sidebars automatically on tablet/mobile views
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setLeftSidebarOpen(false);
        setRightSidebarOpen(false);
      } else {
        setLeftSidebarOpen(true);
        setRightSidebarOpen(true);
      }
    };
    
    // Check size on mount
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Global hotkey Ctrl+E (or Cmd+E) listener to toggle live preview mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setPreviewMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute Active Note object
  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || notes[0] || null;
  }, [notes, activeNoteId]);

  // Perform sorting & filtering on Notes Vault
  const filteredNotes = useMemo(() => {
    const matches = notes.filter((n) => {
      const q = searchTerm.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    });

    if (sortBy === "title") {
      return [...matches].sort((a, b) => a.title.localeCompare(b.title));
    } else {
      return [...matches].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }
  }, [notes, searchTerm, sortBy]);

  // Group notes dynamically based on parent virtual directory folder paths
  const notesByFolder = useMemo(() => {
    const groups: Record<string, Note[]> = {};
    
    // Initialize groups for current folders list
    folders.forEach(f => {
      groups[f] = [];
    });
    // Virtual folder key for root notes
    groups[""] = [];

    filteredNotes.forEach(note => {
      const f = note.folder || "";
      if (groups[f] !== undefined) {
        groups[f].push(note);
      } else {
        // Fallback to empty/root if folder doesn't exist in user folders
        groups[""].push(note);
      }
    });
    return groups;
  }, [filteredNotes, folders]);

  // Incoming Backlinks: Scan other files that contain [[this note title]]
  const incomingBacklinks = useMemo(() => {
    if (!activeNote) return [];
    return notes.filter((n) => {
      if (n.id === activeNote.id) return false;
      const regex = new RegExp(`\\[\\[${activeNote.title}\\]\\]`, "i");
      return regex.test(n.content);
    });
  }, [notes, activeNote]);

  // Handle Note edits safely
  function handleUpdateNoteContent(newContent: string) {
    if (!activeNote) return;
    setNotes((prevNotes) =>
      prevNotes.map((n) =>
        n.id === activeNote.id
          ? { ...n, content: newContent, updatedAt: new Date().toISOString() }
          : n
      )
    );
  }

  function handleUpdateNoteTitle(newTitle: string) {
    if (!activeNote) return;
    const cleanTitle = newTitle.replace(/[\[\]]/g, ""); // strip bracket syntax characters
    setNotes((prevNotes) =>
      prevNotes.map((n) =>
        n.id === activeNote.id
          ? { ...n, title: cleanTitle, updatedAt: new Date().toISOString() }
          : n
      )
    );
  }

  // Create standard blank note or roadmap recommended plans
  function handleAddNote(title: string = "", content: string = "", folderName: string = "") {
    const noteTitle = title.trim() || `Untitled Note ${notes.length + 1}`;
    
    // Check if node exists to open it
    const existing = notes.find(n => n.title.toLowerCase() === noteTitle.toLowerCase());
    if (existing) {
      setActiveNoteId(existing.id);
      return;
    }

    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: noteTitle,
      content: content || `# ${noteTitle}\n\nStart writing knowledge here...`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      folder: folderName,
    };

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  }

  // Dialog Confirmation Actions
  function handleConfirmCreateNote() {
    const rawTitle = createNoteDialog.title.trim();
    const cleanTitle = rawTitle.replace(/[\[\]]/g, "") || `Untitled Note ${notes.length + 1}`;
    
    // Check if duplicate title exists
    const existing = notes.find(n => n.title.toLowerCase() === cleanTitle.toLowerCase());
    if (existing) {
      showToast(`Note name "${cleanTitle}" already exists. Opening existing file.`, "info");
      setActiveNoteId(existing.id);
      setCreateNoteDialog({ isOpen: false, title: "", folder: "" });
      return;
    }

    handleAddNote(cleanTitle, "", createNoteDialog.folder);
    showToast(`Note "${cleanTitle}" successfully created!`, "success");
    setCreateNoteDialog({ isOpen: false, title: "", folder: "" });
  }

  function handleConfirmCreateFolder() {
    const rawName = createFolderDialog.name.trim();
    if (!rawName) return;

    if (folders.some(f => f.toLowerCase() === rawName.toLowerCase())) {
      showToast(`Directory "${rawName}" already exists in vault.`, "warning");
      return;
    }

    setFolders(prev => [...prev, rawName]);
    showToast(`Folder "${rawName}" created!`, "success");
    setCreateFolderDialog({ isOpen: false, name: "" });
  }

  function handleConfirmRenameNote() {
    const rawTitle = renameNoteDialog.title.trim();
    const cleanTitle = rawTitle.replace(/[\[\]]/g, "");
    if (!cleanTitle) return;

    // Check if another note already has that title
    const duplicate = notes.find(n => n.id !== renameNoteDialog.id && n.title.toLowerCase() === cleanTitle.toLowerCase());
    if (duplicate) {
      showToast(`A note with title "${cleanTitle}" already exists. Save aborted.`, "error");
      return;
    }

    setNotes(prev =>
      prev.map(n =>
        n.id === renameNoteDialog.id
          ? { ...n, title: cleanTitle, updatedAt: new Date().toISOString() }
          : n
      )
    );
    showToast(`Note renamed to "${cleanTitle}"`, "success");
    setRenameNoteDialog({ isOpen: false, id: "", title: "" });
  }

  function handleConfirmRenameFolder() {
    const oldName = renameFolderDialog.oldName;
    const newName = renameFolderDialog.newName.trim();
    if (!newName || oldName === newName) {
      setRenameFolderDialog({ isOpen: false, oldName: "", newName: "" });
      return;
    }

    if (folders.some(f => f.toLowerCase() === newName.toLowerCase() && f !== oldName)) {
      showToast(`A folder with name "${newName}" already exists.`, "error");
      return;
    }

    setFolders(prev => prev.map(f => f === oldName ? newName : f));
    setNotes(prev => prev.map(n => n.folder === oldName ? { ...n, folder: newName } : n));
    showToast(`Folder "${oldName}" renamed to "${newName}"`, "success");
    setRenameFolderDialog({ isOpen: false, oldName: "", newName: "" });
  }

  function handleConfirmDeleteNote() {
    const rawId = deleteNoteDialog.id;
    if (!rawId) return;

    const remaining = notes.filter((n) => n.id !== rawId);
    setNotes(remaining);

    if (activeNoteId === rawId) {
      if (remaining.length > 0) {
        setActiveNoteId(remaining[0].id);
      } else {
        setActiveNoteId("");
      }
    }
    setDeleteNoteDialog({ isOpen: false, id: "", title: "" });
  }

  function handleConfirmDeleteFolder() {
    const rawName = deleteFolderDialog.name;
    if (!rawName) return;

    setFolders(prev => prev.filter(f => f !== rawName));
    setNotes(prev => prev.map(n => n.folder === rawName ? { ...n, folder: "" } : n));
    setDeleteFolderDialog({ isOpen: false, name: "" });
  }

  // Double Bracket click interception resolver
  function handleBacklinkClick(targetTitle: string) {
    const matchedNote = notes.find(
      (n) => n.title.toLowerCase() === targetTitle.toLowerCase()
    );

    if (matchedNote) {
      setActiveNoteId(matchedNote.id);
    } else {
      // Create new note on the spot!
      handleAddNote(targetTitle);
    }
  }

  // Pre-process Content: Translate double brackets [[Note Title]] into markdown hyperlinks for react-markdown renderer
  const processedMarkdown = useMemo(() => {
    if (!activeNote) return "";
    return activeNote.content.replace(/\[\[(.*?)\]\]/g, (match, title) => {
      // Create absolute route key and encode
      return `[${title}](backlink://${encodeURIComponent(title)})`;
    });
  }, [activeNote]);

  // Setup Custom Anchor Components in React-Markdown to open backlinks
  const markdownRenderComponents = useMemo(
    () => ({
      a: ({ href, children }: any) => {
        if (href && href.startsWith("backlink://")) {
          const decodedTitle = decodeURIComponent(href.replace("backlink://", ""));
          return (
            <button
              onClick={() => handleBacklinkClick(decodedTitle)}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredLink({
                  title: decodedTitle,
                  clientX: rect.left,
                  clientY: rect.bottom + window.scrollY,
                });
              }}
              onMouseLeave={() => setHoveredLink(null)}
              className="font-bold underline cursor-pointer hover:opacity-85 text-left transition"
              style={{ color: theme.accent }}
            >
              [[{decodedTitle}]]
            </button>
          );
        }
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" className="underline font-medium hover:opacity-85">
            {children}
          </a>
        );
      },
      // Keep styling fully customized and responsive
      h1: ({ children }: any) => <h1 className="text-2xl font-bold tracking-tight mb-4 mt-2 border-b pb-2" style={{ borderColor: theme.border }}>{children}</h1>,
      h2: ({ children }: any) => <h2 className="text-xl font-semibold tracking-tight mb-3 mt-4">{children}</h2>,
      h3: ({ children }: any) => <h3 className="text-lg font-medium tracking-tight mb-2 mt-3">{children}</h3>,
      p: ({ children }: any) => <p className="leading-relaxed mb-4 text-[13px] text-opacity-95">{children}</p>,
      ul: ({ children }: any) => <ul className="list-disc pl-5 mb-4 space-y-1.5 text-[13px]">{children}</ul>,
      ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-4 space-y-1.5 text-[13px]">{children}</ol>,
      li: ({ children }: any) => <li className="mb-0.5">{children}</li>,
      code: ({ children }: any) => (
        <code className="bg-opacity-10 rounded px-1.5 py-0.5 font-mono text-xs border" style={{ backgroundColor: theme.accent, borderColor: theme.border, color: theme.accent }}>
          {children}
        </code>
      ),
      blockquote: ({ children }: any) => (
        <blockquote className="border-l-4 pl-4 italic opacity-80 mb-4" style={{ borderColor: theme.accent }}>
          {children}
        </blockquote>
      )
    }),
    [theme, notes]
  );

  // Simulated Plugin Actions
  function createDailyNote() {
    const dateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const noteTitle = `DailyJournal - ${dateStr}`;
    handleAddNote(
      noteTitle,
      `# Daily Journal - ${dateStr}\n\n## Daily Standup Tasks\n- [ ] Main highlight task 1\n- [ ] Task 2\n\n## Bullet Insights\n- Woke up -> Coffee\n- Coffee -> Mind Outlined\n\n## Brainstorming`
    );
  }

  // Count words, chars, estimate reading time
  const noteStats = useMemo(() => {
    if (!activeNote) return { words: 0, characters: 0, readTime: 0 };
    const text = activeNote.content || "";
    const characters = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const readTime = Math.ceil(words / 180); // Avg speed 180 words/min
    return { words, characters, readTime };
  }, [activeNote]);

  // Insert Emoji list
  const emojiList = ["💡", "🧠", "📁", "🔗", "⭐", "📅", "🚀", "📝", "⚡", "✨", "📌", "✅"];
  function handleInsertEmoji(emoji: string) {
    if (!activeNote) return;
    const textarea = document.getElementById("note-text-editor") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = activeNote.content;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const updated = before + emoji + after;
      handleUpdateNoteContent(updated);
      
      // Keep focus on editor and update typing placement
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 50);
    } else {
      handleUpdateNoteContent(activeNote.content + " " + emoji);
    }
  }

  // Custom theme updater
  function handleThemeColorChange(key: keyof ThemeSettings, val: string) {
    setTheme((prev) => ({
      ...prev,
      [key]: val,
    }));
  }

  return (
    <div
      className="flex flex-col h-screen overflow-hidden font-sans select-text leading-normal tracking-normal transition-colors duration-300"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
      }}
    >
      {/* 🚀 Sleek Top Control Bar */}
      <header
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{
          backgroundColor: theme.sidebarBg,
          borderColor: theme.border,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="p-1.5 rounded hover:bg-opacity-15 cursor-pointer"
            style={{ color: theme.sidebarText }}
            title="Toggle File Explorer"
          >
            <Menu size={16} />
          </button>
          
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: theme.accent }}
            />
            <h1 className="text-sm font-semibold tracking-wide font-mono uppercase" style={{ color: theme.accent }}>
              Obsidian .md
            </h1>
          </div>
        </div>

        {/* Central Hotkey Interactive Toggle Display */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-black bg-opacity-15 p-0.5 rounded border" style={{ borderColor: theme.border }}>
            <button
              onClick={() => setPreviewMode(false)}
              className={`p-1 px-2.5 rounded text-xs font-mono font-medium flex items-center gap-1 transition-all ${
                !previewMode
                  ? "shadow"
                  : "opacity-60 hover:opacity-85"
              }`}
              style={{
                backgroundColor: !previewMode ? theme.accent : "transparent",
                color: !previewMode ? "#000000" : theme.text,
              }}
              title="Markdown Text Editor"
            >
              <Edit3 size={11} />
              <span className="hidden sm:inline">Editor</span>
            </button>
            
            <button
              onClick={() => setPreviewMode(true)}
              className={`p-1 px-2.5 rounded text-xs font-mono font-medium flex items-center gap-1 transition-all ${
                previewMode
                  ? "shadow"
                  : "opacity-60 hover:opacity-85"
              }`}
              style={{
                backgroundColor: previewMode ? theme.accent : "transparent",
                color: previewMode ? "#000000" : theme.text,
              }}
              title="Compiled HTML Preview"
            >
              <Eye size={11} />
              <span className="hidden sm:inline">Preview</span>
            </button>
          </div>

          {/* Quick-toggle Editor Canvas width layout */}
          <button
            onClick={() => setIsFullWidth(!isFullWidth)}
            className="p-1 px-2 rounded hover:bg-opacity-15 cursor-pointer text-xs font-mono transition flex items-center gap-1 border"
            style={{
              color: theme.sidebarText,
              borderColor: theme.border,
              backgroundColor: theme.editorBg,
            }}
            title={isFullWidth ? "Set standard centered width" : "Set edge-to-edge widescreen layout"}
          >
            {isFullWidth ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            <span className="hidden md:inline">{isFullWidth ? "Compact" : "Full-W"}</span>
          </button>

          <span className="text-[10px] opacity-40 ml-1 font-mono hidden lg:inline">
            Press <code className="p-0.5 px-1 bg-neutral-800 rounded font-semibold text-white border border-neutral-700">Ctrl+E</code>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Swatches theme swapper (visible on medium & large screens) */}
          <div className="hidden sm:flex items-center gap-1 pb-0.5 bg-black bg-opacity-25 px-2 py-1 rounded border" style={{ borderColor: theme.border }}>
            <span className="text-[9px] font-mono opacity-50 mr-1 uppercase">Preset:</span>
            {standardPresets.map((pr) => (
              <button
                key={pr.name}
                onClick={() => setTheme(pr)}
                className={`w-4 h-4 rounded-full border transition-all hover:scale-125 focus:outline-none ${
                  theme.name === pr.name ? "border-white scale-110 shadow-sm" : "border-transparent"
                }`}
                style={{ backgroundColor: pr.accent }}
                title={`Switch to ${pr.name}`}
              />
            ))}
          </div>

          {/* Cycle theme button */}
          <button
            onClick={() => {
              const currIndex = standardPresets.findIndex((p) => p.name === theme.name);
              const nextIndex = (currIndex + 1) % standardPresets.length;
              setTheme(standardPresets[nextIndex]);
            }}
            className="p-1 px-2 rounded hover:bg-opacity-15 cursor-pointer flex items-center justify-center gap-1 border text-xs font-medium"
            style={{ color: theme.accent, borderColor: theme.border, backgroundColor: theme.editorBg }}
            title="Cycle next preset theme colour scheme"
          >
            <Sparkles size={11} className="animate-spin text-purple-400" style={{ animationDuration: "14s" }} />
            <span className="hidden md:inline">Cycle Theme</span>
          </button>

          {/* Daily Note Plugin Shortcut */}
          {plugins.dailyNotes && (
            <button
              onClick={createDailyNote}
              className="p-1 px-2 rounded hover:opacity-85 cursor-pointer flex items-center gap-1 border text-xs font-medium"
              style={{
                color: theme.text,
                backgroundColor: theme.border,
                borderColor: theme.border
              }}
              title="Create/Open Today's Journal"
            >
              <Calendar size={12} style={{ color: theme.accent }} />
              <span className="hidden md:inline">Journal</span>
            </button>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded hover:bg-opacity-15 cursor-pointer"
            style={{ color: theme.sidebarText }}
            title="Custom RGB Palette Editor"
          >
            <SlidersHorizontal size={14} />
          </button>

          <button
            onClick={() => setShowHelp(true)}
            className="p-1.5 rounded hover:bg-opacity-15 cursor-pointer"
            style={{ color: theme.sidebarText }}
            title="Help / Markdown shortcuts"
          >
            <HelpCircle size={14} />
          </button>

          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="p-1.5 rounded hover:bg-opacity-15 cursor-pointer ml-0.5"
            style={{ color: theme.sidebarText }}
            title="Toggle Right Panel"
          >
            {rightSidebarOpen ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>
      </header>

      {/* 🚀 Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* 📁 LEFT COLUMN: Vault File Manager */}
        <AnimatePresence initial={false}>
          {leftSidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 250, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="h-full border-r flex flex-col shrink-0 z-30 md:relative absolute left-0 top-0 shadow-2xl md:shadow-none bg-inherit"
              style={{
                backgroundColor: theme.sidebarBg,
                borderColor: theme.border,
              }}
            >
              {/* Vault Search */}
              <div className="p-3 space-y-2 border-b" style={{ borderColor: theme.border }}>
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-3.5 opacity-50" style={{ color: theme.sidebarText }} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search note files..."
                    className="w-full text-xs p-2 pl-7 rounded outline-none"
                    style={{
                      backgroundColor: theme.editorBg,
                      borderColor: theme.border,
                      color: theme.text,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: theme.sidebarText }}>
                  <span>Sort by:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSortBy("updated")}
                      className={`hover:underline cursor-pointer ${sortBy === "updated" ? "font-bold text-white uppercase" : "opacity-60"}`}
                      style={{ color: sortBy === "updated" ? theme.accent : theme.sidebarText }}
                    >
                      Updated
                    </button>
                    <button
                      onClick={() => setSortBy("title")}
                      className={`hover:underline cursor-pointer ${sortBy === "title" ? "font-bold text-white uppercase" : "opacity-60"}`}
                      style={{ color: sortBy === "title" ? theme.accent : theme.sidebarText }}
                    >
                      A-Z
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar Action Buttons */}
              <div className="px-3 pb-2 pt-3 grid grid-cols-2 gap-1.5 border-b" style={{ borderColor: theme.border }}>
                <button
                  onClick={() => setCreateNoteDialog({ isOpen: true, title: "", folder: "" })}
                  className="py-1.5 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer shadow transition hover:opacity-90 animate-pulse-subtle"
                  style={{
                    backgroundColor: theme.accent,
                    color: "#0f0f11",
                  }}
                  title="Create new file and ask for title"
                >
                  <Plus size={11} className="stroke-[3px]" />
                  <span>New Note</span>
                </button>
                <button
                  onClick={() => setCreateFolderDialog({ isOpen: true, name: "" })}
                  className="py-1.5 px-2 rounded text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition hover:bg-zinc-800 border"
                  style={{
                    borderColor: theme.border,
                    color: theme.sidebarText,
                    backgroundColor: theme.editorBg,
                  }}
                  title="Create brand new virtual directory"
                >
                  <FolderPlus size={11} className="shrink-0" />
                  <span>New Folder</span>
                </button>
              </div>

              {/* Notes Ledger organized by folders */}
              <div className="flex-1 overflow-y-auto px-2 pt-2 space-y-2 relative">
                {/* Invisible click backdrop to dismiss relative dropdowns gracefully */}
                {(activeNoteMoveDropdown || activeFolderAddExisting) && (
                  <div 
                    className="fixed inset-0 z-[40] bg-transparent cursor-default" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveNoteMoveDropdown(null);
                      setActiveFolderAddExisting(null);
                    }} 
                  />
                )}

                {/* 1. Listed Folders */}
                {folders.map(folderName => {
                  const folderNotes = notesByFolder[folderName] || [];
                  const isCollapsed = collapsedFolders[folderName];
                  // If searching, hide empty folders
                  if (searchTerm && folderNotes.length === 0) return null;
                  
                  return (
                    <div key={folderName} className="mb-2">
                      {/* Folder Title Element */}
                      <div 
                        className="group flex items-center justify-between p-1.5 rounded hover:bg-zinc-800 hover:bg-opacity-20 cursor-pointer transition select-none"
                        style={{ color: theme.sidebarText }}
                        onClick={() => setCollapsedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }))}
                      >
                        <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                          <span className="opacity-60">
                            {isCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                          </span>
                          <Folder size={12} className="text-yellow-600/80 shrink-0" />
                          <span className="text-[11px] font-bold truncate hover:text-white transition">
                            {folderName}
                          </span>
                          <span className="text-[9px] px-1 bg-black/20 rounded opacity-60 font-mono">
                            {folderNotes.length}
                          </span>
                        </div>

                        {/* Action buttons revealed on folder hover */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 relative z-50" onClick={e => e.stopPropagation()}>
                          {/* Add note inside folder directly */}
                          <button
                            onClick={() => {
                              setCreateNoteDialog({ isOpen: true, title: "", folder: folderName });
                            }}
                            className="p-1 hover:text-white rounded hover:bg-neutral-800 transition"
                            title={`Create note inside "${folderName}"`}
                          >
                            <Plus size={11} className="stroke-[3px]" />
                          </button>

                          {/* Add existing note to this folder dropdown trigger */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFolderAddExisting(prev => prev === folderName ? null : folderName);
                                setActiveNoteMoveDropdown(null); // Close other dropdowns
                              }}
                              className="p-1 hover:text-sky-400 rounded hover:bg-neutral-800 transition"
                              title="Add existing note to this folder..."
                            >
                              <ArrowRightLeft size={10} />
                            </button>

                            {/* Add Existing Note Dropdown menu */}
                            {activeFolderAddExisting === folderName && (
                              <div
                                className="absolute right-0 top-6 w-48 py-1 rounded shadow-xl border z-50 text-left font-sans text-[11px]"
                                style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
                                onClick={ev => ev.stopPropagation()}
                              >
                                <div className="px-2 py-1 border-b text-[9px] font-mono opacity-50 uppercase" style={{ borderColor: theme.border }}>
                                  Add Existing File:
                                </div>
                                <div className="max-h-40 overflow-y-auto">
                                  {notes.filter(n => n.folder !== folderName).map(otherNote => (
                                    <button
                                      key={otherNote.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setNotes(prev => prev.map(n => n.id === otherNote.id ? { ...n, folder: folderName } : n));
                                        setActiveFolderAddExisting(null);
                                      }}
                                      className="w-full text-left px-2 py-1.5 hover:bg-zinc-805 hover:bg-opacity-40 flex flex-col transition border-b last:border-o border-zinc-800"
                                      style={{ color: theme.text }}
                                    >
                                      <span className="truncate font-medium text-white">📄 {otherNote.title}</span>
                                      <span className="text-[9px] opacity-50 font-mono">
                                        Current: {otherNote.folder || "(Root)"}
                                      </span>
                                    </button>
                                  ))}
                                  {notes.filter(n => n.folder !== folderName).length === 0 && (
                                    <div className="px-2 py-2 text-[10px] text-zinc-500 italic">
                                      No other files found in vault
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Rename folder */}
                          <button
                            onClick={() => {
                              setRenameFolderDialog({ isOpen: true, oldName: folderName, newName: folderName });
                            }}
                            className="p-1 hover:text-white rounded hover:bg-neutral-800 transition"
                            title="Rename folder"
                          >
                            <Edit2 size={10} />
                          </button>

                          {/* Delete folder */}
                          <button
                            onClick={() => {
                              setDeleteFolderDialog({ isOpen: true, name: folderName });
                            }}
                            className="p-1 hover:text-red-500 rounded hover:bg-neutral-800 transition"
                            title="Delete folder"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>

                      {/* Folder Children Indented */}
                      {!isCollapsed && (
                        <div className="pl-3.5 border-l ml-2 space-y-0.5 mt-0.5 relative z-10" style={{ borderColor: theme.border + "22" }}>
                          {folderNotes.map(note => {
                            const isActive = note.id === activeNoteId;
                            const wordCount = note.content.trim() ? note.content.trim().split(/\s+/).length : 0;
                            return (
                              <div
                                key={note.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveNoteId(note.id);
                                }}
                                className={`group/note p-2 rounded cursor-pointer flex items-center justify-between transition-all duration-200 ${
                                  isActive
                                    ? "shadow border text-white font-semibold"
                                    : "hover:bg-zinc-800 hover:bg-opacity-40"
                                }`}
                                style={{
                                  backgroundColor: isActive ? theme.cardBg : "transparent",
                                  borderColor: isActive ? theme.border : "transparent",
                                }}
                              >
                                <div className="truncate max-w-[70%]">
                                  <span
                                    className="block truncate text-xs font-medium"
                                    style={{ color: isActive ? theme.accent : theme.text }}
                                  >
                                    📄 {note.title}
                                  </span>
                                  <span className="text-[9px] block font-mono opacity-50 truncate mt-0.5" style={{ color: theme.sidebarText }}>
                                    {wordCount} words • {new Date(note.updatedAt).toLocaleDateString()}
                                  </span>
                                </div>

                                <div className="flex items-center gap-0.5 opacity-0 group-hover/note:opacity-100 transition-all duration-150 relative z-30" onClick={e => e.stopPropagation()}>
                                  {/* File Moving Selector Dropdown */}
                                  <div className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveNoteMoveDropdown(prev => prev === note.id ? null : note.id);
                                        setActiveFolderAddExisting(null); // Close folder dropdowns
                                      }}
                                      className="p-1 hover:text-yellow-400 rounded hover:bg-neutral-800 transition"
                                      title="Move note to folder..."
                                    >
                                      <FolderClosed size={10} />
                                    </button>
                                    
                                    {activeNoteMoveDropdown === note.id && (
                                      <div
                                        className="absolute right-0 top-6 w-36 py-1 rounded shadow-xl border z-50 text-left font-sans text-[11px]"
                                        style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
                                        onClick={ev => ev.stopPropagation()}
                                      >
                                        <div className="px-2 py-1 border-b text-[9px] font-mono opacity-50 uppercase" style={{ borderColor: theme.border }}>
                                          Move to:
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setNotes(prev => prev.map(n => n.id === note.id ? { ...n, folder: "" } : n));
                                            setActiveNoteMoveDropdown(null);
                                          }}
                                          className="w-full text-left px-2 py-1.5 hover:bg-zinc-800 flex items-center gap-1 transition"
                                          style={{ color: !note.folder ? theme.accent : theme.text }}
                                        >
                                          {(!note.folder) && <Check size={8} />}
                                          <span>(Root / None)</span>
                                        </button>
                                        {folders.map(f => (
                                          <button
                                            key={f}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setNotes(prev => prev.map(n => n.id === note.id ? { ...n, folder: f } : n));
                                              setActiveNoteMoveDropdown(null);
                                            }}
                                            className="w-full text-left px-2 py-1.5 hover:bg-zinc-800 flex items-center gap-1 transition truncate"
                                            style={{ color: note.folder === f ? theme.accent : theme.text }}
                                          >
                                            {note.folder === f && <Check size={8} />}
                                            <Folder size={9} className="opacity-60 text-yellow-500 shrink-0" />
                                            <span className="truncate">{f}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => {
                                      setRenameNoteDialog({ isOpen: true, id: note.id, title: note.title });
                                    }}
                                    className="p-1 hover:text-sky-400 rounded hover:bg-neutral-800 transition"
                                    title="Rename note"
                                  >
                                    <Edit2 size={10} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeleteNoteDialog({ isOpen: true, id: note.id, title: note.title });
                                    }}
                                    className="p-1 hover:text-red-500 rounded hover:bg-neutral-800 transition"
                                    title="Delete note"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          {folderNotes.length === 0 && (
                            <div className="p-1.5 pl-3 text-[10px] italic opacity-40 font-mono" style={{ color: theme.sidebarText }}>
                              Folder is empty
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 2. Root / Uncategorized files */}
                {(() => {
                  const rootNotes = notesByFolder[""] || [];
                  if (searchTerm && rootNotes.length === 0) return null;
                  
                  return (
                    <div className="mt-4 mb-2 relative z-10">
                      <div className="flex items-center gap-1.5 p-1 px-1.5 text-[10px] font-mono tracking-wider opacity-50 uppercase" style={{ color: theme.sidebarText }}>
                        <span>Files (Root)</span>
                        <span className="text-[9px] px-1 bg-black/25 rounded font-mono font-normal">
                          {rootNotes.length}
                        </span>
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {rootNotes.map(note => {
                          const isActive = note.id === activeNoteId;
                          const wordCount = note.content.trim() ? note.content.trim().split(/\s+/).length : 0;
                          return (
                            <div
                              key={note.id}
                              onClick={() => setActiveNoteId(note.id)}
                              className={`group/note p-2 rounded cursor-pointer flex items-center justify-between transition-all duration-200 ${
                                isActive
                                  ? "shadow border text-white font-semibold"
                                  : "hover:bg-zinc-800 hover:bg-opacity-40"
                              }`}
                              style={{
                                backgroundColor: isActive ? theme.cardBg : "transparent",
                                borderColor: isActive ? theme.border : "transparent",
                              }}
                            >
                              <div className="truncate max-w-[70%]">
                                <span
                                  className="block truncate text-xs font-medium"
                                  style={{ color: isActive ? theme.accent : theme.text }}
                                >
                                  📄 {note.title}
                                </span>
                                <span className="text-[9px] block font-mono opacity-50 truncate mt-0.5" style={{ color: theme.sidebarText }}>
                                  {wordCount} words • {new Date(note.updatedAt).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="flex items-center gap-0.5 opacity-0 group-hover/note:opacity-100 transition-all duration-150 relative z-30" onClick={e => e.stopPropagation()}>
                                {/* File Moving Dropdown in Root files lists */}
                                <div className="relative animate-fade-in">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveNoteMoveDropdown(prev => prev === note.id ? null : note.id);
                                      setActiveFolderAddExisting(null); // Close folder dropdowns
                                    }}
                                    className="p-1 hover:text-yellow-400 rounded hover:bg-neutral-800 transition"
                                    title="Move note to folder..."
                                  >
                                    <FolderClosed size={10} />
                                  </button>
                                  
                                  {activeNoteMoveDropdown === note.id && (
                                    <div
                                      className="absolute right-0 top-6 w-36 py-1 rounded shadow-xl border z-50 text-left font-sans text-[11px]"
                                      style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
                                      onClick={ev => ev.stopPropagation()}
                                    >
                                      <div className="px-2 py-1 border-b text-[9px] font-mono opacity-50 uppercase" style={{ borderColor: theme.border }}>
                                        Move to:
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setNotes(prev => prev.map(n => n.id === note.id ? { ...n, folder: "" } : n));
                                          setActiveNoteMoveDropdown(null);
                                        }}
                                        className="w-full text-left px-2 py-1.5 hover:bg-zinc-800 flex items-center gap-1 transition"
                                        style={{ color: !note.folder ? theme.accent : theme.text }}
                                      >
                                        {(!note.folder) && <Check size={8} />}
                                        <span>(Root / None)</span>
                                      </button>
                                      {folders.map(f => (
                                        <button
                                          key={f}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setNotes(prev => prev.map(n => n.id === note.id ? { ...n, folder: f } : n));
                                            setActiveNoteMoveDropdown(null);
                                          }}
                                          className="w-full text-left px-2 py-1.5 hover:bg-zinc-800 flex items-center gap-1 transition truncate"
                                          style={{ color: note.folder === f ? theme.accent : theme.text }}
                                        >
                                          {note.folder === f && <Check size={8} />}
                                          <Folder size={9} className="opacity-60 text-yellow-500 shrink-0" />
                                          <span className="truncate">{f}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <button
                                  onClick={() => {
                                    setRenameNoteDialog({ isOpen: true, id: note.id, title: note.title });
                                  }}
                                  className="p-1 hover:text-sky-400 rounded hover:bg-neutral-800 transition"
                                  title="Rename note"
                                >
                                  <Edit2 size={10} />
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteNoteDialog({ isOpen: true, id: note.id, title: note.title });
                                  }}
                                  className="p-1 hover:text-red-500 rounded hover:bg-neutral-800 transition"
                                  title="Delete note"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {rootNotes.length === 0 && !searchTerm && (
                          <div className="p-2 text-[10px] italic text-center opacity-40 font-mono mx-auto" style={{ color: theme.sidebarText }}>
                            No loose files
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {filteredNotes.length === 0 && (
                  <div className="p-4 text-center text-xs opacity-50 font-mono" style={{ color: theme.sidebarText }}>
                    No notes inside vault.
                  </div>
                )}
              </div>

              {/* Simulated core plugins toggle controller */}
              <div
                className="p-3 border-t space-y-2 mt-auto"
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.sidebarBg,
                }}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider font-semibold flex items-center justify-between" style={{ color: theme.sidebarText }}>
                  <span>Simulated Plugins</span>
                  <Settings size={10} />
                </div>

                <div className="space-y-1.5 text-[11px] font-medium" style={{ color: theme.sidebarText }}>
                  <label className="flex items-center justify-between cursor-pointer hover:text-white">
                    <span>Stats Counter</span>
                    <input
                      type="checkbox"
                      checked={plugins.wordCount}
                      onChange={(e) => setPlugins({ ...plugins, wordCount: e.target.checked })}
                      className="accent-purple-500 scale-90"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer hover:text-white">
                    <span>Daily Journals</span>
                    <input
                      type="checkbox"
                      checked={plugins.dailyNotes}
                      onChange={(e) => setPlugins({ ...plugins, dailyNotes: e.target.checked })}
                      className="accent-purple-500 scale-90"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer hover:text-white">
                    <span>Visual Flowchart</span>
                    <input
                      type="checkbox"
                      checked={plugins.visualDiagram}
                      onChange={(e) => setPlugins({ ...plugins, visualDiagram: e.target.checked })}
                      className="accent-purple-500 scale-90"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer hover:text-white">
                    <span>Floating Emoji Picker</span>
                    <input
                      type="checkbox"
                      checked={plugins.emojiPicker}
                      onChange={(e) => setPlugins({ ...plugins, emojiPicker: e.target.checked })}
                      className="accent-purple-500 scale-90"
                    />
                  </label>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ✍️ MIDDLE COLUMN: Central Editor Sandbox / Markdown Previewer */}
        <main
          className="flex-1 flex flex-col h-full overflow-hidden p-2 sm:p-4 relative transition-all duration-300"
          style={{
            backgroundColor: theme.background,
          }}
        >
          {activeNote ? (
            <div
              className={`flex-1 flex flex-col h-full w-full mx-auto bg-opacity-40 rounded-xl overflow-hidden shadow-sm border p-4 sm:p-6 transition-all duration-300 ${
                isFullWidth ? "max-w-full" : "max-w-4xl"
              }`}
              style={{ backgroundColor: theme.editorBg, borderColor: theme.border }}
            >
              
              {/* Title Section */}
              <div className="mb-5 space-y-1 pb-3 border-b" style={{ borderColor: theme.border }}>
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => handleUpdateNoteTitle(e.target.value)}
                  placeholder="Note Title"
                  className="w-full text-2xl font-bold tracking-tight bg-transparent border-none outline-none font-sans"
                  style={{ color: theme.accent }}
                />
                
                <div className="flex flex-wrap items-center justify-between text-[11px] opacity-60 font-mono gap-y-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Created: {new Date(activeNote.createdAt).toLocaleString()}</span>
                    <span>•</span>
                    <span>Edited: {new Date(activeNote.updatedAt).toLocaleTimeString()}</span>
                    <span>•</span>
                    <span className="flex items-center gap-[3px] bg-black/10 px-1.5 py-0.5 rounded border border-zinc-700/20 hover:border-zinc-700/50 transition-all">
                      <Folder size={10} className="text-yellow-500/80 shrink-0" />
                      <span>Folder:</span>
                      <select
                        value={activeNote.folder || ""}
                        onChange={(e) => {
                          const newFolder = e.target.value;
                          setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, folder: newFolder } : n));
                        }}
                        className="bg-transparent border-none text-[10px] outline-none font-sans font-medium hover:text-white transition cursor-pointer p-0"
                        style={{ color: theme.accent }}
                      >
                        <option value="" style={{ backgroundColor: theme.cardBg, color: theme.text }}>(Root)</option>
                        {folders.map(f => (
                          <option key={f} value={f} style={{ backgroundColor: theme.cardBg, color: theme.text }}>{f}</option>
                        ))}
                      </select>
                    </span>
                  </div>
                  
                  {plugins.wordCount && (
                    <div className="flex items-center gap-2">
                      <span>{noteStats.words} words</span>
                      <span>•</span>
                      <span>{noteStats.readTime} min read</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Core Sandbox Panel */}
              <div className="flex-1 overflow-y-auto mb-4 relative">
                {!previewMode ? (
                  // Mode 1: Detailed editor view with line mapping
                  <div className="w-full h-full relative font-mono flex items-stretch">
                    
                    {/* Simulated editor margins index */}
                    <div className="w-10 text-right pr-3 shrink-0 font-mono text-[11px] select-none opacity-25 pt-0.5 border-r pb-12"
                         style={{ color: theme.text, borderColor: theme.border }}
                    >
                      {activeNote.content.split("\n").map((_, i) => (
                        <div key={`line-${i}`} className="h-[21px]">{i + 1}</div>
                      ))}
                    </div>

                    <textarea
                      id="note-text-editor"
                      value={activeNote.content}
                      onChange={(e) => handleUpdateNoteContent(e.target.value)}
                      placeholder="# Your Markdown goes here"
                      className="flex-1 px-4 text-[13px] leading-[21.5px] font-mono outline-none border-none resize-none bg-transparent h-full pb-48"
                      style={{ color: theme.text }}
                    />

                    {/* Emoji picker drawer overlay */}
                    {plugins.emojiPicker && (
                      <div className="absolute bottom-5 right-5 p-2 rounded-lg border shadow-lg flex gap-1.5 flex-wrap max-w-[200px]"
                           style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
                      >
                        {emojiList.map((em) => (
                          <button
                            key={em}
                            onClick={() => handleInsertEmoji(em)}
                            className="p-1 hover:scale-125 transition text-xs cursor-pointer"
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Mode 2: Clean rendered Markdown preview
                  <div className="prose text-[13px] leading-relaxed max-w-none pb-32">
                    <Markdown components={markdownRenderComponents}>
                      {processedMarkdown}
                    </Markdown>

                    {/* Clean list statistic items inline */}
                    <div className="mt-12 pt-6 border-t font-mono text-[11px] opacity-65 flex items-center justify-between" style={{ borderColor: theme.border }}>
                      <span>📄 Markdown Format Compiler v1.4</span>
                      <span>Stats: {noteStats.words} W | {noteStats.characters} C</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 🔗 BACKLINKING SECTION: Bottom Backlinks shelf */}
              <div
                className="mt-auto border-t pt-4"
                style={{ borderColor: theme.border }}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider mb-2" style={{ color: theme.sidebarText }}>
                  <Network size={12} style={{ color: theme.accent }} />
                  <span>Incoming Backlinks ({incomingBacklinks.length})</span>
                </div>

                {incomingBacklinks.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {incomingBacklinks.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => setActiveNoteId(n.id)}
                        className="p-1 px-2.5 rounded border text-[11px] font-medium flex items-center gap-1 hover:opacity-85 cursor-pointer transition shadow-sm"
                        style={{
                          backgroundColor: theme.cardBg,
                          borderColor: theme.border,
                        }}
                      >
                        <span style={{ color: theme.accent }}>←</span>
                        <span style={{ color: theme.text }}>[[{n.title}]]</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] italic font-mono" style={{ color: theme.sidebarText }}>
                    No other notes currently backlink to this file. Write [[{activeNote.title}]] in another file to link them.
                  </p>
                )}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center h-full text-center text-xs text-opacity-50">
              <Sparkles size={32} className="opacity-20 mb-2" style={{ color: theme.accent }} />
              <p>Welcome to the Obsidian .md Workspace!</p>
              <button
                onClick={() => handleAddNote()}
                className="mt-3 py-1.5 px-3 rounded font-medium text-[11px]"
                style={{ backgroundColor: theme.accent, color: "#121214" }}
              >
                Initialize blank note
              </button>
            </div>
          )}
        </main>

        {/* 🗺️ RIGHT COLUMN: Knowledge Graph, Diagrammer, and Chat co-writer */}
        <AnimatePresence initial={false}>
          {rightSidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="h-full border-l flex flex-col shrink-0 overflow-y-auto space-y-4 p-4 z-30 md:relative absolute right-0 top-0 shadow-2xl md:shadow-none w-[340px] max-w-[85vw]"
              style={{
                backgroundColor: theme.sidebarBg,
                borderColor: theme.border,
              }}
            >
              
              {/* Tab Selector Header */}
              <div className="flex items-center gap-1 p-0.5 bg-black bg-opacity-25 rounded border" style={{ borderColor: theme.border }}>
                <button
                  onClick={() => setRightSidebarTab("insights")}
                  className={`flex-1 py-1.5 px-0.5 rounded text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    rightSidebarTab === "insights" ? "bg-opacity-20 shadow-sm" : "opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: rightSidebarTab === "insights" ? theme.accent : "transparent",
                    color: rightSidebarTab === "insights" ? (theme.isDark ? "#ffffff" : "#000000") : theme.text
                  }}
                  title="Vault Graph & Diagrams"
                >
                  <Network size={11} />
                  <span>Map</span>
                </button>
                <button
                  onClick={() => setRightSidebarTab("ai")}
                  className={`flex-1 py-1.5 px-0.5 rounded text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    rightSidebarTab === "ai" ? "bg-opacity-20 shadow-sm" : "opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: rightSidebarTab === "ai" ? theme.accent : "transparent",
                    color: rightSidebarTab === "ai" ? (theme.isDark ? "#ffffff" : "#000000") : theme.text
                  }}
                  title="AI Co-Writer Chat"
                >
                  <Sparkles size={11} />
                  <span>AI Chat</span>
                </button>
                <button
                  onClick={() => setRightSidebarTab("google")}
                  className={`flex-1 py-1.5 px-0.5 rounded text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    rightSidebarTab === "google" ? "bg-opacity-20 shadow-sm" : "opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: rightSidebarTab === "google" ? theme.accent : "transparent",
                    color: rightSidebarTab === "google" ? (theme.isDark ? "#ffffff" : "#000000") : theme.text
                  }}
                  title="Google Workspace Services"
                >
                  <Globe size={11} />
                  <span>Cloud</span>
                </button>
              </div>

              {/* Conditional Content based on selected Tab */}
              {rightSidebarTab === "insights" && (
                <div className="space-y-4 flex flex-col flex-1">
                  {/* Module 1: Interactive Knowledge Graph */}
                  <div className="space-y-1 pt-1">
                    <KnowledgeGraph
                      notes={notes}
                      activeNoteId={activeNoteId}
                      onSelectNote={(id) => setActiveNoteId(id)}
                      theme={theme}
                    />
                  </div>

                  {/* Module 2: Visual Diagram compilation structure */}
                  {plugins.visualDiagram && activeNote && (
                    <div className="flex-1 min-h-[220px]">
                      <VisualDiagrammer note={activeNote} theme={theme} />
                    </div>
                  )}
                </div>
              )}

              {rightSidebarTab === "ai" && (
                <div className="flex-1 flex flex-col min-h-[380px]">
                  {/* Module 3: Chatbot Integration co-writer */}
                  <ChatbotSidebar
                    activeNote={activeNote}
                    notes={notes}
                    onAddNote={(title, content) => handleAddNote(title, content)}
                    theme={theme}
                  />
                </div>
              )}

              {rightSidebarTab === "google" && (
                <div className="flex-1 flex flex-col gap-2">
                  <GoogleWorkspacePanel
                    activeNote={activeNote}
                    onAddNote={(title, content) => handleAddNote(title, content)}
                    theme={theme}
                  />
                </div>
              )}

            </motion.aside>
          )}
        </AnimatePresence>

      </div>

      {/* 🎨 SETTINGS PALETTE MODAL PANEL */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-5 rounded-lg border shadow-xl flex flex-col gap-4 font-sans"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                color: theme.text,
              }}
            >
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: theme.border }}>
                <h3 className="font-semibold text-sm font-mono tracking-wider uppercase" style={{ color: theme.accent }}>
                  Color Vault Custonizier
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 px-2.5 rounded text-xs bg-opacity-10 font-bold hover:bg-opacity-20 cursor-pointer"
                  style={{ backgroundColor: theme.accent, color: theme.accent }}
                >
                  Apply
                </button>
              </div>

              {/* Select Theme Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider block opacity-75">
                  Corporate Presets
                </span>
                
                <div className="grid grid-cols-2 gap-2 text-[11px] font-medium">
                  {standardPresets.map((pr) => (
                    <button
                      key={pr.name}
                      onClick={() => setTheme(pr)}
                      className="p-2 py-2 rounded text-left border flex flex-col justify-between hover:border-gray-400 cursor-pointer text-[11.5px]"
                      style={{
                        backgroundColor: pr.background,
                        borderColor: theme.name === pr.name ? theme.accent : theme.border,
                        color: pr.text,
                      }}
                    >
                      <span>{pr.name}</span>
                      <div className="flex gap-1 mt-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pr.accent }} />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pr.sidebarBg }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Raw Custom Color Pickers */}
              <div className="space-y-2 pt-2 border-t" style={{ borderColor: theme.border }}>
                <span className="text-[10px] font-mono uppercase tracking-wider block opacity-75">
                  Full RGB Color Override
                </span>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono leading-relaxed">
                  <div className="flex items-center justify-between p-1.5 rounded border" style={{ borderColor: theme.border, backgroundColor: theme.editorBg }}>
                    <span>Background:</span>
                    <input
                      type="color"
                      value={theme.background}
                      onChange={(e) => handleThemeColorChange("background", e.target.value)}
                      className="w-6 h-6 rounded border-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded border" style={{ borderColor: theme.border, backgroundColor: theme.editorBg }}>
                    <span>Text Primary:</span>
                    <input
                      type="color"
                      value={theme.text}
                      onChange={(e) => handleThemeColorChange("text", e.target.value)}
                      className="w-6 h-6 rounded border-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded border" style={{ borderColor: theme.border, backgroundColor: theme.editorBg }}>
                    <span>Sidebar BG:</span>
                    <input
                      type="color"
                      value={theme.sidebarBg}
                      onChange={(e) => handleThemeColorChange("sidebarBg", e.target.value)}
                      className="w-6 h-6 rounded border-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded border" style={{ borderColor: theme.border, backgroundColor: theme.editorBg }}>
                    <span>Accent Key:</span>
                    <input
                      type="color"
                      value={theme.accent}
                      onChange={(e) => {
                        handleThemeColorChange("accent", e.target.value);
                        handleThemeColorChange("accentHover", e.target.value);
                      }}
                      className="w-6 h-6 rounded border-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded border" style={{ borderColor: theme.border, backgroundColor: theme.editorBg }}>
                    <span>Borders:</span>
                    <input
                      type="color"
                      value={theme.border}
                      onChange={(e) => handleThemeColorChange("border", e.target.value)}
                      className="w-6 h-6 rounded border-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded border" style={{ borderColor: theme.border, backgroundColor: theme.editorBg }}>
                    <span>Editor BG:</span>
                    <input
                      type="color"
                      value={theme.editorBg}
                      onChange={(e) => handleThemeColorChange("editorBg", e.target.value)}
                      className="w-6 h-6 rounded border-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    // Reset custom picker modifications to Slate Default
                    setTheme(standardPresets[0]);
                  }}
                  className="text-[10px] underline font-mono text-opacity-70 hover:text-opacity-100 flex items-center gap-1 cursor-pointer"
                  style={{ color: theme.text }}
                >
                  <RotateCcw size={10} />
                  Restore Slate Dark Defaults
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📖 HELP SHORTCUTS PANEL MODAL */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-5 rounded-lg border shadow-xl flex flex-col gap-4 font-sans"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                color: theme.text,
              }}
            >
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: theme.border }}>
                <h3 className="font-semibold text-sm font-mono tracking-wider uppercase" style={{ color: theme.accent }}>
                  Vault Cheat Sheet
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-1 px-3.5 rounded text-xs bg-opacity-20 cursor-pointer text-white font-semibold transition"
                  style={{ backgroundColor: theme.accent }}
                >
                  Got it
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <h4 className="font-semibold font-mono" style={{ color: theme.accent }}>
                    🛠️ Double Bracket Backlinks
                  </h4>
                  <p className="leading-relaxed opacity-90 font-sans">
                    Wrap any note name in double brackets like <code className="font-mono bg-neutral-900 px-1 py-0.5 rounded text-violet-300">[[Backlinking Guide]]</code> inside your note content. Click it in **Live Preview** to open, or create it if missing!
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-semibold font-mono" style={{ color: theme.accent }}>
                    ⚡ Flow Diagrams
                  </h4>
                  <p className="leading-relaxed opacity-90 font-sans">
                    Construct flowcharts on the fly inside the active note by adding arrows to double bullets:
                    <br />
                    <code className="font-mono bg-neutral-900 block p-1.5 rounded text-[10px] leading-tight text-emerald-300 mt-1">
                      - Setup Vault -{">"} Link Notes
                      <br />- Link Notes -{">"} Draw Graphs
                    </code>
                  </p>
                </div>

                <div className="space-y-1.5 border-t pt-3" style={{ borderColor: theme.border }}>
                  <h4 className="font-semibold font-mono text-[11px]" style={{ color: theme.text }}>
                    ⌨️ System Hotkeys
                  </h4>
                  <div className="font-mono space-y-1 opacity-80 text-[11px]">
                    <div className="flex justify-between">
                      <span>Toggle Preview:</span>
                      <span className="font-bold">Ctrl + E</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Create Daily Journal:</span>
                      <span className="font-bold">Alt + Click Journal</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🔮 CUSTOM MODAL: CREATE NEW FILE (ASK FOR TITLE) */}
      <AnimatePresence>
        {createNoteDialog.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4" id="create-note-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-xl p-5 border shadow-2xl flex flex-col gap-4"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }}
            >
              <div className="flex items-center gap-2 pb-1 border-b" style={{ borderColor: theme.border }}>
                <Edit3 size={15} style={{ color: theme.accent }} />
                <h3 className="font-semibold text-sm">Create New Note</h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono opacity-60 uppercase">Note Title</label>
                  <input
                    type="text"
                    placeholder="E.g. Project Specs, Master Plan..."
                    value={createNoteDialog.title}
                    onChange={(e) => setCreateNoteDialog(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-2 text-xs rounded border outline-none font-sans focus:ring-1"
                    style={{ backgroundColor: theme.editorBg, borderColor: theme.border, color: theme.text }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleConfirmCreateNote();
                      }
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono opacity-60 uppercase">Target Folder</label>
                  <select
                    value={createNoteDialog.folder}
                    onChange={(e) => setCreateNoteDialog(prev => ({ ...prev, folder: e.target.value }))}
                    className="w-full p-2 text-xs rounded border outline-none cursor-pointer focus:ring-1 select-none"
                    style={{ backgroundColor: theme.editorBg, borderColor: theme.border, color: theme.text }}
                  >
                    <option value="">(Root / None)</option>
                    {folders.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={() => setCreateNoteDialog({ isOpen: false, title: "", folder: "" })}
                  className="px-3 py-1.5 rounded hover:bg-zinc-800 hover:bg-opacity-40 text-[11px] font-medium transition cursor-pointer"
                  style={{ color: theme.sidebarText }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCreateNote}
                  className="px-4 py-1.5 rounded text-[11px] font-bold transition shadow cursor-pointer animate-pulse-subtle"
                  style={{ backgroundColor: theme.accent, color: "#111113" }}
                >
                  Create Note
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📁 CUSTOM MODAL: CREATE NEW VIRTUAL FOLDER */}
      <AnimatePresence>
        {createFolderDialog.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4" id="create-folder-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-xl p-5 border shadow-2xl flex flex-col gap-4"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }}
            >
              <div className="flex items-center gap-2 pb-1 border-b" style={{ borderColor: theme.border }}>
                <FolderPlus size={15} style={{ color: theme.accent }} />
                <h3 className="font-semibold text-sm">Create Folder</h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono opacity-60 uppercase">Folder Name</label>
                  <input
                    type="text"
                    placeholder="E.g. Archive, Brainstorm, Personal..."
                    value={createFolderDialog.name}
                    onChange={(e) => setCreateFolderDialog(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 text-xs rounded border outline-none font-sans focus:ring-1"
                    style={{ backgroundColor: theme.editorBg, borderColor: theme.border, color: theme.text }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleConfirmCreateFolder();
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={() => setCreateFolderDialog({ isOpen: false, name: "" })}
                  className="px-3 py-1.5 rounded hover:bg-zinc-800 hover:bg-opacity-40 text-[11px] font-medium transition cursor-pointer"
                  style={{ color: theme.sidebarText }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCreateFolder}
                  className="px-4 py-1.5 rounded text-[11px] font-bold transition shadow cursor-pointer"
                  style={{ backgroundColor: theme.accent, color: "#111113" }}
                >
                  Create Folder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📝 CUSTOM MODAL: RENAME FILE */}
      <AnimatePresence>
        {renameNoteDialog.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4" id="rename-file-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-xl p-5 border shadow-2xl flex flex-col gap-4"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }}
            >
              <div className="flex items-center gap-2 pb-1 border-b" style={{ borderColor: theme.border }}>
                <Edit2 size={13} style={{ color: theme.accent }} />
                <h3 className="font-semibold text-sm">Rename Note file</h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono opacity-60 uppercase">New file Title</label>
                  <input
                    type="text"
                    placeholder="Enter file name..."
                    value={renameNoteDialog.title}
                    onChange={(e) => setRenameNoteDialog(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-2 text-xs rounded border outline-none font-sans focus:ring-1"
                    style={{ backgroundColor: theme.editorBg, borderColor: theme.border, color: theme.text }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleConfirmRenameNote();
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={() => setRenameNoteDialog({ isOpen: false, id: "", title: "" })}
                  className="px-3 py-1.5 rounded hover:bg-zinc-800 hover:bg-opacity-40 text-[11px] font-medium transition cursor-pointer"
                  style={{ color: theme.sidebarText }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRenameNote}
                  className="px-4 py-1.5 rounded text-[11px] font-bold transition shadow cursor-pointer"
                  style={{ backgroundColor: theme.accent, color: "#111113" }}
                >
                  Apply Rename
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📁 CUSTOM MODAL: RENAME FOLDER */}
      <AnimatePresence>
        {renameFolderDialog.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4" id="rename-folder-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-xl p-5 border shadow-2xl flex flex-col gap-4"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }}
            >
              <div className="flex items-center gap-2 pb-1 border-b" style={{ borderColor: theme.border }}>
                <Folder size={13} style={{ color: theme.accent }} />
                <h3 className="font-semibold text-sm">Rename Folder directory</h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono opacity-60 uppercase">New Folder Name</label>
                  <input
                    type="text"
                    placeholder="Enter folder name..."
                    value={renameFolderDialog.newName}
                    onChange={(e) => setRenameFolderDialog(prev => ({ ...prev, newName: e.target.value }))}
                    className="w-full p-2 text-xs rounded border outline-none font-sans focus:ring-1"
                    style={{ backgroundColor: theme.editorBg, borderColor: theme.border, color: theme.text }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleConfirmRenameFolder();
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={() => setRenameFolderDialog({ isOpen: false, oldName: "", newName: "" })}
                  className="px-3 py-1.5 rounded hover:bg-zinc-800 hover:bg-opacity-40 text-[11px] font-medium transition cursor-pointer"
                  style={{ color: theme.sidebarText }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRenameFolder}
                  className="px-4 py-1.5 rounded text-[11px] font-bold transition shadow cursor-pointer"
                  style={{ backgroundColor: theme.accent, color: "#111113" }}
                >
                  Apply Rename
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ⚠️ CUSTOM MODAL: DELETE NOTE CONFIRMATION */}
      <AnimatePresence>
        {deleteNoteDialog.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in" id="delete-note-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-xl p-5 border shadow-2xl flex flex-col gap-4 text-left"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }}
            >
              <div className="flex items-center gap-2 pb-1 border-b" style={{ borderColor: theme.border }}>
                <Trash2 size={15} className="text-red-500" />
                <h3 className="font-semibold text-sm">Delete Knowledge Note</h3>
              </div>

              <p className="text-xs opacity-80 leading-relaxed text-left">
                Are you absolutely sure you want to delete note <span className="font-semibold text-white">"{deleteNoteDialog.title}"</span>? This action is permanent and cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={() => setDeleteNoteDialog({ isOpen: false, id: "", title: "" })}
                  className="px-3 py-1.5 rounded hover:bg-zinc-800 hover:bg-opacity-40 text-[11px] font-medium transition cursor-pointer"
                  style={{ color: theme.sidebarText }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteNote}
                  className="px-4 py-1.5 rounded text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 transition shadow cursor-pointer"
                  style={{ backgroundColor: "#ef4444" }}
                >
                  Delete Note
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ⚠️ CUSTOM MODAL: DELETE FOLDER CONFIRMATION */}
      <AnimatePresence>
        {deleteFolderDialog.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in" id="delete-folder-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-xl p-5 border shadow-2xl flex flex-col gap-4 text-left"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }}
            >
              <div className="flex items-center gap-2 pb-1 border-b" style={{ borderColor: theme.border }}>
                <Folder size={15} className="text-red-500" />
                <h3 className="font-semibold text-sm">Delete Virtual Directory</h3>
              </div>

              <div className="space-y-1.5 text-xs opacity-80 leading-relaxed text-left">
                <p>
                  Are you sure you want to remove the virtual folder <span className="font-semibold text-white">"{deleteFolderDialog.name}"</span>?
                </p>
                <p className="text-[10px] font-mono opacity-60">
                  Note: Any files inside will NOT be deleted; they will safely be repositioned to the Root workspace folder.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={() => setDeleteFolderDialog({ isOpen: false, name: "" })}
                  className="px-3 py-1.5 rounded hover:bg-zinc-800 hover:bg-opacity-40 text-[11px] font-medium transition cursor-pointer"
                  style={{ color: theme.sidebarText }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteFolder}
                  className="px-4 py-1.5 rounded text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 transition shadow cursor-pointer"
                  style={{ backgroundColor: "#ef4444" }}
                >
                  Delete Folder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🔮 HOVER FLOW DIAGRAM PREVIEW FLOATER */}
      <AnimatePresence>
        {hoveredLink && (() => {
          const matched = notes.find(n => n.title.toLowerCase() === hoveredLink.title.toLowerCase());
          return (
            <div 
              className="fixed pointer-events-none z-[150] shadow-2xl rounded-lg p-3.5 w-64 text-left border"
              style={{
                left: `${hoveredLink.clientX + 10}px`,
                top: `${hoveredLink.clientY + 12}px`,
                backgroundColor: theme.cardBg + "f2",
                backdropFilter: "blur(12px)",
                borderColor: theme.border,
                color: theme.text,
              }}
            >
              <div className="flex items-center justify-between border-b pb-1.5 mb-2" style={{ borderColor: theme.border + "77" }}>
                <div className="flex items-center gap-1.5 font-sans font-semibold text-xs truncate">
                  <span className="text-yellow-400 text-xs">✦</span>
                  <span className="truncate text-white text-[11px]">[[{hoveredLink.title}]]</span>
                </div>
                {matched?.folder && (
                  <span 
                    className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-black/45 rounded font-mono shrink-0 font-medium"
                    style={{ color: theme.accent }}
                  >
                    {matched.folder}
                  </span>
                )}
              </div>

              {matched ? (
                <NoteHoverDiagramContent note={matched} theme={theme} />
              ) : (
                <div className="text-[10px] text-zinc-500 italic py-1">
                  Virtual Note node does not exist. Click this link to instantly create and add it to your mapping!
                </div>
              )}
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ⚠️ NOTIFICATION CENTER: GRACEFUL FLOAT TOASTS */}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none max-w-sm w-80">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className="p-3.5 rounded-lg shadow-xl border flex items-center gap-2.5 pointer-events-auto backdrop-blur-md"
              style={{
                backgroundColor: theme.cardBg + "ea",
                borderColor: 
                  toast.type === "error" ? "rgba(239, 68, 68, 0.4)" :
                  toast.type === "warning" ? "rgba(245, 158, 11, 0.4)" :
                  toast.type === "success" ? "rgba(16, 185, 129, 0.4)" :
                  theme.border,
                color: theme.text,
              }}
            >
              <div className="flex-1 text-[11.5px] leading-relaxed font-sans font-medium text-white">
                {toast.type === "success" && <span className="text-emerald-400 mr-1.5">✓</span>}
                {toast.type === "error" && <span className="text-red-400 mr-1.5">✗</span>}
                {toast.type === "warning" && <span className="text-yellow-400 mr-1.5">⚠</span>}
                {toast.type === "info" && <span className="text-sky-400 mr-1.5">✦</span>}
                {toast.message}
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-[9px] font-bold opacity-45 hover:opacity-100 p-1 font-mono shrink-0 cursor-pointer text-white"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
