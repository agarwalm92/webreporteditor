import { useEffect, useRef, useState, useCallback } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  DecoupledEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading,
  FontSize,
  FontFamily,
  FontColor,
  FontBackgroundColor,
  Alignment,
  List,
  Indent,
  IndentBlock,
  Link,
  Table,
  TableToolbar,
  HorizontalLine,
  BlockQuote,
  Undo,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import "./styles/editor.css";

const INITIAL_CONTENT = `
<h1>Q4 2024 Performance Report</h1>
<h2>Acme Corporation</h2>
<p><strong>Prepared by:</strong> Mayank Agarwal &nbsp;|&nbsp; <strong>Date:</strong> March 2026 &nbsp;|&nbsp; <strong>Rating:</strong> BBB+</p>
<hr>
<h3>Executive Summary</h3>
<p>Total revenue for Q4 stands at <strong>$4.2M</strong>, reflecting a <strong>12.4%</strong> year-over-year growth against a target of <strong>$3.8M</strong>. Assets under management stand at <strong>$142M</strong>.</p>
<h3>Financial Performance</h3>
<table>
  <tbody>
    <tr><th>Metric</th><th>Q3 2024</th><th>Q4 2024</th><th>Target</th><th>Variance</th></tr>
    <tr><td>Revenue</td><td>$3.8M</td><td>$4.2M</td><td>$3.8M</td><td>+10.5%</td></tr>
    <tr><td>Operating Costs</td><td>$2.1M</td><td>$2.3M</td><td>$2.2M</td><td>+4.5%</td></tr>
    <tr><td>Net Profit</td><td>$1.7M</td><td>$1.9M</td><td>$1.6M</td><td>+18.7%</td></tr>
    <tr><td>AUM</td><td>$128M</td><td>$142M</td><td>$135M</td><td>+5.2%</td></tr>
  </tbody>
</table>
<h3>Risk Analysis</h3>
<p>The portfolio maintains a risk rating of <strong>BBB+</strong> with diversified exposure across asset classes. Equity allocation at 35% of total AUM.</p>
<h3>Outlook</h3>
<p>Management projects continued growth of <strong>12.4%</strong> into FY2025, subject to macro conditions and ongoing regulatory review.</p>
`;

// ─── Preview Panel ────────────────────────────────────────────────────────────
function PreviewPanel({ content }) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#f3f4f6",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "8px 16px",
          background: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
          fontSize: 11,
          fontWeight: 600,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        👁 Live Preview
      </div>

      {/* Scrollable preview */}
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <div
          style={{
            background: "#fff",
            boxShadow: "0 1px 6px rgba(0,0,0,0.10)",
            borderRadius: 2,
            padding: "36px 32px",
            minHeight: 500,
            fontFamily: "Calibri, Segoe UI, sans-serif",
            fontSize: "8pt",
            lineHeight: 1.55,
            color: "#111",
          }}
        >
          <div
            className="preview-body"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Drag Divider ─────────────────────────────────────────────────────────────
