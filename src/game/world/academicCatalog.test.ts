import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACADEMIC_LEVELS,
  DEFAULT_ACADEMIC_PROFILE,
  getCoursesForDepartment,
  getDepartmentsForFaculty,
  PLACEHOLDER_COURSES,
  PLACEHOLDER_DEPARTMENTS,
  PLACEHOLDER_FACULTIES,
  sanitizeAcademicProfile,
  validateAcademicAdmission,
} from './academicCatalog';

test('default academic profile does not automatically assign faculty, department, course, or level', () => {
  assert.equal(DEFAULT_ACADEMIC_PROFILE.facultyId, '');
  assert.equal(DEFAULT_ACADEMIC_PROFILE.departmentId, '');
  assert.equal(DEFAULT_ACADEMIC_PROFILE.courseId, '');
  assert.equal(DEFAULT_ACADEMIC_PROFILE.level, null);
  assert.equal(DEFAULT_ACADEMIC_PROFILE.admitted, false);

  const check = validateAcademicAdmission(DEFAULT_ACADEMIC_PROFILE);
  assert.equal(check.valid, false);
  assert.ok(check.errors.faculty);
  assert.ok(check.errors.department);
  assert.ok(check.errors.course);
  assert.ok(check.errors.level);
});

test('placeholder academic catalogue entries are marked as placeholders and maintain hierarchy integrity', () => {
  assert.ok(PLACEHOLDER_FACULTIES.length >= 4);
  assert.ok(PLACEHOLDER_DEPARTMENTS.length >= 8);
  assert.ok(PLACEHOLDER_COURSES.length >= 12);
  assert.equal(ACADEMIC_LEVELS.length, 5);

  for (const fac of PLACEHOLDER_FACULTIES) {
    assert.equal(fac.isPlaceholder, true);
    const depts = getDepartmentsForFaculty(fac.id);
    assert.ok(depts.length > 0, `Faculty ${fac.id} should have departments`);
    for (const dept of depts) {
      assert.equal(dept.isPlaceholder, true);
      assert.equal(dept.facultyId, fac.id);
      const courses = getCoursesForDepartment(dept.id);
      assert.ok(courses.length > 0, `Department ${dept.id} should have courses`);
      for (const course of courses) {
        assert.equal(course.isPlaceholder, true);
        assert.equal(course.departmentId, dept.id);
      }
    }
  }
});

test('validateAcademicAdmission rejects cross-faculty or cross-department mismatches', () => {
  const mismatchDept = validateAcademicAdmission({
    facultyId: 'engineering',
    departmentId: 'computer-science', // belongs to sciences
    courseId: 'bsc-cs',
    level: 200,
    admitted: false,
  });
  assert.equal(mismatchDept.valid, false);
  assert.ok(mismatchDept.errors.department);

  const mismatchCourse = validateAcademicAdmission({
    facultyId: 'sciences',
    departmentId: 'computer-science',
    courseId: 'beng-civil', // belongs to civil-eng
    level: 300,
    admitted: false,
  });
  assert.equal(mismatchCourse.valid, false);
  assert.ok(mismatchCourse.errors.course);

  const validPlacement = validateAcademicAdmission({
    facultyId: 'sciences',
    departmentId: 'computer-science',
    courseId: 'bsc-cs',
    level: 100,
    admitted: true,
  });
  assert.equal(validPlacement.valid, true);
  assert.deepEqual(validPlacement.errors, {});
});

test('sanitizeAcademicProfile strips mismatched hierarchy and invalid levels safely', () => {
  const cleaned = sanitizeAcademicProfile({
    facultyId: 'engineering',
    departmentId: 'economics', // invalid for engineering
    courseId: 'bsc-economics',
    level: 900,
    admitted: true,
  });
  assert.equal(cleaned.facultyId, 'engineering');
  assert.equal(cleaned.departmentId, '');
  assert.equal(cleaned.courseId, '');
  assert.equal(cleaned.level, null);
  assert.equal(cleaned.admitted, false);

  const validRestored = sanitizeAcademicProfile({
    facultyId: 'management',
    departmentId: 'accounting',
    courseId: 'bsc-accounting',
    level: 400,
    admitted: true,
  });
  assert.equal(validRestored.facultyId, 'management');
  assert.equal(validRestored.departmentId, 'accounting');
  assert.equal(validRestored.courseId, 'bsc-accounting');
  assert.equal(validRestored.level, 400);
  assert.equal(validRestored.admitted, true);
});
