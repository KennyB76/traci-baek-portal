/**
 * stealth-comment.js  v1.0  (2026-05-17)
 * Newton School / Kenny + Traci portal stealth annotation layer.
 *
 * Features:
 *   - text selection drag -> floating "+" button
 *   - click "+" -> inline textarea -> Enter save / Esc cancel
 *   - localStorage per pathname
 *   - floating dot (12px, opacity 0.3 / hover 1) bottom-right
 *   - hover/click dot -> panel with comment list + copy all + clear all
 *   - copy all = structured block per SPEC
 *
 * Storage key: "stealth-comments-v1:" + window.location.pathname
 * (separate from /visual --edit widget keys)
 *
 * No external dependencies. Self-contained.
 */
(function () {
  'use strict';

  /* ── storage ── */
  var STORE_KEY = 'stealth-comments-v1:' + window.location.pathname;

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
    catch (e) { return []; }
  }

  function save(arr) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(arr)); }
    catch (e) { /* quota — silent */ }
  }

  var comments = load();

  /* ── inject CSS ── */
  var style = document.createElement('style');
  style.textContent = [
    /* floating dot */
    '#sc-dot{',
    '  position:fixed;bottom:18px;right:18px;',
    '  width:12px;height:12px;border-radius:50%;',
    '  background:#6366f1;',
    '  opacity:.3;cursor:pointer;z-index:99990;',
    '  transition:opacity .2s,transform .2s;',
    '  box-shadow:0 1px 4px rgba(0,0,0,.4);',
    '}',
    '#sc-dot:hover,#sc-dot.open{opacity:1;transform:scale(1.2);}',
    /* panel */
    '#sc-panel{',
    '  position:fixed;bottom:38px;right:14px;',
    '  width:280px;max-height:360px;',
    '  background:#18181b;color:#e4e4e7;',
    '  border:1px solid #3f3f46;border-radius:8px;',
    '  font:12px/1.5 "Inter",system-ui,sans-serif;',
    '  box-shadow:0 4px 20px rgba(0,0,0,.6);',
    '  display:none;flex-direction:column;',
    '  z-index:99991;overflow:hidden;',
    '}',
    '#sc-panel.open{display:flex;}',
    '#sc-panel-head{',
    '  padding:8px 10px;font-size:11px;',
    '  color:#a1a1aa;border-bottom:1px solid #3f3f46;',
    '  flex-shrink:0;',
    '}',
    '#sc-panel-list{',
    '  flex:1;overflow-y:auto;padding:6px 0;',
    '}',
    '.sc-item{',
    '  padding:5px 10px;border-bottom:1px solid #27272a;',
    '}',
    '.sc-item:last-child{border-bottom:none;}',
    '.sc-item-text{',
    '  font-size:11px;color:#71717a;',
    '  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
    '}',
    '.sc-item-comment{',
    '  font-size:12px;color:#d4d4d8;margin-top:1px;',
    '}',
    '.sc-item-ts{',
    '  font-size:10px;color:#52525b;margin-top:1px;',
    '}',
    '#sc-panel-foot{',
    '  padding:6px 10px;border-top:1px solid #3f3f46;',
    '  display:flex;gap:6px;flex-shrink:0;',
    '}',
    '.sc-btn{',
    '  flex:1;padding:4px 0;',
    '  background:#27272a;color:#a1a1aa;',
    '  border:1px solid #3f3f46;border-radius:4px;',
    '  font:11px system-ui,sans-serif;cursor:pointer;',
    '  transition:background .15s,color .15s;',
    '}',
    '.sc-btn:hover{background:#3f3f46;color:#e4e4e7;}',
    '.sc-empty{',
    '  padding:12px 10px;color:#52525b;font-size:11px;',
    '  text-align:center;',
    '}',
    /* selection "+" button */
    '#sc-plus{',
    '  position:absolute;',
    '  width:20px;height:20px;',
    '  background:#6366f1;color:#fff;',
    '  border:none;border-radius:4px;',
    '  font:bold 14px/20px system-ui,sans-serif;',
    '  cursor:pointer;z-index:99992;',
    '  display:none;text-align:center;',
    '  box-shadow:0 1px 4px rgba(0,0,0,.4);',
    '  padding:0;',
    '}',
    '#sc-plus:hover{background:#4f46e5;}',
    /* inline input */
    '#sc-input-wrap{',
    '  position:absolute;z-index:99993;',
    '  background:#18181b;border:1px solid #6366f1;',
    '  border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.5);',
    '  padding:6px;display:none;',
    '}',
    '#sc-input{',
    '  width:220px;min-height:52px;',
    '  background:#09090b;color:#e4e4e7;',
    '  border:none;border-radius:4px;',
    '  font:12px/1.5 "Inter",system-ui,sans-serif;',
    '  padding:4px 6px;resize:vertical;outline:none;',
    '}',
    '#sc-input-hint{',
    '  font:10px system-ui,sans-serif;color:#52525b;',
    '  margin-top:4px;',
    '}',
  ].join('');
  document.head.appendChild(style);

  /* ── DOM elements ── */
  var dot = document.createElement('div');
  dot.id = 'sc-dot';
  dot.title = 'Stealth comments';

  var panel = document.createElement('div');
  panel.id = 'sc-panel';
  panel.innerHTML =
    '<div id="sc-panel-head"></div>' +
    '<div id="sc-panel-list"></div>' +
    '<div id="sc-panel-foot">' +
    '<button class="sc-btn" id="sc-copy">copy all</button>' +
    '<button class="sc-btn" id="sc-clear">clear all</button>' +
    '</div>';

  var plusBtn = document.createElement('button');
  plusBtn.id = 'sc-plus';
  plusBtn.textContent = '+';

  var inputWrap = document.createElement('div');
  inputWrap.id = 'sc-input-wrap';
  inputWrap.innerHTML =
    '<textarea id="sc-input" placeholder="comment..." rows="3"></textarea>' +
    '<div id="sc-input-hint">Enter = save  |  Esc = cancel</div>';

  document.body.appendChild(dot);
  document.body.appendChild(panel);
  document.body.appendChild(plusBtn);
  document.body.appendChild(inputWrap);

  var panelHead = document.getElementById('sc-panel-head');
  var panelList = document.getElementById('sc-panel-list');
  var inputEl   = document.getElementById('sc-input');

  /* ── state ── */
  var pending = null; // { text, x, y }

  /* ── panel render ── */
  function renderPanel() {
    panelHead.textContent = comments.length + ' comment' + (comments.length !== 1 ? 's' : '');
    if (comments.length === 0) {
      panelList.innerHTML = '<div class="sc-empty">no comments yet</div>';
      return;
    }
    panelList.innerHTML = comments.map(function (c) {
      var ts = new Date(c.timestamp);
      var hh = ('0' + ts.getHours()).slice(-2);
      var mm = ('0' + ts.getMinutes()).slice(-2);
      var ss = ('0' + ts.getSeconds()).slice(-2);
      var textSnip = c.selectedText.length > 50
        ? c.selectedText.slice(0, 50) + '...'
        : c.selectedText;
      return '<div class="sc-item">' +
        '<div class="sc-item-text">"' + esc(textSnip) + '"</div>' +
        '<div class="sc-item-comment">' + esc(c.comment) + '</div>' +
        '<div class="sc-item-ts">' + hh + ':' + mm + ':' + ss + '</div>' +
        '</div>';
    }).join('');
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── panel toggle ── */
  var panelOpen = false;

  function openPanel() {
    renderPanel();
    panel.classList.add('open');
    dot.classList.add('open');
    panelOpen = true;
  }

  function closePanel() {
    panel.classList.remove('open');
    dot.classList.remove('open');
    panelOpen = false;
  }

  dot.addEventListener('click', function (e) {
    e.stopPropagation();
    if (panelOpen) closePanel(); else openPanel();
  });

  document.addEventListener('click', function (e) {
    if (panelOpen && !panel.contains(e.target) && e.target !== dot) {
      closePanel();
    }
  });

  /* ── copy all ── */
  document.getElementById('sc-copy').addEventListener('click', function () {
    if (comments.length === 0) return;
    var url = window.location.href;
    var lines = ['=== Comments for ' + url + ' ===', ''];
    comments.forEach(function (c) {
      var ts = new Date(c.timestamp);
      var hh = ('0' + ts.getHours()).slice(-2);
      var mm = ('0' + ts.getMinutes()).slice(-2);
      var ss = ('0' + ts.getSeconds()).slice(-2);
      lines.push('[' + hh + ':' + mm + ':' + ss + ']');
      lines.push('text     : "' + c.selectedText.replace(/"/g, '\\"') + '"');
      lines.push('comment  : "' + c.comment.replace(/"/g, '\\"') + '"');
      lines.push('');
    });
    lines.push('===');
    var blob = lines.join('\n');
    navigator.clipboard.writeText(blob).then(function () {
      var btn = document.getElementById('sc-copy');
      var orig = btn.textContent;
      btn.textContent = 'copied!';
      btn.style.color = '#86efac';
      setTimeout(function () {
        btn.textContent = orig;
        btn.style.color = '';
      }, 1200);
    }).catch(function () {
      /* fallback — textarea trick */
      var ta = document.createElement('textarea');
      ta.value = blob;
      ta.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
  });

  /* ── clear all ── */
  document.getElementById('sc-clear').addEventListener('click', function () {
    if (comments.length === 0) return;
    if (!confirm('Clear all ' + comments.length + ' comment(s)?')) return;
    comments = [];
    save(comments);
    renderPanel();
  });

  /* ── selection -> "+" button ── */
  var selectionTimer = null;

  document.addEventListener('mouseup', function (e) {
    if (inputWrap.contains(e.target) || plusBtn.contains(e.target)) return;
    clearTimeout(selectionTimer);
    selectionTimer = setTimeout(function () {
      var sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        hidePlus();
        return;
      }
      var text = sel.toString().trim();
      if (text.length < 2) { hidePlus(); return; }
      var range = sel.getRangeAt(0);
      var rect  = range.getBoundingClientRect();
      var scrollX = window.scrollX || window.pageXOffset;
      var scrollY = window.scrollY || window.pageYOffset;
      /* position: top-right corner of selection */
      var bx = rect.right + scrollX + 4;
      var by = rect.top  + scrollY - 4;
      pending = { text: text, x: bx, y: by };
      plusBtn.style.left = bx + 'px';
      plusBtn.style.top  = by + 'px';
      plusBtn.style.display = 'block';
    }, 60);
  });

  /* hide "+" on new selection start */
  document.addEventListener('mousedown', function (e) {
    if (e.target === plusBtn || inputWrap.contains(e.target)) return;
    hidePlus();
  });

  function hidePlus() {
    plusBtn.style.display = 'none';
    pending = null;
  }

  /* ── "+" click -> input wrap ── */
  plusBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!pending) return;
    /* position input wrap near selection */
    var wx = pending.x;
    var wy = pending.y + 24;
    /* clamp to viewport */
    var vpW = window.innerWidth + (window.scrollX || window.pageXOffset);
    if (wx + 240 > vpW) wx = vpW - 244;
    inputWrap.style.left = wx + 'px';
    inputWrap.style.top  = wy + 'px';
    inputWrap.style.display = 'block';
    inputEl.value = '';
    inputEl.focus();
    hidePlus();
  });

  /* ── input: Enter save / Esc cancel ── */
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveComment();
    } else if (e.key === 'Escape') {
      cancelInput();
    }
  });

  function saveComment() {
    var txt = inputEl.value.trim();
    if (!txt || !pending) { cancelInput(); return; }
    var entry = {
      id:           Date.now(),
      selectedText: pending.text,
      comment:      txt,
      timestamp:    Date.now(),
      x:            pending.x,
      y:            pending.y,
    };
    comments.push(entry);
    save(comments);
    cancelInput();
    /* flash dot */
    dot.style.opacity = '1';
    setTimeout(function () { dot.style.opacity = panelOpen ? '1' : '.3'; }, 600);
    /* re-render if panel open */
    if (panelOpen) renderPanel();
  }

  function cancelInput() {
    inputWrap.style.display = 'none';
    pending = null;
    window.getSelection && window.getSelection().removeAllRanges();
  }

  /* close input on outside click */
  document.addEventListener('mousedown', function (e) {
    if (!inputWrap.contains(e.target) && e.target !== plusBtn) {
      if (inputWrap.style.display === 'block') cancelInput();
    }
  });

  /* ── init ── */
  renderPanel();

})();
