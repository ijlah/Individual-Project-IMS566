// layout.js - sidebar, topbar and mobile menu
(function () {
  'use strict';
  var StudNest = window.StudNest = window.StudNest || {};

  // page title for breadcrumb
  var PAGE_TITLES = {
    dashboard: 'Overview',
    assignments: 'Assignments',
    timetable: 'Timetable',
    progress: 'My progress',
    'admin-dashboard': 'Admin overview',
    subjects: 'Subjects',
    students: 'Students',
    sections: 'Sections & classes',
    enrolments: 'Enrolments',
    announcements: 'Announcements',
    submissions: 'Submissions & grades',
    reports: 'Reports & exports',
    staff: 'Staff & audit'
  };

  // student menu links
  function studentNav() {
    return [
      { href: 'dashboard.html', page: 'dashboard', icon: 'bi-house-door', label: 'Overview' },
      { href: 'assignments.html', page: 'assignments', icon: 'bi-check2-square', label: 'Assignments', countId: 'navDueCount' },
      { href: 'timetable.html', page: 'timetable', icon: 'bi-calendar3', label: 'Timetable' },
      { href: 'progress.html', page: 'progress', icon: 'bi-graph-up-arrow', label: 'My progress' }
    ];
  }

  // staff menu links
  function staffNav() {
    return [
      { href: 'dashboard.html', page: 'admin-dashboard', icon: 'bi-speedometer2', label: 'Overview' },
      { href: 'subjects.html', page: 'subjects', icon: 'bi-journal-bookmark', label: 'Subjects' },
      { href: 'students.html', page: 'students', icon: 'bi-people', label: 'Students' },
      { href: 'sections.html', page: 'sections', icon: 'bi-diagram-3', label: 'Sections & classes' },
      { href: 'enrolments.html', page: 'enrolments', icon: 'bi-person-check', label: 'Enrolments' },
      { href: 'announcements.html', page: 'announcements', icon: 'bi-megaphone', label: 'Announcements' },
      { href: 'submissions.html', page: 'submissions', icon: 'bi-card-checklist', label: 'Submissions & grades' },
      { href: 'reports.html', page: 'reports', icon: 'bi-file-earmark-arrow-down', label: 'Reports & exports' },
      { href: 'staff.html', page: 'staff', icon: 'bi-shield-lock', label: 'Staff & audit' }
    ];
  }

  function $ (selector, root) { return (root || document).querySelector(selector); }

  function closeMobileMenu() {
    var sidebar = $('#sidebar');
    if (sidebar) sidebar.classList.remove('open');
    var overlay = document.querySelector('.menu-overlay');
    if (overlay) overlay.remove();
  }

  function avatarMarkup(id) {
    var src = StudNest.paths.asset('images/avatar.png');
    return '<div class="avatar avatar-photo" id="' + id + '"><img src="' + src + '" alt="" width="36" height="36"></div>';
  }

  StudNest.layout = {
    showToast: function (message) {
      var toastEl = document.getElementById('hubToast');
      var body = document.getElementById('toastMessage');
      if (!toastEl || !body || !window.bootstrap) return;
      body.textContent = message;
      bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2400 }).show();
    },

    injectToast: function () {
      if (document.getElementById('hubToast')) return;
      var wrap = document.createElement('div');
      wrap.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      wrap.innerHTML = '<div id="hubToast" class="toast text-bg-dark border-0" role="status"><div class="d-flex"><div class="toast-body" id="toastMessage">Saved.</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div></div>';
      document.body.appendChild(wrap);
    },

    init: function () {
      var page = document.body.dataset.page;
      var role = StudNest.selectedRole || StudNest.auth.getRole();
      var user = StudNest.currentUser;
      var items = role === 'admin' ? staffNav() : studentNav();
      var homeHref = role === 'admin' ? 'dashboard.html' : 'dashboard.html';

      StudNest.layout.injectToast();

      var sidebarMount = document.getElementById('sidebar');
      if (sidebarMount) {
        sidebarMount.classList.toggle('sidebar-admin', role === 'admin');
      }
      if (sidebarMount && !sidebarMount.querySelector('.side-nav')) {
        var navHtml = items.map(function (item) {
          var active = item.page === page ? ' active' : '';
          var count = item.countId ? '<span class="nav-count" id="' + item.countId + '">0</span>' : '';
          return '<a href="' + item.href + '" class="nav-link' + active + '" data-nav-page="' + item.page + '"><i class="bi ' + item.icon + '"></i><span>' + item.label + '</span>' + count + '</a>';
        }).join('');

        var student = role === 'student' && user ? StudNest.loadList(StudNest.KEYS.students, []).find(function (s) { return s.number === user.identifier; }) : null;
        var contextTitle = role === 'student' ? 'Current semester' : 'Staff login';
        var contextDetail = role === 'student' ? ('Semester ' + (student && student.currentSemester ? student.currentSemester : '4')) : 'Admin menu';

        sidebarMount.innerHTML =
          '<a class="brand brand-dark sidebar-brand" href="' + homeHref + '" aria-label="StudNest home">' +
          '<span class="brand-mark"><i class="bi bi-mortarboard-fill"></i></span><span>Stud<span class="brand-accent">Nest</span></span></a>' +
          '<div class="sidebar-label">Menu</div>' +
          '<nav class="side-nav" aria-label="Main navigation">' + navHtml + '</nav>' +
          '<div class="sidebar-bottom">' +
          '<div class="semester-card"><span class="semester-icon"><i class="bi bi-mortarboard"></i></span><div><small id="sidebarContextTitle">' + contextTitle + '</small><strong id="sidebarContextDetail">' + contextDetail + '</strong></div></div>' +
          '<div class="user-row">' + avatarMarkup('userAvatar') +
          '<div class="user-meta"><strong id="userName">' + StudNest.escapeHtml(user ? user.name : '') + '</strong>' +
          '<small id="userRoleLabel">' + StudNest.escapeHtml(user ? user.label : '') + '</small></div>' +
          '<button type="button" id="logoutButton" class="icon-button ms-auto" aria-label="Sign out" title="Sign out"><i class="bi bi-box-arrow-right"></i></button></div></div>';
      }

      var crumb = document.getElementById('pageCrumb');
      if (crumb) crumb.textContent = PAGE_TITLES[page] || 'StudNest';
      var today = document.getElementById('todayLabel');
      if (today) {
        today.textContent = new Date().toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      }

      var topAvatar = document.getElementById('topAvatar');
      if (topAvatar) {
        topAvatar.classList.add('avatar-photo');
        topAvatar.innerHTML = '<img src="' + StudNest.paths.asset('images/avatar.png') + '" alt="" width="36" height="36">';
      }

      var themeToggle = document.querySelector('[data-theme-toggle]');
      var topbarRight = document.querySelector('.topbar-right');
      if (!themeToggle && topbarRight) {
        topbarRight.insertAdjacentHTML('afterbegin', '<button type="button" class="theme-toggle" data-theme-toggle aria-pressed="false" title="Switch to dark mode"><i class="bi bi-moon-stars theme-icon-dark" aria-hidden="true"></i><i class="bi bi-sun theme-icon-light" aria-hidden="true"></i><span data-theme-label>Dark mode</span></button>');
        if (StudNest.theme) StudNest.theme.updateControls();
      }

      var logout = document.getElementById('logoutButton');
      if (logout && !logout.dataset.bound) {
        logout.dataset.bound = '1';
        logout.addEventListener('click', function () { StudNest.auth.logout(); });
      }

      var menuToggle = document.getElementById('menuToggle');
      if (menuToggle && !menuToggle.dataset.bound) {
        menuToggle.dataset.bound = '1';
        menuToggle.addEventListener('click', function () {
          var sidebar = $('#sidebar');
          if (!sidebar) return;
          if (sidebar.classList.contains('open')) {
            closeMobileMenu();
            return;
          }
          sidebar.classList.add('open');
          var overlay = document.createElement('div');
          overlay.className = 'menu-overlay';
          overlay.addEventListener('click', closeMobileMenu);
          document.body.appendChild(overlay);
        });
      }

      document.querySelectorAll('.side-nav a').forEach(function (link) {
        link.addEventListener('click', closeMobileMenu);
      });
    }
  };
}());