function DragDivider({ onDrag }) {
  const isDragging = useRef(false);

  const onPointerDown = (e) => {
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    // Prevent text selection while dragging
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  };

  const onPointerMove = (e) => {
    if (!isDragging.current) return;
    onDrag(e.clientX);
  };

  const onPointerUp = (e) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        width: 6,
        flexShrink: 0,
        background: "#e5e7eb",
        cursor: "col-resize",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.15s",
        position: "relative",
        zIndex: 10,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#1e3a5f")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#e5e7eb")}
      title="Drag to resize"
    >
      {/* Grip dots */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          pointerEvents: "none",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 2,
              height: 2,
              borderRadius: "50%",
              background: "#9ca3af",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const toolbarRef = useRef(null);
  const containerRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  const [content, setContent] = useState(INITIAL_CONTENT);
  const [showPreview, setShowPreview] = useState(true);
  const [saveStatus, setSaveStatus] = useState("saved");
  const saveTimer = useRef(null);

  // editorWidthPct: percentage of the container given to the editor pane
  // default 62% editor, 38% preview
  const [editorWidthPct, setEditorWidthPct] = useState(62);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleDrag = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const rawPct = ((clientX - rect.left) / rect.width) * 100;
    // Clamp: editor minimum 35%, maximum 85%
    const clamped = Math.min(85, Math.max(35, rawPct));
    setEditorWidthPct(clamped);
  }, []);

  const handleChange = (_event, editor) => {
    const data = editor.getData();
    setContent(data);
    setSaveStatus("unsaved");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaveStatus("saving");
      setTimeout(() => setSaveStatus("saved"), 700);
    }, 1500);
  };

  const handleReady = (editor) => {
    if (toolbarRef.current) {
      toolbarRef.current.appendChild(editor.ui.view.toolbar.element);
    }
  };

  const handleDestroy = () => {
    if (toolbarRef.current) {
      while (toolbarRef.current.firstChild) {
        toolbarRef.current.removeChild(toolbarRef.current.firstChild);
      }
    }
  };

  return (
    <div className="app-shell">
      {/* ── Top bar ── */}
      <div className="top-bar">
        <span className="top-bar-title">📄 ReportEditor</span>
        <span className="top-bar-doc">Q4 2024 — Acme Corporation</span>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* Preview toggle */}
          <button
            onClick={() => setShowPreview((p) => !p)}
            style={{
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.35)",
              background: showPreview
                ? "rgba(255,255,255,0.22)"
                : "transparent",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {showPreview ? "✕ Hide Preview" : "👁 Show Preview"}
          </button>

          {/* Save status */}
          <span
            className={`save-pill ${saveStatus}`}
            title="In production this saves to your SQL database"
          >
            {saveStatus === "saved" && "✓ Saved"}
            {saveStatus === "saving" && "⏳ Saving…"}
            {saveStatus === "unsaved" && "● Unsaved"}
          </span>
        </div>
      </div>

      {/* ── Toolbar ribbon ── */}
      <div className="toolbar-ribbon" ref={toolbarRef} />

      {/* ── Editor + Preview container ── */}
      <div
        ref={containerRef}
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          // Prevent iframe/editor from eating pointer events during drag
          pointerEvents: "auto",
        }}
      >
        {/* Editor pane */}
        <div
          style={{
            width: showPreview ? `${editorWidthPct}%` : "100%",
            minWidth: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            transition: showPreview ? "none" : "width 0.2s",
          }}
        >
          <div className="page-scroll" style={{ flex: 1 }}>
            {isMounted && (
              <CKEditor
                editor={DecoupledEditor}
                data={INITIAL_CONTENT}
                config={{
                  licenseKey: "GPL",
                  plugins: [
                    Essentials,
                    Paragraph,
                    Bold,
                    Italic,
                    Underline,
                    Strikethrough,
                    Heading,
                    FontSize,
                    FontFamily,
                    FontColor,
                    FontBackgroundColor,
                    Alignment,
                    List,
                    Indent,
                    IndentBlock,
                    Link,
                    Table,
                    TableToolbar,
                    HorizontalLine,
                    BlockQuote,
                    Undo,
                  ],
                  toolbar: {
                    items: [
                      "undo",
                      "redo",
                      "|",
                      "heading",
                      "|",
                      "fontFamily",
                      "fontSize",
                      "|",
                      "fontColor",
                      "fontBackgroundColor",
                      "|",
                      "bold",
                      "italic",
                      "underline",
                      "strikethrough",
                      "|",
                      "alignment",
                      "|",
                      "bulletedList",
                      "numberedList",
                      "outdent",
                      "indent",
                      "|",
                      "link",
                      "insertTable",
                      "blockQuote",
                      "horizontalLine",
                    ],
                    shouldNotGroupWhenFull: false,
                  },
                  heading: {
                    options: [
                      {
                        model: "paragraph",
                        title: "Paragraph",
                        class: "ck-heading_paragraph",
                      },
                      {
                        model: "heading1",
                        view: "h1",
                        title: "Heading 1",
                        class: "ck-heading_heading1",
                      },
                      {
                        model: "heading2",
                        view: "h2",
                        title: "Heading 2",
                        class: "ck-heading_heading2",
                      },
                      {
                        model: "heading3",
                        view: "h3",
                        title: "Heading 3",
                        class: "ck-heading_heading3",
                      },
                    ],
                  },
                  table: {
                    contentToolbar: [
                      "tableColumn",
                      "tableRow",
                      "mergeTableCells",
                    ],
                  },
                  fontSize: {
                    options: [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32],
                  },
                }}
                onReady={handleReady}
                onAfterDestroy={handleDestroy}
                onChange={handleChange}
              />
            )}
          </div>
        </div>

        {/* Drag divider — only shown when preview is visible */}
        {showPreview && <DragDivider onDrag={handleDrag} />}

        {/* Preview pane */}
        {showPreview && (
          <div
            style={{
              width: `${100 - editorWidthPct}%`,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <PreviewPanel content={content} />
          </div>
        )}
      </div>
    </div>
  );
}
