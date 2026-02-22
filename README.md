# docsify-pdf-preview

A [Docsify](https://docsify.js.org) plugin that enables inline and modal preview of `.pdf` assets linked within your Markdown pages.

## Features

- 🔍 **Auto-detects** PDF links in rendered Markdown content
- 📄 **Inline mode** – replaces the link with an embedded iframe viewer
- 🪟 **Modal mode** – opens a full-screen overlay on click (default)
- 🔀 **Both mode** – keeps the original link and adds a preview button
- 📦 **Optional PDF.js backend** – lazy-loaded for page navigation and zoom controls
- ♿ **Accessible** – ARIA roles, focus trap, ESC key, keyboard navigation
- 🔒 **Secure** – URL sanitization, no `eval`, no inline scripts
- ⚡ **Performant** – no preloading, no global event listener leaks

---

## Installation

Add a single `<script>` tag after `docsify.min.js` — styles are injected automatically:

```html
<script src="docsify-pdf-preview.js"></script>
```

Or use a CDN:

```html
<script src="https://cdn.jsdelivr.net/gh/gllmAR/docsify-pdf-preview/docsify-pdf-preview.js"></script>
```

---

## Configuration

Add a `pdfPreview` block to your `window.$docsify` config:

```html
<script>
  window.$docsify = {
    pdfPreview: {
      enabled: true,          // Enable/disable the plugin
      mode: 'modal',          // "inline" | "modal" | "both"
      backend: 'native',      // "native" (iframe) | "pdfjs"
      height: '75vh',         // Inline preview height
      modalWidth: '90vw',     // Modal width
      modalHeight: '90vh',    // Modal height
      downloadButton: true,   // Show Download button
      openButton: true,       // Show Open in new tab button
      routeParam: null,       // URL param for modal state, e.g. "pdf"
      match: /\.pdf(\?.*)?$/i // Regex to match PDF links
    }
  };
</script>
```

All settings are optional – the defaults above apply when not specified.

---

## Modes

### `mode: "modal"` (default)

A **Preview PDF** button is appended after each PDF link. Clicking it opens a full-screen modal overlay with the PDF rendered in an iframe. The modal can be closed with:

- The **✕** close button
- Pressing **Escape**
- Clicking the backdrop

### `mode: "inline"`

The PDF link is replaced by an embedded viewer directly in the page.

### `mode: "both"`

The original link is preserved and a preview button is added beside it.

---

## Backends

### `backend: "native"` (default)

Uses a plain `<iframe>` to embed the PDF. A fallback message with Open/Download links is displayed if the browser cannot render it.

### `backend: "pdfjs"`

Loads [PDF.js](https://mozilla.github.io/pdf.js/) lazily (only when a preview is first requested). Provides:

- Page navigation (Prev / Next)
- Zoom controls (+ / −)
- Page number indicator

If PDF.js fails to load, it automatically falls back to the native backend.

---

## URL State

Set `routeParam` to a non-null string to enable URL state tracking:

```js
pdfPreview: {
  routeParam: 'pdf'
}
```

Opening a modal appends `?pdf=<encoded-url>` to the hash. The browser back button closes the modal instead of navigating away.

---

## Accessibility

- Modal uses `role="dialog"` and `aria-modal="true"`
- Focus is trapped inside the modal while open
- Pressing **ESC** closes the modal
- Focus is restored to the triggering button on close
- All buttons have descriptive `aria-label` attributes

---

## Security

- All URLs are validated — `javascript:` and `data:` schemes are rejected
- All injected HTML attributes are sanitized
- No `eval` or dynamic code execution
- Optional: configure your server to add `X-Frame-Options` or CSP headers

---

## Usage Example

In your Markdown file:

```markdown
Check out the [project proposal](assets/proposal.pdf) for details.
```

With `mode: "modal"`, a **📄 Preview PDF** button appears after the link. Clicking it opens the PDF in a modal overlay.

---

## Per-Link Options

Override any global config option on a single link using the `:pdf-preview` token in the Markdown link title — the same position Docsify uses for `':include'`:

```markdown
[Label](file.pdf ':pdf-preview key=value key2=value2')
```

The token is stripped before rendering so it never appears as a browser tooltip.

### Supported keys

| Key | Values | Default |
|-----|--------|---------|
| `mode` | `inline` \| `modal` \| `both` | global config |
| `backend` | `native` \| `pdfjs` | global config |
| `height` | any CSS length | `75vh` |
| `modalWidth` | any CSS length | `90vw` |
| `modalHeight` | any CSS length | `90vh` |

### Examples

```markdown
<!-- Force inline with a specific height -->
[Report](report.pdf ':pdf-preview mode=inline height=60vh')

<!-- Use PDF.js backend with page navigation -->
[Slides](slides.pdf ':pdf-preview mode=inline backend=pdfjs height=80vh')

<!-- Narrow modal -->
[Contract](contract.pdf ':pdf-preview mode=modal modalWidth=70vw modalHeight=85vh')

<!-- Combine: both mode + pdfjs -->
[Manual](manual.pdf ':pdf-preview mode=both backend=pdfjs')

<!-- Quoted values also work -->
[Doc](doc.pdf ':pdf-preview mode="inline" height="50vh"')
```

Unknown keys are silently ignored. If the token is present but empty (`:pdf-preview` with no keys), the global config is used unchanged.

---

## License

MIT