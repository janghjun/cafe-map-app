import { safeGet, safeSet } from "../utils/safeStorage";

const COURSES_KEY = "kagong_courses";

export type StudyCourse = {
  id: string;
  name: string;
  cafeIds: string[];
  createdAt: string;
};

function isStudyCourse(val: unknown): val is StudyCourse {
  return (
    typeof val === "object" &&
    val !== null &&
    typeof (val as StudyCourse).id === "string" &&
    typeof (val as StudyCourse).name === "string" &&
    Array.isArray((val as StudyCourse).cafeIds)
  );
}

function isCourseArray(val: unknown): val is StudyCourse[] {
  return Array.isArray(val) && val.every(isStudyCourse);
}

function read(): StudyCourse[] {
  return safeGet(COURSES_KEY, [], isCourseArray);
}

function write(courses: StudyCourse[]): void {
  safeSet(COURSES_KEY, courses);
}

export function getCourses(): StudyCourse[] {
  return read();
}

export function createCourse(name: string): StudyCourse {
  const course: StudyCourse = {
    id: `course_${Date.now()}`,
    name: name.trim(),
    cafeIds: [],
    createdAt: new Date().toISOString(),
  };
  write([...read(), course]);
  return course;
}

export function deleteCourse(courseId: string): void {
  write(read().filter((c) => c.id !== courseId));
}

export function addCafeToCourse(courseId: string, cafeId: string): void {
  write(
    read().map((c) =>
      c.id === courseId && !c.cafeIds.includes(cafeId)
        ? { ...c, cafeIds: [...c.cafeIds, cafeId] }
        : c
    )
  );
}

export function removeCafeFromCourse(courseId: string, cafeId: string): void {
  write(
    read().map((c) =>
      c.id === courseId
        ? { ...c, cafeIds: c.cafeIds.filter((id) => id !== cafeId) }
        : c
    )
  );
}
