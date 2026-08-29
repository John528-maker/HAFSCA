import { isExperimentId } from "../experiments/registry.ts";
import { LOCALES, type CourseLocale } from "../lib/locales.ts";

export type Difficulty = "intro" | "core" | "advanced";

export interface LessonMeta {
  slug: string;
  order: number;
  difficulty: Difficulty;
  title: Record<CourseLocale, string>;
  summary: Record<CourseLocale, string>;
  prerequisites: string[];
  experimentId?: string;
  /** When false, the route renders a Coming page instead of MDX. */
  published: boolean;
}

export const LESSONS: LessonMeta[] = [
  {
    slug: "functions-and-parameters",
    order: 1,
    difficulty: "intro",
    title: {
      en: "Functions and parameters",
      ko: "함수와 매개변수",
    },
    summary: {
      en: "A model is a function whose shape is decided by parameters.",
      ko: "모델은 매개변수가 모양을 정하는 함수입니다.",
    },
    prerequisites: [],
    published: true,
  },
  {
    slug: "linear-regression",
    order: 2,
    difficulty: "intro",
    title: { en: "Linear regression", ko: "선형 회귀" },
    summary: {
      en: "The line that is linear in the parameters, not necessarily in x.",
      ko: "x에 대해 직선일 필요는 없고, 매개변수에 대해 선형인 모델입니다.",
    },
    prerequisites: ["functions-and-parameters"],
    experimentId: "linear-regression",
    published: true,
  },
  {
    slug: "loss-function",
    order: 3,
    difficulty: "intro",
    title: { en: "Loss function", ko: "손실 함수" },
    summary: {
      en: "Mean squared error is the number the charts already plot.",
      ko: "평균 제곱 오차는 사이트가 이미 그리는 그 숫자입니다.",
    },
    prerequisites: ["linear-regression"],
    published: true,
  },
  {
    slug: "polynomial-regression",
    order: 4,
    difficulty: "intro",
    title: { en: "Polynomial regression", ko: "다항 회귀" },
    summary: {
      en: "Complexity becomes a knob before you meet the gradient.",
      ko: "기울기를 만나기 전에 복잡도를 손잡이로 만집니다.",
    },
    prerequisites: ["linear-regression"],
    published: true,
  },
  {
    slug: "derivative",
    order: 5,
    difficulty: "core",
    title: { en: "Derivative", ko: "도함수" },
    summary: {
      en: "Slope of the loss with respect to one parameter.",
      ko: "한 매개변수에 대한 손실의 기울기입니다.",
    },
    prerequisites: ["loss-function"],
    published: true,
  },
  {
    slug: "partial-derivative",
    order: 6,
    difficulty: "core",
    title: { en: "Partial derivative", ko: "편도함수" },
    summary: {
      en: "Hold the other parameters fixed and differentiate one.",
      ko: "나머지 매개변수를 고정하고 하나만 미분합니다.",
    },
    prerequisites: ["derivative"],
    published: true,
  },
  {
    slug: "gradient",
    order: 7,
    difficulty: "core",
    title: { en: "Gradient", ko: "기울기 벡터" },
    summary: {
      en: "The vector of all partial derivatives — the uphill direction.",
      ko: "모든 편도함수를 모은 벡터, 곧 오르막 방향입니다.",
    },
    prerequisites: ["partial-derivative"],
    experimentId: "activations",
    published: true,
  },
  {
    slug: "gradient-descent",
    order: 8,
    difficulty: "core",
    title: { en: "Gradient descent", ko: "경사 하강법" },
    summary: {
      en: "Step opposite the gradient. Too large a step diverges.",
      ko: "기울기 반대 방향으로 한 걸음. 너무 크면 발산합니다.",
    },
    prerequisites: ["gradient"],
    experimentId: "gradient-descent",
    published: true,
  },
  {
    slug: "optimization",
    order: 9,
    difficulty: "core",
    title: { en: "Optimization", ko: "최적화" },
    summary: {
      en: "Bowls, valleys, and why the landscape shape matters.",
      ko: "사발과 골짜기, 그리고 지형이 중요한 이유입니다.",
    },
    prerequisites: ["gradient-descent"],
    published: true,
  },
  {
    slug: "normal-equations",
    order: 10,
    difficulty: "core",
    title: { en: "Normal equations", ko: "정규 방정식" },
    summary: {
      en: "The same loss, solved by setting the gradient to zero.",
      ko: "같은 손실을 기울기 = 0으로 한 번에 풉니다.",
    },
    prerequisites: ["loss-function"],
    published: true,
  },
  {
    slug: "generalization",
    order: 11,
    difficulty: "intro",
    title: { en: "Generalization", ko: "일반화" },
    summary: {
      en: "Train error is not the question. Unseen error is.",
      ko: "학습 오차가 질문이 아닙니다. 보지 못한 오차가 질문입니다.",
    },
    prerequisites: ["loss-function"],
    published: true,
  },
  {
    slug: "overfitting",
    order: 12,
    difficulty: "core",
    title: { en: "Overfitting", ko: "과적합" },
    summary: {
      en: "Training error can fall while test error rises.",
      ko: "학습 오차는 내려가도 테스트 오차는 올라갈 수 있습니다.",
    },
    prerequisites: ["linear-regression"],
    experimentId: "overfitting",
    published: true,
  },
  {
    slug: "regularization",
    order: 13,
    difficulty: "core",
    title: { en: "Regularization", ko: "정규화" },
    summary: {
      en: "A penalty on complexity. The engine already uses a tiny ridge.",
      ko: "복잡도에 벌점을 줍니다. 엔진은 이미 작은 ridge를 씁니다.",
    },
    prerequisites: ["overfitting"],
    experimentId: "ridge",
    published: true,
  },
  {
    slug: "interpolation-threshold",
    order: 14,
    difficulty: "core",
    title: { en: "Interpolation threshold", ko: "보간 임계값" },
    summary: {
      en: "When parameters catch up with training points, p = n.",
      ko: "매개변수 수가 학습 점 수와 같아지는 지점, p = n입니다.",
    },
    prerequisites: ["overfitting"],
    published: true,
  },
  {
    slug: "conditioning",
    order: 15,
    difficulty: "advanced",
    title: { en: "Conditioning", ko: "조건수" },
    summary: {
      en: "A correct formula can still explode when p approaches n.",
      ko: "공식이 맞아도 p가 n에 가까워지면 숫자가 터질 수 있습니다.",
    },
    prerequisites: ["interpolation-threshold"],
    published: true,
  },
  {
    slug: "double-descent",
    order: 16,
    difficulty: "advanced",
    title: { en: "Double descent", ko: "이중 하강" },
    summary: {
      en: "A real variance explosion near interpolation, then partial recovery.",
      ko: "보간 근처의 실제 분산 폭증, 그리고 부분 회복입니다.",
    },
    prerequisites: ["overfitting"],
    experimentId: "double-descent",
    published: true,
  },
  {
    slug: "neural-network",
    order: 17,
    difficulty: "advanced",
    title: { en: "Neural networks", ko: "신경망" },
    summary: {
      en: "Composed functions. Depth without a nonlinearity is still one affine map.",
      ko: "합성된 함수. 비선형이 없으면 깊어도 아핀 하나와 같습니다.",
    },
    prerequisites: ["gradient-descent"],
    published: true,
  },
  {
    slug: "backpropagation",
    order: 18,
    difficulty: "advanced",
    title: { en: "Backpropagation", ko: "역전파" },
    summary: {
      en: "The chain rule applied through a composed model.",
      ko: "합성 모델에 연쇄 법칙을 적용합니다.",
    },
    prerequisites: ["neural-network", "gradient"],
    experimentId: "activations",
    published: true,
  },
];

