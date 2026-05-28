import { Note } from "./types";

export const defaultNotes: Note[] = [
  {
    id: "welcome-note",
    title: "Welcome to Obsidian",
    content: `# Welcome to Obsidian .md Editor

This is a minimalist, highly customizable markdown workspace designed for mapping out knowledge. 

## Key Core Features

1. **Dual Modes**: Toggle between **Text Editor Mode** and **Live Preview Mode** using the floating action button at the top, or the quick-action hotkey \`Ctrl + E\` (or \`Cmd + E\`).
2. **Double-Bracket Backlinks**: Create connected networks of notes by wrapping note names in brackets like [[Backlinking Guide]]. Click any link to open it, or create a brand-new note!
3. **Interactive Knowledge Graph**: View your entire vault as a dynamic, interactive force-directed graph node-map. Drag nodes, hover to see titles, and double-click to navigate!
4. **Visual Diagramming**: Creating outlines dynamically draws SVG flowcharts in the visual diagramming panel. Read the instructions in [[Visual Diagramming]].
5. **AI Co-Writer Chatbot**: Ask the AI sidebar assistant to draft paragraphs, search your note vault, or draw up comprehensive study and roadmap plans.

## Real-Time Outline Flowchart
Let's see the bullet-based diagrammer parse arrows:
- Draft Outline -> Write Notes
- Write Notes -> Link Concepts
- Link Concepts -> Visualize Graph
`,
    createdAt: new Date("2026-05-28T10:00:00Z").toISOString(),
    updatedAt: new Date("2026-05-28T10:05:00Z").toISOString()
  },
  {
    id: "backlinking-guide",
    title: "Backlinking Guide",
    content: `# Interconnecting Your Notes

Traditional note apps use nested folder hierarchies. This Obsidian Editor relies on **dynamic bidirectional backlinks** to build a personal web of knowledge.

## Why Backlink?
- Avoid rigid hierarchies.
- Allow organic discovery of connections.
- Your vault adapts as your ideas expand.

## Creating Links in Obsidian
Simply type double brackets around another note's title like [[Welcome to Obsidian]]. You can also link to a note that does not exist yet (e.g., [[My Master Plan]]), and clicking the link will seamlessly initialize a blank note with that title!

This bidirectional association allows [[Welcome to Obsidian]] to know that this note refers to it. Scroll to the bottom of the editor in Preview Mode to see the active backlinks!

## Concept Flow
- Scattered Notes -> Connect Brackets
- Connect Brackets -> Unified Brain
- Unified Brain -> Deep Insights
`,
    createdAt: new Date("2026-05-28T10:01:00Z").toISOString(),
    updatedAt: new Date("2026-05-28T10:03:00Z").toISOString()
  },
  {
    id: "visual-diagramming",
    title: "Visual Diagramming",
    content: `# Real-Time Visual Diagramming

This editor parses text structures and outputs active vector SVG diagrams in the **Diagramming** plugin pane.

## Built-In Flowchart Parser
To create a high-quality flowchart in the diagram panel, write simple list nodes separated by \`->\`.

For example:
- Define Topic -> Research Context
- Research Context -> Draft Content
- Draft Content -> Link Notes
- Link Notes -> AI Refinement

## Outlines Node Tree
The diagrammer also creates tree views based on your header indentation rules, or any nested list items. Try adding indented items below to see them update in real-time in the sidebar!

- Root Idea
  - Sub-concept Alpha
  - Sub-concept Beta
    - Micro Detail 1
- Supporting Resource
`,
    createdAt: new Date("2026-05-28T10:01:30Z").toISOString(),
    updatedAt: new Date("2026-05-28T10:04:10Z").toISOString()
  }
];
