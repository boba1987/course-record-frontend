/** Spring Data PagedModel JSON (VIA_DTO serialization) */
export type PageMetadata = {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
};

export type PagedModel<T> = {
  content: T[];
  page: PageMetadata;
};

export type JwtResponse = {
  accessToken: string;
  tokenType: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type ProfessorDto = { id: number; firstName: string; lastName: string };
export type ProfessorPayload = { firstName: string; lastName: string };

export type StudentDto = {
  id: number;
  indexNumber: string;
  firstName: string;
  lastName: string;
};
export type StudentPayload = {
  indexNumber: string;
  firstName: string;
  lastName: string;
};

export type StudyProgramDto = {
  id: number;
  code: string;
  name: string;
  description: string | null;
};
export type StudyProgramPayload = {
  code: string;
  name: string;
  description: string | null;
};

export type CourseStudyProgramDto = {
  id: number;
  courseId: number;
  studyProgramId: number;
  studyProgramCode: string;
  studyProgramName: string;
  semester: number;
};
export type CourseStudyProgramPayload = {
  studyProgramId: number;
  semester: number;
};
export type CourseDto = {
  id: number;
  code: string;
  title: string;
  description: string | null;
  espb: number;
  professorId: number | null;
  studyPrograms: CourseStudyProgramDto[];
  books: BookDto[];
};
export type CoursePayload = {
  code: string;
  title: string;
  description: string | null;
  espb: number;
  professorId: number | null;
  studyPrograms: CourseStudyProgramPayload[] | null;
  bookIds: number[] | null;
};

export type CourseStudyProgramUpsertPayload = {
  courseId: number;
  studyProgramId: number;
  semester: number;
};

export type EnrollmentDto = {
  id: number;
  studentId: number;
  courseId: number;
};
export type EnrollmentPayload = { studentId: number; courseId: number };

export type ExamDto = {
  id: number;
  studentId: number;
  courseId: number;
  examDate: string;
  grade: number;
};
export type ExamPayload = {
  studentId: number;
  courseId: number;
  examDate: string;
  grade: number;
};

export type AuthorDto = { id: number; firstName: string; lastName: string };
export type AuthorPayload = { firstName: string; lastName: string };

export type BookDto = {
  id: number;
  title: string;
  publicationDate: string;
  authorId: number | null;
};
export type BookPayload = {
  title: string;
  publicationDate: string;
  authorId: number | null;
};

export type CourseBookDto = {
  id: number;
  courseId: number;
  bookId: number;
};
export type CourseBookPayload = { courseId: number; bookId: number };
