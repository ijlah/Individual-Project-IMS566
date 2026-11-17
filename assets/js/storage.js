// storage.js - save and load data using localStorage
(function () {
  'use strict';
  var StudNest = window.StudNest = window.StudNest || {};
  var seed = StudNest.seed;
  // change this key to reset browser data
  var INIT_KEY = 'studNestMultipageV4';

  // localStorage keys for each data list
  StudNest.KEYS = {
    assignments: 'studNestAssignments',
    subjects: 'studNestSubjects',
    students: 'studNestStudents',
    sections: 'studNestSections',
    enrolments: 'studNestEnrolments',
    announcements: 'studNestAnnouncements',
    submissions: 'studNestSubmissions',
    staff: 'studNestStaff',
    audit: 'studNestAudit'
  };

  // get list from localStorage
  StudNest.loadList = function (key, fallback) {
    try {
      var saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : (fallback ? fallback.slice() : []);
    } catch (e) {
      return fallback ? fallback.slice() : [];
    }
  };

  StudNest.saveList = function (key, list) {
    try {
      localStorage.setItem(key, JSON.stringify(list));
      return true;
    } catch (e) {
      console.error('Unable to save StudNest data for ' + key, e);
      if (StudNest.layout && StudNest.layout.showToast) {
        StudNest.layout.showToast('Your browser could not save this change. Free some storage and try again.');
      }
      return false;
    }
  };

  function findProgramme(value) {
    var curriculum = StudNest.programmeCurriculum;
    if (!curriculum) return null;
    var normalized = String(value || '').trim().toLowerCase();
    return StudNest.programmeList.find(function (programme) {
      return programme.code.toLowerCase() === normalized || programme.name.toLowerCase() === normalized;
    }) || null;
  }

  function semesterPlanFor(programmeValue, semesterValue) {
    var programme = typeof programmeValue === 'object' ? programmeValue : findProgramme(programmeValue);
    var semester = Number(semesterValue);
    var curriculum = StudNest.programmeCurriculum;
    if (!programme || !curriculum) return { ok: false, message: 'Programme information is unavailable.', courses: [] };
    if (!Number.isInteger(semester) || semester < 1 || semester > 6) {
      return { ok: false, message: 'Current semester is missing or invalid.', courses: [] };
    }
    var courses = curriculum[programme.code].semesters[semester];
    if (!Array.isArray(courses) || !courses.length) {
      return { ok: false, message: 'The subject outline for ' + programme.name + ', Semester ' + semester + ' is unavailable.', courses: [] };
    }
    if (curriculum[programme.code].incompleteSemesters && curriculum[programme.code].incompleteSemesters.indexOf(semester) !== -1) {
      return { ok: false, programme: programme, semester: semester, courses: [], message: 'The outline for ' + programme.name + ', Semester ' + semester + ' is not yet verified in this demo.' };
    }
    return { ok: true, programme: programme, semester: semester, courses: courses };
  }

  function mergeById(existing, incoming) {
    var merged = existing.slice();
    var knownIds = new Set(merged.map(function (item) { return item.id; }));
    incoming.forEach(function (item) {
      if (!knownIds.has(item.id)) {
        merged.push(item);
        knownIds.add(item.id);
      }
    });
    return merged;
  }

  function bootstrapCurriculumCatalog(subjects, sections) {
    var curriculum = StudNest.programmeCurriculum;
    var courseRows = Object.keys(curriculum).reduce(function (all, code) {
      Object.keys(curriculum[code].semesters).forEach(function (semester) {
        var plan = semesterPlanFor(code, semester);
        if (!plan.ok) return;
        plan.courses.forEach(function (course) {
          all.push({
            programmeCode: code,
            programme: curriculum[code].name,
            semester: Number(semester),
            code: course[0],
            name: course[1],
            sectionId: 'SEC-' + code + '-' + course[0] + '-S' + semester
          });
        });
      });
      return all;
    }, []);

    var codes = new Set(subjects.map(function (s) { return s.code; }));
    courseRows.forEach(function (course) {
      if (!codes.has(course.code)) {
        codes.add(course.code);
        subjects.push({ code: course.code, name: course.name, completed: 0, total: 3, average: null });
      }
    });

    var sectionIds = new Set(sections.map(function (s) { return s.id; }));
    courseRows.forEach(function (course) {
      if (!sectionIds.has(course.sectionId)) {
        sectionIds.add(course.sectionId);
        sections.push({
          id: course.sectionId,
          code: course.code,
          programme: course.programme,
          programmeCode: course.programmeCode,
          semester: course.semester,
          instructor: 'To be assigned',
          room: 'To be scheduled',
          time: ''
        });
      }
    });

    return { subjects: subjects, sections: sections };
  }

  function ensureStudentEnrolments(student, subjects, sections, enrolments) {
    var plan = semesterPlanFor(student.programme, student.currentSemester);
    if (!plan.ok) return plan;
    var added = [];
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
          id: sectionId,
          code: course[0],
          programme: plan.programme.name,
          programmeCode: plan.programme.code,
          semester: plan.semester,
          instructor: timedTemplate ? timedTemplate.instructor : 'To be assigned',
          room: timedTemplate ? timedTemplate.room : 'To be scheduled',
          time: timedTemplate ? timedTemplate.time : ''
        };
        if (!sections.some(function (item) { return item.id === sectionId; })) sections.push(section);
      }
      var existing = enrolments.find(function (item) {
        return item.studentNumber === student.number && item.sectionId === section.id;
      });
      if (!existing) {
        added.push({
          id: 'outline-' + student.id + '-' + course[0] + '-S' + plan.semester,
          studentNumber: student.number,
          sectionId: section.id,
          status: 'Active'
        });
      } else if (existing.status !== 'Active') {
        existing.status = 'Active';
      }
    });
    if (added.length) enrolments = mergeById(enrolments, added);
    return { ok: true, enrolments: enrolments, sections: sections };
  }

  // first visit loads seed data; later visits keep saved data
  StudNest.initStorage = function () {
    StudNest.programmeCurriculum = seed.programmeCurriculum;
    StudNest.programmeList = Object.keys(StudNest.programmeCurriculum).map(function (code) {
      return { code: code, name: StudNest.programmeCurriculum[code].name };
    });
    StudNest.semesterOptions = [1, 2, 3, 4, 5, 6];

    localStorage.removeItem('studNestLanguage');
    localStorage.removeItem('studNestMultipageV1');
    localStorage.removeItem('studNestMultipageV2');

    var KEYS = StudNest.KEYS;

    if (!localStorage.getItem(INIT_KEY)) {
      var subjects = seed.subjects.slice();
      var sections = seed.sections.slice();
      var boot = bootstrapCurriculumCatalog(subjects, sections);
      subjects = boot.subjects;
      sections = boot.sections;
      var enrolments = seed.enrolments.slice();
      var students = seed.students.slice();

      students.forEach(function (student) {
        var result = ensureStudentEnrolments(student, subjects, sections, enrolments);
        if (result.enrolments) enrolments = result.enrolments;
        if (result.sections) sections = result.sections;
      });

      StudNest.saveList(KEYS.subjects, subjects);
      StudNest.saveList(KEYS.assignments, seed.assignments.slice());
      StudNest.saveList(KEYS.students, students);
      StudNest.saveList(KEYS.sections, sections);
      StudNest.saveList(KEYS.enrolments, enrolments);
      StudNest.saveList(KEYS.announcements, seed.announcements.slice());
      StudNest.saveList(KEYS.submissions, seed.submissions.slice());
      StudNest.saveList(KEYS.staff, seed.staff.slice());
      StudNest.saveList(KEYS.audit, []);
      localStorage.setItem(INIT_KEY, '1');
    } else {
      var state = StudNest.loadAppState();
      StudNest.refreshCatalogue(state);
      StudNest.saveList(KEYS.subjects, state.subjects);
      StudNest.saveList(KEYS.sections, state.sections);
      StudNest.saveList(KEYS.enrolments, state.enrolments);
      StudNest.saveList(KEYS.students, state.students);
    }
  };

  StudNest.findProgramme = findProgramme;
  StudNest.semesterPlanFor = semesterPlanFor;

  StudNest.populateProgrammeSelect = function (select, includeAllLabel) {
    if (!select) return;
    var first = includeAllLabel || 'Choose programme';
    select.innerHTML = '<option value="">' + StudNest.escapeHtml(first) + '</option>' +
      StudNest.programmeList.map(function (programme) {
        return '<option value="' + StudNest.escapeHtml(programme.name) + '">' + StudNest.escapeHtml(programme.name) + '</option>';
      }).join('');
  };

  StudNest.populateSemesterSelect = function (select) {
    if (!select) return;
    select.innerHTML = StudNest.semesterOptions.map(function (semester) {
      return '<option value="' + semester + '"' + (semester === 4 ? ' selected' : '') + '>Semester ' + semester + '</option>';
    }).join('');
  };

  StudNest.escapeHtml = function (value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  };

  StudNest.loadAppState = function () {
    var KEYS = StudNest.KEYS;
    var s = seed;
    return {
      assignments: StudNest.loadList(KEYS.assignments, s.assignments),
      subjects: StudNest.loadList(KEYS.subjects, s.subjects),
      students: StudNest.loadList(KEYS.students, s.students),
      sections: StudNest.loadList(KEYS.sections, s.sections),
      enrolments: StudNest.loadList(KEYS.enrolments, s.enrolments),
      announcements: StudNest.loadList(KEYS.announcements, s.announcements),
      submissions: StudNest.loadList(KEYS.submissions, s.submissions),
      staff: StudNest.loadList(KEYS.staff, s.staff),
      audit: StudNest.loadList(KEYS.audit, [])
    };
  };

  StudNest.refreshCatalogue = function (state) {
    var boot = bootstrapCurriculumCatalog(state.subjects, state.sections);
    state.subjects = boot.subjects;
    state.sections = boot.sections;
    state.students.forEach(function (student) {
      var result = ensureStudentEnrolments(student, state.subjects, state.sections, state.enrolments);
      if (result.enrolments) state.enrolments = result.enrolments;
      if (result.sections) state.sections = result.sections;
    });
  };
}());
