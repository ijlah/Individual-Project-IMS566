// theme.js - light/dark mode preference and toggle
(function () {
  'use strict';

  var StudNest = window.StudNest = window.StudNest || {};
  var STORAGE_KEY = 'studNestTheme';

  function updateControls() {
    var isDark = document.documentElement.dataset.theme === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(isDark));
      button.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      button.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      var label = button.querySelector('[data-theme-label]');
      if (label) label.textContent = isDark ? 'Light mode' : 'Dark mode';
    });
  }

  function apply(theme) {
    var nextTheme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    try { localStorage.setItem(STORAGE_KEY, nextTheme); } catch (e) { /* preference is optional */ }
    var metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', nextTheme === 'dark' ? '#111A22' : '#F7F6F2');
    updateControls();
  }

  function init() {
    var savedTheme = null;
    try { savedTheme = localStorage.getItem(STORAGE_KEY); } catch (e) { /* use light mode */ }
    apply(savedTheme || 'light');
  }

  document.addEventListener('click', function (event) {
    var toggle = event.target.closest('[data-theme-toggle]');
    if (!toggle) return;
    event.preventDefault();
    apply(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  StudNest.theme = {
    init: init,
    apply: apply,
    updateControls: updateControls
  };

  init();
}());
