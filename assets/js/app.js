// app.js - display pages, forms, charts and table pages
(function () {
  'use strict';
  var StudNest = window.StudNest;
  var seed = StudNest.seed;
  StudNest.initStorage();
  var KEYS = StudNest.KEYS;
  var programmeCurriculum = StudNest.programmeCurriculum;
  var programmeList = StudNest.programmeList;
  var semesterOptions = StudNest.semesterOptions;
  var ROLE_PERMISSIONS = seed.ROLE_PERMISSIONS;

  // current data in memory (save to localStorage when changed)
  var state = StudNest.loadAppState();
  var assignments = state.assignments;
  var subjects = state.subjects;
  var students = state.students;
  var sections = state.sections;
  var enrolments = state.enrolments;
  var announcements = state.announcements;
  var submissions = state.submissions;
  var staffMembers = state.staff;
  var auditEntries = state.audit;

  var activeFilter = 'all';
  var selectedRole = StudNest.selectedRole || 'student';
  var currentUser = StudNest.currentUser || null;
  var dashboardChart, progressChart, adminChart;
  var timetableWeekStart = startOfWeek(new Date());

  function startOfWeek(value) {
    var date = new Date(value);
    date.setHours(0, 0, 0, 0);
    var day = date.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return date;
  }
  function addDays(value, amount) {
    var date = new Date(value);
    date.setDate(date.getDate() + amount);
    return date;
  }
  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function formatDayLabel(date) {
    return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
  }
  function formatMonthLabel(date) {
    return date.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
  }
  function formatRangeLabel(monday) {
    var friday = addDays(monday, 4);
    return monday.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) +
      ' – ' + friday.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const $ = function (selector, root) { return (root || document).querySelector(selector); };
  const $$ = function (selector, root) { return Array.from((root || document).querySelectorAll(selector)); };
  function setHtml(selector, html) { var node = $(selector); if (node) node.innerHTML = html; }
  function setText(selector, text) { var node = $(selector); if (node) node.textContent = text; }

  // current page number for each table
  var tablePagerState = {};
  var TABLE_PAGE_SIZE = 8;

  // badge count for open assignments
  function updateNavDueCount() {
    var el = document.getElementById('navDueCount');
    if (!el) return;
    if (selectedRole !== 'student' || !currentUser) {
      el.textContent = '0';
      return;
    }
    var student = students.find(function (item) { return item.number === currentUser.identifier; });
    var open = getStudentAssignments(student).filter(function (item) { return !item.done; }).length;
    el.textContent = String(open);
  }

  // show table rows by page
  function renderPagedRows(tbodyId, rowHtmlList, pageSize, resetPage) {
    var tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    pageSize = pageSize || TABLE_PAGE_SIZE;
    if (!tablePagerState[tbodyId]) tablePagerState[tbodyId] = { page: 1 };
    var state = tablePagerState[tbodyId];
    if (resetPage) state.page = 1;
    state.rows = (rowHtmlList || []).filter(function (row) { return !!row; });
    state.pageSize = pageSize;
    var total = state.rows.length;
    var pages = Math.max(1, Math.ceil(total / pageSize) || 1);
    if (state.page > pages) state.page = pages;
    if (state.page < 1) state.page = 1;
    var start = (state.page - 1) * pageSize;
    tbody.innerHTML = state.rows.slice(start, start + pageSize).join('');
    renderPagerControls(tbodyId, total, pages, state.page, pageSize);
  }

  function renderPagerControls(tbodyId, total, pages, page, pageSize) {
    var pagerId = tbodyId + 'Pager';
    var pager = document.getElementById(pagerId);
    if (!pager) {
      var tbody = document.getElementById(tbodyId);
      if (!tbody) return;
      var host = tbody.closest('.table-responsive') || tbody.parentNode;
      pager = document.createElement('div');
      pager.id = pagerId;
      pager.className = 'table-pager';
      if (host.parentNode) host.parentNode.insertBefore(pager, host.nextSibling);
      else host.appendChild(pager);
    }
    if (!total) {
      pager.innerHTML = '';
      pager.classList.add('d-none');
      return;
    }
    pager.classList.remove('d-none');
    var from = ((page - 1) * pageSize) + 1;
    var to = Math.min(page * pageSize, total);
    var buttons = '';
    buttons += '<button type="button" class="btn btn-light btn-sm" data-pager-table="' + tbodyId + '" data-pager-action="prev"' + (page <= 1 ? ' disabled' : '') + '><i class="bi bi-chevron-left"></i></button>';
    var startPage = Math.max(1, page - 2);
    var endPage = Math.min(pages, startPage + 4);
    startPage = Math.max(1, endPage - 4);
    for (var p = startPage; p <= endPage; p++) {
      buttons += '<button type="button" class="btn btn-sm ' + (p === page ? 'btn-primary' : 'btn-light') + '" data-pager-table="' + tbodyId + '" data-pager-action="goto" data-pager-page="' + p + '">' + p + '</button>';
    }
    buttons += '<button type="button" class="btn btn-light btn-sm" data-pager-table="' + tbodyId + '" data-pager-action="next"' + (page >= pages ? ' disabled' : '') + '><i class="bi bi-chevron-right"></i></button>';
    pager.innerHTML = '<span class="table-pager-info">Showing ' + from + '–' + to + ' of ' + total + '</span><div class="table-pager-actions">' + buttons + '</div>';
  }
  function hideModal(id) {
    var node = document.getElementById(id);
    if (!node || !window.bootstrap) return;
    bootstrap.Modal.getOrCreateInstance(node).hide();
  }
  function refreshCurrentPage() {
    runPage(document.body.dataset.page || '');
  }

  function saveList(key, list) {
    if (key === KEYS.assignments) assignments = list;
    if (key === KEYS.subjects) subjects = list;
    if (key === KEYS.students) students = list;
    if (key === KEYS.sections) sections = list;
    if (key === KEYS.enrolments) enrolments = list;
    if (key === KEYS.announcements) announcements = list;
    if (key === KEYS.submissions) submissions = list;
    if (key === KEYS.staff) staffMembers = list;
    if (key === KEYS.audit) auditEntries = list;
    return StudNest.saveList(key, list);
  }
  function loadList(key, fallback) { return StudNest.loadList(key, fallback); }
  function findProgramme(value) { return StudNest.findProgramme(value); }
  function semesterPlanFor(a, b) { return StudNest.semesterPlanFor(a, b); }
  function populateProgrammeSelect(select, label) { StudNest.populateProgrammeSelect(select, label); }
  function populateSemesterSelect(select) { StudNest.populateSemesterSelect(select); }
  function escapeHtml(value) { return StudNest.escapeHtml(value); }

  function ensureCurrentStudentEnrolments(student) {
    var plan = semesterPlanFor(student.programme, student.currentSemester);
    if (!plan.ok) return plan;
    var added = [];
    var reactivated = false;
    plan.courses.forEach(function (course) {
      var section = sections.find(function (item) {
        return item.programmeCode === plan.programme.code && Number(item.semester) === plan.semester && item.code === course[0] && item.time;
      }) || sections.find(function (item) {
        return item.programmeCode === plan.programme.code && Number(item.semester) === plan.semester && item.code === course[0];
      });
      if (!section) {
        var timedTemplate = sections.find(function (item) { return item.code === course[0] && item.time; });
        var sectionId = 'SEC-' + plan.programme.code + '-' + course[0] + '-S' + plan.semester;
        section = {
          id: sectionId, code: course[0], programme: plan.programme.name, programmeCode: plan.programme.code,
          semester: plan.semester,
          instructor: timedTemplate ? timedTemplate.instructor : 'To be assigned',
          room: timedTemplate ? timedTemplate.room : 'To be scheduled',
          time: timedTemplate ? timedTemplate.time : ''
        };
        if (!sections.some(function (item) { return item.id === sectionId; })) sections.push(section);
      }
      var existing = enrolments.find(function (item) { return item.studentNumber === student.number && item.sectionId === section.id; });
      if (!existing) {
        added.push({ id: 'outline-' + student.id + '-' + course[0] + '-S' + plan.semester,
          studentNumber: student.number, sectionId: section.id, status: 'Active' });
      } else if (existing.status !== 'Active') {
        existing.status = 'Active';
        reactivated = true;
      }
    });
    if (added.length) enrolments = mergeById(enrolments, added);
    if (added.length || reactivated) {
      saveList(KEYS.sections, sections);
      saveList(KEYS.enrolments, enrolments);
    }
    return plan;
  }
  function resetStudentForm() {
    var form = $('#studentForm');
    if (!form) return;
    form.reset();
    if ($('#studentOriginalId')) $('#studentOriginalId').value = '';
    if ($('#studentModalLabel')) $('#studentModalLabel').textContent = 'Add a student';
    var btn = $('#studentForm button[type="submit"]');
    if (btn) btn.textContent = 'Add student';
    populateProgrammeSelect($('#studentProgramme'), 'Choose programme');
    populateSemesterSelect($('#studentSemester'));
  }
  function replaceCurriculumSubject(oldCode, newCode, newName) {
    Object.keys(programmeCurriculum).forEach(function (programmeCode) {
      Object.keys(programmeCurriculum[programmeCode].semesters).forEach(function (semester) {
        programmeCurriculum[programmeCode].semesters[semester] = programmeCurriculum[programmeCode].semesters[semester].map(function (course) {
          return course[0] === oldCode ? [newCode, newName] : course;
        });
      });
    });
  }
  function mergeById(existing, incoming) {
    var merged = existing.slice();
    var knownIds = new Set(merged.map(function (item) { return item.id; }));
    incoming.forEach(function (item) { if (!knownIds.has(item.id)) { merged.push(item); knownIds.add(item.id); } });
    return merged;
  }

  const CHART = { score: '#2C5F7C', target: '#D9D5CB', text: '#5B6670', grid: '#ECE9E1', tooltip: '#1F2933', font: 'IBM Plex Sans' };

  function studentSubjectPlan(student) {
    if (!student) return { ok: false, message: 'Student information is unavailable.', courses: [], subjects: [] };
    var plan = semesterPlanFor(student.programme, student.currentSemester);
    if (!plan.ok) return Object.assign({}, plan, { subjects: [] });
    var mapped = plan.courses.map(function (course) {
      return subjects.find(function (subject) { return subject.code === course[0]; }) || {
        code: course[0],
        name: course[1],
        completed: 0,
        total: 3,
        average: null
      };
    });
    mapped.forEach(function (subject) {
      if (!subjects.some(function (item) { return item.code === subject.code; })) {
        subjects.push(subject);
      }
    });
    return {
      ok: true,
      programme: plan.programme,
      semester: plan.semester,
      courses: plan.courses,
      subjects: mapped
    };
  }
  function labelForSubject(code) {
    const subject = subjects.find(function (item) { return item.code === code; });
    return subject ? subject.code + ' - ' + subject.name : code;
  }
  function programmeSemesterLabelsForSubject(code) {
    const offerings = [];
    programmeList.forEach(function (programme) {
      Object.keys(programmeCurriculum[programme.code].semesters).forEach(function (semester) {
        if (!semesterPlanFor(programme.code, semester).ok) return;
        if (programmeCurriculum[programme.code].semesters[semester].some(function (course) { return course[0] === code; })) {
          offerings.push(programme.name + ' · S' + semester);
        }
      });
    });
    return offerings;
  }
  function dateAtMidnight(value) { return new Date(value + 'T00:00:00'); }
  function prettyDate(value) { return dateAtMidnight(value).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }); }

  function statusFor(item) {
    if (item.done) return { label: 'Completed', className: 'status-done' };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = Math.round((dateAtMidnight(item.due) - today) / 86400000);
    if (days < 0) return { label: 'Overdue', className: 'status-overdue' };
    if (days <= 3) return { label: 'Due soon', className: 'status-progress' };
    return { label: 'In progress', className: 'status-upcoming' };
  }
  function activeSectionsForStudent() {
    if (!currentUser || selectedRole !== 'student') return [];
    const student = students.find(function (item) { return item.number === currentUser.identifier; });
    const plan = studentSubjectPlan(student);
    if (!plan.ok) return [];
    const allowedCourseCodes = new Set(plan.courses.map(function (course) { return course[0]; }));
    const activeSectionIds = new Set(enrolments.filter(function (item) {
      return item.studentNumber === currentUser.identifier && item.status === 'Active';
    }).map(function (item) { return item.sectionId; }));
    return sections.filter(function (section) {
      return allowedCourseCodes.has(section.code) && activeSectionIds.has(section.id) &&
        section.programmeCode === plan.programme.code && Number(section.semester) === plan.semester && !section.archived;
    });
  }
  function getCurrentStudentSubjects() {
    if (!currentUser || selectedRole !== 'student') return subjects;
    const student = students.find(function (item) { return item.number === currentUser.identifier; });
    return studentSubjectPlan(student).subjects;
  }
  function getStudentAssignments(student) {
    if (!student) return [];
    const plan = studentSubjectPlan(student);
    if (!plan.ok) return [];
    const courseCodes = new Set(plan.courses.map(function (course) { return course[0]; }));
    return assignments.filter(function (item) { return courseCodes.has(item.course); });
  }
  function sectionScheduleInfo(section) {
    const match = String(section.time || '').match(/^\s*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*,\s*(.+)$/i);
    if (!match) return null;
    const day = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].indexOf(match[1].toLowerCase());
    const times = match[2].match(/\d{1,2}(?::\d{2})?\s*(?:AM|PM)?/gi) || [];
    if (day < 0 || !times.length) return null;
    const endPeriod = /\b(AM|PM)\b/i.exec(times[1] || '')?.[1]?.toUpperCase();
    const start = times[0].match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
    if (!start) return null;
    let hour = Number(start[1]); const minute = Number(start[2] || 0); const period = (start[3] || endPeriod || '').toUpperCase();
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    const slots = [8,10,13,14,15]; const minutes = hour * 60 + minute;
    const slot = slots.reduce(function (best,value,index) { return Math.abs(value*60-minutes) < Math.abs(slots[best]*60-minutes) ? index : best; },0);
    return { day: day, slot: slot, startMinutes: minutes };
  }
  function formatSectionStart(section) {
    const match = String(section.time || '').match(/,\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
    if (!match) return '';
    const hour = Number(match[1]) % 12 || 12;
    const periods = String(section.time || '').match(/\b(AM|PM)\b/gi) || [];
    const period = (match[3] || periods[periods.length - 1] || '').toUpperCase();
    return hour + (match[2] ? ':' + match[2] : '') + (period ? ' ' + period : '');
  }
  function renderDashboardClasses() {
    const today = new Date().getDay();
    const student = currentUser && students.find(function (item) { return item.number === currentUser.identifier; });
    const plan = studentSubjectPlan(student);
    const list = activeSectionsForStudent().map(function (section) { return { section: section, schedule: sectionScheduleInfo(section) }; })
      .filter(function (item) { return item.schedule && item.schedule.day === today; }).sort(function (a,b) { return a.schedule.startMinutes-b.schedule.startMinutes; });
    if ($('#statClassesToday')) $('#statClassesToday').textContent = list.length;
    const now = new Date(); const next = list.find(function (item) { return item.schedule.startMinutes > now.getHours()*60+now.getMinutes(); });
    if ($('#statNextClass')) $('#statNextClass').textContent = next ? 'Next class at ' + formatSectionStart(next.section) : (list.length ? 'No more classes today' : 'No classes scheduled today');
    if ($('#dashboardClassNote')) $('#dashboardClassNote').textContent = !plan.ok ? plan.message : list.length ? 'Active sections today' : 'No classes today';
    if ($('#dashboardClasses')) {
      $('#dashboardClasses').innerHTML = list.map(function (item) {
        const s = item.section;
        const name = labelForSubject(s.code).replace(s.code + ' - ', '');
        return '<a class="class-item class-item-link" href="timetable.html"><div class="class-time">' + escapeHtml(formatSectionStart(s)) + '</div><div class="class-info"><strong>' + escapeHtml(s.code + ' - ' + name) + '</strong><span>' + escapeHtml(s.room + ' · ' + s.instructor) + '</span></div></a>';
      }).join('') || '<div class="empty-state py-3"><span>' + escapeHtml(plan.ok ? 'No classes scheduled for today.' : plan.message) + '</span></div>';
    }
  }
  function priorityClass(priority) { return 'priority-' + String(priority).toLowerCase(); }
  function showToast(message) {
    if (StudNest.layout) StudNest.layout.showToast(message);
  }
  function renderSubjectOptions() {
    const select = $('#newCourse');
    if (!select) return;
    var list = subjects.slice();
    if (selectedRole === 'student' && currentUser) {
      var student = students.find(function (item) { return item.number === currentUser.identifier; });
      var plan = studentSubjectPlan(student);
      if (plan.ok && plan.subjects && plan.subjects.length) {
        list = plan.subjects.filter(Boolean);
      } else if (plan.courses && plan.courses.length) {
        list = plan.courses.map(function (course) {
          return { code: course[0], name: course[1] };
        });
      }
    }
    select.innerHTML = '<option value="">Choose a subject</option>' + list.map(function (subject) {
      return '<option value="' + escapeHtml(subject.code) + '">' + escapeHtml(subject.code + ' - ' + subject.name) + '</option>';
    }).join('');
  }
  function renderDashboard() {
    if (!document.getElementById('statOpen')) return;
    renderSubjectOptions();
    const greetEl = $('#studentGreeting');
    if (greetEl && currentUser) {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
      greetEl.textContent = greeting + ', ' + currentUser.name;
    }
    const student = currentUser && students.find(function (item) { return item.number === currentUser.identifier; });
    const studentAssignments = getStudentAssignments(student);
    const open = studentAssignments.filter(function (item) { return !item.done; });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const soon = open.filter(function (item) { const days = (dateAtMidnight(item.due) - today) / 86400000; return days >= 0 && days <= 7; });
    if ($('#statOpen')) $('#statOpen').textContent = open.length;
    if ($('#statDueSoon')) $('#statDueSoon').textContent = soon.length + ' due this week';
    if ($('#statDone')) $('#statDone').textContent = studentAssignments.filter(function (item) { return item.done; }).length;
    const subjectPlan = studentSubjectPlan(student);
    if ($('#statSubjects')) $('#statSubjects').textContent = subjectPlan.ok ? subjectPlan.subjects.length : '—';
    renderDashboardClasses();
    const sorted = studentAssignments.slice().sort(function (a, b) { return a.due.localeCompare(b.due); });
    renderPagedRows('dashboardAssignments', sorted.map(function (item) {
      const status = statusFor(item);
      return '<tr><td><div class="task-name"><button type="button" class="task-check ' + (item.done ? 'checked' : '') + '" data-toggle-task="' + escapeHtml(item.id) + '" aria-label="Toggle ' + escapeHtml(item.title) + '">' + (item.done ? '<i class="bi bi-check2"></i>' : '') + '</button><div><a class="task-title" href="assignments.html">' + escapeHtml(item.title) + '</a></div></div></td><td><span class="course-label">' + escapeHtml(labelForSubject(item.course)) + '</span></td><td><span class="date-cell">' + prettyDate(item.due) + '</span></td><td><span class="status-pill ' + status.className + '">' + status.label + '</span></td><td><a class="row-action" href="assignments.html" aria-label="Open assignments"><i class="bi bi-arrow-right"></i></a></td></tr>';
    }), 5, true);
    renderChart('dashboardChart', 'dashboard');
    renderStudentAnnouncements();
  }
  function renderAssignments() {
    if (!document.getElementById('assignmentsTable')) return;
    renderSubjectOptions();
    const query = ($('#assignmentSearch').value || '').toLowerCase().trim();
    const student = currentUser && students.find(function (item) { return item.number === currentUser.identifier; });
    const studentAssignments = getStudentAssignments(student);
    let shown = studentAssignments.slice().sort(function (a, b) { return a.due.localeCompare(b.due); });
    if (activeFilter === 'open') shown = shown.filter(function (item) { return !item.done; });
    if (activeFilter === 'done') shown = shown.filter(function (item) { return item.done; });
    if (query) shown = shown.filter(function (item) { return (item.title + ' ' + labelForSubject(item.course)).toLowerCase().includes(query); });
    renderPagedRows('assignmentsTable', shown.map(function (item) {
      const status = statusFor(item);
      return '<tr><td><div class="task-name"><button type="button" class="task-check ' + (item.done ? 'checked' : '') + '" data-toggle-task="' + escapeHtml(item.id) + '" aria-label="Toggle ' + escapeHtml(item.title) + '">' + (item.done ? '<i class="bi bi-check2"></i>' : '') + '</button><div><div class="task-title">' + escapeHtml(item.title) + '</div></div></div></td><td><span class="course-label">' + escapeHtml(labelForSubject(item.course)) + '</span></td><td><span class="priority-pill ' + priorityClass(item.priority) + '">' + escapeHtml(item.priority) + '</span></td><td><span class="date-cell">' + prettyDate(item.due) + '</span></td><td><span class="status-pill ' + status.className + '">' + status.label + '</span></td><td><button type="button" class="row-action" data-delete-task="' + escapeHtml(item.id) + '" aria-label="Delete ' + escapeHtml(item.title) + '"><i class="bi bi-trash3"></i></button></td></tr>';
    }), TABLE_PAGE_SIZE, true);
    $('#assignmentEmpty').classList.toggle('d-none', shown.length > 0);
    const assignmentPlan = studentSubjectPlan(student);
    if (!assignmentPlan.ok) $('#assignmentEmpty').querySelector('span').textContent = assignmentPlan.message;
    else $('#assignmentEmpty').querySelector('span').textContent = 'Try another search or add an assignment for one of your current subjects.';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const done = studentAssignments.filter(function (item) { return item.done; }).length;
    const upcoming = studentAssignments.filter(function (item) { return !item.done && dateAtMidnight(item.due) >= today; }).length;
    const overdue = studentAssignments.filter(function (item) { return !item.done && dateAtMidnight(item.due) < today; }).length;
    if ($('#assignmentSummary')) {
      $('#assignmentSummary').innerHTML =
        '<button type="button" class="summary-card" data-filter="open"><span class="stat-icon lilac"><i class="bi bi-hourglass-split"></i></span><div><strong>' + upcoming + '</strong><span>In progress</span></div></button>' +
        '<button type="button" class="summary-card" data-filter="done"><span class="stat-icon mint"><i class="bi bi-check2-circle"></i></span><div><strong>' + done + '</strong><span>Completed</span></div></button>' +
        '<button type="button" class="summary-card" data-filter="open"><span class="stat-icon danger"><i class="bi bi-exclamation-circle"></i></span><div><strong>' + overdue + '</strong><span>Overdue</span></div></button>';
    }
  }
  function renderTimetable() {
    if (!$('#timetableBody')) return;
    if (!(timetableWeekStart instanceof Date) || isNaN(timetableWeekStart.getTime())) {
      timetableWeekStart = startOfWeek(new Date());
    }
    const slots = ['8:00 AM', '10:00 AM', '1:00 PM', '2:00 PM', '3:00 PM'];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const student = currentUser && students.find(function (item) { return item.number === currentUser.identifier; });
    const semester = student && student.currentSemester ? Number(student.currentSemester) : null;
    const plan = studentSubjectPlan(student);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    setText('#timetableSemesterLabel', semester ? ('Semester ' + semester) : 'Semester not set');
    setText('#timetableRangeLabel', formatRangeLabel(timetableWeekStart));
    setText('#timetableMonthLabel', formatMonthLabel(timetableWeekStart));

    const headCells = ['<th>Time</th>'].concat(dayNames.map(function (name, index) {
      const date = addDays(timetableWeekStart, index);
      const todayClass = sameDay(date, today) ? ' is-today' : '';
      return '<th class="' + todayClass.trim() + '">' + name + '<br><small>' + formatDayLabel(date) + '</small></th>';
    }));
    setHtml('#timetableHeadRow', headCells.join(''));

    const allMySections = activeSectionsForStudent();
    const scheduled = allMySections
      .map(function (section) { return { section: section, schedule: sectionScheduleInfo(section) }; })
      .filter(function (item) { return item.schedule; });

    setHtml('#timetableBody', slots.map(function (label, slot) {
      let row = '<tr><td class="time-col">' + label + '</td>';
      for (let day = 1; day <= 5; day++) {
        const date = addDays(timetableWeekStart, day - 1);
        const todayClass = sameDay(date, today) ? ' is-today' : '';
        const blocks = scheduled.filter(function (item) {
          return item.schedule.day === day && item.schedule.slot === slot;
        }).map(function (item) {
          const s = item.section;
          const name = labelForSubject(s.code).replace(s.code + ' - ', '');
          const lab = /lab|studio/i.test(s.room);
          return '<div class="class-block' + (lab ? ' lab' : '') + '"><strong>' + escapeHtml(s.code + ' - ' + name) + '</strong><span>' + escapeHtml(s.room + ' · ' + s.time) + '</span></div>';
        }).join('');
        row += '<td class="' + todayClass.trim() + '">' + (blocks || '<div class="class-block empty"></div>') + '</td>';
      }
      return row + '</tr>';
    }).join(''));

    const mySections = allMySections.slice().sort(function (a, b) {
      return String(a.time || '').localeCompare(String(b.time || ''));
    });
    renderPagedRows('mySectionsTable', mySections.map(function (section) {
      return '<tr><td><span class="course-label">' + escapeHtml(labelForSubject(section.code)) + '</span></td><td><span class="subject-code-chip">' + escapeHtml(section.id) + '</span></td><td><span class="course-label">' + escapeHtml(section.instructor) + '</span></td><td><span class="course-label">' + escapeHtml(section.room) + '</span></td><td><span class="course-label">' + escapeHtml(section.time || 'To be scheduled') + '</span></td></tr>';
    }), TABLE_PAGE_SIZE, true);
    if ($('#mySectionsEmpty')) {
      $('#mySectionsEmpty').classList.toggle('d-none', mySections.length > 0);
      if (!plan.ok) $('#mySectionsEmpty').querySelector('span').textContent = plan.message;
      else if (!mySections.length) $('#mySectionsEmpty').querySelector('span').textContent = 'No current class sections are available for this programme and semester.';
    }
  }
  // calculate progress from assignments and graded submissions
  function subjectProgressForStudent(student, subject) {
    if (!subject) return { code: '', name: '', completed: 0, total: 0, average: null, pct: 0 };
    var courseCode = subject.code;
    var myAssignments = student ? getStudentAssignments(student).filter(function (item) {
      return item.course === courseCode;
    }) : [];
    var mySubs = student ? submissions.filter(function (item) {
      return item.studentNumber === student.number && item.course === courseCode;
    }) : [];
    var graded = mySubs.filter(function (item) {
      return item.grade !== null && item.grade !== '' && Number.isFinite(Number(item.grade));
    });
    var total = myAssignments.length;
    var completed = myAssignments.filter(function (item) { return item.done; }).length;
    if (!total) {
      total = mySubs.length;
      completed = graded.length;
    }
    var average = graded.length
      ? Math.round(graded.reduce(function (sum, item) { return sum + Number(item.grade); }, 0) / graded.length)
      : null;
    var completionPct = total ? Math.round((completed / total) * 100) : 0;
    return {
      code: subject.code,
      name: subject.name,
      completed: completed,
      total: total,
      average: average,
      pct: average != null ? average : completionPct
    };
  }
  function recomputeSubjectStatsFromSubmissions(courseCode) {
    var subject = subjects.find(function (item) { return item.code === courseCode; });
    if (!subject) return;
    var courseAssign = assignments.filter(function (item) { return item.course === courseCode; });
    var graded = submissions.filter(function (item) {
      return item.course === courseCode && item.grade !== null && item.grade !== '' && Number.isFinite(Number(item.grade));
    });
    subject.total = courseAssign.length || submissions.filter(function (item) { return item.course === courseCode; }).length;
    subject.completed = courseAssign.length
      ? courseAssign.filter(function (item) { return item.done; }).length
      : graded.length;
    subject.average = graded.length
      ? Math.round(graded.reduce(function (sum, item) { return sum + Number(item.grade); }, 0) / graded.length)
      : null;
  }
  function recomputeAllSubjectStats() {
    subjects.forEach(function (subject) { recomputeSubjectStatsFromSubmissions(subject.code); });
    saveList(KEYS.subjects, subjects);
  }
  function renderProgress() {
    if (!$('#progressTable')) return;
    const student = currentUser && students.find(function (item) { return item.number === currentUser.identifier; });
    const plan = studentSubjectPlan(student);
    const visibleSubjects = (plan.subjects || []).map(function (subject) {
      return subjectProgressForStudent(student, subject);
    });
    const semester = student && student.currentSemester ? Number(student.currentSemester) : null;
    const semesterLabel = semester ? 'Semester ' + semester : 'Semester not set';
    setText('#progressSemesterLabel', semesterLabel);
    setText('#progressChartPeriod', semesterLabel);
    const totalAssessments = visibleSubjects.reduce(function (sum, subject) { return sum + Number(subject.total || 0); }, 0);
    const completedAssessments = visibleSubjects.reduce(function (sum, subject) { return sum + Number(subject.completed || 0); }, 0);
    const gradedSubjects = visibleSubjects.filter(function (subject) { return subject.average !== null && Number.isFinite(Number(subject.average)); });
    const averageScore = gradedSubjects.length ? Math.round(gradedSubjects.reduce(function (sum, subject) { return sum + Number(subject.average); }, 0) / gradedSubjects.length) : null;
    setText('#progressSubjectCount', visibleSubjects.length);
    if ($('#progressAssessmentCount')) $('#progressAssessmentCount').innerHTML = completedAssessments + ' <em>/ ' + totalAssessments + '</em>';
    if ($('#progressAverage')) $('#progressAverage').innerHTML = averageScore == null ? '—' : averageScore + '<em>%</em>';
    var score = averageScore == null ? 0 : averageScore;
    if ($('#goalRingValue')) $('#goalRingValue').textContent = averageScore == null ? '—' : score + '%';
    if ($('#goalRingLabel')) $('#goalRingLabel').textContent = averageScore == null ? 'no grades yet' : (score >= 80 ? 'on target' : 'current average');
    if ($('#goalTrackFill')) $('#goalTrackFill').style.width = Math.max(0, Math.min(100, score)) + '%';
    if ($('.goal-ring')) $('.goal-ring').style.background = 'conic-gradient(var(--accent) 0 ' + Math.max(0, Math.min(100, score)) + '%, #ECE9E1 0 100%)';
    renderPagedRows('progressTable', visibleSubjects.map(function (subject) {
      const average = subject.average == null ? '—' : subject.average + '%';
      return '<tr><td><div class="task-title">' + escapeHtml(subject.code + ' - ' + subject.name) + '</div></td><td><span class="course-label">' + subject.total + '</span></td><td><span class="course-label">' + subject.completed + ' / ' + subject.total + '</span></td><td><strong class="task-title">' + average + '</strong></td><td><div class="d-flex align-items-center"><div class="course-progress"><div style="width:' + subject.pct + '%"></div></div><span class="course-percent">' + subject.pct + '%</span></div></td></tr>';
    }), TABLE_PAGE_SIZE, true);
    if ($('#progressEmpty')) {
      $('#progressEmpty').classList.toggle('d-none', visibleSubjects.length > 0);
      if (!plan.ok) $('#progressEmpty').querySelector('span').textContent = plan.message;
      else if (!visibleSubjects.length) $('#progressEmpty').querySelector('span').textContent = 'No subjects listed for this semester.';
    }
    renderChart('progressChart', 'progress', visibleSubjects);
  }
  function renderChart(id, type, progressRows) {
    if (!window.Chart) return;
    const canvas = document.getElementById(id); if (!canvas) return;
    const thickness = type === 'progress' ? 22 : 18;
    var visibleSubjects;
    if (type === 'progress' && progressRows) {
      visibleSubjects = progressRows;
    } else if (selectedRole === 'student') {
      var student = currentUser && students.find(function (item) { return item.number === currentUser.identifier; });
      visibleSubjects = getCurrentStudentSubjects().map(function (subject) {
        return subjectProgressForStudent(student, subject);
      });
    } else {
      visibleSubjects = subjects;
    }
    const chartData = { labels: visibleSubjects.map(function (subject) { return subject.code; }), datasets: [
      { label: 'Current score', data: visibleSubjects.map(function (subject) { return subject.average == null ? 0 : subject.average; }), backgroundColor: CHART.score, borderColor: CHART.score, borderRadius: 3, barThickness: thickness },
      { label: 'Target score', data: visibleSubjects.map(function () { return 80; }), backgroundColor: CHART.target, borderColor: CHART.target, borderRadius: 3, barThickness: thickness }
    ] };
    const options = {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: CHART.tooltip, padding: 10, titleFont: { family: CHART.font }, bodyFont: { family: CHART.font }, callbacks: { label: function (context) { return ' ' + context.dataset.label + ': ' + context.raw + '%'; } } }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { color: CHART.text, font: { family: CHART.font, size: 11 } } },
        y: { min: 0, max: 100, ticks: { stepSize: 20, color: CHART.text, font: { family: CHART.font, size: 11 }, callback: function (value) { return value + '%'; } }, grid: { color: CHART.grid, drawTicks: false }, border: { display: false } }
      }
    };
    if (id === 'dashboardChart' && dashboardChart) dashboardChart.destroy();
    if (id === 'progressChart' && progressChart) progressChart.destroy();
    if (id === 'adminChart' && adminChart) adminChart.destroy();
    const chart = new Chart(canvas, { type: 'bar', data: chartData, options: options });
    if (id === 'dashboardChart') dashboardChart = chart;
    else if (id === 'progressChart') progressChart = chart;
    else adminChart = chart;
  }
  function renderAdminDashboard() {
    if (!document.getElementById('adminSubjectCount')) return;
    recomputeAllSubjectStats();
    const adminGreet = $('#adminGreeting');
    if (adminGreet && currentUser) adminGreet.textContent = 'Welcome, ' + currentUser.name;
    $('#adminSubjectCount').textContent = subjects.length;
    $('#adminStudentCount').textContent = students.length;
    $('#adminAssignmentCount').textContent = assignments.length;
    const gradedSubjects = subjects.filter(function (subject) { return subject.average !== null && subject.average !== undefined && Number.isFinite(Number(subject.average)); });
    const average = gradedSubjects.length ? Math.round(gradedSubjects.reduce(function (sum, subject) { return sum + Number(subject.average); }, 0) / gradedSubjects.length) : 0;
    if ($('#adminAverageValue')) $('#adminAverageValue').innerHTML = average + '<span class="stat-unit">%</span>';
    if ($('#adminSubjectPreview')) {
      $('#adminSubjectPreview').innerHTML = subjects.slice(0, 5).map(function (subject) {
        return '<a class="admin-preview-row" href="subjects.html"><span class="subject-code-chip">' + escapeHtml(subject.code) + '</span><span>' + escapeHtml(subject.name) + '</span></a>';
      }).join('') || '<div class="empty-state"><strong>No subjects added</strong></div>';
    }
    renderPagedRows('programmeSummaryTable', programmeList.map(function (programme) {
      const members = students.filter(function (student) {
        var studentProg = findProgramme(student.programme);
        return studentProg && studentProg.code === programme.code;
      });
      const bySemester = semesterOptions.map(function (semester) {
        const count = members.filter(function (student) { return Number(student.currentSemester) === semester; }).length;
        return count ? 'S' + semester + ': ' + count : '';
      }).filter(Boolean).join(' · ') || 'No confirmed semesters';
      return '<tr><td><strong class="task-title">' + escapeHtml(programme.name) + '</strong></td><td>' + members.length + '</td><td>' + escapeHtml(bySemester) + '</td></tr>';
    }), TABLE_PAGE_SIZE, true);
    renderChart('adminChart', 'admin');
  }
  function renderSubjects() {
    if (!$('#subjectsTable')) return;
    renderPagedRows('subjectsTable', subjects.map(function (subject) {
      const usage = assignments.filter(function (item) { return item.course === subject.code; }).length;
      const offerings = programmeSemesterLabelsForSubject(subject.code);
      return '<tr><td><span class="subject-code-chip">' + escapeHtml(subject.code) + '</span></td><td><strong class="task-title">' + escapeHtml(subject.name) + '</strong></td><td><span class="course-label">' + (offerings.length ? escapeHtml(offerings.join('; ')) : 'Catalogue only') + '</span></td><td><span class="course-label">' + usage + ' assignments</span></td><td class="text-end"><button class="row-action me-2" data-edit-subject="' + escapeHtml(subject.code) + '" aria-label="Edit ' + escapeHtml(subject.code) + '"><i class="bi bi-pencil-square"></i></button><button class="row-action" data-delete-subject="' + escapeHtml(subject.code) + '" aria-label="Delete ' + escapeHtml(subject.code) + '"><i class="bi bi-trash3"></i></button></td></tr>';
    }), TABLE_PAGE_SIZE, true);
    if ($('#subjectEmpty')) $('#subjectEmpty').classList.toggle('d-none', subjects.length > 0);
    setText('#subjectCountLabel', subjects.length + (subjects.length === 1 ? ' subject' : ' subjects'));
  }
  function renderStudents() {
    if (!$('#studentsTable')) return;
    const query = (($('#studentSearch') && $('#studentSearch').value) || '').toLowerCase().trim();
    const programmeFilter = ($('#studentProgrammeFilter') && $('#studentProgrammeFilter').value) || '';
    const semesterFilter = ($('#studentSemesterFilter') && $('#studentSemesterFilter').value) || '';
    const shown = students.filter(function (student) {
      const matchesQuery = (student.name + ' ' + student.email + ' ' + student.number + ' ' + student.programme).toLowerCase().includes(query);
      return matchesQuery && (!programmeFilter || student.programme === programmeFilter) && (!semesterFilter || String(student.currentSemester || '') === semesterFilter);
    });
    var avatarSrc = StudNest.paths.asset('images/avatar.png');
    renderPagedRows('studentsTable', shown.map(function (student) {
      const active = student.active !== false;
      const reviewBadge = student.matrixNumberReview
        ? '<span class="status-pill status-progress ms-1" title="Confirm semester and intake year">Review</span>' : '';
      return '<tr><td><div class="task-name"><span class="avatar student-row-avatar avatar-photo"><img src="' + escapeHtml(avatarSrc) + '" alt="" width="32" height="32"></span><div><div class="task-title">' + escapeHtml(student.name) + '</div><div class="task-subtitle">' + escapeHtml(student.email) + '</div></div></div></td><td><span class="course-label">' + escapeHtml(student.number) + '</span> ' + reviewBadge + '</td><td><span class="course-label">' + escapeHtml(student.programme) + '</span></td><td><span class="course-label">Semester ' + escapeHtml(String(student.currentSemester || 'Unconfirmed')) + '</span></td><td><span class="status-pill ' + (active ? 'status-done' : 'status-progress') + '">' + (active ? 'Active' : 'Inactive') + '</span></td><td><button class="row-action me-2" data-edit-student="' + escapeHtml(student.id) + '" aria-label="Edit ' + escapeHtml(student.name) + '"><i class="bi bi-pencil-square"></i></button><button class="row-action" data-toggle-student="' + escapeHtml(student.id) + '" aria-label="' + (active ? 'Deactivate ' : 'Activate ') + escapeHtml(student.name) + '"><i class="bi ' + (active ? 'bi-person-dash' : 'bi-person-check') + '"></i></button></td></tr>';
    }), TABLE_PAGE_SIZE, true);
    if ($('#studentEmpty')) $('#studentEmpty').classList.toggle('d-none', shown.length > 0);
  }
  function subjectOptions(selectedValue, allowedCodes) {
    const allowed = allowedCodes ? new Set(allowedCodes) : null;
    return '<option value="">Choose subject</option>' + subjects.filter(function (subject) { return !allowed || allowed.has(subject.code); }).map(function (subject) {
      return '<option value="' + escapeHtml(subject.code) + '"' + (selectedValue === subject.code ? ' selected' : '') + '>' + escapeHtml(subject.code + ' - ' + subject.name) + '</option>';
    }).join('');
  }
  function updateEnrolmentOptions() {
    if (!$('#enrolStudent') || !$('#enrolSubject') || !$('#enrolSection')) return;
    const student = students.find(function (item) { return item.number === $('#enrolStudent').value; });
    const plan = studentSubjectPlan(student);
    const codes = plan.ok ? plan.courses.map(function (course) { return course[0]; }) : [];
    const sectionsForStudent = plan.ok ? sections.filter(function (section) {
      return !section.archived && section.programmeCode === plan.programme.code && Number(section.semester) === plan.semester && codes.includes(section.code);
    }) : [];
    setHtml('#enrolSubject', subjectOptions('', codes));
    setHtml('#enrolSection', '<option value="">Choose section</option>' + sectionsForStudent.map(function (section) {
      return '<option value="' + escapeHtml(section.id) + '">' + escapeHtml(section.id + ' - ' + labelForSubject(section.code)) + '</option>';
    }).join(''));
    setText('#enrolmentScopeNote', student ? (plan.ok ? student.programme + ', Semester ' + plan.semester + ': ' + codes.length + ' outline subjects.' : plan.message) : 'Choose a student to see the subjects in their current programme and semester.');
  }
  function fillManagementSelects() {
    if ($('#sectionSubject') && !$('#sectionProgramme')) setHtml('#sectionSubject', subjectOptions(''));
    if ($('#enrolStudent')) {
      setHtml('#enrolStudent', '<option value="">Choose student</option>' + students.filter(function (student) { return student.active !== false; }).map(function (student) {
        return '<option value="' + escapeHtml(student.number) + '">' + escapeHtml(student.number + ' - ' + student.name) + '</option>';
      }).join(''));
    }
    const sectionOptions = sections.filter(function (section) { return !section.archived; }).map(function (section) {
      return '<option value="' + escapeHtml(section.id) + '">' + escapeHtml(section.id + ' - ' + labelForSubject(section.code)) + '</option>';
    }).join('');
    if ($('#enrolSection')) setHtml('#enrolSection', '<option value="">Choose section</option>' + sectionOptions);
    if ($('#reportSection')) setHtml('#reportSection', '<option value="">All enrolled students</option>' + sectionOptions);
    if ($('#announcementTarget')) setHtml('#announcementTarget', '<option value="all">All classes</option>' + sectionOptions);
    updateEnrolmentOptions();
  }
  function renderSections() {
    if (!$('#sectionsTable')) return;
    fillManagementSelects();
    renderPagedRows('sectionsTable', sections.map(function (section) {
      return '<tr><td><span class="subject-code-chip">' + escapeHtml(section.id) + '</span>' + (section.archived ? '<span class="status-pill status-progress ms-1">Archived</span>' : '') + '</td><td><span class="course-label">' + escapeHtml(labelForSubject(section.code)) + '</span></td><td><span class="course-label">' + escapeHtml(section.programme || 'All programmes') + '</span></td><td><span class="course-label">' + (section.semester ? 'Semester ' + escapeHtml(String(section.semester)) : '—') + '</span></td><td><span class="course-label">' + escapeHtml(section.instructor) + '</span></td><td><span class="course-label">' + escapeHtml(section.room) + '</span></td><td><span class="course-label">' + escapeHtml(section.time || 'To be scheduled') + '</span></td><td class="text-end"><button class="row-action me-2" data-edit-section="' + escapeHtml(section.id) + '" aria-label="Edit section"><i class="bi bi-pencil-square"></i></button><button class="row-action" data-delete-section="' + escapeHtml(section.id) + '" aria-label="Archive section"><i class="bi bi-archive"></i></button></td></tr>';
    }), TABLE_PAGE_SIZE, true);
    if ($('#sectionEmpty')) $('#sectionEmpty').classList.toggle('d-none', sections.length > 0);
    setText('#sectionCountLabel', sections.length + ' teaching sections across the subject catalogue');
  }
  function renderEnrolments() {
    if (!$('#enrolmentsTable')) return;
    fillManagementSelects();
    const rows = enrolments.map(function (item) {
      const student = students.find(function (entry) { return entry.number === item.studentNumber; });
      const section = sections.find(function (entry) { return entry.id === item.sectionId; });
      if (!student || !section) return '';
      const statuses = ['Active', 'Waitlist', 'Withdrawn', 'Historical'];
      return '<tr><td><div class="task-title">' + escapeHtml(student.name) + '</div><div class="task-subtitle">' + escapeHtml(student.number) + '</div></td><td><span class="course-label">' + escapeHtml(labelForSubject(section.code)) + '</span></td><td><span class="subject-code-chip">' + escapeHtml(section.id) + '</span>' + (section.archived ? '<span class="status-pill status-progress ms-1">Archived section</span>' : '') + '</td><td><select class="form-select status-select" data-enrol-status="' + escapeHtml(item.id) + '">' + statuses.map(function (status) { return '<option' + (item.status === status ? ' selected' : '') + '>' + escapeHtml(status) + '</option>'; }).join('') + '</select></td><td><button class="row-action" data-delete-enrolment="' + escapeHtml(item.id) + '" aria-label="Mark enrolment withdrawn"><i class="bi bi-person-dash"></i></button></td></tr>';
    });
    renderPagedRows('enrolmentsTable', rows, TABLE_PAGE_SIZE, true);
    if ($('#enrolmentEmpty')) $('#enrolmentEmpty').classList.toggle('d-none', rows.some(Boolean));
    setText('#enrolmentCountLabel', enrolments.length + ' student registrations');
  }
  function renderAnnouncements() {
    if (!$('#announcementsTable')) return;
    fillManagementSelects();
    renderPagedRows('announcementsTable', announcements.slice().sort(function (a, b) { return b.publishedAt.localeCompare(a.publishedAt); }).map(function (item) {
      const target = item.target === 'all' ? 'All classes' : (sections.find(function (section) { return section.id === item.target; }) || { id: 'Former section' }).id;
      return '<tr><td><div class="task-title">' + escapeHtml(item.title) + '</div><div class="task-subtitle announcement-message">' + escapeHtml(item.body) + '</div></td><td><span class="status-pill ' + (item.type === 'Deadline reminder' ? 'status-progress' : 'status-upcoming') + '">' + escapeHtml(item.type) + '</span></td><td><span class="course-label">' + escapeHtml(target) + '</span></td><td><span class="date-cell">' + (item.deadline ? prettyDate(item.deadline) : '—') + '</span></td><td><span class="date-cell">' + prettyDate(item.publishedAt) + '</span></td><td><button class="row-action" data-delete-announcement="' + escapeHtml(item.id) + '" aria-label="Delete announcement"><i class="bi bi-trash3"></i></button></td></tr>';
    }), TABLE_PAGE_SIZE, true);
    if ($('#announcementEmpty')) $('#announcementEmpty').classList.toggle('d-none', announcements.length > 0);
  }
  function renderStudentAnnouncements() {
    const box = $('#studentAnnouncements');
    if (!box || !currentUser) return;
    if (!document.getElementById('studentAnnouncementPanel')) return;
    const mySections = activeSectionsForStudent().map(function (section) { return section.id; });
    const visible = announcements.filter(function (item) { return item.target === 'all' || mySections.includes(item.target); });
    box.innerHTML = visible.slice(0, 3).map(function (item) {
      return '<article class="student-notice"><span class="notice-mark ' + (item.type === 'Deadline reminder' ? 'notice-deadline' : '') + '"><i class="bi ' + (item.type === 'Deadline reminder' ? 'bi-alarm' : 'bi-megaphone') + '"></i></span><div><strong>' + escapeHtml(item.title) + '</strong><p>' + escapeHtml(item.body) + '</p>' + (item.deadline ? '<small>Due ' + prettyDate(item.deadline) + '</small>' : '') + '</div></article>';
    }).join('');
    $('#studentAnnouncementPanel').classList.toggle('d-none', visible.length === 0);
  }
  function renderSubmissions() {
    if (!$('#submissionsTable')) return;
    const filter = ($('#submissionFilter') && $('#submissionFilter').value) || 'all';
    const shown = submissions.filter(function (item) {
      return filter === 'all' || (filter === 'pending' ? item.grade === null || item.grade === '' : item.grade !== null && item.grade !== '');
    });
    renderPagedRows('submissionsTable', shown.map(function (item) {
      const student = students.find(function (entry) { return entry.number === item.studentNumber; }) || { name: 'Unknown student' };
      const graded = item.grade !== null && item.grade !== '';
      return '<tr><td><div class="task-title">' + escapeHtml(student.name) + '</div><div class="task-subtitle">' + escapeHtml(item.studentNumber) + '</div></td><td><span class="course-label">' + escapeHtml(item.assignment) + '</span></td><td><span class="course-label">' + escapeHtml(labelForSubject(item.course)) + '</span></td><td><span class="date-cell">' + prettyDate(item.submittedAt) + '</span></td><td><strong class="task-title">' + (graded ? escapeHtml(item.grade) + '%' : '—') + '</strong></td><td><span class="status-pill ' + (graded ? 'status-done' : 'status-progress') + '">' + (graded ? 'Graded' : 'Needs review') + '</span></td><td><button class="btn btn-sm btn-light" data-grade-submission="' + escapeHtml(item.id) + '">' + (graded ? 'Edit review' : 'Review') + '</button></td></tr>';
    }), TABLE_PAGE_SIZE, true);
    if ($('#submissionEmpty')) $('#submissionEmpty').classList.toggle('d-none', shown.length > 0);
  }
  function renderReports() {
    if (!$('#reportSection') && !$('#exportClassList')) return;
    fillManagementSelects();
  }
  function renderStaffAudit() {
    if (!$('#staffTable')) return;
    const roles = Object.keys(ROLE_PERMISSIONS);
    renderPagedRows('staffTable', staffMembers.map(function (member) {
      return '<tr><td><strong class="task-title">' + escapeHtml(member.name) + '</strong></td><td><span class="course-label">' + escapeHtml(member.email) + '</span></td><td><select class="form-select status-select" data-staff-role="' + escapeHtml(member.id) + '">' + roles.map(function (role) { return '<option' + (member.role === role ? ' selected' : '') + '>' + escapeHtml(role) + '</option>'; }).join('') + '</select></td><td><span class="course-label permission-summary">' + escapeHtml(ROLE_PERMISSIONS[member.role] || '') + '</span></td><td><button class="row-action" data-delete-staff="' + escapeHtml(member.id) + '" aria-label="Remove staff member"><i class="bi bi-person-dash"></i></button></td></tr>';
    }), TABLE_PAGE_SIZE, true);
    if ($('#staffEmpty')) $('#staffEmpty').classList.toggle('d-none', staffMembers.length > 0);
    renderPagedRows('auditTable', auditEntries.slice().reverse().map(function (item) {
      return '<tr><td><span class="date-cell">' + escapeHtml(new Date(item.when).toLocaleString()) + '</span></td><td><span class="status-pill status-upcoming">' + escapeHtml(item.action) + '</span></td><td><span class="subject-code-chip">' + escapeHtml(item.code) + '</span></td><td><span class="course-label">' + escapeHtml(item.detail || '') + '</span></td><td><span class="course-label">' + escapeHtml(item.by) + '</span></td></tr>';
    }), TABLE_PAGE_SIZE, true);
    if ($('#auditEmpty')) $('#auditEmpty').classList.toggle('d-none', auditEntries.length > 0);
  }
  function recordCatalogueChange(action, code, detail) {
    auditEntries.push({ id: 'audit-' + Date.now(), when: new Date().toISOString(), action: action, code: code, detail: detail || '', by: currentUser ? currentUser.name : 'Admin' });
    saveList(KEYS.audit, auditEntries);
  }
  function csvCell(value) { return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"'; }
  function downloadCsv(filename, rows) {
    const text = '\ufeff' + rows.map(function (row) { return row.map(csvCell).join(','); }).join('\r\n');
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function exportClassList() {
    const sectionId = $('#reportSection').value;
    let list = enrolments.filter(function (item) { return !sectionId || item.sectionId === sectionId; });
    const rows = [['Student name', 'Matrix number', 'Email', 'Programme', 'Subject', 'Section', 'Enrolment status', 'Student status']];
    list.forEach(function (item) {
      const student = students.find(function (entry) { return entry.number === item.studentNumber; });
      const section = sections.find(function (entry) { return entry.id === item.sectionId; });
      if (student && section) rows.push([student.name, student.number, student.email, student.programme, labelForSubject(section.code), section.id, item.status, student.active === false ? 'Inactive' : 'Active']);
    });
    downloadCsv('studnest-class-list.csv', rows);
  }
  function exportProgressSummary() {
    const rows = [['Student name', 'Matrix number', 'Subject code', 'Subject title', 'Enrolment status', 'Assessments completed', 'Assessments total', 'Sample average (%)']];
    enrolments.forEach(function (item) {
      const student = students.find(function (entry) { return entry.number === item.studentNumber; });
      const section = sections.find(function (entry) { return entry.id === item.sectionId; });
      const subject = section && subjects.find(function (entry) { return entry.code === section.code; });
      if (student && section && subject) rows.push([student.name, student.number, subject.code, subject.name, item.status, subject.completed, subject.total, subject.average]);
    });
    downloadCsv('studnest-progress-summary.csv', rows);
  }
  function exportStudentBackup() {
    let preExpansionBackup = null;
    try { preExpansionBackup = JSON.parse(localStorage.getItem('studNestPreExpansionBackupV1') || 'null'); } catch (error) { preExpansionBackup = null; }
    const backup = {
      app: 'StudNest',
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      data: {
        students: students,
        subjects: subjects,
        sections: sections,
        enrolments: enrolments,
        assignments: assignments,
        submissions: submissions,
        announcements: announcements,
        audit: auditEntries,
        curriculum: programmeCurriculum
      },
      preExpansionBackup: preExpansionBackup
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'studnest-student-data-backup.json';
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    showToast('Student data backup downloaded.');
  }
  function openModal(id) {
    var node = document.getElementById(id);
    if (!node || !window.bootstrap) return;
    window.setTimeout(function () {
      bootstrap.Modal.getOrCreateInstance(node).show();
    }, 0);
  }
  function resetSectionForm() {
    if (!$('#sectionForm')) return;
    $('#sectionForm').reset();
    if ($('#sectionOriginalId')) $('#sectionOriginalId').value = '';
    setText('#sectionModalLabel', 'Create section');
    populateProgrammeSelect($('#sectionProgramme'), 'Choose programme');
    populateSemesterSelect($('#sectionSemester'));
    updateSectionSubjectOptions();
  }
  function updateSectionSubjectOptions(selectedCode) {
    if (!$('#sectionSubject') || !$('#sectionProgramme') || !$('#sectionSemester')) return;
    const programme = findProgramme($('#sectionProgramme').value);
    const semester = Number($('#sectionSemester').value);
    const plan = programme ? semesterPlanFor(programme.code, semester) : { ok: false };
    const codes = plan.ok ? plan.courses.map(function (course) { return course[0]; }) : [];
    setHtml('#sectionSubject', subjectOptions(selectedCode || '', codes));
  }
  function resetSubjectForm() {
    if (!$('#subjectForm')) return;
    $('#subjectForm').reset();
    if ($('#subjectOriginalCode')) $('#subjectOriginalCode').value = '';
    setText('#subjectModalLabel', 'Add a subject');
    var btn = $('#subjectForm button[type="submit"]');
    if (btn) btn.textContent = 'Save subject';
  }

  document.addEventListener('submit', function (event) {
    if (event.target.id === 'sectionForm') {
      event.preventDefault();
      const original = $('#sectionOriginalId').value;
      const programme = findProgramme($('#sectionProgramme').value);
      const semester = Number($('#sectionSemester').value);
      const plan = programme && semesterPlanFor(programme.code, semester);
      const code = $('#sectionSubject').value;
      if (!programme || !plan || !plan.ok || !plan.courses.some(function (course) { return course[0] === code; })) {
        showToast('Choose a subject listed for the selected programme and semester.'); return;
      }
      const section = { id: original || 'SEC-' + programme.code + '-' + code + '-S' + semester + '-' + Date.now().toString().slice(-4),
        code: code, programme: programme.name, programmeCode: programme.code, semester: semester,
        instructor: $('#sectionInstructor').value.trim(), room: $('#sectionRoom').value.trim(), time: $('#sectionTime').value.trim() };
      if (original) sections = sections.map(function (item) { return item.id === original ? section : item; });
      else sections.push(section);
      saveList(KEYS.sections, sections);
      event.target.reset(); if ($('#sectionOriginalId')) $('#sectionOriginalId').value = '';
      hideModal('sectionModal');
      refreshCurrentPage();
      showToast(original ? 'Section updated.' : 'Section created.');
    }
    if (event.target.id === 'enrolmentForm') {
      event.preventDefault();
      const studentNumber = $('#enrolStudent').value;
      const sectionId = $('#enrolSection').value;
      const code = $('#enrolSubject').value;
      const student = students.find(function (item) { return item.number === studentNumber; });
      const section = sections.find(function (item) { return item.id === sectionId; });
      const plan = studentSubjectPlan(student);
      if (!student || !plan.ok) { showToast(plan.message || 'Choose a student with a valid programme and semester.'); return; }
      const planHasCode = plan.courses.some(function (course) { return course[0] === code; });
      if (!section || section.code !== code || !planHasCode || section.programmeCode !== plan.programme.code || Number(section.semester) !== plan.semester) {
        showToast('Choose a subject section from the student’s current programme and semester.'); return;
      }
      if (enrolments.some(function (item) { return item.studentNumber === studentNumber && item.sectionId === sectionId; })) { showToast('This student is already enrolled in that section.'); return; }
      enrolments.push({ id: 'en-' + Date.now(), studentNumber: studentNumber, sectionId: sectionId, status: 'Active' });
      saveList(KEYS.enrolments, enrolments); event.target.reset();
      refreshCurrentPage();
      showToast('Student enrolled in the section.');
    }
    if (event.target.id === 'announcementForm') {
      event.preventDefault();
      const type = $('#announcementType').value;
      announcements.push({ id: 'notice-' + Date.now(), title: $('#announcementTitle').value.trim(), body: $('#announcementBody').value.trim(), type: type, target: $('#announcementTarget').value, deadline: type === 'Deadline reminder' ? $('#announcementDeadline').value : '', publishedAt: new Date().toISOString().slice(0, 10) });
      saveList(KEYS.announcements, announcements); event.target.reset();
      if ($('#deadlineField')) $('#deadlineField').classList.add('d-none');
      hideModal('announcementModal');
      refreshCurrentPage();
      showToast('Announcement published.');
    }
    if (event.target.id === 'gradeForm') {
      event.preventDefault();
      const item = submissions.find(function (entry) { return entry.id === $('#gradeSubmissionId').value; });
      if (item) {
        item.grade = Number($('#gradeValue').value);
        item.feedback = $('#gradeFeedback').value.trim();
        item.reviewedBy = currentUser ? currentUser.name : '';
        item.reviewedAt = new Date().toISOString();
        saveList(KEYS.submissions, submissions);
        recomputeSubjectStatsFromSubmissions(item.course);
        saveList(KEYS.subjects, subjects);
        hideModal('gradeModal');
        refreshCurrentPage();
        showToast('Grade and feedback saved.');
      }
    }
    if (event.target.id === 'staffForm') {
      event.preventDefault();
      const email = $('#staffEmail').value.trim().toLowerCase();
      if (staffMembers.some(function (item) { return String(item.email || '').toLowerCase() === email; })) { $('#staffEmail').setCustomValidity('This staff email is already listed.'); $('#staffEmail').reportValidity(); $('#staffEmail').setCustomValidity(''); return; }
      staffMembers.push({ id: 'staff-' + Date.now(), name: $('#staffName').value.trim(), email: email, password: $('#staffPassword').value, role: $('#staffRole').value });
      saveList(KEYS.staff, staffMembers); event.target.reset();
      hideModal('staffModal');
      refreshCurrentPage();
      showToast('Staff member added.');
    }
    if (event.target.id === 'assignmentForm') {
      event.preventDefault();
      assignments.push({ id: 'task-' + Date.now(), title: $('#newTitle').value.trim(), course: $('#newCourse').value, due: $('#newDue').value, priority: $('#newPriority').value, done: false });
      saveList(KEYS.assignments, assignments);
      event.target.reset();
      hideModal('assignmentModal');
      refreshCurrentPage();
      showToast('Assignment added.');
    }
    if (event.target.id === 'subjectForm') {
      event.preventDefault();
      const original = $('#subjectOriginalCode').value;
      const code = $('#subjectCode').value.trim().toUpperCase();
      const name = $('#subjectName').value.trim().toUpperCase();
      if (subjects.some(function (item) { return item.code === code && item.code !== original; })) {
        $('#subjectCode').setCustomValidity('This subject code is already in the catalogue.');
        $('#subjectCode').reportValidity(); $('#subjectCode').setCustomValidity(''); return;
      }
      let auditDetail = 'Added subject: ' + name;
      if (original) {
        const subject = subjects.find(function (item) { return item.code === original; });
        auditDetail = original + ' - ' + subject.name + ' changed to ' + code + ' - ' + name;
        subject.code = code; subject.name = name;
        replaceCurriculumSubject(original, code, name);
        assignments.forEach(function (item) { if (item.course === original) item.course = code; });
        sections.forEach(function (item) { if (item.code === original) item.code = code; });
        submissions.forEach(function (item) { if (item.course === original) item.course = code; });
      } else subjects.push({ code: code, name: name, completed: 0, total: 3, average: 0 });
      recordCatalogueChange(original ? 'Updated' : 'Created', code, auditDetail);
      saveList(KEYS.sections, sections); saveList(KEYS.subjects, subjects); saveList(KEYS.assignments, assignments); saveList(KEYS.submissions, submissions);
      event.target.reset();
      hideModal('subjectModal');
      refreshCurrentPage();
      showToast(original ? 'Subject updated.' : 'Subject added.');
    }
    if (event.target.id === 'studentForm') {
      event.preventDefault();
      const originalId = $('#studentOriginalId').value;
      const original = students.find(function (student) { return student.id === originalId; });
      const number = $('#studentNumber').value.trim();
      if (!/^\d{10}$/.test(number)) {
        $('#studentNumber').setCustomValidity('Enter a 10-digit matrix number.');
        $('#studentNumber').reportValidity(); $('#studentNumber').setCustomValidity(''); return;
      }
      if (students.some(function (student) { return student.number === number && student.id !== originalId; })) {
        $('#studentNumber').setCustomValidity('This student ID already exists.');
        $('#studentNumber').reportValidity(); $('#studentNumber').setCustomValidity(''); return;
      }
      const programme = findProgramme($('#studentProgramme').value);
      const semester = Number($('#studentSemester').value);
      if (!programme || !semesterOptions.includes(semester)) { showToast('Choose a valid programme and semester.'); return; }
      const oldNumber = original ? original.number : '';
      const studentRecord = Object.assign({}, original || {}, { id: original ? original.id : 'student-' + Date.now(),
        name: $('#studentName').value.trim(), email: $('#studentEmail').value.trim(), number: number,
        programme: programme.name, currentSemester: semester, admissionYear: Number(number.slice(0, 4)), active: original ? original.active : true });
      if (original && (findProgramme(original.programme)?.code !== programme.code || Number(original.currentSemester) !== semester)) {
        const priorProgramme = findProgramme(original.programme);
        const priorSemester = Number(original.currentSemester);
        enrolments.forEach(function (item) {
          const priorSection = sections.find(function (section) { return section.id === item.sectionId; });
          if (item.studentNumber === original.number && item.status === 'Active' && priorSection &&
              priorSection.programmeCode === (priorProgramme && priorProgramme.code) && Number(priorSection.semester) === priorSemester) {
            item.status = 'Historical';
          }
        });
      }
      if (original) students = students.map(function (student) { return student.id === original.id ? studentRecord : student; });
      else students.push(studentRecord);
      if (oldNumber && oldNumber !== number) {
        enrolments = enrolments.map(function (item) { return item.studentNumber === oldNumber ? Object.assign({}, item, { studentNumber: number }) : item; });
        submissions = submissions.map(function (item) { return item.studentNumber === oldNumber ? Object.assign({}, item, { studentNumber: number }) : item; });
        if (currentUser && selectedRole === 'student' && currentUser.identifier === oldNumber) {
          currentUser.identifier = number;
          sessionStorage.setItem('studNestIdentifier', number);
        }
      }
      const plan = ensureCurrentStudentEnrolments(studentRecord);
      saveList(KEYS.students, students); saveList(KEYS.enrolments, enrolments); saveList(KEYS.submissions, submissions); saveList(KEYS.sections, sections);
      event.target.reset(); if ($('#studentOriginalId')) $('#studentOriginalId').value = '';
      hideModal('studentModal');
      refreshCurrentPage();
      showToast(original ? (plan.ok ? 'Student record and current subject list updated.' : 'Student updated. ' + plan.message) : (plan.ok ? 'Student added to the directory.' : 'Student added. ' + plan.message));
    }
  });
  document.addEventListener('click', function (event) {
    var clickTarget = event.target;
    if (clickTarget && clickTarget.nodeType !== 1) clickTarget = clickTarget.parentElement;
    if (!clickTarget || typeof clickTarget.closest !== 'function') return;

    const pagerBtn = clickTarget.closest('[data-pager-table]');
    if (pagerBtn) {
      event.preventDefault();
      var tableId = pagerBtn.dataset.pagerTable;
      var state = tablePagerState[tableId];
      if (!state) return;
      if (pagerBtn.dataset.pagerAction === 'prev') state.page -= 1;
      if (pagerBtn.dataset.pagerAction === 'next') state.page += 1;
      if (pagerBtn.dataset.pagerAction === 'goto') state.page = Number(pagerBtn.dataset.pagerPage) || 1;
      renderPagedRows(tableId, state.rows, state.pageSize, false);
      return;
    }

    const timetableNav = clickTarget.closest('#timetablePrevWeek, #timetableNextWeek, #timetablePrevMonth, #timetableNextMonth, #timetableToday');
    if (timetableNav) {
      if (timetableNav.id === 'timetablePrevWeek') timetableWeekStart = addDays(timetableWeekStart, -7);
      if (timetableNav.id === 'timetableNextWeek') timetableWeekStart = addDays(timetableWeekStart, 7);
      if (timetableNav.id === 'timetablePrevMonth') timetableWeekStart = startOfWeek(addDays(timetableWeekStart, -28));
      if (timetableNav.id === 'timetableNextMonth') timetableWeekStart = startOfWeek(addDays(timetableWeekStart, 28));
      if (timetableNav.id === 'timetableToday') timetableWeekStart = startOfWeek(new Date());
      renderTimetable();
      return;
    }
    const opener = clickTarget.closest('[data-open-modal]');
    if (opener) {
      event.preventDefault();
      event.stopPropagation();
      const modalId = opener.dataset.openModal;
      if (modalId === 'subjectModal') resetSubjectForm();
      if (modalId === 'studentModal') resetStudentForm();
      if (modalId === 'sectionModal') resetSectionForm();
      if (modalId === 'announcementModal') {
        if ($('#announcementForm')) $('#announcementForm').reset();
        if ($('#deadlineField')) $('#deadlineField').classList.add('d-none');
        if ($('#announcementDeadline')) $('#announcementDeadline').required = false;
        fillManagementSelects();
      }
      if (modalId === 'staffModal' && $('#staffForm')) $('#staffForm').reset();
      openModal(modalId);
      return;
    }
    const filter = clickTarget.closest('[data-filter]');
    if (filter) {
      activeFilter = filter.dataset.filter;
      $$('.filter-tab').forEach(function (tab) { tab.classList.toggle('active', tab.dataset.filter === activeFilter); });
      if ($('#assignmentsTable')) renderAssignments();
      return;
    }
    const toggle = clickTarget.closest('[data-toggle-task]');
    if (toggle) { const item = assignments.find(function (entry) { return entry.id === toggle.dataset.toggleTask; }); if (item) { item.done = !item.done; saveList(KEYS.assignments, assignments); refreshCurrentPage(); showToast(item.done ? 'Marked as complete.' : 'Moved back to in progress.'); } }
    const remove = clickTarget.closest('[data-delete-task]');
    if (remove) { assignments = assignments.filter(function (item) { return item.id !== remove.dataset.deleteTask; }); saveList(KEYS.assignments, assignments); refreshCurrentPage(); showToast('Assignment removed.'); }
    const editSubject = clickTarget.closest('[data-edit-subject]');
    if (editSubject) {
      const subject = subjects.find(function (item) { return item.code === editSubject.dataset.editSubject; });
      if (subject) { $('#subjectOriginalCode').value = subject.code; $('#subjectCode').value = subject.code; $('#subjectName').value = subject.name; $('#subjectModalLabel').textContent = 'Edit subject'; $('#subjectForm button[type="submit"]').textContent = 'Save changes'; openModal('subjectModal'); }
    }
    const editStudent = clickTarget.closest('[data-edit-student]');
    if (editStudent) {
      const student = students.find(function (item) { return item.id === editStudent.dataset.editStudent; });
      if (student) {
        resetStudentForm();
        $('#studentOriginalId').value = student.id;
        $('#studentName').value = student.name;
        $('#studentEmail').value = student.email || '';
        $('#studentNumber').value = student.number;
        var prog = findProgramme(student.programme);
        $('#studentProgramme').value = prog ? prog.name : '';
        $('#studentSemester').value = String(student.currentSemester || '');
        $('#studentModalLabel').textContent = 'Edit student record';
        $('#studentForm button[type="submit"]').textContent = 'Save changes';
        openModal('studentModal');
      }
    }
    const deleteSubject = clickTarget.closest('[data-delete-subject]');
    if (deleteSubject) {
      const code = deleteSubject.dataset.deleteSubject;
      if (window.confirm('Remove ' + code + ' from the subject catalogue?')) {
        const referenced = programmeSemesterLabelsForSubject(code).length || sections.some(function (item) { return item.code === code; }) ||
          assignments.some(function (item) { return item.course === code; }) || submissions.some(function (item) { return item.course === code; });
        if (referenced) { showToast('This subject is linked to a programme plan or academic record. Edit its details instead of deleting it.'); return; }
        const removedSubject = subjects.find(function (item) { return item.code === code; });
        recordCatalogueChange('Removed', code, removedSubject ? 'Removed subject: ' + removedSubject.name : 'Removed subject');
        subjects = subjects.filter(function (item) { return item.code !== code; });
        saveList(KEYS.subjects, subjects);
        refreshCurrentPage();
        showToast('Subject removed.');
      }
    }
    const editSection = clickTarget.closest('[data-edit-section]');
    if (editSection) {
      const section = sections.find(function (item) { return item.id === editSection.dataset.editSection; });
      if (section) {
        populateProgrammeSelect($('#sectionProgramme'), 'Choose programme');
        populateSemesterSelect($('#sectionSemester'));
        $('#sectionProgramme').value = section.programme || '';
        $('#sectionSemester').value = String(section.semester || '');
        updateSectionSubjectOptions(section.code);
        $('#sectionOriginalId').value = section.id; $('#sectionSubject').value = section.code;
        $('#sectionInstructor').value = section.instructor; $('#sectionRoom').value = section.room; $('#sectionTime').value = section.time;
        $('#sectionModalLabel').textContent = 'Edit section'; openModal('sectionModal');
      }
    }
    const deleteSection = clickTarget.closest('[data-delete-section]');
    if (deleteSection) {
      const section = sections.find(function (item) { return item.id === deleteSection.dataset.deleteSection; });
      if (section && window.confirm('Archive this section? Existing enrolment and announcement records will be kept.')) {
        section.archived = true;
        enrolments.forEach(function (item) { if (item.sectionId === section.id && item.status === 'Active') item.status = 'Historical'; });
        saveList(KEYS.sections, sections); saveList(KEYS.enrolments, enrolments);
        refreshCurrentPage();
        showToast('Section archived; linked records were kept.');
      }
    }
    const deleteEnrolment = clickTarget.closest('[data-delete-enrolment]');
    if (deleteEnrolment) {
      const item = enrolments.find(function (entry) { return entry.id === deleteEnrolment.dataset.deleteEnrolment; });
      if (item) { item.status = 'Withdrawn'; saveList(KEYS.enrolments, enrolments); refreshCurrentPage(); showToast('Enrolment marked withdrawn; its record was kept.'); }
    }
    const deleteAnnouncement = clickTarget.closest('[data-delete-announcement]');
    if (deleteAnnouncement) {
      announcements = announcements.filter(function (item) { return item.id !== deleteAnnouncement.dataset.deleteAnnouncement; });
      saveList(KEYS.announcements, announcements); refreshCurrentPage();
    }
    const gradeSubmission = clickTarget.closest('[data-grade-submission]');
    if (gradeSubmission) {
      const item = submissions.find(function (entry) { return entry.id === gradeSubmission.dataset.gradeSubmission; });
      if (item) {
        const student = students.find(function (entry) { return entry.number === item.studentNumber; });
        $('#gradeSubmissionId').value = item.id; $('#gradeContext').textContent = (student ? student.name : item.studentNumber) + ' - ' + item.assignment + ' - ' + labelForSubject(item.course);
        $('#gradeValue').value = item.grade == null ? '' : item.grade; $('#gradeFeedback').value = item.feedback || '';
        openModal('gradeModal');
      }
    }
    const deleteStaff = clickTarget.closest('[data-delete-staff]');
    if (deleteStaff) {
      staffMembers = staffMembers.filter(function (item) { return item.id !== deleteStaff.dataset.deleteStaff; });
      saveList(KEYS.staff, staffMembers); renderStaffAudit();
    }
    const toggleStudent = clickTarget.closest('[data-toggle-student]');
    if (toggleStudent) {
      const student = students.find(function (item) { return item.id === toggleStudent.dataset.toggleStudent; });
      if (student) {
        student.active = student.active === false;
        saveList(KEYS.students, students);
        refreshCurrentPage();
        showToast(student.active ? 'Student account activated.' : 'Student account deactivated.');
      }
    }
  });
  document.addEventListener('change', function (event) {

    if (event.target.id === 'studentProgrammeFilter' || event.target.id === 'studentSemesterFilter') renderStudents();
    if (event.target.id === 'enrolStudent') updateEnrolmentOptions();
    if (event.target.id === 'sectionProgramme' || event.target.id === 'sectionSemester') updateSectionSubjectOptions();
    if (event.target.id === 'submissionFilter') renderSubmissions();
    if (event.target.id === 'announcementType') {
      const isDeadline = event.target.value === 'Deadline reminder';
      if ($('#deadlineField')) $('#deadlineField').classList.toggle('d-none', !isDeadline);
      if ($('#announcementDeadline')) $('#announcementDeadline').required = isDeadline;
    }
    const enrolStatus = event.target.closest('[data-enrol-status]');
    if (enrolStatus) {
      const item = enrolments.find(function (entry) { return entry.id === enrolStatus.dataset.enrolStatus; });
      if (item) { item.status = enrolStatus.value; saveList(KEYS.enrolments, enrolments); refreshCurrentPage(); }
    }
    const staffRole = event.target.closest('[data-staff-role]');
    if (staffRole) {
      const member = staffMembers.find(function (entry) { return entry.id === staffRole.dataset.staffRole; });
      if (member) { member.role = staffRole.value; saveList(KEYS.staff, staffMembers); renderStaffAudit(); showToast('Staff permissions updated.'); }
    }
  });
  var exportClassListBtn = $('#exportClassList');
  if (exportClassListBtn) exportClassListBtn.addEventListener('click', exportClassList);
  var exportProgressBtn = $('#exportProgress');
  if (exportProgressBtn) exportProgressBtn.addEventListener('click', exportProgressSummary);
  var exportBackupBtn = $('#exportStudentBackup');
  if (exportBackupBtn) exportBackupBtn.addEventListener('click', exportStudentBackup);

  document.addEventListener('input', function (event) {
    if (event.target.id === 'assignmentSearch') renderAssignments();
    if (event.target.id === 'studentSearch') renderStudents();
  });
  var newDueEl = $('#newDue');
  if (newDueEl) newDueEl.min = new Date().toISOString().slice(0, 10);

  var studentProg = $('#studentProgramme');
  if (studentProg) {
    populateProgrammeSelect($('#studentProgramme'), 'Choose programme');
    populateProgrammeSelect($('#studentProgrammeFilter'), 'All programmes');
    populateSemesterSelect($('#studentSemester'));
    var semFilter = $('#studentSemesterFilter');
    if (semFilter) {
      semFilter.innerHTML = '<option value="">All semesters</option>' + semesterOptions.map(function (semester) {
        return '<option value="' + semester + '">Semester ' + semester + '</option>';
      }).join('');
    }
  }

  // open the correct page content
  function runPage(page) {
    if (page === 'dashboard') renderDashboard();
    if (page === 'assignments') renderAssignments();
    if (page === 'timetable') renderTimetable();
    if (page === 'progress') renderProgress();
    if (page === 'admin-dashboard') renderAdminDashboard();
    if (page === 'subjects') renderSubjects();
    if (page === 'students') renderStudents();
    if (page === 'sections') renderSections();
    if (page === 'enrolments') renderEnrolments();
    if (page === 'announcements') renderAnnouncements();
    if (page === 'submissions') renderSubmissions();
    if (page === 'reports') renderReports();
    if (page === 'staff') renderStaffAudit();
    updateNavDueCount();
  }

  // start page after login check
  var page = document.body.dataset.page;
  if (page && page !== 'login') {
    if (!StudNest.auth.requireAuth()) return;
    selectedRole = StudNest.selectedRole;
    currentUser = StudNest.currentUser;
    StudNest.layout.init();
    runPage(page);
  }
}());
