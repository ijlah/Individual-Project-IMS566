// seed.js - sample data for the portal (no database)
(function () {
  'use strict';
  var STUDENT_DEFAULT_PASSWORD = 'student123';

  // subject list for first load
  var seedSubjects = [
    { code: 'IMS560', name: 'ADVANCED DATABASE MANAGEMENT SYSTEM', completed: 0, total: 0, average: null },
    { code: 'IMS561', name: 'WEB PUBLISHING', completed: 0, total: 0, average: null },
    { code: 'IMS564', name: 'USER EXPERIENCE DESIGN', completed: 0, total: 0, average: null },
    { code: 'IMS565', name: 'INFORMATION SYSTEM PROJECT MANAGEMENT', completed: 0, total: 0, average: null },
    { code: 'IMS566', name: 'ADVANCED WEB DESIGN DEVELOPMENT AND CONTENT MANAGEMENT', completed: 0, total: 0, average: null },
    { code: 'LCC501', name: 'ENGLISH FOR PROFESSIONAL CORRESPONDENCE', completed: 0, total: 0, average: null },
    { code: 'TMC501', name: 'INTRODUCTORY MANDARIN (LEVEL III)', completed: 0, total: 0, average: null },
    { code: 'IML590', name: 'INFORMATION SOURCES AND SERVICES', completed: 0, total: 0, average: null }
  ];

  // calculate due date based on today
  function daysFromToday(offset) {
    var date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  }

  // sample assignments for student pages
  var seedAssignments = [
    { id: 'a1', title: 'Individual Project Proposal', course: 'IMS566', due: daysFromToday(3), priority: 'High', done: false },
    { id: 'a2', title: 'Professional Email Portfolio', course: 'LCC501', due: daysFromToday(6), priority: 'Medium', done: false },
    { id: 'a3', title: 'UX Wireframe Review', course: 'IMS564', due: daysFromToday(10), priority: 'High', done: false },
    { id: 'a4', title: 'Database Design Exercise', course: 'IMS560', due: daysFromToday(14), priority: 'Medium', done: false },
    { id: 'a5', title: 'Project Management Plan', course: 'IMS565', due: daysFromToday(-2), priority: 'Low', done: false },
    { id: 'a6', title: 'Web Publishing Draft', course: 'IMS561', due: daysFromToday(-8), priority: 'Low', done: true }
  ];

  var seedStudents = [
    { id: 's1', name: 'Aina Sofea', email: 'aina.sofea@studnest.edu.my', number: '2026123401', programme: 'Information Systems', currentSemester: 4, admissionYear: 2026, password: STUDENT_DEFAULT_PASSWORD, active: true },
    { id: 's2', name: 'Zarif Ghazzi', email: 'zarifunzzi@studnest.edu.my', number: '2026123402', programme: 'Information Systems', currentSemester: 4, admissionYear: 2026, password: STUDENT_DEFAULT_PASSWORD, active: true },
    { id: 's3', name: 'Nur Amirah', email: 'nur.amirah@studnest.edu.my', number: '2026123403', programme: 'Library Management', currentSemester: 4, admissionYear: 2026, password: STUDENT_DEFAULT_PASSWORD, active: true },
    { id: 's4', name: 'Amierul Aiman', email: 'mierulaiman@studnest.edu.my', number: '2026123404', programme: 'Information Systems', currentSemester: 4, admissionYear: 2026, password: STUDENT_DEFAULT_PASSWORD, active: true },
    { id: 's5', name: 'Siti Hajar', email: 'siti.hajar@studnest.edu.my', number: '2026123405', programme: 'Information Content', currentSemester: 4, admissionYear: 2026, password: STUDENT_DEFAULT_PASSWORD, active: true },
    { id: 's6', name: 'Haziq Iman', email: 'haziq.iman@studnest.edu.my', number: '2025123406', programme: 'Information Systems', currentSemester: 3, admissionYear: 2025, password: STUDENT_DEFAULT_PASSWORD, active: true },
    { id: 's7', name: 'Alya Nadia', email: 'alya.nadia@studnest.edu.my', number: '2025123407', programme: 'Information Systems', currentSemester: 4, admissionYear: 2025, password: STUDENT_DEFAULT_PASSWORD, active: true },
    { id: 's8', name: 'Izzat Hakimi', email: 'izzat.hakimi@studnest.edu.my', number: '2024123408', programme: 'Information Systems', currentSemester: 5, admissionYear: 2024, password: STUDENT_DEFAULT_PASSWORD, active: true },
    { id: 's9', name: 'Dania Maisarah', email: 'dania.maisarah@studnest.edu.my', number: '2025123409', programme: 'Library Management', currentSemester: 3, admissionYear: 2025, password: STUDENT_DEFAULT_PASSWORD, active: true },
    { id: 's10', name: 'Muhammad Afiq', email: 'muhammad.afiq@studnest.edu.my', number: '2025123410', programme: 'Library Management', currentSemester: 4, admissionYear: 2025, password: STUDENT_DEFAULT_PASSWORD, active: true },
    { id: 's11', name: 'Nurul Izzah', email: 'nurul.izzah@studnest.edu.my', number: '2024123411', programme: 'Library Management', currentSemester: 5, admissionYear: 2024, password: STUDENT_DEFAULT_PASSWORD, active: true },
    { id: 's12', name: 'Aisyah Qistina', email: 'aisyah.qistina@studnest.edu.my', number: '2025123412', programme: 'Record Management', currentSemester: 3, admissionYear: 2025, password: STUDENT_DEFAULT_PASSWORD, active: true }
  ];

  var seedSections = [
    { id: 'SEC-SI262-IMS560-S4', code: 'IMS560', instructor: 'Dr. Ghaffar', room: 'MK-10', time: 'Wednesday, 10:00 AM–12:00 PM', programme: 'Information Systems', programmeCode: 'SI262', semester: 4 },
    { id: 'SEC-SI262-IMS561-S4', code: 'IMS561', instructor: 'Ms. Lina Aziz', room: 'MK-05', time: 'Monday, 10:00 AM–12:00 PM', programme: 'Information Systems', programmeCode: 'SI262', semester: 4 },
    { id: 'SEC-SI262-IMS564-S4', code: 'IMS564', instructor: 'Mr. Faizal Noor', room: 'Design Studio 2', time: 'Thursday, 2:00–4:00 PM', programme: 'Information Systems', programmeCode: 'SI262', semester: 4 },
    { id: 'SEC-SI262-IMS565-S4', code: 'IMS565', instructor: 'Pn. Noraini Musa', room: 'MK-13', time: 'Tuesday, 1:00–3:00 PM', programme: 'Information Systems', programmeCode: 'SI262', semester: 4 },
    { id: 'SEC-SI262-IMS566-S4', code: 'IMS566', instructor: 'Mr. Hafiz Rahman', room: 'MK-01', time: 'Friday, 10:00 AM–12:00 PM', programme: 'Information Systems', programmeCode: 'SI262', semester: 4 },
    { id: 'SEC-SI262-LCC501-S4', code: 'LCC501', instructor: 'Mr. Daniel Tan', room: 'BK-12', time: 'Tuesday, 8:00–10:00 AM', programme: 'Information Systems', programmeCode: 'SI262', semester: 4 },
    { id: 'SEC-SI262-TMC501-S4', code: 'TMC501', instructor: 'Mr. Hendery Lee', room: 'Language Lab 2', time: 'Monday, 3:00–5:00 PM', programme: 'Information Systems', programmeCode: 'SI262', semester: 4 },
    { id: 'SEC-CDIM260-IML590-S4', code: 'IML590', instructor: 'Dr. Faridah Hassan', room: 'Lecture Hall 1', time: 'Wednesday, 10:00 AM–12:00 PM', programme: 'Library Management', programmeCode: 'CDIM260', semester: 4 }
  ];

  var seedEnrolments = [
    { id: 'en1', studentNumber: '2026123401', sectionId: 'SEC-SI262-IMS566-S4', status: 'Active' },
    { id: 'en2', studentNumber: '2026123401', sectionId: 'SEC-SI262-IMS560-S4', status: 'Active' },
    { id: 'en3', studentNumber: '2026123401', sectionId: 'SEC-SI262-LCC501-S4', status: 'Active' },
    { id: 'en4', studentNumber: '2026123401', sectionId: 'SEC-SI262-IMS564-S4', status: 'Active' },
    { id: 'en5', studentNumber: '2026123402', sectionId: 'SEC-SI262-LCC501-S4', status: 'Active' },
    { id: 'en6', studentNumber: '2026123402', sectionId: 'SEC-SI262-IMS560-S4', status: 'Active' },
    { id: 'en7', studentNumber: '2026123404', sectionId: 'SEC-SI262-IMS565-S4', status: 'Active' },
    { id: 'en8', studentNumber: '2026123404', sectionId: 'SEC-SI262-IMS566-S4', status: 'Active' }
  ];

  var seedAnnouncements = [
    { id: 'notice1', title: 'Welcome to the new study week', body: 'Check your class schedule and note the upcoming assessment dates.', type: 'Announcement', target: 'all', deadline: '', publishedAt: daysFromToday(-1) },
    { id: 'notice2', title: 'Project proposal due soon', body: 'Please upload your individual project proposal before the deadline.', type: 'Deadline reminder', target: 'SEC-SI262-IMS566-S4', deadline: daysFromToday(3), publishedAt: daysFromToday(-1) }
  ];

  var seedSubmissions = [
    { id: 'sub1', studentNumber: '2026123401', assignment: 'Web Publishing Draft', course: 'IMS561', submittedAt: daysFromToday(-8), grade: 84, feedback: 'Clear structure and good references.' },
    { id: 'sub2', studentNumber: '2026123402', assignment: 'Professional Email Portfolio', course: 'LCC501', submittedAt: daysFromToday(-2), grade: null, feedback: '' },
    { id: 'sub3', studentNumber: '2026123404', assignment: 'Project Management Plan', course: 'IMS565', submittedAt: daysFromToday(-1), grade: null, feedback: '' },
    { id: 'sub4', studentNumber: '2026123401', assignment: 'Database Design Exercise', course: 'IMS560', submittedAt: daysFromToday(-4), grade: 91, feedback: 'Strong normalisation and clear ER diagram.' }
  ];

  // programme subjects by semester for enrolment and progress
  var programmeCurriculum = {
    SI262: {
      name: 'Information Systems',
      semesters: {
        1: [['CTU552', 'PHILOSOPHY AND CURRENT ISSUES'], ['HBU111', 'NATIONAL KESATRIA I'], ['IMC401', 'FOUNDATION OF INFORMATION AND COMMUNICATIONS TECHNOLOGY'], ['IMC411', 'DATABASE MANAGEMENT SYSTEM'], ['IMC412', 'FUNDAMENTALS OF INFORMATION SCIENCE'], ['IMC413', 'INFORMATION STORAGE & RETRIEVAL SYSTEMS'], ['IMC414', 'DIGITAL CITIZENSHIP AND SOCIAL MEDIA'], ['IMC451', 'ORGANIZATION OF INFORMATION']],
        2: [['CTU554', 'VALUES AND CIVILIZATION II'], ['HBU121', 'NATIONAL KESATRIA II'], ['IMC452', 'INTRODUCTION TO METADATA'], ['IMS450', 'PROBLEM SOLVING AND PROGRAM DESIGN 1'], ['IMS457', 'MULTIMEDIA FOR INFORMATION PROFESSIONALS'], ['IMS458', 'WEB DESIGN AND DEVELOPMENT'], ['MGT400', 'INTRODUCTION TO MANAGEMENT'], ['TMC401', 'INTRODUCTORY MANDARIN (LEVEL I)']],
        3: [['ENT530', 'PRINCIPLES OF ENTREPRENEURSHIP'], ['HBU131', 'NATIONAL KESATRIA III'], ['IMC501', 'INFORMATION ANALYTICS'], ['IMR533', 'INFORMATION ETHICS AND LAW'], ['IMS511', 'PROBLEM SOLVING AND PROGRAM DESIGN 2'], ['IMS555', 'DECISION THEORY'], ['LCC402', 'ENGLISH FOR ORAL REPORTING'], ['TMC451', 'INTRODUCTORY MANDARIN (LEVEL II)']],
        4: [['IMS560', 'ADVANCED DATABASE MANAGEMENT SYSTEM'], ['IMS561', 'WEB PUBLISHING'], ['IMS564', 'USER EXPERIENCE DESIGN'], ['IMS565', 'INFORMATION SYSTEM PROJECT MANAGEMENT'], ['IMS566', 'ADVANCED WEB DESIGN DEVELOPMENT AND CONTENT MANAGEMENT'], ['LCC501', 'ENGLISH FOR PROFESSIONAL CORRESPONDENCE'], ['TMC501', 'INTRODUCTORY MANDARIN (LEVEL III)']],
        5: [['EET699', 'ENGLISH EXIT TEST'], ['ICM573', 'CORPORATE COMMUNICATION FOR INFORMATION PROFESSIONAL'], ['IML511', 'OUTREACH AND COMMUNITY SERVICES FOR INFORMATION PROFESSIONALS'], ['IMS552', 'INFORMATION SYSTEMS MANAGEMENT'], ['IMS610', 'DESIGN SCIENCE RESEARCH FOR INFORMATION SYSTEMS'], ['IMS611', 'SYSTEMS ANALYSIS AND DESIGN IN INFORMATION MANAGEMENT'], ['IMS613', 'DATA CENTER OPERATIONS AND INFRASTRUCTURE']],
        6: [['IMC690', 'INDUSTRIAL TRAINING'], ['IMS568', 'INFORMATION MANAGEMENT SYSTEM PROJECT (CAPSTONE)']]
      }
    },
    CDIM260: {
      name: 'Library Management',
      semesters: {
        1: [['CTU552', 'PHILOSOPHY AND CURRENT ISSUES'], ['HBU111', 'NATIONAL KESATRIA I'], ['IMC401', 'FOUNDATION OF INFORMATION AND COMMUNICATIONS TECHNOLOGY'], ['IMC411', 'DATABASE MANAGEMENT SYSTEM'], ['IMC412', 'FUNDAMENTALS OF INFORMATION SCIENCE'], ['IMC413', 'INFORMATION STORAGE & RETRIEVAL SYSTEMS'], ['IMC414', 'DIGITAL CITIZENSHIP AND SOCIAL MEDIA'], ['IMC451', 'ORGANIZATION OF INFORMATION']],
        2: [['CTU554', 'VALUES AND CIVILIZATION II'], ['HBU121', 'NATIONAL KESATRIA II'], ['IMC452', 'INTRODUCTION TO METADATA'], ['IML465', 'ICT APPLICATION IN LIBRARIES AND MEDIA CENTERS'], ['IML466', 'DIGITAL REFERENCE SERVICE'], ['IML470', 'INTRODUCTION TO WEB DEVELOPMENT AND LIBRARY PORTAL'], ['MGT400', 'INTRODUCTION TO MANAGEMENT'], ['TMC401', 'INTRODUCTORY MANDARIN (LEVEL I)']],
        3: [['ENT530', 'PRINCIPLES OF ENTREPRENEURSHIP'], ['EWC661', 'ENGLISH FOR REPORT WRITING'], ['HBU131', 'NATIONAL KESATRIA III'], ['IMC501', 'INFORMATION ANALYTICS'], ['IML511', 'OUTREACH AND COMMUNITY SERVICES FOR INFORMATION PROFESSIONALS'], ['IML517', 'ORGANIZATION OF INFORMATION I: RESOURCE DESCRIPTION AND DISCOVERY'], ['IML527', 'KNOWLEDGE MANAGEMENT IN LIBRARIES AND MEDIA CENTERS'], ['TMC451', 'INTRODUCTORY MANDARIN (LEVEL II)']],
        4: [['EWC663', 'ENGLISH FOR MEETINGS AND DISCUSSIONS'], ['IML577', 'ORGANIZATION OF INFORMATION II: SUBJECT ANALYSIS AND ACCESS TO INFORMATION'], ['IML588', 'DIGITAL PUBLISHING'], ['IML590', 'INFORMATION SOURCES AND SERVICES'], ['IML592', 'LIBRARIES AND MEDIA CENTERS MANAGEMENT'], ['IMR533', 'INFORMATION ETHICS AND LAW'], ['TMC501', 'INTRODUCTORY MANDARIN (LEVEL III)']],
        5: [['EET699', 'ENGLISH EXIT TEST'], ['ICM573', 'CORPORATE COMMUNICATION FOR INFORMATION PROFESSIONAL'], ['IML625', 'DIGITAL LIBRARIES PRINCIPLES AND APPLICATIONS'], ['IML630', 'LIBRARY ANALYTICS AND METRICS'], ['IML633', 'PUBLIC RELATIONS AND COMMUNITY ENGAGEMENT'], ['IML636', 'RESEARCH METHODS IN LIBRARY AND INFORMATION SCIENCE'], ['IMS561', 'WEB PUBLISHING']],
        6: [['IMC690', 'INDUSTRIAL TRAINING'], ['IML699', 'INDEPENDENT STUDY']]
      }
    },
    CDIM261: {
      name: 'Record Management',
      incompleteSemesters: [1, 2, 3, 4, 5, 6],
      semesters: {
        3: [['CTU552', 'PHILOSOPHY AND CURRENT ISSUES'], ['ENT530', 'PRINCIPLES OF ENTREPRENEURSHIP'], ['LCC402', 'ENGLISH FOR ORAL REPORTING'], ['TMC451', 'THIRD LANGUAGE (LEVEL II)'], ['IMC501', 'INFORMATION ANALYTICS'], ['IMR511', 'THEOLOGICAL INFORMATION MANAGEMENT'], ['IMR512', 'FILE PLAN DEVELOPMENT AND APPRAISAL']],
        4: [['TMC501', 'THIRD LANGUAGE (LEVEL III)'], ['LCC501', 'ENGLISH FOR PROFESSIONAL CORRESPONDENCE'], ['CTU554', 'VALUES AND CIVILIZATION II'], ['IMR542', 'RECORDS AND INFORMATION GOVERNANCE'], ['IMR543', 'DIGITAL INFORMATION FORENSICS'], ['IMR544', 'ARCHIVAL PRESERVATION AND TECHNIQUES']],
        5: [['IMR621', 'ORAL HISTORY AND DOCUMENTATION OF CULTURAL HERITAGE'], ['IMR605', 'ARCHIVAL ARRANGEMENT AND DESCRIPTION'], ['IMR623', 'ELECTRONIC RECORDS MANAGEMENT'], ['IMR624', 'RESEARCH AND DEVELOPMENT IN RECORDS MANAGEMENT AND ARCHIVES ADMINISTRATION']],
        6: [['IMC690', 'INDUSTRIAL TRAINING'], ['IMR680', 'RECORDS MANAGEMENT PROJECT']]
      }
    },
    CDIM263: {
      name: 'Information Content',
      incompleteSemesters: [1, 2, 3, 4, 5, 6],
      semesters: {}
    }
  };

  var seedStaff = [
    { id: 'staff1', name: 'Wajihah', email: 'wajihah@studnest.edu.my', password: 'admin123', role: 'Administrator' },
    { id: 'staff2', name: 'Hafiz Rahman', email: 'hafiz.rahman@studnest.edu.my', password: 'staff123', role: 'Instructor' },
    { id: 'staff3', name: 'Faridah Hassan', email: 'faridah.hassan@studnest.edu.my', password: 'staff123', role: 'Advisor' }
  ];

  window.StudNest = window.StudNest || {};
  window.StudNest.seed = {
    STUDENT_DEFAULT_PASSWORD: STUDENT_DEFAULT_PASSWORD,
    STAFF_ACCOUNT: { email: 'wajihah@studnest.edu.my', name: 'Wajihah', password: 'admin123', label: 'Admin / Staff' },
    subjects: seedSubjects,
    assignments: seedAssignments,
    students: seedStudents,
    sections: seedSections,
    enrolments: seedEnrolments,
    announcements: seedAnnouncements,
    submissions: seedSubmissions,
    staff: seedStaff,
    programmeCurriculum: programmeCurriculum,
    ROLE_PERMISSIONS: {
      Administrator: 'Manage subjects, sections, students, announcements, grades, reports, and staff access',
      Instructor: 'Manage assigned sections, publish class notices, review submissions, and record grades',
      Advisor: 'View student directory, enrolments, and progress reports'
    }
  };
}());
