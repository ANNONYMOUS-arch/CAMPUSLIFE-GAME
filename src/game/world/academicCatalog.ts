/**
 * Maintainable Placeholder Academic Catalogue for Campus Life (Phase 1.1).
 *
 * NOTE: The faculties, departments, and courses below are clearly marked
 * placeholder entries so an approved institutional academic catalogue can be
 * dropped in later without modifying admission UI or validation logic.
 */

import type { AcademicLevel, AcademicProfile } from '../types/game';

export interface AcademicCourseItem {
  id: string;
  departmentId: string;
  code: string;
  name: string;
  isPlaceholder: true;
}

export interface AcademicDepartmentItem {
  id: string;
  facultyId: string;
  name: string;
  isPlaceholder: true;
}

export interface AcademicFacultyItem {
  id: string;
  name: string;
  isPlaceholder: true;
}

export const ACADEMIC_LEVELS: ReadonlyArray<{ id: AcademicLevel; label: string }> = [
  { id: 100, label: '100 Level' },
  { id: 200, label: '200 Level' },
  { id: 300, label: '300 Level' },
  { id: 400, label: '400 Level' },
  { id: 500, label: '500 Level' },
];

export const PLACEHOLDER_FACULTIES: ReadonlyArray<AcademicFacultyItem> = [
  { id: 'engineering', name: 'Faculty of Engineering', isPlaceholder: true },
  { id: 'sciences', name: 'Faculty of Sciences & Computing', isPlaceholder: true },
  { id: 'management', name: 'Faculty of Management & Social Sciences', isPlaceholder: true },
  { id: 'arts', name: 'Faculty of Arts & Humanities', isPlaceholder: true },
];

export const PLACEHOLDER_DEPARTMENTS: ReadonlyArray<AcademicDepartmentItem> = [
  { id: 'civil-eng', facultyId: 'engineering', name: 'Civil Engineering', isPlaceholder: true },
  { id: 'electrical-eng', facultyId: 'engineering', name: 'Electrical & Electronics Engineering', isPlaceholder: true },
  { id: 'mechanical-eng', facultyId: 'engineering', name: 'Mechanical Engineering', isPlaceholder: true },

  { id: 'computer-science', facultyId: 'sciences', name: 'Computer Science', isPlaceholder: true },
  { id: 'biochemistry', facultyId: 'sciences', name: 'Biochemistry & Microbiology', isPlaceholder: true },

  { id: 'economics', facultyId: 'management', name: 'Economics', isPlaceholder: true },
  { id: 'accounting', facultyId: 'management', name: 'Accounting & Business Administration', isPlaceholder: true },
  { id: 'mass-comm', facultyId: 'management', name: 'Mass Communication', isPlaceholder: true },

  { id: 'english', facultyId: 'arts', name: 'English & Literary Studies', isPlaceholder: true },
  { id: 'history', facultyId: 'arts', name: 'History & International Studies', isPlaceholder: true },
];

export const PLACEHOLDER_COURSES: ReadonlyArray<AcademicCourseItem> = [
  { id: 'beng-civil', departmentId: 'civil-eng', code: 'CVE', name: 'B.Eng. Civil Engineering', isPlaceholder: true },
  { id: 'beng-structural', departmentId: 'civil-eng', code: 'STE', name: 'B.Eng. Structural Engineering', isPlaceholder: true },

  { id: 'beng-electrical', departmentId: 'electrical-eng', code: 'EEE', name: 'B.Eng. Electrical & Electronics Engineering', isPlaceholder: true },
  { id: 'beng-computer', departmentId: 'electrical-eng', code: 'CPE', name: 'B.Eng. Computer Engineering', isPlaceholder: true },

  { id: 'beng-mechanical', departmentId: 'mechanical-eng', code: 'MEE', name: 'B.Eng. Mechanical Engineering', isPlaceholder: true },
  { id: 'beng-mechatronics', departmentId: 'mechanical-eng', code: 'MCT', name: 'B.Eng. Mechatronics Engineering', isPlaceholder: true },

  { id: 'bsc-cs', departmentId: 'computer-science', code: 'CSC', name: 'B.Sc. Computer Science', isPlaceholder: true },
  { id: 'bsc-se', departmentId: 'computer-science', code: 'SEN', name: 'B.Sc. Software Engineering', isPlaceholder: true },

  { id: 'bsc-biochem', departmentId: 'biochemistry', code: 'BCH', name: 'B.Sc. Biochemistry', isPlaceholder: true },
  { id: 'bsc-microbio', departmentId: 'biochemistry', code: 'MCB', name: 'B.Sc. Microbiology', isPlaceholder: true },

  { id: 'bsc-economics', departmentId: 'economics', code: 'ECN', name: 'B.Sc. Economics', isPlaceholder: true },
  { id: 'bsc-finance', departmentId: 'economics', code: 'FIN', name: 'B.Sc. Banking & Finance', isPlaceholder: true },

  { id: 'bsc-accounting', departmentId: 'accounting', code: 'ACC', name: 'B.Sc. Accounting', isPlaceholder: true },
  { id: 'bsc-bus-admin', departmentId: 'accounting', code: 'BUS', name: 'B.Sc. Business Administration', isPlaceholder: true },

  { id: 'bsc-mass-comm', departmentId: 'mass-comm', code: 'MCM', name: 'B.Sc. Mass Communication', isPlaceholder: true },

  { id: 'ba-english', departmentId: 'english', code: 'ENG', name: 'B.A. English Language', isPlaceholder: true },
  { id: 'ba-literature', departmentId: 'english', code: 'LIT', name: 'B.A. Literature in English', isPlaceholder: true },

  { id: 'ba-history', departmentId: 'history', code: 'HIS', name: 'B.A. History & International Studies', isPlaceholder: true },
];

