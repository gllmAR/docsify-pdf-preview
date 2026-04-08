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
    height: 'auto',          // 'auto' = fit one full page; or any CSS length
    modalWidth: '96vw',
    modalHeight: '97vh',
    pdfjsCrossOrigin: false, // false = use card/ios fallback for cross-origin PDFs
    routeParam: null,        // e.g. "pdf" – enables URL state
    match: /\.pdf(\?.*)?$/i
  };

  var _routeParam = null;

  // ─── CSS ─────────────────────────────────────────────────────────────────────

  var PLUGIN_CSS = [
    /* ── Inline container ── */
    '.pdf-preview-inline{border:1px solid var(--sidebar-border-color,#e2e2e3);border-radius:var(--border-radius-l,4px);overflow:hidden;margin:1em 0;font-family:inherit;display:flex;flex-direction:column}',
    '.pdf-preview-header{display:flex;align-items:center;justify-content:space-between;padding:5px 10px;background:color-mix(in srgb,var(--base-background-color,#fff) 85%,var(--base-color,#000) 15%);border-bottom:1px solid var(--sidebar-border-color,#e2e2e3);gap:6px;flex-shrink:0}',
    '.pdf-preview-filename{font-weight:600;font-size:.88em;color:var(--theme-color,#42b983);text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}',
    '.pdf-preview-filename:hover,.pdf-preview-filename:focus{text-decoration:underline;outline:none}',
    '.pdf-header-center{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;min-width:0}',
    '.pdf-preview-controls{display:flex;gap:4px;flex-shrink:0}',
    '.pdf-inline-expand-btn{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--sidebar-border-color,#e2e2e3);border-radius:var(--border-radius-m,2px);background:var(--base-background-color,#fff);color:var(--base-color,#000);font-size:.8em;line-height:1;cursor:pointer;font-family:inherit;transition:background .15s,border-color .15s,color .15s;padding:0;flex-shrink:0}',
    '.pdf-inline-expand-btn:hover,.pdf-inline-expand-btn:focus{background:color-mix(in srgb,var(--theme-color,#42b983) 12%,var(--base-background-color,#fff));border-color:var(--theme-color,#42b983);color:var(--theme-color,#42b983);outline:none}',
    '.pdf-inline-expand-btn:focus-visible{outline:2px solid var(--theme-color,#42b983);outline-offset:2px}',

    /* ── Frame / canvas area ── */
    '.pdf-preview-frame-area{position:relative;width:100%;background:var(--base-background-color,#fff);overflow:hidden;box-sizing:border-box}',

    /* ── Buttons ── */
    '.pdf-btn{display:inline-flex;align-items:center;padding:3px 8px;border:1px solid var(--sidebar-border-color,#e2e2e3);border-radius:var(--border-radius-m,2px);background:var(--base-background-color,#fff);color:var(--base-color,#000);font-size:.8em;text-decoration:none;cursor:pointer;white-space:nowrap;transition:background .15s,border-color .15s,color .15s;font-family:inherit}',
    '.pdf-btn:hover,.pdf-btn:focus{background:color-mix(in srgb,var(--theme-color,#42b983) 12%,var(--base-background-color,#fff));border-color:var(--theme-color,#42b983);color:var(--theme-color,#42b983);outline:none}',
    '.pdf-btn:focus-visible{outline:2px solid var(--theme-color,#42b983);outline-offset:2px}',
    '.pdf-preview-modal-btn{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;margin:0 4px;border:1px solid var(--sidebar-border-color,#e2e2e3);border-radius:var(--border-radius-m,2px);background:var(--base-background-color,#fff);color:var(--base-color,#000);font-size:.85em;cursor:pointer;font-family:inherit;transition:background .15s,border-color .15s,color .15s}',
    '.pdf-preview-modal-btn:hover,.pdf-preview-modal-btn:focus{background:color-mix(in srgb,var(--theme-color,#42b983) 12%,var(--base-background-color,#fff));border-color:var(--theme-color,#42b983);color:var(--theme-color,#42b983);outline:none}',
    '.pdf-preview-modal-btn:focus-visible{outline:2px solid var(--theme-color,#42b983);outline-offset:2px}',

    /* ── Fallback ── */
    '.pdf-preview-fallback{padding:16px;color:var(--base-color,#000);font-size:.9em;text-align:center;background:color-mix(in srgb,var(--theme-color,#42b983) 8%,var(--base-background-color,#fff));border-top:1px solid var(--sidebar-border-color,#e2e2e3)}',

    /* ── Mobile tap card (iOS / touch fallback) ── */
    '.pdf-mobile-card{display:flex;flex-direction:column;align-items:center;text-decoration:none;color:var(--base-color,#000);padding:24px 16px;background:color-mix(in srgb,var(--theme-color,#42b983) 6%,var(--base-background-color,#fff));border-radius:var(--border-radius-m,4px);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:background .15s}',
    '.pdf-mobile-card:active{background:color-mix(in srgb,var(--theme-color,#42b983) 16%,var(--base-background-color,#fff))}',
    '.pdf-mobile-card-icon{font-size:2.5em;margin-bottom:8px;line-height:1}',
    '.pdf-mobile-card-name{font-weight:600;font-size:.95em;margin-bottom:4px;word-break:break-word;color:var(--theme-color,#42b983)}',
    '.pdf-mobile-card-hint{font-size:.78em;opacity:.55;margin-top:2px}',
    '.pdf-mobile-card-thumb{max-width:100%;border:1px solid var(--sidebar-border-color,#e2e2e3);border-radius:var(--border-radius-m,2px);margin-bottom:10px}',
    '@media(pointer:coarse){.pdf-mobile-card{padding:20px 12px;min-height:80px}}',
    '@media(max-width:600px){.pdf-mobile-card{padding:16px 10px}}',
    '.pdf-mobile-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;justify-content:center}',
    '.pdf-mobile-actions .pdf-btn{min-height:40px;min-width:60px;padding:6px 14px;font-size:.88em}',

    /* ── Modal ── */
    '.pdf-preview-modal-overlay{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:0;box-sizing:border-box}',
    '.pdf-preview-modal{display:flex;flex-direction:column;background:var(--base-background-color,#fff);border-radius:0;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.5);max-width:100%;max-height:100%;box-sizing:border-box}',
    '.pdf-preview-modal-header{display:flex;align-items:center;justify-content:space-between;padding:5px 10px;background:var(--base-background-color,#fff);border-bottom:1px solid var(--sidebar-border-color,#e2e2e3);gap:6px;flex-shrink:0}',
    '.pdf-preview-modal-filename{font-weight:600;font-size:.88em;color:var(--theme-color,#42b983);text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}',
    '.pdf-preview-modal-filename:hover,.pdf-preview-modal-filename:focus{text-decoration:underline;outline:none}',
    '.pdf-preview-modal-actions{display:flex;gap:4px;align-items:center;flex-shrink:0}',
    '.pdf-preview-modal-spacer{width:24px;flex-shrink:0}',
    '.pdf-modal-close-btn{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--sidebar-border-color,#e2e2e3);border-radius:var(--border-radius-m,2px);background:var(--base-background-color,#fff);color:var(--base-color,#000);font-size:.8em;line-height:1;cursor:pointer;font-family:inherit;transition:background .15s,border-color .15s,color .15s;padding:0}',
    '.pdf-modal-close-btn:hover,.pdf-modal-close-btn:focus{background:color-mix(in srgb,#d93025 10%,var(--base-background-color,#fff));border-color:#d93025;color:#d93025;outline:none}',
    '.pdf-modal-close-btn:focus-visible{outline:2px solid #d93025;outline-offset:2px}',
    '.pdf-preview-modal-body{flex:1;overflow:auto;position:relative;display:flex;flex-direction:column}',

    /* ── PDF.js viewer ── */
    '.pdfjs-viewer{display:flex;flex-direction:column;background:color-mix(in srgb,var(--base-background-color,#fff) 90%,var(--base-color,#000) 10%)}',
    '.pdfjs-controls{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:6px;padding:6px 10px;background:color-mix(in srgb,var(--theme-color,#42b983) 15%,var(--base-background-color,#fff) 85%);border-bottom:1px solid var(--sidebar-border-color,#e2e2e3);flex-shrink:0;flex-wrap:wrap}',
    '.pdfjs-page-info{color:var(--base-color,#000);font-size:.85em;min-width:80px;text-align:center}',
    '.pdfjs-canvas-wrap{position:relative;display:flex;justify-content:center;background:color-mix(in srgb,var(--base-background-color,#fff) 90%,var(--base-color,#000) 10%)}',
    '.pdfjs-canvas{display:block;margin:0 auto;max-width:100%}',
    '.pdfjs-text-layer{position:absolute;left:0;top:0;overflow:hidden;line-height:1;z-index:2;pointer-events:auto}',
    '.pdfjs-text-layer span{color:transparent;position:absolute;white-space:pre;transform-origin:0% 0%;pointer-events:all}',
    '.pdfjs-text-layer ::selection{background:rgba(0,100,200,0.3)}',
    '.pdfjs-text-layer ::-moz-selection{background:rgba(0,100,200,0.3)}',
    '.pdfjs-tap-prev,.pdfjs-tap-next{position:absolute;top:0;bottom:0;width:22%;min-width:44px;background:transparent !important;border:none !important;border-radius:0 !important;cursor:pointer;z-index:3;-webkit-tap-highlight-color:transparent;touch-action:manipulation;padding:0 !important;margin:0 !important;box-shadow:none !important;outline:none !important;opacity:0;appearance:none;-webkit-appearance:none}',
    '.pdfjs-tap-prev{left:0}.pdfjs-tap-next{right:0}',
    '.pdfjs-swipe-hint{color:color-mix(in srgb,var(--base-color,#000) 50%,transparent);font-size:.75em;text-align:center;padding:4px 0 6px;letter-spacing:.02em;user-select:none;flex-shrink:0}',

    /* ── Loading indicator ── */
    '.pdf-loading{display:flex;align-items:center;justify-content:center;padding:40px 20px;color:var(--base-color,#666);font-size:.9em;gap:8px}',
    '.pdf-loading-spinner{width:18px;height:18px;border:2px solid var(--sidebar-border-color,#e2e2e3);border-top-color:var(--theme-color,#42b983);border-radius:50%;animation:pdfspin .8s linear infinite}',
    '@keyframes pdfspin{to{transform:rotate(360deg)}}',

    /* ── Mobile / touch ── */
    '@media(pointer:coarse){.pdf-btn{min-height:40px;min-width:40px;padding:6px 12px;font-size:.9em}}',
    '@media(max-width:600px){',
    '.pdf-preview-modal{width:100vw !important;height:100vh !important;border-radius:0}',
    '.pdf-preview-modal-overlay{padding:0}',
    '.pdf-preview-header,.pdf-preview-modal-header{flex-wrap:wrap}',
    '.pdf-preview-inline{margin:0.5em 0}',
    '.pdfjs-controls{gap:3px;padding:4px 6px}',
    '.pdfjs-controls .pdf-btn{padding:6px 10px;font-size:.85em}',
    '}'
  ].join('');

  function injectStyles() {
    if (document.getElementById('docsify-pdf-preview-styles')) return;
    var style = document.createElement('style');
    style.id = 'docsify-pdf-preview-styles';
    style.textContent = PLUGIN_CSS;
    document.head.appendChild(style);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

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

  function sanitizeAttr(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function isSafeUrl(url) {
    if (!url || typeof url !== 'string') return false;
    var trimmed = url.trim().toLowerCase();
    if (/^javascript:/i.test(trimmed)) return false;
    if (/^data:/i.test(trimmed)) return false;
    return true;
  }

  function filenameFromUrl(url) {
    try {
      var path = url.split('?')[0].split('#')[0];
      var parts = path.split('/');
      return parts[parts.length - 1] || 'document.pdf';
    } catch (e) {
      return 'document.pdf';
    }
  }

  /**
   * Detect iOS / iPadOS — these platforms cannot render PDFs inside iframes.
   */
  function isIOS() {
    if (typeof navigator === 'undefined') return false;
    var ua = navigator.userAgent || '';
    // iPhone / iPad / iPod in classic UA strings
    if (/iPhone|iPad|iPod/i.test(ua)) return true;
    // iPadOS 13+ reports as Macintosh; detect via touch support
    if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return true;
    return false;
  }

  function isCrossOriginUrl(url) {
    try {
      return new URL(url, window.location.href).origin !== window.location.origin;
    } catch (e) {
      return false;
    }
  }

  function shouldUsePdfjs(url, cfg) {
    if (!isCrossOriginUrl(url)) return true;
    return !!(cfg && cfg.pdfjsCrossOrigin);
  }

  function shouldUseIframeFallback(url) {
    return !isCrossOriginUrl(url);
  }

  function parsePdfLinkOptions(title) {
    if (!title) return null;
    var marker = title.indexOf(':pdf-preview');
    if (marker === -1) return null;
    var raw = title.slice(marker + ':pdf-preview'.length).trim();
    if (!raw) return {};
    var opts = {};
    var allowed = { mode: true, height: true, modalWidth: true, modalHeight: true, pdfjsCrossOrigin: true };
    var re = /(\w+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g;
    var m;
    while ((m = re.exec(raw)) !== null) {
      var key = m[1];
      var val = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : m[4]);
      if (allowed[key]) opts[key] = val;
    }
    return opts;
  }

  // ─── Path Resolver ───────────────────────────────────────────────────────────

  function resolvePdfUrl(href, basePath, currentRoute) {
    if (/^https?:\/\//i.test(href)) return href;
    basePath = (basePath || '').replace(/\/$/, '');
    if (href.charAt(0) === '/') return basePath + href;

    var routeDir = (currentRoute || '/').replace(/\/[^/]*$/, '') || '/';
    var combined = routeDir.replace(/\/$/, '') + '/' + href;
    var parts = combined.split('/');
    var resolved = [];
    for (var i = 0; i < parts.length; i++) {
      if (parts[i] === '..') resolved.pop();
      else if (parts[i] !== '.') resolved.push(parts[i]);
    }
    return basePath + resolved.join('/');
  }

  // ─── Link Scanner ───────────────────────────────────────────────────────────

  function encodePdfOptsInMarkdown(content) {
    return content.replace(
      /\(([^\s)]+)\s+(['"])([^'"]*:pdf-preview[^'"]*)\2\)/g,
      function (match, url, _quote, title) {
        var marker = title.indexOf(':pdf-preview');
        var rawOpts = title.slice(marker + ':pdf-preview'.length).trim();
        var cleanTitle = title.slice(0, marker).trim();
        var sep = url.indexOf('?') === -1 ? '?' : '&';
        var newUrl = url + sep + '__pdfOpts=' + encodeURIComponent(rawOpts);
        return cleanTitle
          ? '(' + newUrl + ' "' + cleanTitle + '")'
          : '(' + newUrl + ')';
      }
    );
  }

  function extractPdfOpts(href) {
    if (href.indexOf('__pdfOpts=') === -1) return { cleanHref: href, linkOpts: null };
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

  function scanPdfLinks(cfg, basePath, currentRoute) {
    var links = document.querySelectorAll('.markdown-section a[href]');
    var results = [];
    for (var i = 0; i < links.length; i++) {
      var el = links[i];
      if (el.getAttribute('data-pdf-preview-processed')) continue;
      if (el.closest('code, pre')) continue;
      var href = el.getAttribute('href');
      var extracted = extractPdfOpts(href);
      var cleanHref = extracted.cleanHref;
      var linkOpts = extracted.linkOpts;
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

  // ─── PDF.js Loader (lazy, singleton) ─────────────────────────────────────────

  var _pdfjsLoaded = false;
  var _pdfjsLoading = false;
  var _pdfjsQueue = [];

  function loadPdfjs(callback) {
    if (_pdfjsLoaded) { callback(null); return; }
    _pdfjsQueue.push(callback);
    if (_pdfjsLoading) return;
    _pdfjsLoading = true;

    // Use jsdelivr with @latest so it always resolves to the newest release.
    // Fallback to cdnjs and unpkg if jsdelivr is blocked or slow.
    var CDN_SOURCES = [
      { script: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/build/pdf.min.mjs',
        worker: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/build/pdf.worker.min.mjs' },
      { script: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.min.mjs',
        worker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs' },
      { script: 'https://unpkg.com/pdfjs-dist@latest/build/pdf.min.mjs',
        worker: 'https://unpkg.com/pdfjs-dist@latest/build/pdf.worker.min.mjs' }
    ];

    function tryLoad(idx) {
      if (idx >= CDN_SOURCES.length) {
        var err = new Error('pdfjs load failed: all CDN sources exhausted');
        _pdfjsQueue.forEach(function (cb) { cb(err); });
        _pdfjsQueue = [];
        _pdfjsLoading = false;
        return;
      }

      var src = CDN_SOURCES[idx];
      // Use a unique event name per CDN attempt to avoid stale listeners
      var eventName = '__pdfjs_ready_' + idx + '_' + Date.now();
      var loader = document.createElement('script');
      loader.type = 'module';
      loader.textContent =
        'import * as pdfjsLib from "' + src.script + '";\n' +
        'pdfjsLib.GlobalWorkerOptions.workerSrc = "' + src.worker + '";\n' +
        'window.pdfjsLib = pdfjsLib;\n' +
        'window.dispatchEvent(new Event("' + eventName + '"));';

      var settled = false;

      function onReady() {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        window.removeEventListener(eventName, onReady);
        if (window.pdfjsLib) {
          _pdfjsLoaded = true;
          _pdfjsQueue.forEach(function (cb) { cb(null); });
          _pdfjsQueue = [];
        } else {
          console.warn('[pdf-preview] CDN ' + idx + ' loaded but pdfjsLib missing, trying next…');
          tryLoad(idx + 1);
        }
      }

      function onFail() {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        window.removeEventListener(eventName, onReady);
        console.warn('[pdf-preview] CDN ' + idx + ' failed (' + src.script + '), trying next…');
        tryLoad(idx + 1);
      }

      // Timeout: if the module doesn't fire the ready event within 10s, try next
      var timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        window.removeEventListener(eventName, onReady);
        if (!_pdfjsLoaded) {
          console.warn('[pdf-preview] CDN ' + idx + ' timed out, trying next…');
          tryLoad(idx + 1);
        }
      }, 10000);

      window.addEventListener(eventName, onReady);
      loader.onerror = onFail;

      document.head.appendChild(loader);
    }

    tryLoad(0);
  }

  // ─── PDF Fetcher (with CORS proxy fallback chain) ────────────────────────────

  var CORS_PROXIES = [
    function (u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); },
    function (u) { return 'https://cors-anywhere.herokuapp.com/' + u; },
    function (u) { return 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u); }
  ];

  /**
   * Validate that an ArrayBuffer starts with the PDF signature (%PDF).
   */
  function isPdfBuffer(buf) {
    if (!buf || buf.byteLength < 5) return false;
    var h = new Uint8Array(buf, 0, 5);
    return h[0] === 0x25 && h[1] === 0x50 && h[2] === 0x44 && h[3] === 0x46; // %PDF
  }

  /**
   * Try fetching from a list of CORS proxies, starting at index `idx`.
   * Rejects when all proxies are exhausted.
   */
  function tryProxies(url, idx) {
    if (idx >= CORS_PROXIES.length) {
      return Promise.reject(new Error('All CORS proxies failed'));
    }
    var proxyUrl = CORS_PROXIES[idx](url);
    return fetch(proxyUrl).then(function (res) {
      if (!res.ok) throw new Error('Proxy ' + idx + ' HTTP ' + res.status);
      return res.arrayBuffer();
    }).then(function (buf) {
      if (!isPdfBuffer(buf)) throw new Error('Proxy ' + idx + ' returned non-PDF content');
      return buf;
    }).catch(function (err) {
      if (idx < CORS_PROXIES.length - 1) {
        console.debug('[pdf-preview] Proxy ' + idx + ' failed for', url, '–', err.message);
      } else {
        console.warn('[pdf-preview] All CORS proxies failed for', url);
      }
      return tryProxies(url, idx + 1);
    });
  }

  /**
   * Fetch a PDF as an ArrayBuffer.
   *
   * Strategy:
   *  1. Try direct fetch (works for same-origin and CORS-enabled servers)
   *  2. On CORS failure for cross-origin URLs, try a chain of public
   *     CORS proxies that return raw bytes
   *
   * Requests are serialized (max 2 concurrent) to avoid rate-limiting on
   * free CORS proxies.
   *
   * Returns a Promise that resolves to an ArrayBuffer.
   */
  var _fetchQueue = [];
  var _fetchActive = 0;
  var MAX_CONCURRENT_FETCHES = 2;

  function _drainQueue() {
    while (_fetchActive < MAX_CONCURRENT_FETCHES && _fetchQueue.length > 0) {
      var next = _fetchQueue.shift();
      _fetchActive++;
      next();
    }
  }

  function fetchPdfBytes(url) {
    return new Promise(function (resolve, reject) {
      _fetchQueue.push(function () {
        _doFetch(url).then(resolve, reject).finally(function () {
          _fetchActive--;
          _drainQueue();
        });
      });
      _drainQueue();
    });
  }

  function _doFetch(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.arrayBuffer();
    }).then(function (buf) {
      if (!isPdfBuffer(buf)) throw new Error('Direct fetch returned non-PDF content');
      return buf;
    }).catch(function (directErr) {
      // Only try proxies for cross-origin URLs
      var isCrossOrigin = false;
      try { isCrossOrigin = new URL(url).origin !== window.location.origin; } catch (e) { /* */ }
      if (!isCrossOrigin) throw directErr;

      console.debug('[pdf-preview] Cross-origin PDF, using CORS proxy for', url);
      return tryProxies(url, 0);
    });
  }

  // ─── PDF Document Cache ──────────────────────────────────────────────────────

  var _pdfDocCache = {}; // url → PDFDocumentProxy
  var _viewerPageState = {}; // url → { page, scale }

  // ─── PDF.js Renderer ─────────────────────────────────────────────────────────

  /**
   * Core renderer: loads a PDF via PDF.js and renders it onto a canvas.
   * Provides page nav, zoom, swipe gestures, keyboard nav, ResizeObserver.
   * Sizes the container to exactly one page when cfg.height === 'auto'.
   *
   * If a PDFDocumentProxy for `url` is already cached, it is reused
   * without re-fetching — so expanding inline→modal is instant.
   */
  function renderPdfViewer(container, url, cfg) {
    if (!shouldUsePdfjs(url, cfg)) {
      if (shouldUseIframeFallback(url)) renderIframeFallback(container, url, cfg);
      else renderMobileCard(container, url, cfg);
      return;
    }

    loadPdfjs(function (err) {
      if (err || !window.pdfjsLib) {
        console.warn('[pdf-preview] PDF.js unavailable, falling back to iframe:', err && err.message);
        if (shouldUseIframeFallback(url)) renderIframeFallback(container, url, cfg);
        else renderMobileCard(container, url, cfg);
        return;
      }

      var pdfjs = window.pdfjsLib;
      var state = { doc: null, page: 1, totalPages: 0, scale: 1.0, rendering: false };
      var dpr = window.devicePixelRatio || 1;

      // ── Build viewer DOM ──
      var viewer = document.createElement('div');
      viewer.className = 'pdfjs-viewer';

      var controls = document.createElement('div');
      controls.className = 'pdfjs-controls';
      controls.setAttribute('role', 'toolbar');
      controls.setAttribute('aria-label', 'PDF navigation');

      var prevBtn = makeBtn('◀ Prev', 'Previous page');
      var nextBtn = makeBtn('Next ▶', 'Next page');
      var zoomIn = makeBtn('+ Zoom', 'Zoom in');
      var zoomOut = makeBtn('− Zoom', 'Zoom out');
      var pageInfo = document.createElement('span');
      pageInfo.className = 'pdfjs-page-info';
      pageInfo.setAttribute('aria-live', 'polite');

      controls.appendChild(prevBtn);
      controls.appendChild(pageInfo);
      controls.appendChild(nextBtn);
      controls.appendChild(zoomIn);
      controls.appendChild(zoomOut);

      var canvas = document.createElement('canvas');
      canvas.className = 'pdfjs-canvas';
      canvas.setAttribute('role', 'img');

      var textLayerDiv = document.createElement('div');
      textLayerDiv.className = 'pdfjs-text-layer';

      var canvasBox = document.createElement('div');
      canvasBox.style.position = 'relative';
      canvasBox.style.display = 'inline-block';
      canvasBox.appendChild(canvas);
      canvasBox.appendChild(textLayerDiv);

      var canvasWrap = document.createElement('div');
      canvasWrap.className = 'pdfjs-canvas-wrap';

      var tapPrev = document.createElement('button');
      tapPrev.type = 'button';
      tapPrev.className = 'pdfjs-tap-prev';
      tapPrev.setAttribute('aria-label', 'Previous page');
      var tapNext = document.createElement('button');
      tapNext.type = 'button';
      tapNext.className = 'pdfjs-tap-next';
      tapNext.setAttribute('aria-label', 'Next page');

      canvasWrap.appendChild(tapPrev);
      canvasWrap.appendChild(canvasBox);
      canvasWrap.appendChild(tapNext);

      var swipeHint = document.createElement('div');
      swipeHint.className = 'pdfjs-swipe-hint';
      swipeHint.setAttribute('aria-hidden', 'true');
      swipeHint.textContent = '← swipe or tap sides to navigate →';

      viewer.appendChild(controls);
      viewer.appendChild(canvasWrap);
      viewer.appendChild(swipeHint);

      container.innerHTML = '';
      container.appendChild(viewer);

      // ── Render one page ──
      var _currentRenderTask = null;
      var _textLayerGen = 0;

      function renderPage(num) {
        if (!state.doc) return;

        // Cancel any in-flight render before starting a new one
        if (_currentRenderTask) {
          _currentRenderTask.cancel();
          _currentRenderTask = null;
        }

        state.rendering = true;

        state.doc.getPage(num).then(function (page) {
          // Fit-to-width: scale so page width matches container width
          var containerWidth = container.clientWidth || container.parentElement.clientWidth || window.innerWidth || 800;
          var baseVp = page.getViewport({ scale: 1.0 });
          var fitScale = containerWidth / baseVp.width;
          var cssScale = fitScale * state.scale;
          var viewport = page.getViewport({ scale: cssScale * dpr });

          // Set canvas pixel dimensions (high-res for retina)
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          // Set CSS display dimensions (logical pixels)
          canvas.style.width = Math.round(viewport.width / dpr) + 'px';
          canvas.style.height = Math.round(viewport.height / dpr) + 'px';
          canvas.setAttribute('aria-label', 'PDF page ' + num + ' of ' + state.totalPages);

          var ctx = canvas.getContext('2d');
          var task = page.render({ canvasContext: ctx, viewport: viewport });
          _currentRenderTask = task;

          // ── Text layer for selectable text ──
          var myGen = ++_textLayerGen;
          if (pdfjs.TextLayer) {
            textLayerDiv.innerHTML = '';
            var cssW = Math.round(viewport.width / dpr);
            var cssH = Math.round(viewport.height / dpr);
            textLayerDiv.style.width = cssW + 'px';
            textLayerDiv.style.height = cssH + 'px';
            var cssViewport = page.getViewport({ scale: cssScale });
            page.getTextContent().then(function (textContent) {
              if (myGen !== _textLayerGen) return; // stale
              textLayerDiv.innerHTML = '';
              var tl = new pdfjs.TextLayer({
                textContentSource: textContent,
                container: textLayerDiv,
                viewport: cssViewport
              });
              return tl.render();
            }).catch(function (e) {
              console.debug('[pdf-preview] TextLayer:', e && e.message);
            });
          }

          task.promise.then(function () {
            _currentRenderTask = null;
            state.rendering = false;
          }).catch(function (err) {
            _currentRenderTask = null;
            state.rendering = false;
            // RenderingCancelledException is expected when we cancel; ignore it
            if (err && err.name !== 'RenderingCancelledException') {
              console.warn('[pdf-preview] Render error:', err.message);
            }
          });

          // Update controls
          pageInfo.textContent = 'Page ' + num + ' / ' + state.totalPages;
          prevBtn.disabled = num <= 1;
          nextBtn.disabled = num >= state.totalPages;
          tapPrev.style.display = num <= 1 ? 'none' : '';
          tapNext.style.display = num >= state.totalPages ? 'none' : '';
          swipeHint.style.display = state.totalPages <= 1 ? 'none' : '';

          // Auto-height: size container to exactly one rendered page
          if (cfg.height === 'auto') {
            var cssPageH = Math.round(viewport.height / dpr);
            var controlsH = controls.offsetHeight || 0;
            var hintH = swipeHint.style.display === 'none' ? 0 : (swipeHint.offsetHeight || 24);
            container.style.height = (cssPageH + controlsH + hintH) + 'px';
          }
        }).catch(function () {
          state.rendering = false;
        });
      }

      // ── ResizeObserver for responsive re-render ──
      var _prevW = 0;
      if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(function (entries) {
          if (!state.doc) return;
          var w = Math.round(entries[0].contentRect.width);
          if (w > 0 && w !== _prevW) {
            _prevW = w;
            renderPage(state.page);
          }
        }).observe(container);
      }

      // ── Navigation ──
      function saveViewerState() { _viewerPageState[url] = { page: state.page, scale: state.scale }; }
      function goPrev() { if (state.page > 1) { state.page--; saveViewerState(); renderPage(state.page); } }
      function goNext() { if (state.page < state.totalPages) { state.page++; saveViewerState(); renderPage(state.page); } }
      prevBtn.addEventListener('click', goPrev);
      nextBtn.addEventListener('click', goNext);
      tapPrev.addEventListener('click', goPrev);
      tapNext.addEventListener('click', goNext);
      zoomIn.addEventListener('click', function () {
        state.scale = Math.min(state.scale + 0.25, 4.0);
        saveViewerState(); renderPage(state.page);
      });
      zoomOut.addEventListener('click', function () {
        state.scale = Math.max(state.scale - 0.25, 0.25);
        saveViewerState(); renderPage(state.page);
      });

      // ── Swipe (mobile) ──
      var _tx = 0, _ty = 0;
      viewer.addEventListener('touchstart', function (e) {
        _tx = e.changedTouches[0].clientX;
        _ty = e.changedTouches[0].clientY;
      }, { passive: true });
      viewer.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - _tx;
        var dy = e.changedTouches[0].clientY - _ty;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
          if (dx < 0) goNext(); else goPrev();
        }
      }, { passive: true });

      // ── Keyboard ──
      viewer.setAttribute('tabindex', '0');
      viewer.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext(); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goPrev(); }
      });

      // ── Load the document (with cache + CORS proxy fallback) ──
      function onDocReady(doc) {
        _pdfDocCache[url] = doc;
        state.doc = doc;
        state.totalPages = doc.numPages;
        var saved = _viewerPageState[url];
        if (saved) {
          state.page = Math.min(saved.page, doc.numPages) || 1;
          state.scale = saved.scale || 1.0;
        }
        saveViewerState();
        renderPage(state.page);
      }

      if (_pdfDocCache[url]) {
        onDocReady(_pdfDocCache[url]);
      } else {
        fetchPdfBytes(url).then(function (data) {
          return pdfjs.getDocument({ data: data }).promise;
        }).then(onDocReady).catch(function (loadErr) {
          console.warn('[pdf-preview] PDF.js load failed, falling back to alternate preview:', loadErr.message);
          if (shouldUseIframeFallback(url)) renderIframeFallback(container, url, cfg);
          else renderMobileCard(container, url, cfg);
        });
      }
    });
  }

  function makeBtn(text, label) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pdf-btn';
    btn.textContent = text;
    btn.setAttribute('aria-label', label);
    return btn;
  }

  // ─── Loading / Fallback UI ────────────────────────────────────────────────

  function showLoading(container) {
    container.innerHTML =
      '<div class="pdf-loading">' +
        '<span class="pdf-loading-spinner"></span> Loading PDF…' +
      '</div>';
  }

  /**
   * Render a mobile-friendly "tap to open" card.
   * Used on iOS and as fallback when both PDF.js and iframe fail.
   * Optionally renders a thumbnail of page 1 via PDF.js if available.
   */
  function renderMobileCard(container, url, cfg) {
    var safeUrl = sanitizeAttr(url);
    var safeName = sanitizeAttr(filenameFromUrl(url));

    var card = document.createElement('a');
    card.className = 'pdf-mobile-card';
    card.href = url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.setAttribute('aria-label', 'Open ' + filenameFromUrl(url));

    // Thumbnail canvas (filled later if PDF.js is available)
    var thumb = document.createElement('canvas');
    thumb.className = 'pdf-mobile-card-thumb';
    thumb.style.display = 'none';
    card.appendChild(thumb);

    var icon = document.createElement('div');
    icon.className = 'pdf-mobile-card-icon';
    icon.textContent = '\uD83D\uDCC4'; // 📄
    card.appendChild(icon);

    var name = document.createElement('div');
    name.className = 'pdf-mobile-card-name';
    name.textContent = filenameFromUrl(url);
    card.appendChild(name);

    var hint = document.createElement('div');
    hint.className = 'pdf-mobile-card-hint';
    hint.textContent = 'Tap to open PDF';
    card.appendChild(hint);

    // Action buttons
    var actions = document.createElement('div');
    actions.className = 'pdf-mobile-actions';
    actions.innerHTML =
      '<a class="pdf-btn" href="' + safeUrl + '" target="_blank" rel="noopener noreferrer">Open</a>' +
      '<a class="pdf-btn" href="' + safeUrl + '" download="' + safeName + '">Download</a>';
    // Prevent card navigation when clicking action buttons
    actions.addEventListener('click', function (e) { e.stopPropagation(); });
    card.appendChild(actions);

    container.innerHTML = '';
    container.appendChild(card);

    // Try to render a thumbnail of page 1
    _tryRenderThumbnail(thumb, icon, url);
  }

  /**
   * If PDF.js is available, render a small thumbnail of page 1
   * on the given canvas and hide the fallback icon.
   */
  function _tryRenderThumbnail(canvas, iconEl, url) {
    loadPdfjs(function (err) {
      if (err || !window.pdfjsLib) return;
      var pdfjs = window.pdfjsLib;
      var thumbWidth = Math.min(window.innerWidth - 40, 400);
      var dpr = window.devicePixelRatio || 1;

      function renderFromDoc(doc) {
        doc.getPage(1).then(function (page) {
          var baseVp = page.getViewport({ scale: 1.0 });
          var scale = (thumbWidth / baseVp.width) * dpr;
          var vp = page.getViewport({ scale: scale });
          canvas.width = vp.width;
          canvas.height = vp.height;
          canvas.style.width = Math.round(vp.width / dpr) + 'px';
          canvas.style.height = Math.round(vp.height / dpr) + 'px';
          return page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        }).then(function () {
          canvas.style.display = '';
          if (iconEl) iconEl.style.display = 'none';
        }).catch(function () { /* thumbnail is optional */ });
      }

      if (_pdfDocCache[url]) {
        renderFromDoc(_pdfDocCache[url]);
      } else {
        fetchPdfBytes(url).then(function (data) {
          return pdfjs.getDocument({ data: data }).promise;
        }).then(function (doc) {
          _pdfDocCache[url] = doc;
          renderFromDoc(doc);
        }).catch(function () { /* thumbnail is optional */ });
      }
    });
  }

  /**
   * Last-resort fallback: render the PDF in a native browser iframe.
   * Restricted to same-origin PDFs. Cross-origin fallbacks use the open-card UI
   * to avoid CSP frame-ancestor failures and insecure iframe warnings.
   */
  function renderIframeFallback(container, url, cfg) {
    // iOS and cross-origin URLs should not use iframe fallback.
    if (isIOS() || !shouldUseIframeFallback(url)) {
      renderMobileCard(container, url, cfg);
      return;
    }

    var safeUrl = sanitizeAttr(url);
    var safeName = sanitizeAttr(filenameFromUrl(url));
    // Append #view=FitH to hint the browser to fit-width
    var iframeSrc = safeUrl.split('#')[0] + '#view=FitH';

    var heightStyle = (cfg && cfg.height && cfg.height !== 'auto')
      ? cfg.height
      : '80vh';

    container.innerHTML =
      '<iframe style="display:block;width:100%;height:' + sanitizeAttr(heightStyle) + ';border:none"' +
        ' src="' + iframeSrc + '"' +
        ' title="PDF preview: ' + safeName + '"' +
        ' aria-label="PDF preview: ' + safeName + '">' +
      '</iframe>' +
      '<div style="text-align:center;padding:4px;font-size:.75em;opacity:.5">' +
        'Rendered with browser PDF viewer — ' +
        '<a href="' + safeUrl + '" target="_blank" rel="noopener noreferrer">Open</a> | ' +
        '<a href="' + safeUrl + '" download="' + safeName + '">Download</a>' +
      '</div>';
  }

  function showFallback(container, url) {
    // On iOS use the mobile card for a better touch experience
    if (isIOS()) {
      renderMobileCard(container, url, {});
      return;
    }
    var safeUrl = sanitizeAttr(url);
    var safeName = sanitizeAttr(filenameFromUrl(url));
    container.innerHTML =
      '<div class="pdf-preview-fallback">' +
        '<div style="margin-bottom:10px">📄 <strong>' + safeName + '</strong></div>' +
        '<div style="margin-bottom:8px;font-size:.85em;opacity:.7">Could not render this PDF inline.</div>' +
        '<a class="pdf-btn" href="' + safeUrl + '" target="_blank" rel="noopener noreferrer" style="margin:4px">Open PDF</a> ' +
        '<a class="pdf-btn" href="' + safeUrl + '" download="' + safeName + '" style="margin:4px">Download</a>' +
      '</div>';
  }

  // ─── Inline Header ──────────────────────────────────────────────────────────

  function buildInlineHeader(safeUrl, safeName) {
    return '<div class="pdf-preview-header">' +
      '<span class="pdf-preview-modal-spacer"></span>' +
      '<span class="pdf-header-center">' +
        '<a class="pdf-preview-filename" href="' + safeUrl + '" target="_blank" rel="noopener noreferrer" aria-label="Open ' + safeName + ' in new tab">' + safeName + '</a>' +
      '</span>' +
      '<span class="pdf-preview-controls">' +
        '<button class="pdf-inline-expand-btn" type="button" aria-label="Expand to full screen" aria-haspopup="dialog">&#x2197;</button>' +
      '</span>' +
    '</div>';
  }

  // ─── Modal Trigger Button ────────────────────────────────────────────────────

  function buildModalTrigger(info) {
    var btn = document.createElement('button');
    btn.className = 'pdf-preview-modal-btn';
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-label', 'Preview PDF: ' + info.filename);
    btn.textContent = '📄 Preview PDF';
    return btn;
  }

  // ─── Modal ───────────────────────────────────────────────────────────────────

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
          '<span class="pdf-header-center">' +
            '<a class="pdf-preview-modal-filename" id="pdf-modal-title" href="#" target="_blank" rel="noopener noreferrer"></a>' +
          '</span>' +
          '<span class="pdf-preview-modal-actions">' +
            '<button class="pdf-modal-close-btn" id="pdf-modal-close" type="button" aria-label="Close PDF viewer">&#x2715;</button>' +
          '</span>' +
        '</div>' +
        '<div class="pdf-preview-modal-body" id="pdf-modal-body"></div>' +
      '</div>';

    document.body.appendChild(overlay);

    overlay.querySelector('#pdf-modal-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && overlay.style.display !== 'none') {
        closeModal();
      }
    });
    overlay.addEventListener('keydown', trapFocus);

    _modal = overlay;
    return overlay;
  }

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
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function openModal(info, cfg) {
    var overlay = getOrCreateModal();
    overlay.setAttribute('aria-label', 'PDF Viewer: ' + info.filename);
    overlay.querySelector('.pdf-preview-modal').style.width = cfg.modalWidth;
    overlay.querySelector('.pdf-preview-modal').style.height = cfg.modalHeight;

    var titleLink = overlay.querySelector('#pdf-modal-title');
    titleLink.textContent = info.filename;
    titleLink.href = info.resolvedUrl;
    titleLink.setAttribute('aria-label', 'Open ' + info.filename + ' in new tab');

    var body = overlay.querySelector('#pdf-modal-body');
    body.innerHTML = '';

    var frameArea = document.createElement('div');
    frameArea.className = 'pdf-preview-frame-area';
    frameArea.style.flex = '1';
    frameArea.style.minHeight = '0';
    body.appendChild(frameArea);

    showLoading(frameArea);

    // Modal always uses explicit height (fills modal body via flex)
    var modalCfg = mergeConfig(cfg, { height: '100%' });

    renderPdfViewer(frameArea, info.resolvedUrl, modalCfg);

    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    if (cfg.routeParam) {
      try {
        var hash = window.location.hash || '#';
        window.history.pushState(null, '', setHashParam(hash, cfg.routeParam, info.resolvedUrl));
      } catch (e) { /* non-critical */ }
    }

    setTimeout(function () {
      overlay.querySelector('#pdf-modal-close').focus();
    }, 50);
  }

  function closeModal() {
    if (!_modal) return;
    _modal.style.display = 'none';
    document.body.style.overflow = '';

    // Clear modal body to stop any rendering
    var body = _modal.querySelector('#pdf-modal-body');
    if (body) body.innerHTML = '';

    if (_modalFocusTrigger && _modalFocusTrigger.focus) {
      _modalFocusTrigger.focus();
    }
    _modalFocusTrigger = null;

    try {
      if (window.location.hash && _routeParam) {
        window.history.pushState(null, '', removeHashParam(window.location.hash, _routeParam));
      }
    } catch (e) { /* non-critical */ }
  }

  // ─── Hash helpers ───────────────────────────────────────────────────────────

  function removeHashParam(hash, key) {
    var raw = hash.charAt(0) === '#' ? hash.slice(1) : hash;
    var parts = raw.split('?');
    var base = parts[0] || '';
    var params = new URLSearchParams(parts[1] || '');
    params.delete(key);
    var q = params.toString();
    return '#' + (q ? base + '?' + q : base);
  }

  function setHashParam(hash, key, value) {
    var raw = hash.charAt(0) === '#' ? hash.slice(1) : hash;
    var parts = raw.split('?');
    var base = parts[0] || '';
    var params = new URLSearchParams(parts[1] || '');
    params.set(key, value);
    var q = params.toString();
    return '#' + (q ? base + '?' + q : base);
  }

  // ─── Rendering Controller ────────────────────────────────────────────────────

  function processLink(info, cfg) {
    var el = info.element;
    el.setAttribute('data-pdf-preview-processed', '1');

    // Merge per-link options over global config
    if (info.linkOpts && Object.keys(info.linkOpts).length > 0) {
      cfg = mergeConfig(cfg, info.linkOpts);
    }

    switch (cfg.mode) {
      case 'inline':  renderInline(info, cfg); break;
      case 'modal':   renderModal(info, cfg); break;
      case 'both':    renderBoth(info, cfg); break;
      default:        renderInline(info, cfg);
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
    // Set a comfortable placeholder height while loading.
    // PDF.js will set exact page dimensions after first render.
    if (cfg.height === 'auto') {
      frameArea.style.minHeight = '200px';
    } else {
      frameArea.style.height = cfg.height;
    }
    container.appendChild(frameArea);

    el.parentNode.replaceChild(container, el);

    showLoading(frameArea);

    renderPdfViewer(frameArea, info.resolvedUrl, cfg);

    // Wire expand button → modal
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
    var btn = buildModalTrigger(info);
    btn.addEventListener('click', function () {
      _modalFocusTrigger = btn;
      openModal(info, cfg);
    });
    if (el.parentNode) {
      el.parentNode.insertBefore(btn, el.nextSibling);
    }
  }

  function renderBoth(info, cfg) {
    var el = info.element;
    var btn = buildModalTrigger(info);
    btn.addEventListener('click', function () {
      _modalFocusTrigger = btn;
      openModal(info, cfg);
    });
    if (el.parentNode) {
      el.parentNode.insertBefore(btn, el.nextSibling);
    }
  }

  // ─── Plugin Entry ────────────────────────────────────────────────────────────

  function install(hook, vm) {
    var cfg = mergeConfig(DEFAULT_CONFIG, (window.$docsify || {}).pdfPreview);
    _routeParam = cfg.routeParam || null;

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

    if (cfg.routeParam) {
      window.addEventListener('popstate', function () {
        var hash = window.location.hash;
        if (hash.indexOf(cfg.routeParam + '=') === -1) closeModal();
      });
    }

    hook.beforeEach(function (content, next) {
      closeModal();
      next(encodePdfOptsInMarkdown(content));
    });
  }

  // Register with Docsify
  if (window.$docsify) {
    window.$docsify.plugins = (window.$docsify.plugins || []).concat(install);
  } else {
    window.$docsify = { plugins: [install] };
  }
})();
