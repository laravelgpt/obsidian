import React, { useMemo } from "react";
import { Note, ThemeSettings, DiagramNode, DiagramEdge } from "../types";
import { GitCommit, GitPullRequest, ArrowRight, TableProperties } from "lucide-react";

interface VisualDiagrammerProps {
  note: Note;
  theme: ThemeSettings;
}

export default function VisualDiagrammer({ note, theme }: VisualDiagrammerProps) {
  const content = note?.content || "";

  // Parse arrow flows: e.g. "- Define Topic -> Research Context"
  const arrowFlowData = useMemo(() => {
    const nodes: { id: string; label: string }[] = [];
    const edges: { source: string; target: string }[] = [];
    const lines = content.split("\n");

    lines.forEach((line) => {
      const trimmed = line.trim();
      // Look for lines starting with lists and containing at least one "->"
      if ((trimmed.startsWith("-") || trimmed.startsWith("*")) && trimmed.includes("->")) {
        // Strip markdown prefix
        let cleanText = trimmed.replace(/^[-*]\s*/, "");
        const parts = cleanText.split("->").map((p) => p.trim());

        for (let i = 0; i < parts.length; i++) {
          const nodeLabel = parts[i];
          const nodeId = nodeLabel.toLowerCase().replace(/[^a-z0-9]/g, "-");
          
          if (nodeId && !nodes.some((n) => n.id === nodeId)) {
            nodes.push({ id: nodeId, label: nodeLabel });
          }

          if (i > 0) {
            const prevLabel = parts[i - 1];
            const prevId = prevLabel.toLowerCase().replace(/[^a-z0-9]/g, "-");
            if (prevId && nodeId) {
              edges.push({ source: prevId, target: nodeId });
            }
          }
        }
      }
    });

    return { nodes, edges };
  }, [content]);

  // Parse bullet outline hierarchy: e.g. nested lists
  const bulletOutlineData = useMemo(() => {
    const listItems: { text: string; indent: number; id: string; parentId: string | null }[] = [];
    const lines = content.split("\n");
    let lastAtIndent: { [key: number]: string } = {};

    lines.forEach((line, index) => {
      // Find indentation
      const match = line.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
      if (match) {
        const indentSpace = match[1].length;
        const text = match[3].trim();
        // Skip arrow-flow lines to avoid mixing
        if (text.includes("->")) return;

        const cleanId = `item-${index}-${text.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 15)}`;
        
        // Find parent with smaller indent
        let parentId: string | null = null;
        let pIndent = indentSpace - 1;
        while (pIndent >= 0) {
          if (lastAtIndent[pIndent]) {
            parentId = lastAtIndent[pIndent];
            break;
          }
          pIndent--;
        }
        // Fallback to highest level if no matching parent
        if (!parentId && indentSpace > 0) {
          const keys = Object.keys(lastAtIndent).map(Number).filter(k => k < indentSpace);
          if (keys.length > 0) {
            const maxKey = Math.max(...keys);
            parentId = lastAtIndent[maxKey];
          }
        }

        listItems.push({
          text,
          indent: indentSpace,
          id: cleanId,
          parentId,
        });

        lastAtIndent[indentSpace] = cleanId;
      }
    });

    return listItems;
  }, [content]);

  // Parse header structure: e.g. #, ##
  const headerStructure = useMemo(() => {
    const items: { label: string; level: number; y: number }[] = [];
    const lines = content.split("\n");
    let yCounter = 0;

    lines.forEach((line) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const label = match[2].trim();
        items.push({ label, level, y: yCounter++ });
      }
    });

    return items;
  }, [content]);

  const hasDiagramData = arrowFlowData.nodes.length > 0 || bulletOutlineData.length > 0 || headerStructure.length > 0;

  return (
    <div
      className="flex flex-col h-full border rounded-lg overflow-hidden"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.border,
      }}
    >
      <div
        className="p-3 border-b flex items-center justify-between"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.sidebarBg,
        }}
      >
        <div className="flex items-center gap-2">
          <GitCommit size={15} style={{ color: theme.accent }} />
          <span className="text-xs font-semibold tracking-wider uppercase font-mono" style={{ color: theme.text }}>
            Dynamic Diagrams
          </span>
        </div>
        <span className="text-[10px] py-0.5 px-2 rounded-full font-mono uppercase bg-opacity-10" style={{ color: theme.accent, backgroundColor: theme.accent }}>
          Live compiler
        </span>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        {!hasDiagramData ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-xs p-4">
            <GitPullRequest size={24} className="opacity-30 mb-2" style={{ color: theme.sidebarText }} />
            <p className="font-sans font-medium" style={{ color: theme.text }}>
              No visual diagram data detected
            </p>
            <p className="text-[10px] mt-1 max-w-[200px]" style={{ color: theme.sidebarText }}>
              Write bullet points like <code className="font-mono bg-opacity-10 p-0.5 rounded" style={{ backgroundColor: theme.accent, color: theme.accent }}>A -{">"} B</code> or nested list nodes to render flowcharts!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Arrow-Flow Diagram section */}
            {arrowFlowData.nodes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase font-mono tracking-wider" style={{ color: theme.sidebarText }}>
                  Sequential Link Flow
                </h4>
                
                <div className="flex flex-col gap-2.5 p-3 rounded-md border" style={{ borderColor: theme.border, backgroundColor: theme.editorBg }}>
                  {arrowFlowData.nodes.map((node, index) => {
                    const outgoingEdge = arrowFlowData.edges.filter(e => e.source === node.id);
                    return (
                      <React.Fragment key={node.id}>
                        <div
                          className="p-2 py-2 rounded border text-xs font-medium text-center shadow-sm relative transition-all hover:scale-[1.02]"
                          style={{
                            backgroundColor: theme.cardBg,
                            borderColor: theme.border,
                            color: theme.text,
                            borderLeft: `3.5px solid ${theme.accent}`,
                          }}
                        >
                          {node.label}
                        </div>
                        {index < arrowFlowData.nodes.length - 1 && (
                          <div className="flex justify-center py-0.5 animate-bounce">
                            <ArrowRight size={14} className="transform rotate-90" style={{ color: theme.accent }} />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Indented Node Diagram Section */}
            {bulletOutlineData.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase font-mono tracking-wider" style={{ color: theme.sidebarText }}>
                  Mind Outline Tree
                </h4>
                <div className="p-3.5 rounded-md border text-xs space-y-1 font-mono" style={{ borderColor: theme.border, backgroundColor: theme.editorBg }}>
                  {bulletOutlineData.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 transition-all hover:opacity-100"
                      style={{
                        paddingLeft: `${item.indent * 12}px`,
                        opacity: item.indent > 0 ? 0.8 : 1,
                      }}
                    >
                      <span className="opacity-40" style={{ color: theme.accent }}>
                        {item.parentId ? "└─" : "●"}
                      </span>
                      <span
                        className="py-1 px-2 rounded hover:bg-opacity-10 text-[11px]"
                        style={{
                          color: item.parentId ? theme.text : theme.accent,
                          fontWeight: item.parentId ? "400" : "600",
                        }}
                      >
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Header Structure Mapping */}
            {headerStructure.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase font-mono tracking-wider" style={{ color: theme.sidebarText }}>
                  Markdown Document Schema
                </h4>
                <div className="p-3.5 rounded-md border text-xs flex flex-col gap-1.5" style={{ borderColor: theme.border, backgroundColor: theme.editorBg }}>
                  {headerStructure.map((head, idx) => (
                    <div
                      key={`head-${idx}`}
                      className="flex items-center gap-1.5"
                      style={{
                        paddingLeft: `${(head.level - 1) * 14}px`,
                      }}
                    >
                      <span
                        className="text-[9px] font-bold py-0.5 px-1.5 rounded uppercase font-mono"
                        style={{
                          backgroundColor: theme.border,
                          color: theme.sidebarText,
                        }}
                      >
                        H{head.level}
                      </span>
                      <span
                        className="font-sans font-medium truncate text-[11px]"
                        style={{
                          color: theme.text,
                        }}
                      >
                        {head.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