export const DEFAULT_ACADEMIC_PROFILE: AcademicProfile = {
  facultyId: '',
  departmentId: '',
  courseId: '',
  level: null,
  admitted: false,
};

export function getFacultyById(facultyId: string): AcademicFacultyItem | undefined {
  return PLACEHOLDER_FACULTIES.find((f) => f.id === facultyId);
}

export function getDepartmentsForFaculty(facultyId: string): ReadonlyArray<AcademicDepartmentItem> {
  if (!facultyId) return [];
  return PLACEHOLDER_DEPARTMENTS.filter((d) => d.facultyId === facultyId);
}

export function getDepartmentById(departmentId: string): AcademicDepartmentItem | undefined {
  return PLACEHOLDER_DEPARTMENTS.find((d) => d.id === departmentId);
}

export function getCoursesForDepartment(departmentId: string): ReadonlyArray<AcademicCourseItem> {
  if (!departmentId) return [];
  return PLACEHOLDER_COURSES.filter((c) => c.departmentId === departmentId);
}

export function getCourseById(courseId: string): AcademicCourseItem | undefined {
  return PLACEHOLDER_COURSES.find((c) => c.id === courseId);
}

export function isValidAcademicLevel(value: unknown): value is AcademicLevel {
  return value === 100 || value === 200 || value === 300 || value === 400 || value === 500;
}

export interface AdmissionValidationErrors {
  faculty?: string;
  department?: string;
  course?: string;
  level?: string;
}

export interface AdmissionValidationResult {
  valid: boolean;
  errors: AdmissionValidationErrors;
}

export function validateAcademicAdmission(profile: AcademicProfile): AdmissionValidationResult {
  const errors: AdmissionValidationErrors = {};
  const faculty = getFacultyById(profile.facultyId);
  if (!faculty) {
    errors.faculty = 'Select a faculty.';
  }

  const department = getDepartmentById(profile.departmentId);
  if (!department || (faculty && department.facultyId !== faculty.id)) {
    errors.department = 'Select a department in your faculty.';
  }

  const course = getCourseById(profile.courseId);
  if (!course || (department && course.departmentId !== department.id)) {
    errors.course = 'Select a course in your department.';
  }

  if (!isValidAcademicLevel(profile.level)) {
    errors.level = 'Select an academic level (100–500).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function sanitizeAcademicProfile(raw: unknown): AcademicProfile {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_ACADEMIC_PROFILE };
  }
  const obj = raw as Record<string, unknown>;
  const facultyId = typeof obj.facultyId === 'string' && getFacultyById(obj.facultyId) ? obj.facultyId : '';
  const deptObj = typeof obj.departmentId === 'string' ? getDepartmentById(obj.departmentId) : undefined;
  const departmentId = deptObj && deptObj.facultyId === facultyId ? deptObj.id : '';
  const courseObj = typeof obj.courseId === 'string' ? getCourseById(obj.courseId) : undefined;
  const courseId = courseObj && courseObj.departmentId === departmentId ? courseObj.id : '';
  const level = isValidAcademicLevel(obj.level) ? obj.level : null;

  const candidate: AcademicProfile = {
    facultyId,
    departmentId,
    courseId,
    level,
    admitted: false,
  };
  const check = validateAcademicAdmission(candidate);
  return {
    ...candidate,
    admitted: Boolean(obj.admitted) && check.valid,
  };
}
