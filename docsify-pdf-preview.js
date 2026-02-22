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
    mode: 'modal',           // "inline" | "modal" | "both"
    backend: 'native',       // "native" | "pdfjs"
    height: '75vh',
    modalWidth: '90vw',
    modalHeight: '90vh',
    downloadButton: true,
    openButton: true,
    routeParam: null,        // e.g. "pdf" – enables URL state
    match: /\.pdf(\?.*)?$/i
  };

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
   * Find all unprocessed PDF links in the markdown section.
   * Returns array of { element, href, resolvedUrl, filename }.
   */
  function scanPdfLinks(cfg, basePath, currentRoute) {
    var links = document.querySelectorAll('.markdown-section a[href]');
    var results = [];
    for (var i = 0; i < links.length; i++) {
      var el = links[i];

      // Skip already-processed links
      if (el.getAttribute('data-pdf-preview-processed')) continue;

      // Skip links inside code blocks
      if (el.closest('code, pre')) continue;

      var href = el.getAttribute('href');
      if (!cfg.match.test(href)) continue;

      if (!isSafeUrl(href)) continue;

      var resolvedUrl = resolvePdfUrl(href, basePath, currentRoute);
      if (!isSafeUrl(resolvedUrl)) continue;

      results.push({
        element: el,
        href: href,
        resolvedUrl: resolvedUrl,
        filename: filenameFromUrl(href)
      });
    }
    return results;
  }

  // ─── 5. UI Builders ──────────────────────────────────────────────────────────

  /**
   * Build an inline preview container.
   *
   * Layout:
   * +-----------------------------------+
   * | filename.pdf  [open] [download]  |
   * +-----------------------------------+
   * |           iframe area            |
   * +-----------------------------------+
   */
  function buildInlineContainer(info, cfg) {
    var safeUrl = sanitizeAttr(info.resolvedUrl);
    var safeName = sanitizeAttr(info.filename);

    var openBtn = cfg.openButton
      ? '<a class="pdf-btn" href="' + safeUrl + '" target="_blank" rel="noopener noreferrer" aria-label="Open ' + safeName + ' in new tab">Open</a>'
      : '';
    var dlBtn = cfg.downloadButton
      ? '<a class="pdf-btn" href="' + safeUrl + '" download="' + safeName + '" aria-label="Download ' + safeName + '">Download</a>'
      : '';

    var wrapper = document.createElement('div');
    wrapper.className = 'pdf-preview-inline';
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', 'PDF Preview: ' + info.filename);

    wrapper.innerHTML =
      '<div class="pdf-preview-header">' +
        '<span class="pdf-preview-filename">' + safeName + '</span>' +
        '<span class="pdf-preview-controls">' + openBtn + dlBtn + '</span>' +
      '</div>' +
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
          '<span class="pdf-preview-modal-filename" id="pdf-preview-modal-title"></span>' +
          '<span class="pdf-preview-modal-actions">' +
            '<a class="pdf-btn" id="pdf-modal-open-btn" href="#" target="_blank" rel="noopener noreferrer" aria-label="Open in new tab">Open</a>' +
            '<a class="pdf-btn" id="pdf-modal-dl-btn" href="#" aria-label="Download">Download</a>' +
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
    overlay.style.width = cfg.modalWidth;
    overlay.querySelector('.pdf-preview-modal').style.width = cfg.modalWidth;
    overlay.querySelector('.pdf-preview-modal').style.height = cfg.modalHeight;

    overlay.querySelector('#pdf-preview-modal-title').textContent = info.filename;

    var openBtn = overlay.querySelector('#pdf-modal-open-btn');
    var dlBtn = overlay.querySelector('#pdf-modal-dl-btn');
    var frame = overlay.querySelector('#pdf-preview-modal-frame');
    var fbOpen = overlay.querySelector('#pdf-modal-fallback-open');
    var fbDl = overlay.querySelector('#pdf-modal-fallback-dl');

    if (cfg.openButton) {
      openBtn.style.display = '';
      openBtn.href = info.resolvedUrl;
      openBtn.setAttribute('aria-label', 'Open ' + info.filename + ' in new tab');
    } else {
      openBtn.style.display = 'none';
    }

    if (cfg.downloadButton) {
      dlBtn.style.display = '';
      dlBtn.href = info.resolvedUrl;
      dlBtn.setAttribute('download', info.filename);
      dlBtn.setAttribute('aria-label', 'Download ' + info.filename);
    } else {
      dlBtn.style.display = 'none';
    }

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
    var container;

    if (cfg.backend === 'pdfjs') {
      container = document.createElement('div');
      container.className = 'pdf-preview-inline';
      container.setAttribute('role', 'region');
      container.setAttribute('aria-label', 'PDF Preview: ' + info.filename);
      var safeUrl = sanitizeAttr(info.resolvedUrl);
      var safeName = sanitizeAttr(info.filename);
      var openBtn = cfg.openButton
        ? '<a class="pdf-btn" href="' + safeUrl + '" target="_blank" rel="noopener noreferrer" aria-label="Open ' + safeName + ' in new tab">Open</a>'
        : '';
      var dlBtn = cfg.downloadButton
        ? '<a class="pdf-btn" href="' + safeUrl + '" download="' + safeName + '" aria-label="Download ' + safeName + '">Download</a>'
        : '';
      container.innerHTML =
        '<div class="pdf-preview-header">' +
          '<span class="pdf-preview-filename">' + safeName + '</span>' +
          '<span class="pdf-preview-controls">' + openBtn + dlBtn + '</span>' +
        '</div>';
      var frameArea = document.createElement('div');
      frameArea.className = 'pdf-preview-frame-area';
      frameArea.style.height = cfg.height;
      container.appendChild(frameArea);
      el.parentNode.replaceChild(container, el);
      renderPdfJs(frameArea, info.resolvedUrl, cfg);
    } else {
      container = buildInlineContainer(info, cfg);
      el.parentNode.replaceChild(container, el);
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

    // Close modal on route change (no duplicate bindings after navigation)
    hook.beforeEach(function (content, next) {
      onRouteChange();
      next(content);
    });
  }

  // Register plugin with Docsify
  if (window.$docsify) {
    window.$docsify.plugins = (window.$docsify.plugins || []).concat(install);
  } else {
    window.$docsify = { plugins: [install] };
  }
})();
