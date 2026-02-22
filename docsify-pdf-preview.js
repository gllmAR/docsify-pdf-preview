/*!
 * docsify-pdf-preview.js
 * Docsify plugin for inline and modal PDF preview.
 * https://github.com/gllmAR/docsify-pdf-preview
 */
(function () {
  'use strict';

  // ─── Default Configuration ──────────────────────────────────────────────────

  var DEFAULT_CONFIG = {
    enabled: true,
    mode: 'inline',          // "inline" | "modal" | "both"
    backend: 'native',       // "native" | "pdfjs"
    height: '75vh',
    modalWidth: '96vw',
    modalHeight: '97vh',
    downloadButton: true,
    openButton: true,
    routeParam: null,        // e.g. "pdf" – enables URL state
    match: /\.pdf(\?.*)?$/i
  };

  // ─── CSS Injection ───────────────────────────────────────────────────────────

  var PLUGIN_CSS = [
    '.pdf-preview-inline{border:1px solid var(--sidebar-border-color);border-radius:var(--border-radius-l,4px);overflow:hidden;margin:1em 0;font-family:inherit}',
    '.pdf-preview-header{display:flex;align-items:center;justify-content:space-between;padding:5px 10px;background:color-mix(in srgb,var(--base-background-color) 85%,var(--base-color) 15%);border-bottom:1px solid var(--sidebar-border-color);gap:6px;flex-shrink:0}',
    '.pdf-preview-filename{font-weight:600;font-size:.88em;flex:1;text-align:center;color:var(--theme-color);text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.pdf-preview-filename:hover,.pdf-preview-filename:focus{text-decoration:underline;outline:none}',
    '.pdf-preview-controls{display:flex;gap:4px;flex-shrink:0}',
    '.pdf-inline-expand-btn{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--sidebar-border-color);border-radius:var(--border-radius-m,2px);background:var(--base-background-color);color:var(--base-color);font-size:.8em;line-height:1;cursor:pointer;font-family:inherit;transition:background .15s,border-color .15s,color .15s;padding:0;flex-shrink:0}',
    '.pdf-inline-expand-btn:hover,.pdf-inline-expand-btn:focus{background:color-mix(in srgb,var(--theme-color) 12%,var(--base-background-color));border-color:var(--theme-color);color:var(--theme-color);outline:none}',
    '.pdf-inline-expand-btn:focus-visible{outline:2px solid var(--theme-color);outline-offset:2px}',
    '.pdf-preview-frame-area{position:relative;width:100%;background:var(--base-background-color)}',
    '.pdf-preview-frame{display:block;width:100%;height:100%;border:none}',
    '.pdf-preview-fallback{display:none;padding:12px;color:var(--base-color);font-size:.9em;background:color-mix(in srgb,var(--theme-color) 8%,var(--base-background-color));border-top:1px solid var(--sidebar-border-color)}',
    '.pdf-preview-frame-area>.pdf-preview-frame:not([src])+.pdf-preview-fallback,',
    '.pdf-preview-frame-area>.pdf-preview-frame[src=""]+.pdf-preview-fallback{display:block}',
    '.pdf-btn{display:inline-flex;align-items:center;padding:3px 8px;border:1px solid var(--sidebar-border-color);border-radius:var(--border-radius-m,2px);background:var(--base-background-color);color:var(--base-color);font-size:.8em;text-decoration:none;cursor:pointer;white-space:nowrap;transition:background .15s,border-color .15s,color .15s;font-family:inherit}',
    '.pdf-btn:hover,.pdf-btn:focus{background:color-mix(in srgb,var(--theme-color) 12%,var(--base-background-color));border-color:var(--theme-color);color:var(--theme-color);outline:none}',
    '.pdf-btn:focus-visible{outline:2px solid var(--theme-color);outline-offset:2px}',
    '.pdf-preview-modal-btn{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;margin:0 4px;border:1px solid var(--sidebar-border-color);border-radius:var(--border-radius-m,2px);background:var(--base-background-color);color:var(--base-color);font-size:.85em;cursor:pointer;font-family:inherit;transition:background .15s,border-color .15s,color .15s}',
    '.pdf-preview-modal-btn:hover,.pdf-preview-modal-btn:focus{background:color-mix(in srgb,var(--theme-color) 12%,var(--base-background-color));border-color:var(--theme-color);color:var(--theme-color);outline:none}',
    '.pdf-preview-modal-btn:focus-visible{outline:2px solid var(--theme-color);outline-offset:2px}',
    '.pdf-preview-modal-overlay{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:0;box-sizing:border-box}',
    '.pdf-preview-modal{display:flex;flex-direction:column;background:var(--base-background-color);border-radius:0;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.5);max-width:100%;max-height:100%;width:96vw;height:97vh;box-sizing:border-box}',
    '.pdf-preview-modal-header{display:flex;align-items:center;justify-content:space-between;padding:5px 10px;background:var(--base-background-color);border-bottom:1px solid var(--sidebar-border-color);gap:6px;flex-shrink:0;opacity:1}',
    '.pdf-preview-modal-filename{font-weight:600;font-size:.88em;flex:1;text-align:center;color:var(--theme-color);text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.pdf-preview-modal-filename:hover,.pdf-preview-modal-filename:focus{text-decoration:underline;outline:none}',
    '.pdf-preview-modal-actions{display:flex;gap:4px;align-items:center;flex-shrink:0}',
    '.pdf-preview-modal-spacer{width:24px;flex-shrink:0}',
    '.pdf-modal-close-btn{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--sidebar-border-color);border-radius:var(--border-radius-m,2px);background:var(--base-background-color);color:var(--base-color);font-size:.8em;line-height:1;cursor:pointer;font-family:inherit;transition:background .15s,border-color .15s,color .15s;padding:0}',
    '.pdf-modal-close-btn:hover,.pdf-modal-close-btn:focus{background:color-mix(in srgb,#d93025 10%,var(--base-background-color));border-color:#d93025;color:#d93025;outline:none}',
    '.pdf-modal-close-btn:focus-visible{outline:2px solid #d93025;outline-offset:2px}',
    '.pdf-preview-modal-body{flex:1;overflow:auto;position:relative;display:flex;flex-direction:column}',
    '.pdf-preview-modal-body .pdf-preview-frame{flex:1;min-height:0}',
    '.pdfjs-viewer{display:flex;flex-direction:column;height:100%;background:#525659}',
    '.pdfjs-controls{display:flex;align-items:center;gap:6px;padding:6px 10px;background:#3c3c3c;flex-shrink:0;flex-wrap:wrap}',
    '.pdfjs-page-info{color:#fff;font-size:.85em;min-width:80px;text-align:center}',
    '.pdfjs-canvas{display:block;margin:0 auto;max-width:100%}',
    '@media(max-width:600px){',
    /* Override JS-set inline width/height on small screens */
    '.pdf-preview-modal{width:100vw !important;height:100vh !important;border-radius:0}',
    '.pdf-preview-modal-overlay{padding:0}',
    '.pdf-preview-header,.pdf-preview-modal-header{flex-wrap:wrap}',
    '}'
  ].join('');

  /**
   * Inject plugin styles into <head> once. Idempotent.
   */
  function injectStyles() {
    if (document.getElementById('docsify-pdf-preview-styles')) return;
    var style = document.createElement('style');
    style.id = 'docsify-pdf-preview-styles';
    style.textContent = PLUGIN_CSS;
    document.head.appendChild(style);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Merge user config with defaults (shallow).
   */
  function mergeConfig(defaults, user) {
    var cfg = {};
    for (var k in defaults) {
      if (Object.prototype.hasOwnProperty.call(defaults, k)) {
        cfg[k] = user && Object.prototype.hasOwnProperty.call(user, k)
          ? user[k]
          : defaults[k];
      }
    }
    return cfg;
  }

  /**
   * Sanitize a string for safe use as an HTML attribute value.
   * Prevents script injection via crafted URLs.
   */
  function sanitizeAttr(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Validate that a URL is a safe http/https/relative URL (SR3).
   * Rejects javascript: and data: schemes.
   */
  function isSafeUrl(url) {
    if (!url || typeof url !== 'string') return false;
    var trimmed = url.trim().toLowerCase();
    if (/^javascript:/i.test(trimmed)) return false;
    if (/^data:/i.test(trimmed)) return false;
    return true;
  }

  /**
   * Parse per-link PDF options from a link title attribute.
   *
   * Recognises the Docsify-style ':pdf-preview ...' token:
   *   [label](file.pdf ':pdf-preview mode=inline height=60vh backend=pdfjs')
   *
   * Supported keys (all optional, override global config):
   *   mode          inline | modal | both
   *   backend       native | pdfjs
   *   height        any CSS length  (inline mode)
   *   modalWidth    any CSS length  (modal mode)
   *   modalHeight   any CSS length  (modal mode)
   *
   * Returns an object with only the keys that were explicitly provided.
   */
  function parsePdfLinkOptions(title) {
    if (!title) return null;
    var marker = title.indexOf(':pdf-preview');
    if (marker === -1) return null;
    var raw = title.slice(marker + ':pdf-preview'.length).trim();
    if (!raw) return {};

    var opts = {};
    var allowed = { mode: true, backend: true, height: true, modalWidth: true, modalHeight: true };
    // match key=value pairs; values may be bare words or quoted strings
    var re = /(\w+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g;
    var m;
    while ((m = re.exec(raw)) !== null) {
      var key = m[1];
      var val = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : m[4]);
      if (allowed[key]) opts[key] = val;
    }
    return opts;
  }

  /**
   * Extract the filename from a URL path.
   */
  function filenameFromUrl(url) {
    try {
      var path = url.split('?')[0].split('#')[0];
      var parts = path.split('/');
      return parts[parts.length - 1] || 'document.pdf';
    } catch (e) {
      return 'document.pdf';
    }
  }

  // ─── 2.2 Path Resolver Module ────────────────────────────────────────────────

  /**
   * Resolve a PDF href against the current Docsify route.
   *
   * Rules:
   *  - absolute URL (http/https) → return as-is
   *  - root-relative (/…)        → prepend basePath
   *  - relative                  → resolve against current route directory
   */
  function resolvePdfUrl(href, basePath, currentRoute) {
    if (/^https?:\/\//i.test(href)) {
      return href;
    }

    basePath = (basePath || '').replace(/\/$/, '');

    if (href.charAt(0) === '/') {
      return basePath + href;
    }

    // Relative: resolve against current route directory
    var routeDir = (currentRoute || '/').replace(/\/[^/]*$/, '') || '/';
    // Combine and normalise
    var combined = routeDir.replace(/\/$/, '') + '/' + href;
    // Collapse any ../ segments
    var parts = combined.split('/');
    var resolved = [];
    for (var i = 0; i < parts.length; i++) {
      if (parts[i] === '..') {
        resolved.pop();
      } else if (parts[i] !== '.') {
        resolved.push(parts[i]);
      }
    }
    return basePath + resolved.join('/');
  }

  // ─── 2.1 Link Scanner Module ─────────────────────────────────────────────────

  /**
   * Encode ':pdf-preview opts' from a markdown link title into the URL as
   * ?__pdfOpts=<encoded> so it survives Docsify's rendering pipeline intact.
   *
   * Called from hook.beforeEach on the raw markdown string.
   * Handles both single- and double-quoted titles.
   */
  function encodePdfOptsInMarkdown(content) {
    // Matches: (url 'any text :pdf-preview opts') or (url "...")
    return content.replace(
      /\(([^\s)]+)\s+(['"])([^'"]*:pdf-preview[^'"]*)\2\)/g,
      function (match, url, _quote, title) {
        var marker = title.indexOf(':pdf-preview');
        var rawOpts = title.slice(marker + ':pdf-preview'.length).trim();
        var cleanTitle = title.slice(0, marker).trim();
        var sep = url.indexOf('?') === -1 ? '?' : '&';
        var newUrl = url + sep + '__pdfOpts=' + encodeURIComponent(rawOpts);
        // Keep any remaining title text so Docsify renders the title attr normally
        return cleanTitle
          ? '(' + newUrl + ' "' + cleanTitle + '")'
          : '(' + newUrl + ')';
      }
    );
  }

  /**
   * Extract per-link options from a __pdfOpts query param in the href,
   * returning { cleanHref, linkOpts } where cleanHref has the param stripped.
   */
  function extractPdfOpts(href) {
    if (href.indexOf('__pdfOpts=') === -1) return { cleanHref: href, linkOpts: null };

    // Preserve hash
    var hashIdx = href.indexOf('#');
    var hash = hashIdx !== -1 ? href.slice(hashIdx) : '';
    var withoutHash = hashIdx !== -1 ? href.slice(0, hashIdx) : href;

    var qIdx = withoutHash.indexOf('?');
    var base = qIdx !== -1 ? withoutHash.slice(0, qIdx) : withoutHash;
    var query = qIdx !== -1 ? withoutHash.slice(qIdx + 1) : '';

    var rawOpts = '';
    var remaining = [];
    query.split('&').forEach(function (p) {
      if (!p) return;
      if (p.indexOf('__pdfOpts=') === 0) {
        rawOpts = decodeURIComponent(p.slice('__pdfOpts='.length));
      } else {
        remaining.push(p);
      }
    });

    var cleanHref = base + (remaining.length ? '?' + remaining.join('&') : '') + hash;
    return {
      cleanHref: cleanHref,
      linkOpts: rawOpts ? parsePdfLinkOptions(':pdf-preview ' + rawOpts) : {}
    };
  }

  /**
   * Find all unprocessed PDF links in the markdown section.
   * Returns array of { element, href, resolvedUrl, filename, linkOpts }.
   *
   * Per-link options are encoded into the href as ?__pdfOpts=... by
   * encodePdfOptsInMarkdown() (called in hook.beforeEach) and decoded here.
   */
  function scanPdfLinks(cfg, basePath, currentRoute) {
    var links = document.querySelectorAll('.markdown-section a[href]');
    var results = [];
    for (var i = 0; i < links.length; i++) {
      var el = links[i];

      if (el.getAttribute('data-pdf-preview-processed')) continue;
      if (el.closest('code, pre')) continue;

      var href = el.getAttribute('href');

      // Extract and strip __pdfOpts before URL safety / match checks
      var extracted = extractPdfOpts(href);
      var cleanHref = extracted.cleanHref;
      var linkOpts  = extracted.linkOpts;

      if (!cfg.match.test(cleanHref)) continue;
      if (!isSafeUrl(cleanHref)) continue;

      var resolvedUrl = resolvePdfUrl(cleanHref, basePath, currentRoute);
      if (!isSafeUrl(resolvedUrl)) continue;

      results.push({
        element: el,
        href: cleanHref,
        resolvedUrl: resolvedUrl,
        filename: filenameFromUrl(cleanHref),
        linkOpts: linkOpts
      });
    }
    return results;
  }

  // ─── 5. UI Builders ──────────────────────────────────────────────────────────

  /**
   * Build the shared inline header bar.
   * Same visual structure as the modal header: spacer | filename link | expand btn.
   */
  function buildInlineHeader(safeUrl, safeName) {
    return '<div class="pdf-preview-header">' +
      '<span class="pdf-preview-modal-spacer"></span>' +
      '<a class="pdf-preview-filename" href="' + safeUrl + '" target="_blank" rel="noopener noreferrer" aria-label="Open ' + safeName + ' in new tab">' + safeName + '</a>' +
      '<span class="pdf-preview-controls">' +
        '<button class="pdf-inline-expand-btn" type="button" aria-label="Expand to full screen" aria-haspopup="dialog">&#x2197;</button>' +
      '</span>' +
    '</div>';
  }

  /**
   * Build an inline preview container (native iframe backend).
   */
  function buildInlineContainer(info, cfg) {
    var safeUrl = sanitizeAttr(info.resolvedUrl);
    var safeName = sanitizeAttr(info.filename);

    var wrapper = document.createElement('div');
    wrapper.className = 'pdf-preview-inline';
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', 'PDF Preview: ' + info.filename);

    wrapper.innerHTML =
      buildInlineHeader(safeUrl, safeName) +
      '<div class="pdf-preview-frame-area" style="height:' + sanitizeAttr(cfg.height) + '">' +
        '<iframe class="pdf-preview-frame"' +
          ' src="' + safeUrl + '"' +
          ' title="PDF preview: ' + safeName + '"' +
          ' aria-label="PDF preview: ' + safeName + '">' +
        '</iframe>' +
        '<div class="pdf-preview-fallback" aria-live="polite">' +
          'Your browser cannot display this PDF. ' +
          '<a href="' + safeUrl + '" target="_blank" rel="noopener noreferrer">Open</a> or ' +
          '<a href="' + safeUrl + '" download="' + safeName + '">Download</a> it.' +
        '</div>' +
      '</div>';

    return wrapper;
  }

  /**
   * Build a modal trigger button.
   */
  function buildModalTrigger(info, cfg) {
    var safeUrl = sanitizeAttr(info.resolvedUrl);
    var safeName = sanitizeAttr(info.filename);

    var btn = document.createElement('button');
    btn.className = 'pdf-preview-modal-btn';
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-label', 'Preview PDF: ' + info.filename);
    btn.setAttribute('data-pdf-url', safeUrl);
    btn.setAttribute('data-pdf-name', safeName);
    btn.textContent = '📄 Preview PDF';
    return btn;
  }

  // ─── Modal DOM ────────────────────────────────────────────────────────────────

  var _modal = null;
  var _modalFocusTrigger = null;

  function getOrCreateModal() {
    if (_modal) return _modal;

    var overlay = document.createElement('div');
    overlay.id = 'pdf-preview-modal-overlay';
    overlay.className = 'pdf-preview-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'PDF Viewer');
    overlay.style.display = 'none';

    overlay.innerHTML =
      '<div class="pdf-preview-modal" role="document">' +
        '<div class="pdf-preview-modal-header">' +
          '<span class="pdf-preview-modal-spacer"></span>' +
          '<a class="pdf-preview-modal-filename" id="pdf-preview-modal-title" href="#" target="_blank" rel="noopener noreferrer"></a>' +
          '<span class="pdf-preview-modal-actions">' +
            '<button class="pdf-modal-close-btn" id="pdf-modal-close-btn" type="button" aria-label="Close PDF viewer">&#x2715;</button>' +
          '</span>' +
        '</div>' +
        '<div class="pdf-preview-modal-body">' +
          '<iframe class="pdf-preview-frame" id="pdf-preview-modal-frame" title="PDF preview" aria-label="PDF preview"></iframe>' +
          '<div class="pdf-preview-fallback" aria-live="polite" id="pdf-preview-modal-fallback">' +
            'Your browser cannot display this PDF. ' +
            '<a id="pdf-modal-fallback-open" href="#" target="_blank" rel="noopener noreferrer">Open</a> or ' +
            '<a id="pdf-modal-fallback-dl" href="#">Download</a> it.' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    overlay.querySelector('#pdf-modal-close-btn').addEventListener('click', closeModal);

    // Close on backdrop click
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    // ESC key (AR2)
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && overlay.style.display !== 'none') {
        closeModal();
      }
    });

    // Focus trap (AR4 / FR-M4)
    overlay.addEventListener('keydown', trapFocus);

    _modal = overlay;
    return overlay;
  }

  /**
   * Trap Tab/Shift+Tab focus within the modal.
   */
  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    var modal = document.querySelector('.pdf-preview-modal');
    if (!modal) return;
    var focusable = modal.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function openModal(info, cfg) {
    var overlay = getOrCreateModal();
    var safeUrl = sanitizeAttr(info.resolvedUrl);
    var safeName = sanitizeAttr(info.filename);

    overlay.setAttribute('aria-label', 'PDF Viewer: ' + info.filename);
    overlay.querySelector('.pdf-preview-modal').style.width = cfg.modalWidth;
    overlay.querySelector('.pdf-preview-modal').style.height = cfg.modalHeight;

    var titleLink = overlay.querySelector('#pdf-preview-modal-title');
    titleLink.textContent = info.filename;
    titleLink.href = info.resolvedUrl;
    titleLink.setAttribute('aria-label', 'Open ' + info.filename + ' in new tab');

    var frame = overlay.querySelector('#pdf-preview-modal-frame');
    var fbOpen = overlay.querySelector('#pdf-modal-fallback-open');
    var fbDl = overlay.querySelector('#pdf-modal-fallback-dl');

    frame.src = info.resolvedUrl;
    fbOpen.href = info.resolvedUrl;
    fbDl.href = info.resolvedUrl;
    fbDl.setAttribute('download', info.filename);

    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Update URL state if configured (4.2)
    if (cfg.routeParam) {
      try {
        var hash = window.location.hash;
        var paramStr = cfg.routeParam + '=' + encodeURIComponent(info.resolvedUrl);
        if (hash.indexOf('?') === -1) {
          window.history.pushState(null, '', hash + '?' + paramStr);
        } else {
          window.history.pushState(null, '', hash + '&' + paramStr);
        }
      } catch (e) { /* non-critical */ }
    }

    // Focus the close button (AR4)
    setTimeout(function () {
      overlay.querySelector('#pdf-modal-close-btn').focus();
    }, 50);
  }

  function closeModal() {
    if (!_modal) return;
    _modal.style.display = 'none';
    document.body.style.overflow = '';

    // Clear iframe src to stop loading
    var frame = _modal.querySelector('#pdf-preview-modal-frame');
    if (frame) frame.src = '';

    // Restore focus to trigger element (AR4 / FR-M5)
    if (_modalFocusTrigger && _modalFocusTrigger.focus) {
      _modalFocusTrigger.focus();
    }
    _modalFocusTrigger = null;

    // Remove URL state param if configured
    try {
      var hash = window.location.hash;
      if (hash.indexOf('?') !== -1) {
        window.history.pushState(null, '', hash.split('?')[0]);
      }
    } catch (e) { /* non-critical */ }
  }

  // ─── 3.2 PDF.js Backend (lazy) ───────────────────────────────────────────────

  var _pdfjsLoaded = false;
  var _pdfjsLoading = false;
  var _pdfjsQueue = [];

  function loadPdfjsViewer(callback) {
    if (_pdfjsLoaded) {
      callback(null);
      return;
    }
    _pdfjsQueue.push(callback);
    if (_pdfjsLoading) return;
    _pdfjsLoading = true;

    var cdnBase = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174';

    var script = document.createElement('script');
    script.src = cdnBase + '/pdf.min.js';
    script.onload = function () {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = cdnBase + '/pdf.worker.min.js';
        _pdfjsLoaded = true;
        _pdfjsQueue.forEach(function (cb) { cb(null); });
        _pdfjsQueue = [];
      } else {
        var err = new Error('PDF.js failed to initialise');
        _pdfjsQueue.forEach(function (cb) { cb(err); });
        _pdfjsQueue = [];
      }
    };
    script.onerror = function () {
      var err = new Error('PDF.js script failed to load');
      _pdfjsQueue.forEach(function (cb) { cb(err); });
      _pdfjsQueue = [];
      _pdfjsLoading = false;
    };
    document.head.appendChild(script);
  }

  /**
   * Render a PDF inside a canvas-based viewer using PDF.js.
   * Fallback to native backend on any error (FR-E3).
   */
  function renderPdfJs(container, url, cfg) {
    loadPdfjsViewer(function (err) {
      if (err || !window.pdfjsLib) {
        // FR-E3: fallback to native
        renderNativeInContainer(container, url, cfg);
        return;
      }

      var pdfjs = window.pdfjsLib;
      var state = { doc: null, page: 1, totalPages: 0, scale: 1.0 };

      var viewer = document.createElement('div');
      viewer.className = 'pdfjs-viewer';

      var controls = document.createElement('div');
      controls.className = 'pdfjs-controls';
      controls.setAttribute('role', 'toolbar');
      controls.setAttribute('aria-label', 'PDF navigation controls');

      var prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'pdf-btn';
      prevBtn.textContent = '◀ Prev';
      prevBtn.setAttribute('aria-label', 'Previous page');

      var nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'pdf-btn';
      nextBtn.textContent = 'Next ▶';
      nextBtn.setAttribute('aria-label', 'Next page');

      var pageInfo = document.createElement('span');
      pageInfo.className = 'pdfjs-page-info';
      pageInfo.setAttribute('aria-live', 'polite');
      pageInfo.textContent = 'Page 1';

      var zoomIn = document.createElement('button');
      zoomIn.type = 'button';
      zoomIn.className = 'pdf-btn';
      zoomIn.textContent = '+ Zoom In';
      zoomIn.setAttribute('aria-label', 'Zoom in');

      var zoomOut = document.createElement('button');
      zoomOut.type = 'button';
      zoomOut.className = 'pdf-btn';
      zoomOut.textContent = '- Zoom Out';
      zoomOut.setAttribute('aria-label', 'Zoom out');

      controls.appendChild(prevBtn);
      controls.appendChild(pageInfo);
      controls.appendChild(nextBtn);
      controls.appendChild(zoomIn);
      controls.appendChild(zoomOut);

      var canvas = document.createElement('canvas');
      canvas.className = 'pdfjs-canvas';
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', 'PDF page');

      viewer.appendChild(controls);
      viewer.appendChild(canvas);

      // Clear container and insert viewer
      container.innerHTML = '';
      container.appendChild(viewer);

      function renderPage(num) {
        state.doc.getPage(num).then(function (page) {
          var viewport = page.getViewport({ scale: state.scale });
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvas.setAttribute('aria-label', 'PDF page ' + num + ' of ' + state.totalPages);
          var ctx = canvas.getContext('2d');
          page.render({ canvasContext: ctx, viewport: viewport });
          pageInfo.textContent = 'Page ' + num + ' / ' + state.totalPages;
          prevBtn.disabled = num <= 1;
          nextBtn.disabled = num >= state.totalPages;
        });
      }

      prevBtn.addEventListener('click', function () {
        if (state.page > 1) { state.page--; renderPage(state.page); }
      });
      nextBtn.addEventListener('click', function () {
        if (state.page < state.totalPages) { state.page++; renderPage(state.page); }
      });
      zoomIn.addEventListener('click', function () {
        state.scale = Math.min(state.scale + 0.25, 4.0);
        renderPage(state.page);
      });
      zoomOut.addEventListener('click', function () {
        state.scale = Math.max(state.scale - 0.25, 0.25);
        renderPage(state.page);
      });

      pdfjs.getDocument(url).promise.then(function (doc) {
        state.doc = doc;
        state.totalPages = doc.numPages;
        renderPage(1);
      }).catch(function () {
        // FR-E3: fallback to native
        renderNativeInContainer(container, url, cfg);
      });
    });
  }

  function renderNativeInContainer(container, url, cfg) {
    var safeUrl = sanitizeAttr(url);
    var safeName = sanitizeAttr(filenameFromUrl(url));
    container.innerHTML =
      '<iframe class="pdf-preview-frame"' +
        ' src="' + safeUrl + '"' +
        ' title="PDF preview: ' + safeName + '"' +
        ' aria-label="PDF preview: ' + safeName + '">' +
      '</iframe>' +
      '<div class="pdf-preview-fallback" aria-live="polite">' +
        'Your browser cannot display this PDF. ' +
        '<a href="' + safeUrl + '" target="_blank" rel="noopener noreferrer">Open</a> or ' +
        '<a href="' + safeUrl + '" download="' + safeName + '">Download</a> it.' +
      '</div>';
  }

  // ─── 2.3 Rendering Controller ────────────────────────────────────────────────

  function processLink(info, cfg) {
    var el = info.element;
    el.setAttribute('data-pdf-preview-processed', '1');

    // Merge per-link options (from ':pdf-preview ...' syntax) over global config
    if (info.linkOpts && Object.keys(info.linkOpts).length > 0) {
      cfg = mergeConfig(cfg, info.linkOpts);
    }

    switch (cfg.mode) {
      case 'inline':
        renderInline(info, cfg);
        break;
      case 'modal':
        renderModal(info, cfg);
        break;
      case 'both':
        renderBoth(info, cfg);
        break;
      default:
        renderModal(info, cfg);
    }
  }

  function renderInline(info, cfg) {
    var el = info.element;
    var safeUrl = sanitizeAttr(info.resolvedUrl);
    var safeName = sanitizeAttr(info.filename);

    var container = document.createElement('div');
    container.className = 'pdf-preview-inline';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'PDF Preview: ' + info.filename);
    container.innerHTML = buildInlineHeader(safeUrl, safeName);

    var frameArea = document.createElement('div');
    frameArea.className = 'pdf-preview-frame-area';
    frameArea.style.height = cfg.height;
    container.appendChild(frameArea);

    el.parentNode.replaceChild(container, el);

    if (cfg.backend === 'pdfjs') {
      renderPdfJs(frameArea, info.resolvedUrl, cfg);
    } else {
      renderNativeInContainer(frameArea, info.resolvedUrl, cfg);
    }

    // Wire expand button → open same PDF in modal
    var expandBtn = container.querySelector('.pdf-inline-expand-btn');
    if (expandBtn) {
      expandBtn.addEventListener('click', function () {
        _modalFocusTrigger = expandBtn;
        openModal(info, cfg);
      });
    }
  }

  function renderModal(info, cfg) {
    var el = info.element;
    var btn = buildModalTrigger(info, cfg);

    btn.addEventListener('click', function () {
      _modalFocusTrigger = btn;
      openModal(info, cfg);
    });

    // Insert button after the original link
    if (el.parentNode) {
      el.parentNode.insertBefore(btn, el.nextSibling);
    }
  }

  function renderBoth(info, cfg) {
    var el = info.element;
    var btn = buildModalTrigger(info, cfg);
    btn.addEventListener('click', function () {
      _modalFocusTrigger = btn;
      openModal(info, cfg);
    });
    if (el.parentNode) {
      el.parentNode.insertBefore(btn, el.nextSibling);
    }
  }

  // ─── Route change / cleanup ──────────────────────────────────────────────────

  function onRouteChange() {
    closeModal();
  }

  // ─── Plugin Entry Point ──────────────────────────────────────────────────────

  function install(hook, vm) {
    var cfg = mergeConfig(DEFAULT_CONFIG, (window.$docsify || {}).pdfPreview);

    if (!cfg.enabled) return;

    injectStyles();

    function processPdfLinks() {
      var basePath = (window.$docsify || {}).basePath || '';
      var currentRoute = (vm.route && vm.route.path) || '/';
      var links = scanPdfLinks(cfg, basePath, currentRoute);
      links.forEach(function (info) {
        processLink(info, cfg);
      });
    }

    hook.doneEach(processPdfLinks);
    hook.mounted(processPdfLinks);

    // Handle URL state back-button (4.2)
    if (cfg.routeParam) {
      window.addEventListener('popstate', function () {
        var hash = window.location.hash;
        if (hash.indexOf(cfg.routeParam + '=') === -1) {
          closeModal();
        }
      });
    }

    // Close modal on route change + encode per-link :pdf-preview opts into URLs
    hook.beforeEach(function (content, next) {
      onRouteChange();
      next(encodePdfOptsInMarkdown(content));
    });
  }

  // Register plugin with Docsify
  if (window.$docsify) {
    window.$docsify.plugins = (window.$docsify.plugins || []).concat(install);
  } else {
    window.$docsify = { plugins: [install] };
  }
})();
