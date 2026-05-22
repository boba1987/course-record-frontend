import { z } from "zod";
import { formInt, formPositiveInt } from "@/lib/form-numbers";
import type { CourseDto, CoursePayload } from "@/types/api";

const studyProgramRowSchema = z.object({
  studyProgramId: z.string().min(1, "Select a study program"),
  semester: formInt(1, 8),
});

export const courseFormSchema = z
  .object({
    code: z.string().min(1),
    title: z.string().min(1),
    description: z.string().max(8000),
    espb: formPositiveInt(1),
    professorId: z.string(),
    studyPrograms: z.array(studyProgramRowSchema),
    bookIds: z.array(z.number().int().positive()),
  })
  .refine(
    (data) =>
      new Set(data.studyPrograms.map((s) => s.studyProgramId)).size === data.studyPrograms.length,
    { message: "Each study program can only appear once", path: ["studyPrograms"] },
  )
  .refine((data) => new Set(data.bookIds).size === data.bookIds.length, {
    message: "Each book can only be added once",
    path: ["bookIds"],
  });

export type CourseFormValues = z.input<typeof courseFormSchema>;
export type CourseFormOutput = z.output<typeof courseFormSchema>;

export function formatCourseStudyPrograms(
  rows: { studyProgramCode: string; semester: number }[] | null | undefined,
): string {
  if (!rows || rows.length === 0) return "—";
  return rows.map((r) => `${r.studyProgramCode}:${r.semester}`).join(", ");
}

export function courseFormValuesFromDto(c: CourseDto): CourseFormValues {
  return {
    code: c.code,
    title: c.title,
    description: c.description ?? "",
    espb: c.espb,
    professorId: c.professorId != null ? String(c.professorId) : "",
    studyPrograms:
      (c.studyPrograms ?? []).length > 0
        ? (c.studyPrograms ?? []).map((s) => ({
            studyProgramId: String(s.studyProgramId),
            semester: s.semester,
          }))
        : [],
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
    studyPrograms: v.studyPrograms.map((s) => ({
      studyProgramId: Number(s.studyProgramId),
      semester: s.semester,
    })),
    bookIds: v.bookIds ?? [],
  };
}

export const emptyCourseFormValues: CourseFormValues = {
  code: "",
  title: "",
  description: "",
  espb: "",
  professorId: "",
  studyPrograms: [],
  bookIds: [],
};