export const LESSON_BY_SLUG = new Map(LESSONS.map((lesson) => [lesson.slug, lesson]));

export function getLesson(slug: string): LessonMeta | undefined {
  return LESSON_BY_SLUG.get(slug);
}

export function publishedLessons(): LessonMeta[] {
  return LESSONS.filter((lesson) => lesson.published);
}

export function lessonPath(locale: CourseLocale, slug: string): string {
  return `/${locale}/learn/${slug}`;
}

export function generateLessonParams(): Array<{ lang: string; slug: string }> {
  return LOCALES.flatMap((lang) =>
    LESSONS.map((lesson) => ({ lang, slug: lesson.slug })),
  );
}

export function previousPublished(slug: string): LessonMeta | null {
  const current = getLesson(slug);
  if (!current) return null;
  const earlier = publishedLessons().filter((lesson) => lesson.order < current.order);
  return earlier.at(-1) ?? null;
}

export function nextPublished(slug: string): LessonMeta | null {
  const current = getLesson(slug);
  if (!current) return null;
  return publishedLessons().find((lesson) => lesson.order > current.order) ?? null;
}

/** Throws if the curriculum graph has a cycle or a missing prerequisite. */
export function assertCurriculumDag(): void {
  const known = new Set(LESSONS.map((lesson) => lesson.slug));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(slug: string): void {
    if (visited.has(slug)) return;
    if (visiting.has(slug)) {
      throw new Error(`curriculum cycle at ${slug}`);
    }
    visiting.add(slug);
    const lesson = getLesson(slug);
    if (!lesson) throw new Error(`unknown lesson ${slug}`);
    for (const pre of lesson.prerequisites) {
      if (!known.has(pre)) {
        throw new Error(`${slug} prerequisite ${pre} does not exist`);
      }
      visit(pre);
    }
    visiting.delete(slug);
    visited.add(slug);
  }

  for (const lesson of LESSONS) visit(lesson.slug);

  for (const lesson of LESSONS) {
    if (lesson.experimentId && !isExperimentId(lesson.experimentId)) {
      throw new Error(`unregistered experiment ${lesson.experimentId}`);
    }
  }
}
