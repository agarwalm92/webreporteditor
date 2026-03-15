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
  PageBreak,
  CloudServices,
} from "ckeditor5";
import { Pagination, ExportPdf, ExportWord } from "ckeditor5-premium-features";
import "ckeditor5/ckeditor5.css";
import "ckeditor5-premium-features/ckeditor5-premium-features.css";
import "./styles/editor.css";

const LICENSE_KEY = import.meta.env.VITE_CK_LICENSE_KEY;
const TOKEN_URL = import.meta.env.VITE_CK_TOKEN_URL;

// Margins must match exactly between pagination + exportPdf + exportWord
const PAGE_MARGINS = {
  top: "20mm",
  bottom: "20mm",
  left: "25mm",
  right: "25mm",
};

const INITIAL_CONTENT = `
<h1>Q4 2024 Performance Report</h1>
<h2>Acme Corporation</h2>
<p><strong>Prepared by:</strong> Priya Sharma &nbsp;|&nbsp; <strong>Date:</strong> March 2025 &nbsp;|&nbsp; <strong>Rating:</strong> BBB+</p>
<hr>

<h3>Executive Summary</h3>
<p>
  Total revenue for Q4 stands at <strong>$4.2M</strong>, reflecting a <strong>12.4%</strong>
  year-over-year growth against a target of <strong>$3.8M</strong>.
  Assets under management stand at <strong>$142M</strong> as of reporting date.
</p>

<h3>Financial Performance</h3>
<p>The table below summarises quarterly performance across key financial metrics.</p>

<table>
  <tbody>
    <tr>
      <th>Metric</th>
      <th>Q3 2024</th>
      <th>Q4 2024</th>
      <th>Target</th>
      <th>Variance</th>
    </tr>
    <tr>
      <td>Revenue</td>
      <td>$3.8M</td>
      <td>$4.2M</td>
      <td>$3.8M</td>
      <td>+10.5%</td>
    </tr>
    <tr>
      <td>Operating Costs</td>
      <td>$2.1M</td>
      <td>$2.3M</td>
      <td>$2.2M</td>
      <td>+4.5%</td>
    </tr>
    <tr>
      <td>Net Profit</td>
      <td>$1.7M</td>
      <td>$1.9M</td>
      <td>$1.6M</td>
      <td>+18.7%</td>
    </tr>
    <tr>
      <td>AUM</td>
      <td>$128M</td>
      <td>$142M</td>
      <td>$135M</td>
      <td>+5.2%</td>
    </tr>
  </tbody>
</table>

<h3>Risk Analysis</h3>
<p>
  The portfolio maintains a risk rating of <strong>BBB+</strong> with diversified
  exposure across asset classes. Equity allocation remains the largest component
  at 35% of total AUM, followed by Fixed Income at 28%.
</p>

<h3>Outlook</h3>
<p>
  Management projects continued growth of <strong>12.4%</strong> into FY2025,
  subject to macro conditions and ongoing regulatory review. The pipeline
  includes three new institutional mandates currently in due diligence.
</p>
`;

// ── Preview Panel ─────────────────────────────────────────────────────────
function PreviewPanel({ content, pageCount }) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#f9fafb",
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>👁 Live Preview</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 400,
            color: "#9ca3af",
          }}
        >
          {pageCount} {pageCount === 1 ? "page" : "pages"}
        </span>
      </div>

      {/* Readable content — no A4 frame, full width, comfortable font */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "28px 32px",
          background: "#fff",
        }}
      >
        <div
          className="preview-body preview-readable"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}

