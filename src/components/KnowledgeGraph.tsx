import React, { useEffect, useRef, useState } from "react";
import { Note, ThemeSettings } from "../types";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface KnowledgeGraphProps {
  notes: Note[];
  activeNoteId: string;
  onSelectNote: (id: string) => void;
  theme: ThemeSettings;
}

interface SimNode {
  id: string;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isCurrent: boolean;
  size: number;
}

interface SimLink {
  sourceId: string;
  targetId: string;
}

export default function KnowledgeGraph({
  notes,
  activeNoteId,
  onSelectNote,
  theme,
}: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [links, setLinks] = useState<SimLink[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);

  // Parse nodes and edges from links
  useEffect(() => {
    // Collect unique notes as nodes
    const simNodes: SimNode[] = notes.map((note) => {
      // Find historical position if matches
      const existing = nodes.find((n) => n.id === note.id);
      
      const isCurrent = note.id === activeNoteId;
      // Count references to size nodes accordingly
      const incomingLinksCount = notes.reduce((acc, n) => {
        const regex = new RegExp(`\\[\\[${note.title}\\]\\]`, "gi");
        const matches = n.content.match(regex);
        return acc + (matches ? matches.length : 0);
      }, 0);

      return {
        id: note.id,
        title: note.title,
        x: existing?.x ?? (Math.random() * 200 + 100),
        y: existing?.y ?? (Math.random() * 200 + 100),
        vx: existing?.vx ?? 0,
        vy: existing?.vy ?? 0,
        isCurrent,
        size: 6 + Math.min(incomingLinksCount * 2, 14),
      };
    });

    // Identify standard [[links]]
    const simLinks: SimLink[] = [];
    notes.forEach((note) => {
      // Parse link matches like [[Note Title]]
      const matches = [...note.content.matchAll(/\[\[(.*?)\]\]/g)];
      matches.forEach((m) => {
        const targetTitle = m[1]?.trim();
        if (targetTitle) {
          const targetNote = notes.find(
            (n) => n.title.toLowerCase() === targetTitle.toLowerCase()
          );
          if (targetNote && targetNote.id !== note.id) {
            // Avoid duplicates
            const exists = simLinks.some(
              (l) =>
                (l.sourceId === note.id && l.targetId === targetNote.id) ||
                (l.sourceId === targetNote.id && l.targetId === note.id)
            );
            if (!exists) {
              simLinks.push({
                sourceId: note.id,
                targetId: targetNote.id,
              });
            }
          }
        }
      });
    });

    setNodes(simNodes);
    setLinks(simLinks);
  }, [notes, activeNoteId]);

  // Node physics simulationloop
  useEffect(() => {
    if (nodes.length === 0) return;

    let animId: number;
    const center = { x: 200, y: 150 };

    function step() {
      setNodes((prevNodes) => {
        const nextNodes = prevNodes.map((n) => ({ ...n }));

        // 1. Repulsion force between all nodes
        for (let i = 0; i < nextNodes.length; i++) {
          const n1 = nextNodes[i];
          if (n1.id === dragNodeId) continue; // Dragged node stays under cursor

          for (let j = i + 1; j < nextNodes.length; j++) {
            const n2 = nextNodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const distSq = dx * dx + dy * dy || 0.01;
            const dist = Math.sqrt(distSq);

            // Repulsive force magnitude
            if (dist < 180) {
              const force = (120 / (distSq * dist)) * 25;
              const fx = dx * force;
              const fy = dy * force;

              if (n1.id !== dragNodeId) {
                n1.vx -= fx;
                n1.vy -= fy;
              }
              if (n2.id !== dragNodeId) {
                n2.vx += fx;
                n2.vy += fy;
              }
            }
          }
        }

        // 2. Attraction force along links
        links.forEach((link) => {
          const sNode = nextNodes.find((n) => n.id === link.sourceId);
          const tNode = nextNodes.find((n) => n.id === link.targetId);

          if (sNode && tNode) {
            const dx = tNode.x - sNode.x;
            const dy = tNode.y - sNode.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
            // Target length of link is 90px
            const k = 0.025;
            const force = (dist - 100) * k;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (sNode.id !== dragNodeId) {
              sNode.vx += fx;
              sNode.vy += fy;
            }
            if (tNode.id !== dragNodeId) {
              tNode.vx -= fx;
              tNode.vy -= fy;
            }
          }
        });

        // 3. Gravity pulling towards center
        nextNodes.forEach((n) => {
          if (n.id === dragNodeId) return;
          const dx = center.x - n.x;
          const dy = center.y - n.y;
          n.vx += dx * 0.006;
          n.vy += dy * 0.006;
        });

        // 4. Dampen and update positions
        nextNodes.forEach((n) => {
          if (n.id === dragNodeId) return;
          n.vx *= 0.82;
          n.vy *= 0.82;
          n.x += n.vx;
          n.y += n.vy;

          // Soft boundary clamping within reasonable frame
          n.x = Math.max(30, Math.min(370, n.x));
          n.y = Math.max(30, Math.min(270, n.y));
        });

        return nextNodes;
      });

      animId = requestAnimationFrame(step);
    }

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [links, dragNodeId, nodes.length]);

  // Handle Dragging
  function handleMouseDown(e: React.MouseEvent, nodeId: string) {
    e.stopPropagation();
    setDragNodeId(nodeId);
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (dragNodeId) {
      // Scale translation based on Zoom/Pan
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        // Calculate coordinate relative to SVG space
        const mouseX = (e.clientX - rect.left - pan.x) / zoom;
        const mouseY = (e.clientY - rect.top - pan.y) / zoom;

        setNodes((prev) =>
          prev.map((n) =>
            n.id === dragNodeId ? { ...n, x: mouseX, y: mouseY, vx: 0, vy: 0 } : n
          )
        );
      }
    } else if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }

  function handleMouseUp() {
    setDragNodeId(null);
    setIsPanning(false);
  }

  function handleBgMouseDown(e: React.MouseEvent) {
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  }

  function handleReset() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    // Distribute nodes randomly near center for clean layout
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        x: Math.random() * 200 + 100,
        y: Math.random() * 160 + 70,
        vx: 0,
        vy: 0,
      }))
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[320px] rounded-lg overflow-hidden select-none border"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.border,
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseDown={handleBgMouseDown}
    >
      {/* Controls Overlay */}
      <div className="absolute top-3 left-3 z-10 flex gap-1.5 bg-opacity-70 backdrop-blur-sm p-1 rounded-md border"
           style={{ backgroundColor: theme.editorBg, borderColor: theme.border }}
      >
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.15, 2.5))}
          className="p-1 hover:opacity-80 rounded"
          style={{ color: theme.text }}
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.5))}
          className="p-1 hover:opacity-80 rounded"
          style={{ color: theme.text }}
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={handleReset}
          className="p-1 hover:opacity-80 rounded"
          style={{ color: theme.text }}
          title="Recenter & Reset"
        >
          <Maximize2 size={10} className="stroke-[3px]" />
        </button>
      </div>

      <div className="absolute top-3.5 right-3 text-[10px] font-mono tracking-wider uppercase" style={{ color: theme.sidebarText }}>
        Knowledge Vault Graph
      </div>

      <svg className="w-full h-full cursor-grab active:cursor-grabbing">
        {/* Transform Group for panning and zooming */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Draw Connection Links */}
          {links.map((link, idx) => {
            const source = nodes.find((n) => n.id === link.sourceId);
            const target = nodes.find((n) => n.id === link.targetId);
            if (!source || !target) return null;

            const isRelatedToHover =
              hoverNodeId === link.sourceId || hoverNodeId === link.targetId;
            const isRelatedToActive =
              activeNoteId === link.sourceId || activeNoteId === link.targetId;

            return (
              <line
                key={`link-${idx}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={
                  isRelatedToHover
                    ? theme.accent
                    : isRelatedToActive
                    ? theme.accent
                    : theme.border
                }
                strokeWidth={isRelatedToHover ? 1.8 : isRelatedToActive ? 1.4 : 0.8}
                strokeOpacity={isRelatedToHover ? 0.9 : isRelatedToActive ? 0.7 : 0.4}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Draw Nodes */}
          {nodes.map((node) => {
            const isHovered = hoverNodeId === node.id;
            const isCurrent = node.id === activeNoteId;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer"
                onMouseEnter={() => setHoverNodeId(node.id)}
                onMouseLeave={() => setHoverNodeId(null)}
                onDoubleClick={() => onSelectNote(node.id)}
              >
                {/* Outer Glow Halo for Active or Hovered Nodes */}
                {(isCurrent || isHovered) && (
                  <circle
                    r={node.size + 6}
                    fill={isCurrent ? theme.accent : theme.border}
                    opacity={isCurrent ? 0.25 : 0.15}
                    className="animate-pulse"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  r={node.size}
                  fill={isCurrent ? theme.accent : isHovered ? theme.accentHover : theme.cardBg}
                  stroke={isCurrent ? theme.accent : theme.accent}
                  strokeWidth={isCurrent ? 2 : 1.5}
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                />

                {/* Node Label (Text) */}
                <text
                  y={node.size + 14}
                  textAnchor="middle"
                  className="font-sans font-medium text-[9px] select-none pointer-events-none"
                  style={{
                    fill: isCurrent ? theme.accent : theme.text,
                    fontWeight: isCurrent || isHovered ? "600" : "400",
                    opacity: isCurrent || isHovered ? 1 : 0.75,
                  }}
                >
                  {node.title}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
