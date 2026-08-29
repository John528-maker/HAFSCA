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
      en: "The published spine: models, calculus, gradient descent, generalization, overfitting, interpolation, then the flagship lab.",
      ko: "공개된 척추: 모델, 미적분, 경사 하강, 일반화, 과적합, 보간, 그리고 대표 실험.",
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
