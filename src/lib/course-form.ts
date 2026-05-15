import { z } from "zod";
import { formInt, formPositiveInt } from "@/lib/form-numbers";
import type { CourseDto, CoursePayload } from "@/types/api";

const semesterRowSchema = z.object({
  semester: formInt(1, 8),
});

export const courseFormSchema = z
  .object({
    code: z.string().min(1),
    title: z.string().min(1),
    description: z.string().max(8000),
    espb: formPositiveInt(1),
    professorId: z.string(),
    semesters: z.array(semesterRowSchema),
    bookIds: z.array(z.number().int().positive()),
  })
  .refine(
    (data) => new Set(data.semesters.map((s) => s.semester)).size === data.semesters.length,
    { message: "Each study-program semester must be unique", path: ["semesters"] },
  )
  .refine((data) => new Set(data.bookIds).size === data.bookIds.length, {
    message: "Each book can only be added once",
    path: ["bookIds"],
  });

export type CourseFormValues = z.input<typeof courseFormSchema>;
export type CourseFormOutput = z.output<typeof courseFormSchema>;

export function defaultCourseSemesters(): CourseFormValues["semesters"] {
  return [{ semester: 1 }];
}

export function courseFormValuesFromDto(c: CourseDto): CourseFormValues {
  return {
    code: c.code,
    title: c.title,
    description: c.description ?? "",
    espb: c.espb,
    professorId: c.professorId != null ? String(c.professorId) : "",
    semesters:
      c.semesters.length > 0
        ? c.semesters.map((s) => ({ semester: s.semester }))
        : defaultCourseSemesters(),
    bookIds: (c.books ?? []).map((b) => b.id),
  };
}

export function courseFormToPayload(v: CourseFormOutput): CoursePayload {
  const prof = v.professorId.trim();
  const desc = v.description.trim();
  return {
    code: v.code.trim(),
    title: v.title.trim(),
    description: desc === "" ? null : desc,
    espb: v.espb,
    professorId: prof === "" ? null : Number(prof),
    semesters: v.semesters.map((s) => ({ semester: s.semester })),
    bookIds: v.bookIds ?? [],
  };
}

export const emptyCourseFormValues: CourseFormValues = {
  code: "",
  title: "",
  description: "",
  espb: "",
  professorId: "",
  semesters: [],
  bookIds: [],
};
