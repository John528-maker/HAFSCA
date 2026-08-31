export const PROGRESS_STORAGE_KEY = "ai-research-lab.progress.v1";
export const PROGRESS_SCHEMA_VERSION = 1;

export interface ProgressV1 {
  schemaVersion: 1;
  curriculumVersion: number;
  lastLessonSlug: string | null;
  completedSlugs: string[];
  updatedAt: number;
}

export function emptyProgress(curriculumVersion: number): ProgressV1 {
  return {
    schemaVersion: 1,
    curriculumVersion,
    lastLessonSlug: null,
    completedSlugs: [],
    updatedAt: 0,
  };
}

function isSlug(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length < 80;
}

/** Pure parser. Unknown slugs are dropped. Malformed input → empty. */
export function parseProgress(
  raw: unknown,
  knownSlugs: readonly string[],
  curriculumVersion: number,
): ProgressV1 {
  const empty = emptyProgress(curriculumVersion);
  if (raw === null || typeof raw !== "object") return empty;
  const record = raw as Record<string, unknown>;
  if (record.schemaVersion !== PROGRESS_SCHEMA_VERSION) return empty;
  const known = new Set(knownSlugs);
  const last =
    isSlug(record.lastLessonSlug) && known.has(record.lastLessonSlug)
      ? record.lastLessonSlug
      : null;
  const completed = Array.isArray(record.completedSlugs)
    ? record.completedSlugs.filter(
        (slug): slug is string => isSlug(slug) && known.has(slug),
      )
    : [];
  const unique = [...new Set(completed)];
  const updatedAt =
    typeof record.updatedAt === "number" && Number.isFinite(record.updatedAt)
      ? record.updatedAt
      : 0;
  return {
    schemaVersion: 1,
    curriculumVersion,
    lastLessonSlug: last,
    completedSlugs: unique,
    updatedAt,
  };
}

const listeners = new Set<() => void>();
let cached: ProgressV1 | null = null;
let cachedRaw: string | null = null;
let cachedVersion = -1;

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeProgress(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function loadProgress(
  knownSlugs: readonly string[],
  curriculumVersion: number,
): ProgressV1 {
  if (typeof window === "undefined") return emptyProgress(curriculumVersion);
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (
      cached &&
      cachedRaw === raw &&
      cachedVersion === curriculumVersion
    ) {
      return cached;
    }
    cachedRaw = raw;
    cachedVersion = curriculumVersion;
    cached = raw
      ? parseProgress(JSON.parse(raw), knownSlugs, curriculumVersion)
      : emptyProgress(curriculumVersion);
    return cached;
  } catch {
    cached = emptyProgress(curriculumVersion);
    cachedRaw = null;
    cachedVersion = curriculumVersion;
    return cached;
  }
}

export function saveProgress(progress: ProgressV1): void {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(progress);
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, raw);
    cached = progress;
    cachedRaw = raw;
    cachedVersion = progress.curriculumVersion;
    emit();
  } catch {
    cached = progress;
    emit();
  }
}

export function touchLastLesson(
  slug: string,
  knownSlugs: readonly string[],
  curriculumVersion: number,
): ProgressV1 {
  const current = loadProgress(knownSlugs, curriculumVersion);
  if (!knownSlugs.includes(slug)) return current;
  if (current.lastLessonSlug === slug) return current;
  const next: ProgressV1 = {
    ...current,
    lastLessonSlug: slug,
    updatedAt: Date.now(),
  };
  saveProgress(next);
  return next;
}

export function toggleLessonComplete(
  slug: string,
  knownSlugs: readonly string[],
  curriculumVersion: number,
): ProgressV1 {
  const current = loadProgress(knownSlugs, curriculumVersion);
  if (!knownSlugs.includes(slug)) return current;
  const has = current.completedSlugs.includes(slug);
  const completedSlugs = has
    ? current.completedSlugs.filter((item) => item !== slug)
    : [...current.completedSlugs, slug];
  const next: ProgressV1 = {
    ...current,
    lastLessonSlug: slug,
    completedSlugs,
    updatedAt: Date.now(),
  };
  saveProgress(next);
  return next;
}
