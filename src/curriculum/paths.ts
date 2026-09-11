export interface LearningPath {
  id: string;
  title: { en: string; ko: string };
  description: { en: string; ko: string };
  slugs: string[];
}

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: "start",
    title: { en: "Start here", ko: "여기서 시작" },
    description: {
      en: "The published spine: models, calculus, generalization, interpolation, then composed functions.",
      ko: "공개된 척추: 모델, 미적분, 일반화, 보간, 그리고 합성된 함수.",
    },
    slugs: [
      "functions-and-parameters",
      "linear-regression",
      "loss-function",
      "polynomial-regression",
      "derivative",
      "partial-derivative",
      "gradient",
      "gradient-descent",
      "optimization",
      "normal-equations",
      "generalization",
      "overfitting",
      "regularization",
      "interpolation-threshold",
      "conditioning",
      "double-descent",
      "neural-network",
      "backpropagation",
    ],
  },
  {
    id: "lab",
    title: { en: "I came for the lab", ko: "실험만 보러 왔습니다" },
    description: {
      en: "Jump to the interpolation experiment. Read the briefing on the lesson page first.",
      ko: "보간 실험으로 바로 갑니다. 수업 페이지의 짧은 안내를 먼저 읽으세요.",
    },
    slugs: ["double-descent"],
  },
];

export function getPath(id: string): LearningPath | undefined {
  return LEARNING_PATHS.find((path) => path.id === id);
}

export const DEFAULT_PATH_ID = "start";

export function resolvePathId(pathId: string | null | undefined): string {
  if (pathId && getPath(pathId)) return pathId;
  return DEFAULT_PATH_ID;
}

/** Neighbors along an active learning path (falls back to start). */
export function pathNeighbors(
  slug: string,
  pathId: string | null | undefined,
): { prevSlug: string | null; nextSlug: string | null; pathId: string } {
  const id = resolvePathId(pathId);
  const path = getPath(id)!;
  const index = path.slugs.indexOf(slug);
  if (index < 0) {
    return { prevSlug: null, nextSlug: null, pathId: id };
  }
  return {
    prevSlug: index > 0 ? path.slugs[index - 1]! : null,
    nextSlug: index < path.slugs.length - 1 ? path.slugs[index + 1]! : null,
    pathId: id,
  };
}

/** Course-map acts for Fit / Generalize / Scale grouping. */
export const COURSE_ACTS: Array<{
  id: "fit" | "generalize" | "scale";
  slugSet: ReadonlySet<string>;
}> = [
  {
    id: "fit",
    slugSet: new Set([
      "functions-and-parameters",
      "linear-regression",
      "loss-function",
      "polynomial-regression",
      "derivative",
      "partial-derivative",
      "gradient",
      "gradient-descent",
      "optimization",
      "normal-equations",
    ]),
  },
  {
    id: "generalize",
    slugSet: new Set([
      "generalization",
      "overfitting",
      "regularization",
    ]),
  },
  {
    id: "scale",
    slugSet: new Set([
      "interpolation-threshold",
      "conditioning",
      "double-descent",
      "neural-network",
      "backpropagation",
    ]),
  },
];

export function actForSlug(
  slug: string,
): "fit" | "generalize" | "scale" | null {
  for (const act of COURSE_ACTS) {
    if (act.slugSet.has(slug)) return act.id;
  }
  return null;
}