// ── Drag Divider ──────────────────────────────────────────────────────────
function DragDivider({ onDrag }) {
  const dragging = useRef(false);
  const onPointerDown = (e) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    onDrag(e.clientX);
  };
  const onPointerUp = (e) => {
    dragging.current = false;
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
        zIndex: 10,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#1e3a5f")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#e5e7eb")}
    >
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

// ── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const toolbarRef = useRef(null);
  const containerRef = useRef(null);
  const saveTimer = useRef(null);

  const [isMounted, setIsMounted] = useState(false);
  const [content, setContent] = useState(INITIAL_CONTENT);
  const [showPreview, setShowPreview] = useState(true);
  const [saveStatus, setSaveStatus] = useState("saved");
  const [editorWidthPct, setEditorWidthPct] = useState(62);
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleDrag = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setEditorWidthPct(Math.min(85, Math.max(35, pct)));
  }, []);

  const handleChange = (_e, editor) => {
    setContent(editor.getData());
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

    editor.keystrokes.set("Ctrl+Enter", (_data, cancel) => {
      editor.execute("pageBreak");
      cancel();
    });

    // Track page count
    try {
      const pagination = editor.plugins.get("Pagination");
      setPageCount(pagination.pageCount);
      editor.model.document.on("change", () => {
        setPageCount(pagination.pageCount);
      });
    } catch (e) {
      console.warn("Pagination not available:", e.message);
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
      {/* Top bar */}
      <div className="top-bar">
        <span className="top-bar-title">📄 ReportEditor</span>
        <span className="top-bar-doc">Q4 2024 — Acme Corporation</span>

        <span
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.65)",
            background: "rgba(255,255,255,0.1)",
            padding: "2px 10px",
            borderRadius: 8,
            whiteSpace: "nowrap",
          }}
        >
          {pageCount} {pageCount === 1 ? "page" : "pages"}
        </span>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <button
            onClick={() => setShowPreview((p) => !p)}
            style={{
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.35)",
              background: showPreview ? "rgba(255,255,255,0.2)" : "transparent",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {showPreview ? "✕ Hide Preview" : "👁 Show Preview"}
          </button>
          <span className={`save-pill ${saveStatus}`}>
            {saveStatus === "saved" && "✓ Saved"}
            {saveStatus === "saving" && "⏳ Saving…"}
            {saveStatus === "unsaved" && "● Unsaved"}
          </span>
        </div>
      </div>

      {/* Toolbar ribbon */}
      <div className="toolbar-ribbon" ref={toolbarRef} />

      {/* Body */}
      <div
        ref={containerRef}
        style={{ display: "flex", flex: 1, overflow: "hidden" }}
      >
        <div
          style={{
            width: showPreview ? `${editorWidthPct}%` : "100%",
            minWidth: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className="page-scroll" style={{ flex: 1 }}>
            {isMounted && (
              <CKEditor
                editor={DecoupledEditor}
                data={INITIAL_CONTENT}
                config={{
                  licenseKey: LICENSE_KEY,
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
                    PageBreak,
                    CloudServices,
                    Pagination,
                    ExportPdf,
                    ExportWord,
                  ],
                  toolbar: {
                    items: [
                      // Export buttons — most important, always visible
                      "exportPdf",
                      "exportWord",
                      "|",
                      // Pagination nav
                      "previousPage",
                      "nextPage",
                      "pageNavigation",
                      "|",
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
                      "|",
                      "pageBreak",
                    ],
                    shouldNotGroupWhenFull: false,
                  },

                  // Pagination — A4 with matching margins
                  pagination: {
                    pageWidth: "21cm",
                    pageHeight: "29.7cm",
                    pageMargins: PAGE_MARGINS,
                  },

                  cloudServices: {
                    tokenUrl: TOKEN_URL,
                  },

                  exportPdf: {
                    fileName: "report-q4-2024.pdf",
                    stylesheets: [
                      "./ckeditor5.css",
                      "./ckeditor5-premium-features.css",
                      "./style.css", // ← your content styles with .ck-content prefix
                    ],
                    converterOptions: {
                      format: "A4",
                      margin_top: "20mm",
                      margin_bottom: "20mm",
                      margin_left: "25mm",
                      margin_right: "25mm",
                      page_orientation: "portrait",
                    },
                  },

                  exportWord: {
                    fileName: "report-q4-2024.docx",
                    stylesheets: [
                      "./ckeditor5.css",
                      "./ckeditor5-premium-features.css",
                      "./style.css",
                    ],
                    converterOptions: {
                      document: {
                        size: "A4",
                        margins: {
                          top: "20mm",
                          bottom: "20mm",
                          left: "25mm",
                          right: "25mm",
                        },
                      },
                    },
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

        {showPreview && <DragDivider onDrag={handleDrag} />}

        {showPreview && (
          <div
            style={{
              width: `${100 - editorWidthPct}%`,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <PreviewPanel content={content} pageCount={pageCount} />
          </div>
        )}
      </div>
    </div>
  );
}
