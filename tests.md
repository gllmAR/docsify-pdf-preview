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

## 2 · Backend overrides

### 2.1 — Force `pdfjs` backend in inline mode

PDF.js is lazy-loaded. Provides page-navigation and zoom controls.

[Sample PDF — pdfjs inline](https://sample-files.com/downloads/documents/pdf/sample-5-page-pdf-a4-size.pdf ':pdf-preview mode=inline backend=pdfjs height=70vh')

---

### 2.2 — Force `pdfjs` backend in modal mode

[Sample PDF — pdfjs modal](https://sample-files.com/downloads/documents/pdf/sample-5-page-pdf-a4-size.pdf ':pdf-preview mode=modal backend=pdfjs')

---

### 2.3 — Force `native` backend explicitly

[Sample PDF — native inline](https://sample-files.com/downloads/documents/pdf/basic-text.pdf ':pdf-preview mode=inline backend=native height=50vh')

---

## 3 · Combined overrides

### 3.1 — Inline + pdfjs + custom height

[10-page doc — pdfjs 60vh](https://sample-files.com/downloads/documents/pdf/sample-10-page-pdf-a4-size.pdf ':pdf-preview mode=inline backend=pdfjs height=60vh')

---

### 3.2 — Modal + pdfjs + custom size

[10-page doc — pdfjs modal 80vw](https://sample-files.com/downloads/documents/pdf/sample-10-page-pdf-a4-size.pdf ':pdf-preview mode=modal backend=pdfjs modalWidth=80vw modalHeight=80vh')

---

### 3.3 — Both + pdfjs

[10-page doc — both + pdfjs](https://sample-files.com/downloads/documents/pdf/sample-10-page-pdf-a4-size.pdf ':pdf-preview mode=both backend=pdfjs')

---

## 4 · Edge cases

### 4.1 — Token present but no options (bare `:pdf-preview`)

Falls back to global config entirely.

[Sample PDF — bare token](https://sample-files.com/downloads/documents/pdf/basic-text.pdf ':pdf-preview')

---

### 4.2 — Unknown keys are silently ignored

Only whitelisted keys (`mode`, `backend`, `height`, `modalWidth`, `modalHeight`) are applied.

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

### 5.1 — Image-heavy PDF, inline pdfjs

[Image doc — pdfjs inline](https://sample-files.com/downloads/documents/pdf/image-doc.pdf ':pdf-preview mode=inline backend=pdfjs height=75vh')

---

### 5.2 — Legal-size, modal native

[Legal size — modal native](https://sample-files.com/downloads/documents/pdf/sample-pdf-legal-size.pdf ':pdf-preview mode=modal backend=native modalWidth=70vw modalHeight=90vh')

---

### 5.3 — Fillable form, inline native

[Fillable form — inline native](https://sample-files.com/downloads/documents/pdf/fillable-form.pdf ':pdf-preview mode=inline backend=native height=80vh')
