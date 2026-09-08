(function () {
  'use strict';

  /* ---- Theme ------------------------------------------------------------ */

  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');
  var themeColor = document.querySelector('meta[name="theme-color"]');
  var BG = { dark: '#1c1a1f', light: '#f5f0f6' };

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var next = theme === 'dark' ? 'light' : 'dark';
    toggle.textContent = next.toUpperCase();
    toggle.setAttribute('aria-label', 'Switch to ' + next + ' theme');
    // Keeps the mobile browser chrome the same colour as the page, so the
    // strip above and below the content never reads as a seam.
    if (themeColor) themeColor.setAttribute('content', BG[theme]);
  }

  applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

  toggle.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* ---- Generative ASCII backdrop ---------------------------------------- */

  var RAMP = ' ...:::---===+++**##%%';
  var art = document.getElementById('art');

  // Two interfering circular fields, banded into ramp characters.
  function ringField(x, y) {
    var a = Math.hypot(x - 7, y - 5);
    var b = Math.hypot(x - 22, y - 12);
    return Math.sin(a * 1.5) + Math.cos(b * 1.25) + 0.4 * Math.sin((x + y) * 0.5);
  }

  function buildArt(cols, rows) {
    var T = 0.88, scale = 0.5, lines = [];
    for (var y = 0; y < rows; y++) {
      var line = '';
      for (var x = 0; x < cols; x++) {
        var f = ringField(x * 0.055, y * 0.085);
        var band = Math.abs(((f * scale) % 1 + 1) % 1 - 0.5) * 2;
        var edge = 1 - band;
        line += edge > T
          ? RAMP[Math.min(RAMP.length - 1, Math.floor(((edge - T) / (1 - T)) * RAMP.length))]
          : ' ';
      }
      lines.push(line.replace(/\s+$/, ''));
    }
    return lines.join('\n');
  }

  var CHAR_W = 7.05;   // conservative advance width for 13px IBM Plex Mono
  var LINE_H = 13;
  var lastCols = 0, lastRows = 0;

  function measure() {
    var w = window.innerWidth || 1200;
    var h = window.innerHeight || 900;
    return {
      // +10 / +14 cover the negative offsets that bleed the art off the edges.
      cols: Math.ceil((w + 10) / CHAR_W) + 4,
      // Extra height so the mobile URL bar collapsing does not force a rebuild.
      rows: Math.ceil((h + 14 + 120) / LINE_H) + 2
    };
  }

  function regen() {
    var m = measure();
    // Only rebuild when the viewport actually outgrew the current art, or
    // shrank far enough that we are drawing a lot of wasted rows.
    if (m.cols === lastCols && m.rows <= lastRows && m.rows > lastRows - 12) return;
    lastCols = m.cols;
    lastRows = m.rows;
    art.textContent = buildArt(m.cols, m.rows);
  }

  regen();

  var timer;
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(regen, 200);
  });

  // Web fonts change the real character advance; re-measure once they land.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      lastCols = 0;
      regen();
    });
  }
})();
