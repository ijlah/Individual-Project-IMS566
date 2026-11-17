// auth.js - login, register and session check
(function () {
  'use strict';
  var StudNest = window.StudNest = window.StudNest || {};
  var seed = StudNest.seed;

  // pages for student and staff
  var STUDENT_PAGES = ['dashboard', 'assignments', 'timetable', 'progress'];
  var ADMIN_PAGES = ['admin-dashboard', 'subjects', 'students', 'sections', 'enrolments', 'announcements', 'submissions', 'reports', 'staff'];

  function $ (selector, root) { return (root || document).querySelector(selector); }

  // use ../ when page is inside student or staff folder
  function pathDepth() {
    var path = window.location.pathname || '';
    if (/\/(student|staff)(\/|$)/.test(path)) return '../';
    return '';
  }

  StudNest.paths = {
    root: function () { return pathDepth(); },
    login: function () { return pathDepth() + 'index.html'; },
    studentHome: function () { return pathDepth() + 'student/dashboard.html'; },
    staffHome: function () { return pathDepth() + 'staff/dashboard.html'; },
    asset: function (file) { return pathDepth() + 'assets/' + file; }
  };

  StudNest.auth = {
    getRole: function () { return sessionStorage.getItem('studNestRole') || 'student'; },
    isSignedIn: function () { return sessionStorage.getItem('studNestSignedIn') === 'true'; },
    getIdentifier: function () { return sessionStorage.getItem('studNestIdentifier') || ''; },

    // check login details with student or staff list
    resolveUser: function (role, identifier, password, isSession) {
      var students = StudNest.loadList(StudNest.KEYS.students, []);
      var staffMembers = StudNest.loadList(StudNest.KEYS.staff, []);
      var value = String(identifier || '').trim();
      if (role === 'student') {
        var student = students.find(function (item) {
          return String(item.number).trim().toLowerCase() === value.toLowerCase() && item.active !== false;
        });
        if (student) {
          var expected = student.password || seed.STUDENT_DEFAULT_PASSWORD;
          if (isSession || password === expected) {
            return { name: student.name, label: 'Student account', identifier: student.number };
          }
        }
      }
      if (role === 'admin') {
        var member = staffMembers.find(function (item) {
          return String(item.email || '').trim().toLowerCase() === value.toLowerCase();
        });
        if (member && (isSession || member.password === password)) {
          return { name: member.name, label: member.role || seed.STAFF_ACCOUNT.label, identifier: member.email };
        }
      }
      return null;
    },

    setSession: function (role, user) {
      sessionStorage.setItem('studNestSignedIn', 'true');
      sessionStorage.setItem('studNestRole', role);
      sessionStorage.setItem('studNestIdentifier', user.identifier);
    },

    clearSession: function () {
      sessionStorage.removeItem('studNestSignedIn');
      sessionStorage.removeItem('studNestRole');
      sessionStorage.removeItem('studNestIdentifier');
    },

    logout: function () {
      StudNest.auth.clearSession();
      window.location.href = StudNest.paths.login();
    },

    homeForRole: function (role) {
      return role === 'admin' ? StudNest.paths.staffHome() : StudNest.paths.studentHome();
    },

    // redirect if not signed in or wrong role
    requireAuth: function () {
      var page = document.body.dataset.page;
      if (!page || page === 'login') return true;

      if (!StudNest.auth.isSignedIn()) {
        window.location.href = StudNest.paths.login();
        return false;
      }

      var role = StudNest.auth.getRole();
      var isAdminPage = ADMIN_PAGES.indexOf(page) !== -1;
      var isStudentPage = STUDENT_PAGES.indexOf(page) !== -1;

      if (role === 'admin' && isStudentPage) {
        window.location.href = StudNest.paths.staffHome();
        return false;
      }
      if (role === 'student' && isAdminPage) {
        window.location.href = StudNest.paths.studentHome();
        return false;
      }

      var user = StudNest.auth.resolveUser(role, StudNest.auth.getIdentifier(), seed.STUDENT_DEFAULT_PASSWORD, true);
      if (!user) {
        StudNest.auth.clearSession();
        window.location.href = StudNest.paths.login();
        return false;
      }
      StudNest.currentUser = user;
      StudNest.selectedRole = role;
      document.body.dataset.role = role;
      return true;
    },

    initLoginPage: function () {
      if (StudNest.auth.isSignedIn()) {
        window.location.href = StudNest.auth.homeForRole(StudNest.auth.getRole());
        return;
      }

      var selectedRole = 'student';
      var loginAlert = $('#loginAlert');
      var registerAlert = $('#registerAlert');

      function setRoleChoice(role) {
        selectedRole = role;
        document.querySelectorAll('[data-role-choice]').forEach(function (button) {
          button.classList.toggle('active', button.dataset.roleChoice === role);
        });
        var isStudent = role === 'student';
        $('#loginIdentifierLabel').textContent = isStudent ? 'Matrix number' : 'Staff email';
        $('#loginIdentifier').placeholder = isStudent ? 'Enter your matrix number' : 'staff@studnest.edu.my';
        $('#loginIdentifier').inputMode = isStudent ? 'numeric' : 'email';
        $('#loginIdentifierIcon').className = isStudent ? 'bi bi-person-vcard' : 'bi bi-envelope';
        if (loginAlert) loginAlert.classList.add('d-none');
      }

      function loginError(message) {
        if (!loginAlert) return;
        loginAlert.textContent = message;
        loginAlert.classList.remove('d-none');
      }

      function registerError(message) {
        if (!registerAlert) return;
        registerAlert.textContent = message;
        registerAlert.classList.remove('d-none');
      }

      function applyDemoCredentials(kind) {
        if (kind === 'student') {
          setRoleChoice('student');
          $('#loginIdentifier').value = '2026123401';
          $('#loginPassword').value = 'student123';
          return { role: 'student', identifier: '2026123401', password: 'student123' };
        }
        setRoleChoice('admin');
        $('#loginIdentifier').value = seed.STAFF_ACCOUNT.email;
        $('#loginPassword').value = seed.STAFF_ACCOUNT.password;
        return { role: 'admin', identifier: seed.STAFF_ACCOUNT.email, password: seed.STAFF_ACCOUNT.password };
      }

      function completeLogin(role, identifier, password) {
        var user = StudNest.auth.resolveUser(role, identifier, password, false);
        if (!user) {
          loginError(role === 'student'
            ? 'Matrix number or password is incorrect. Check your details or register a new student account.'
            : 'Staff email or password does not match a registered account.');
          return;
        }
        StudNest.auth.setSession(role, user);
        window.location.href = StudNest.auth.homeForRole(role);
      }

      document.querySelectorAll('[data-role-choice]').forEach(function (button) {
        button.addEventListener('click', function () { setRoleChoice(button.dataset.roleChoice); });
      });

      document.querySelectorAll('[data-fill-login]').forEach(function (button) {
        button.addEventListener('click', function () {
          applyDemoCredentials(button.dataset.fillLogin);
        });
      });

      document.querySelectorAll('[data-quick-login]').forEach(function (button) {
        button.addEventListener('click', function () {
          var creds = applyDemoCredentials(button.dataset.quickLogin);
          completeLogin(creds.role, creds.identifier, creds.password);
        });
      });

      document.querySelectorAll('[data-auth-tab]').forEach(function (tab) {
        tab.addEventListener('click', function () {
          var target = tab.dataset.authTab;
          document.querySelectorAll('[data-auth-tab]').forEach(function (t) { t.classList.toggle('active', t === tab); });
          $('#loginPanel').classList.toggle('d-none', target !== 'login');
          $('#registerPanel').classList.toggle('d-none', target !== 'register');
        });
      });

      var loginForm = $('#loginForm');
      if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
          event.preventDefault();
          completeLogin(selectedRole, $('#loginIdentifier').value.trim(), $('#loginPassword').value);
        });
      }

      var registerForm = $('#registerForm');
      if (registerForm) {
        StudNest.populateProgrammeSelect($('#registerProgramme'), 'Choose programme');
        StudNest.populateSemesterSelect($('#registerSemester'));

        registerForm.addEventListener('submit', function (event) {
          event.preventDefault();
          var students = StudNest.loadList(StudNest.KEYS.students, []);
          var number = $('#registerNumber').value.trim();
          var password = $('#registerPassword').value;
          if (!/^\d{10}$/.test(number)) {
            registerError('Enter a valid 10-digit matrix number.');
            return;
          }
          if (password.length < 6) {
            registerError('Password must be at least 6 characters.');
            return;
          }
          if (students.some(function (s) { return s.number === number; })) {
            registerError('This matrix number is already registered.');
            return;
          }
          var programme = StudNest.findProgramme($('#registerProgramme').value);
          var semester = Number($('#registerSemester').value);
          if (!programme || !StudNest.semesterOptions.includes(semester)) {
            registerError('Choose a programme and semester.');
            return;
          }
          var record = {
            id: 'student-' + Date.now(),
            name: $('#registerName').value.trim(),
            email: $('#registerEmail').value.trim(),
            number: number,
            programme: programme.name,
            currentSemester: semester,
            admissionYear: Number(number.slice(0, 4)),
            password: password,
            active: true
          };
          students.push(record);
          StudNest.saveList(StudNest.KEYS.students, students);
          var state = StudNest.loadAppState();
          state.students = students;
          StudNest.refreshCatalogue(state);
          StudNest.saveList(StudNest.KEYS.students, state.students);
          StudNest.saveList(StudNest.KEYS.sections, state.sections);
          StudNest.saveList(StudNest.KEYS.enrolments, state.enrolments);
          StudNest.saveList(StudNest.KEYS.subjects, state.subjects);
          StudNest.auth.setSession('student', { name: record.name, label: 'Student account', identifier: record.number });
          window.location.href = StudNest.paths.studentHome();
        });
      }

      setRoleChoice('student');
    }
  };
}());
