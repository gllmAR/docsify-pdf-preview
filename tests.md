# Per-Link Option Tests

This page exercises every combination of the `:pdf-preview` per-link syntax.  
Each link overrides the **global config** (set to `mode: 'modal'` in `index.html`) inline.

> **Syntax reminder**
> ```markdown
> [Label](file.pdf ':pdf-preview key=value key2=value2')
> ```
> The token lives in the Markdown link title (the quoted part after the URL).  
> It is stripped before rendering so it never appears as a browser tooltip.

---

## 1 · Mode overrides

### 1.1 — Force `inline` (native iframe)

Global config is `modal`, this link overrides to inline with default height.

[Sample PDF — inline](https://sample-files.com/downloads/documents/pdf/basic-text.pdf ':pdf-preview mode=inline')

---

### 1.2 — Force `inline` with custom height

[Sample PDF — inline 40vh](https://sample-files.com/downloads/documents/pdf/basic-text.pdf ':pdf-preview mode=inline height=40vh')

---

### 1.3 — Force `inline` with tall height

[Sample PDF — inline 90vh](https://sample-files.com/downloads/documents/pdf/basic-text.pdf ':pdf-preview mode=inline height=90vh')

---

### 1.4 — Force `modal` (explicit, same as default)

[Sample PDF — modal](https://sample-files.com/downloads/documents/pdf/basic-text.pdf ':pdf-preview mode=modal')

---

### 1.5 — Force `modal` with custom size

[Sample PDF — modal 60vw × 70vh](https://sample-files.com/downloads/documents/pdf/sample-report.pdf ':pdf-preview mode=modal modalWidth=60vw modalHeight=70vh')

---

### 1.6 — Force `modal` with large size

[Sample PDF — modal 95vw × 95vh](https://sample-files.com/downloads/documents/pdf/sample-report.pdf ':pdf-preview mode=modal modalWidth=95vw modalHeight=95vh')

---

### 1.7 — Force `both` (link + preview button)

[Sample PDF — both](https://sample-files.com/downloads/documents/pdf/basic-text.pdf ':pdf-preview mode=both')

---

## 2 · Cross-origin behavior

### 2.1 — Cross-origin PDF with default production-safe behavior

By default, cross-origin PDFs use native rendering to avoid browser CORS errors and flaky public proxy behavior.

[Sample PDF — default cross-origin](https://sample-files.com/downloads/documents/pdf/sample-5-page-pdf-a4-size.pdf ':pdf-preview mode=inline height=70vh')

---

### 2.2 — Opt in to PDF.js for cross-origin PDFs

Use this only when the remote server sends CORS headers or you control a reliable proxy.

[Sample PDF — cross-origin PDF.js opt-in](https://sample-files.com/downloads/documents/pdf/sample-5-page-pdf-a4-size.pdf ':pdf-preview mode=modal pdfjsCrossOrigin=true')

---

## 3 · Combined overrides

### 3.1 — Inline + custom height

[10-page doc — 60vh](https://sample-files.com/downloads/documents/pdf/sample-10-page-pdf-a4-size.pdf ':pdf-preview mode=inline height=60vh')

---

### 3.2 — Modal + custom size

[10-page doc — modal 80vw](https://sample-files.com/downloads/documents/pdf/sample-10-page-pdf-a4-size.pdf ':pdf-preview mode=modal modalWidth=80vw modalHeight=80vh')

---

### 3.3 — Both + cross-origin PDF.js opt-in

[10-page doc — both + pdfjsCrossOrigin](https://sample-files.com/downloads/documents/pdf/sample-10-page-pdf-a4-size.pdf ':pdf-preview mode=both pdfjsCrossOrigin=true')

---

## 4 · Edge cases

### 4.1 — Token present but no options (bare `:pdf-preview`)

Falls back to global config entirely.

[Sample PDF — bare token](https://sample-files.com/downloads/documents/pdf/basic-text.pdf ':pdf-preview')

---

### 4.2 — Unknown keys are silently ignored

Only whitelisted keys (`mode`, `height`, `modalWidth`, `modalHeight`, `pdfjsCrossOrigin`) are applied.

[Sample PDF — unknown key](https://sample-files.com/downloads/documents/pdf/basic-text.pdf ':pdf-preview mode=inline color=red foo=bar')

---

### 4.3 — Quoted values

[Sample PDF — quoted values](https://sample-files.com/downloads/documents/pdf/basic-text.pdf ':pdf-preview mode="inline" height="55vh"')

---

### 4.4 — No token (plain PDF link, uses global config)

[Sample PDF — no token](https://sample-files.com/downloads/documents/pdf/basic-text.pdf)

---

### 4.5 — Multiple PDF links on the same line, each with different options

[Doc A — inline](https://sample-files.com/downloads/documents/pdf/basic-text.pdf ':pdf-preview mode=inline height=30vh') · [Doc B — modal](https://sample-files.com/downloads/documents/pdf/sample-report.pdf ':pdf-preview mode=modal modalWidth=70vw')

---

## 5 · Real-world document types

### 5.1 — Image-heavy PDF, inline

[Image doc — inline](https://sample-files.com/downloads/documents/pdf/image-doc.pdf ':pdf-preview mode=inline height=75vh')

---

### 5.2 — Legal-size, modal

[Legal size — modal](https://sample-files.com/downloads/documents/pdf/sample-pdf-legal-size.pdf ':pdf-preview mode=modal modalWidth=70vw modalHeight=90vh')

---

### 5.3 — Fillable form, inline

[Fillable form — inline](https://sample-files.com/downloads/documents/pdf/fillable-form.pdf ':pdf-preview mode=inline height=80vh')
