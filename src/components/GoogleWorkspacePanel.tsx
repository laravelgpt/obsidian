import React, { useState, useEffect } from "react";
import { 
  FileText, 
  MessageSquare, 
  Send, 
  ExternalLink, 
  RefreshCw, 
  Download, 
  Upload, 
  Check, 
  AlertCircle, 
  Loader2, 
  LogOut, 
  Globe,
  PlusCircle,
  HelpCircle,
  Hash
} from "lucide-react";
import { subscribeToAuth, googleSignIn, googleSignOut, AuthSession } from "../lib/firebaseAuth";
import { Note, ThemeSettings } from "../types";

interface GoogleWorkspacePanelProps {
  activeNote: Note | null;
  onAddNote: (title: string, content: string) => void;
  theme: ThemeSettings;
}

interface ChatSpace {
  name: string; // "spaces/AAAABBBCC"
  displayName: string;
  type: string; // "ROOM", "DM"
}

export default function GoogleWorkspacePanel({ activeNote, onAddNote, theme }: GoogleWorkspacePanelProps) {
  // Authentication states
  const [session, setSession] = useState<AuthSession>({ user: null, accessToken: null });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);

  // Panel navigation state: "docs" | "chat"
  const [activeTab, setActiveTab] = useState<"docs" | "chat">("docs");

  // Google Docs state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportedDocUrl, setExportedDocUrl] = useState<string | null>(null);
  const [exportedDocTitle, setExportedDocTitle] = useState<string | null>(null);
  const [docExportError, setDocExportError] = useState<string | null>(null);

  const [importDocId, setImportDocId] = useState<string>("");
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [docImportError, setDocImportError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Google Chat state
  const [spaces, setSpaces] = useState<ChatSpace[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState<boolean>(false);
  const [spacesError, setSpacesError] = useState<string | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<string>("");
  
  const [chatMessage, setChatMessage] = useState<string>("");
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const [chatSuccessMessage, setChatSuccessMessage] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [includeNoteContent, setIncludeNoteContent] = useState<boolean>(true);

  // Subscribe to Authentication changes
  useEffect(() => {
    const unsubscribe = subscribeToAuth((newSession) => {
      setSession(newSession);
      // Reset errors and success states on user change
      setAuthError(null);
      setExportedDocUrl(null);
      setImportSuccessMessage(null);
      setChatSuccessMessage(null);
    });
    return () => unsubscribe();
  }, []);

  // Set default message format when active note changes
  useEffect(() => {
    if (activeNote) {
      setChatMessage(`Sharing note: *${activeNote.title}*\n\n`);
    } else {
      setChatMessage("");
    }
  }, [activeNote]);

  // Handle SignIn with Google
  const handleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await googleSignIn();
    } catch (err: any) {
      setAuthError(err.message || "Failed to sign in with Google.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Logout
  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setSpaces([]);
      setSelectedSpace("");
    } catch (err: any) {
      setAuthError("Failed to log out of Google session.");
    }
  };

  // Fetch Google Chat Spaces
  const fetchChatSpaces = async () => {
    if (!session.accessToken) return;
    setIsLoadingSpaces(true);
    setSpacesError(null);
    try {
      const response = await fetch("https://chat.googleapis.com/v1/spaces", {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Google Chat API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      const loadedSpaces: ChatSpace[] = data.spaces || [];
      setSpaces(loadedSpaces);
      if (loadedSpaces.length > 0) {
        setSelectedSpace(loadedSpaces[0].name);
      }
    } catch (err: any) {
      console.error("Fetch Spaces Error:", err);
      setSpacesError("Could not retrieve Google Chat spaces. Make sure Chat API has valid access.");
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  // Export note as Google Doc (destructive mutation warning if existing title? Docs API creates clean new ones, so it's write-only safer)
  const handleExportToGoogleDoc = async () => {
    if (!activeNote) return;
    if (!session.accessToken) {
      setDocExportError("You must be signed in to export to Google Docs.");
      return;
    }

    setIsExporting(true);
    setDocExportError(null);
    setExportedDocUrl(null);

    try {
      // 1. Create a blank Google Doc with the specified title
      const createResponse = await fetch("https://docs.googleapis.com/v1/documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: activeNote.title,
        }),
      });

      if (!createResponse.ok) {
        const errData = await createResponse.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Failed to create document: ${createResponse.status}`);
      }

      const createdDoc = await createResponse.json();
      const documentId = createdDoc.documentId;

      // 2. Insert the note content body text into the document
      const noteBody = activeNote.content || "*(No note content)*";
      
      const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: {
                  index: 1,
                },
                text: noteBody,
              },
            },
          ],
        }),
      });

      if (!updateResponse.ok) {
        throw new Error(`Created blank document but failed to insert content: ${updateResponse.statusText}`);
      }

      setExportedDocTitle(activeNote.title);
      setExportedDocUrl(`https://docs.google.com/document/d/${documentId}/edit`);
    } catch (err: any) {
      console.error("Export Docs Error:", err);
      setDocExportError(err.message || "An error occurred exporting document to Google Docs.");
    } finally {
      setIsExporting(false);
    }
  };

  // Helper parser for Google Docs API Body JSON formatting
  const parseGoogleDocText = (doc: any): string => {
    if (!doc || !doc.body || !doc.body.content) return "";
    let parsedText = "";
    for (const item of doc.body.content) {
      if (item.paragraph && item.paragraph.elements) {
        for (const element of item.paragraph.elements) {
          if (element.textRun && element.textRun.content) {
            parsedText += element.textRun.content;
          }
        }
      }
    }
    return parsedText;
  };

  // Extract document ID from typical user pasted Google Doc URL
  const extractDocId = (input: string): string => {
    const rawValue = input.trim();
    if (rawValue.includes("/d/")) {
      const parts = rawValue.split("/d/");
      if (parts.length > 1) {
        const idWithSuffix = parts[1];
        const endOfIdIndex = idWithSuffix.indexOf("/");
        if (endOfIdIndex !== -1) {
          return idWithSuffix.substring(0, endOfIdIndex);
        }
        return idWithSuffix;
      }
    }
    return rawValue; // fallback to raw string input as ID
  };

  // Import high-fidelity Google Doc as dynamic note
  const handleImportGoogleDoc = async () => {
    const docId = extractDocId(importDocId);
    if (!docId) {
      setDocImportError("Please enter a valid Google Document ID or paste its complete URL.");
      return;
    }

    if (!session.accessToken) {
      setDocImportError("You must sign in to Google to fetch Docs.");
      return;
    }

    setIsImporting(true);
    setDocImportError(null);
    setImportSuccessMessage(null);

    try {
      const response = await fetch(`https://docs.googleapis.com/v1/documents/${docId}`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Google Docs API returned error: ${response.status} (${response.statusText})`);
      }

      const documentData = await response.json();
      const title = documentData.title || "Untitled Imported Doc";
      const parsedContent = parseGoogleDocText(documentData);

      // Create note in parent obsidian notes state
      onAddNote(title, parsedContent);
      setImportSuccessMessage(`Successfully imported "${title}" as a new Obsidian note!`);
      setImportDocId("");
    } catch (err: any) {
      console.error("Import Docs Error:", err);
      setDocImportError(err.message || "Failed to retrieve the Google Document content. Verify ID and access.");
    } finally {
      setIsImporting(false);
    }
  };

  // Send Obsidian Note to Google Chat Space
  const handleSendMessageToChat = async () => {
    if (!selectedSpace) {
      setChatError("Please select a valid Google Chat space from the list.");
      return;
    }

    if (!session.accessToken) {
      setChatError("You must sign in to Google first.");
      return;
    }

    // Ask parent user for confirmation message posting action as per "User Confirmation guidelines"
    const confirmed = window.confirm(
      `Confirm Action: This will post a message to the Google Chat Space "${
        spaces.find(s => s.name === selectedSpace)?.displayName || selectedSpace
      }". Proceed?`
    );
    if (!confirmed) return;

    setIsSendingMessage(true);
    setChatError(null);
    setChatSuccessMessage(null);

    try {
      // Build message payload
      let messageContent = chatMessage.trim();
      if (includeNoteContent && activeNote) {
        messageContent += `\n\n*Note Contents:*\n\`\`\`markdown\n${activeNote.content}\n\`\`\``;
      }

      const url = `https://chat.googleapis.com/v1/${selectedSpace}/messages`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: messageContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Failed to send chat message: ${response.status}`);
      }

      setChatSuccessMessage("Successfully printed note to Google Chat!");
      // Reset text except headers
      if (activeNote) {
        setChatMessage(`Sharing note: *${activeNote.title}*\n\n`);
      }
    } catch (err: any) {
      console.error("Chat Message Error:", err);
      setChatError(err.message || "Failed to deliver message securely to Google Chat space.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Automatically fetch spaces on successful login if Chat tab active
  useEffect(() => {
    if (session.accessToken && activeTab === "chat" && spaces.length === 0) {
      fetchChatSpaces();
    }
  }, [session.accessToken, activeTab]);

  return (
    <div 
      className="p-4 rounded-xl border font-sans text-xs shadow-md transition-all flex flex-col gap-3"
      style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }}
      id="google-workspace-integration-panel"
    >
      {/* Header status section */}
      <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: theme.border }}>
        <div className="flex items-center gap-1.5">
          <Globe size={13} style={{ color: theme.accent }} />
          <span className="font-mono font-bold tracking-wider uppercase" style={{ color: theme.accent }}>
            Google Workspace
          </span>
        </div>
        
        {session.user ? (
          <button
            onClick={handleSignOut}
            className="p-1 px-2 rounded hover:bg-opacity-15 cursor-pointer flex items-center gap-1 opacity-70 hover:opacity-100 transition border text-[10px]"
            style={{ color: theme.sidebarText, borderColor: theme.border }}
            title="Log out of Google API"
          >
            <LogOut size={10} />
            <span>Sign Out</span>
          </button>
        ) : (
          <span className="text-[10px] opacity-40 font-mono">OFFLINE</span>
        )}
      </div>

      {/* Connection State */}
      {!session.user ? (
        <div className="flex flex-col items-center justify-center py-4 text-center gap-3">
          <p className="leading-relaxed opacity-80 max-w-[260px] text-[11px]">
            Connect your Google Account with matching scopes to import/export notes in high-fidelity with **Google Docs** and publish files with **Google Chat**.
          </p>
          
          <button 
            onClick={handleSignIn}
            disabled={isAuthLoading}
            className="flex items-center gap-2 bg-white text-black p-2 px-3 rounded shadow hover:bg-neutral-100 font-medium transition cursor-pointer"
            id="gsi-sign-in-btn"
          >
            {isAuthLoading ? (
              <Loader2 size={14} className="animate-spin text-neutral-600" />
            ) : (
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4.5 h-4.5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
            )}
            <span className="text-[11px]">Sign in with Google</span>
          </button>

          {authError && (
            <div className="flex items-center gap-1.5 p-2 rounded bg-red-950/20 text-red-400 max-w-[260px] border border-red-900/30">
              <AlertCircle size={12} className="shrink-0" />
              <p className="text-[10px] text-left leading-snug">{authError}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {/* User profile capsule info */}
          <div className="flex items-center gap-2 p-1.5 px-2.5 rounded bg-black/15 border" style={{ borderColor: theme.border }}>
            {session.user.photoURL ? (
              <img src={session.user.photoURL} alt="Avatar" className="w-5.5 h-5.5 rounded-full ring-1 ring-white/10" />
            ) : (
              <div className="w-5.5 h-5.5 rounded-full flex items-center justify-center bg-zinc-700 font-mono text-[9px] text-zinc-300">G</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[11px] leading-tight truncate">{session.user.displayName || "Google Account"}</p>
              <p className="text-[9px] opacity-50 truncate">{session.user.email}</p>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Cloud Active Ready" />
          </div>

          {/* TAB Buttons */}
          <div className="grid grid-cols-2 gap-1 p-0.5 rounded-md bg-black/20 border" style={{ borderColor: theme.border }}>
            <button
              onClick={() => setActiveTab("docs")}
              className={`py-1.5 rounded font-mono font-medium flex items-center justify-center gap-1 cursor-pointer transition ${
                activeTab === "docs" ? "bg-opacity-15 shadow-sm font-semibold" : "opacity-60 hover:opacity-100"
              }`}
              style={{
                backgroundColor: activeTab === "docs" ? theme.accent : "transparent",
                color: activeTab === "docs" ? (theme.isDark ? "#ffffff" : "#000000") : theme.text
              }}
            >
              <FileText size={11} />
              <span>Google Docs</span>
            </button>
            
            <button
              onClick={() => setActiveTab("chat")}
              className={`py-1.5 rounded font-mono font-medium flex items-center justify-center gap-1 cursor-pointer transition ${
                activeTab === "chat" ? "bg-opacity-15 shadow-sm font-semibold" : "opacity-60 hover:opacity-100"
              }`}
              style={{
                backgroundColor: activeTab === "chat" ? theme.accent : "transparent",
                color: activeTab === "chat" ? (theme.isDark ? "#ffffff" : "#000000") : theme.text
              }}
            >
              <MessageSquare size={11} />
              <span>Google Chat</span>
            </button>
          </div>

          {/* Active Panel View */}
          <div className="flex flex-col gap-3 min-h-[200px]">
            {activeTab === "docs" ? (
              <div className="flex flex-col gap-3">
                
                {/* section: EXPORT */}
                <div className="flex flex-col gap-1.5 p-2 bg-black/10 rounded border border-dashed" style={{ borderColor: theme.border }}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold tracking-wider opacity-90 uppercase text-[10px]">Export to Cloud</span>
                    <Download size={11} className="opacity-50" />
                  </div>
                  
                  {activeNote ? (
                    <div className="space-y-2">
                      <p className="opacity-70 leading-snug text-[10px]">
                        Save active note <span className="font-semibold" style={{ color: theme.accent }}>"{activeNote.title}"</span> as a fresh Google Doc on your Drive securely.
                      </p>
                      
                      <button
                        onClick={handleExportToGoogleDoc}
                        disabled={isExporting}
                        className="w-full p-2 py-1.5 rounded font-medium flex items-center justify-center gap-1.5 transition cursor-pointer hover:bg-opacity-90 shadow-sm"
                        style={{ backgroundColor: theme.accent, color: theme.isDark ? "#ffffff" : "#000000" }}
                      >
                        {isExporting ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Upload size={12} />
                        )}
                        <span>Create Google Doc</span>
                      </button>
                    </div>
                  ) : (
                    <p className="opacity-40 italic text-[10px]">Please select or open a note to export.</p>
                  )}

                  {exportedDocUrl && (
                    <div className="mt-2 p-2 rounded bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 flex flex-col gap-1.5">
                      <div className="flex items-center gap-1 text-[10.5px] font-semibold">
                        <Check size={12} />
                        <span>Created Successfully!</span>
                      </div>
                      <p className="text-[9.5px] leading-tight opacity-90">
                        "{exportedDocTitle}" is ready in your docs library. Click below to view.
                      </p>
                      <a
                        href={exportedDocUrl}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="text-[10px] font-mono hover:underline flex items-center gap-1 text-sky-400 font-bold justify-end mt-0.5"
                      >
                        <span>Open Document</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  )}

                  {docExportError && (
                    <div className="flex items-center gap-1 p-2 rounded bg-red-950/20 text-red-400 border border-red-900/30">
                      <AlertCircle size={11} className="shrink-0" />
                      <p className="text-[10px]">{docExportError}</p>
                    </div>
                  )}
                </div>

                {/* section: IMPORT */}
                <div className="flex flex-col gap-1.5 p-2 bg-black/10 rounded border border-dashed" style={{ borderColor: theme.border }}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold tracking-wider opacity-90 uppercase text-[10px]">Import from Cloud</span>
                    <Download size={11} className="opacity-50" />
                  </div>
                  
                  <p className="opacity-70 leading-snug text-[10px]">
                    Paste a Google Document ID or paste its full share browser URL to pull dynamic content directly into your Obsidian vault.
                  </p>

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Pasted URL or Document ID..."
                      value={importDocId}
                      onChange={(e) => setImportDocId(e.target.value)}
                      className="flex-1 p-1.5 rounded border font-mono text-[10px] outline-none"
                      style={{ backgroundColor: theme.editorBg, borderColor: theme.border, color: theme.text }}
                    />
                    <button
                      onClick={handleImportGoogleDoc}
                      disabled={isImporting || !importDocId}
                      className="p-1 px-3 rounded font-mono font-medium flex items-center justify-center gap-1 text-[11px] disabled:opacity-40 select-none cursor-pointer"
                      style={{ backgroundColor: theme.border, color: theme.text }}
                      title="Pull Document content"
                    >
                      {isImporting ? <Loader2 size={11} className="animate-spin" /> : <span>Import</span>}
                    </button>
                  </div>

                  {importSuccessMessage && (
                    <div className="flex items-start gap-1 p-1.5 rounded bg-emerald-950/20 text-emerald-400 border border-emerald-900/40">
                      <Check size={11} className="mt-0.5 shrink-0" />
                      <p className="text-[10px] leading-tight">{importSuccessMessage}</p>
                    </div>
                  )}

                  {docImportError && (
                    <div className="flex items-start gap-1 p-1.5 rounded bg-red-950/20 text-red-400 border border-red-900/30">
                      <AlertCircle size={11} className="mt-0.5 shrink-0" />
                      <p className="text-[10px] leading-tight">{docImportError}</p>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* List spaces, compose message */}
                <div className="flex flex-col gap-2 p-2 bg-black/10 rounded border" style={{ borderColor: theme.border }}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider opacity-80">Select Chat Target Space</span>
                    <button 
                      onClick={fetchChatSpaces}
                      disabled={isLoadingSpaces}
                      className="p-1 rounded hover:bg-black/30 transition text-zinc-400 hover:text-white"
                      title="Refresh Chat Spaces"
                    >
                      <RefreshCw size={10} className={isLoadingSpaces ? "animate-spin" : ""} />
                    </button>
                  </div>

                  {spaces.length > 0 ? (
                    <select
                      value={selectedSpace}
                      onChange={(e) => setSelectedSpace(e.target.value)}
                      className="w-full p-1.5 rounded border text-[10.5px] font-medium outline-none cursor-pointer"
                      style={{ backgroundColor: theme.editorBg, borderColor: theme.border, color: theme.text }}
                    >
                      {spaces.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.displayName || `Room: ${s.name.split("/")[1]}`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div>
                      {isLoadingSpaces ? (
                        <div className="flex items-center justify-center gap-1.5 py-2 text-zinc-500 font-mono text-[10px]">
                          <Loader2 size={11} className="animate-spin" />
                          <span>Pinging Chat spaces...</span>
                        </div>
                      ) : (
                        <div className="text-zinc-500 italic text-[10px] py-1">
                          No space rooms found yet. Set up or refresh spaces.
                        </div>
                      )}
                    </div>
                  )}

                  {spacesError && (
                    <div className="text-[10px] text-red-400 text-left bg-red-950/20 p-1.5 border border-red-900/30 rounded mt-0.5 flex gap-1 items-start">
                      <AlertCircle size={10} className="mt-0.5 shrink-0" />
                      <span>{spacesError}</span>
                    </div>
                  )}
                </div>

                {/* Compose message container */}
                <div className="flex flex-col gap-2 p-2 bg-black/10 rounded border" style={{ borderColor: theme.border }}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider opacity-80">Message Template</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        id="include-content-chk"
                        checked={includeNoteContent}
                        onChange={(e) => setIncludeNoteContent(e.target.checked)}
                        className="scale-90 cursor-pointer"
                      />
                      <label htmlFor="include-content-chk" className="text-[9.5px] cursor-pointer select-none opacity-60">
                        Include code body
                      </label>
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Enter quick comments, summary details or message to send to space..."
                    className="w-full p-2 rounded border font-mono text-[10.5px] leading-normal outline-none resize-none"
                    style={{ backgroundColor: theme.editorBg, borderColor: theme.border, color: theme.text }}
                  />

                  {activeNote && includeNoteContent && (
                    <div className="p-1 px-2 rounded bg-zinc-800/40 border border-zinc-700/30 text-[9.5px] opacity-60 font-mono truncate">
                      Attachment: {activeNote.title} ({activeNote.content.length} chars)
                    </div>
                  )}

                  <button
                    onClick={handleSendMessageToChat}
                    disabled={isSendingMessage || !selectedSpace}
                    className="w-full p-2 rounded font-medium flex items-center justify-center gap-1.5 transition cursor-pointer hover:bg-opacity-95 shadow-sm ml-auto text-[11px] disabled:opacity-40"
                    style={{ backgroundColor: theme.accent, color: theme.isDark ? "#ffffff" : "#000000" }}
                  >
                    {isSendingMessage ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Send size={11} />
                    )}
                    <span>Send to Google Chat</span>
                  </button>

                  {chatSuccessMessage && (
                    <div className="flex items-center gap-1 p-2 rounded bg-emerald-950/20 text-emerald-400 border border-emerald-900/40">
                      <Check size={11} className="shrink-0" />
                      <p className="text-[10px]">{chatSuccessMessage}</p>
                    </div>
                  )}

                  {chatError && (
                    <div className="flex items-start gap-1 p-2 rounded bg-red-950/20 text-red-400 border border-red-900/30">
                      <AlertCircle size={11} className="mt-0.5 shrink-0" />
                      <p className="text-[10px] leading-tight">{chatError}</p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
