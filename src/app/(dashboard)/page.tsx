import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/professors", label: "Professors" },
  { href: "/students", label: "Students" },
  { href: "/courses", label: "Courses" },
  { href: "/course-semesters", label: "Course semesters" },
  { href: "/enrollments", label: "Enrollments" },
  { href: "/exams", label: "Exams" },
  { href: "/authors", label: "Authors" },
  { href: "/books", label: "Books" },
  { href: "/course-books", label: "Course books" },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>
            Choose a section from the sidebar to manage catalog data. All list views support
            pagination (Spring PagedModel: <code className="text-xs">content</code> +{" "}
            <code className="text-xs">page</code>).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(buttonVariants({ variant: "secondary" }))}
            >
              {l.label}
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
