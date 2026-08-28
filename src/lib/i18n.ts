import type { DoubleDescentVerdict } from "@/types/experiment";

export type Locale = "en" | "ko";

export const LOCALE_STORAGE_KEY = "ai-research-lab.locale";

const en = {
  siteName: "AI Research Lab",
  nav: { experiments: "Experiments", concepts: "Concepts", about: "About" },
  languageToggle: "한국어",
  hero: {
    eyebrow: "AI Research Lab",
    title1: "Explore Machine Learning.",
    title2: "Don't Just Learn It.",
    subtitle:
      "Run experiments, visualize models, and discover how machine learning really behaves.",
    cta: "Start Experiment",
  },
  experiment: {
    title: "Double Descent Experiment",
    description:
      "Change the settings, run the experiment, and watch how training and test error change as model complexity grows — including past the interpolation threshold.",
    settings: "Experiment Settings",
    datasetSize: "Dataset Size",
    noiseLevel: "Noise Level",
    maxComplexity: "Max Model Complexity",
    trainTestSplit: "Train / Test Split",
    splitHelp: "Fixed at 80 / 20 for this MVP.",
    randomSeed: "Random Seed",
    run: "Run Experiment",
    running: "Running…",
    degreeProgress: "Degree progress",
    interpolationHint: (deg: number, nTrain: number) =>
      `Interpolation expected near degree ${deg} (train size ${nTrain}).`,
    beyondCap:
      " This threshold is beyond the complexity cap — use a smaller dataset to observe it.",
  },
  dataset: {
    title: "Dataset",
    caption: (train: number, test: number) =>
      `y = sin(2πx) + noise · x ~ arcsine[-1,1] · train ${train} · test ${test}`,
    empty: "Run an experiment to preview the synthetic dataset.",
    input: "Input (x)",
    target: "Target (y)",
    training: "Training",
    test: "Test",
  },
  summary: {
    title: "Experiment Summary",
    empty: "Experiment summary will appear here after a run.",
    datasetSize: "Dataset Size",
    noiseLevel: "Noise Level",
    randomSeed: "Random Seed",
    bestTest: "Best Test Performance",
    bestDegree: (d: number) => `Degree ${d}`,
    interpolationThreshold: "Interpolation Threshold",
    degree: (d: number) => `Degree ${d}`,
    notReached: "Not reached",
    minTrain: "Minimum Training Error",
    minTest: "Minimum Test Error",
    doubleDescent: "Double Descent Evidence",
    beyondSweep:
      "The expected interpolation threshold (near train-set size) is beyond this sweep's max complexity. Try a smaller dataset size to observe the threshold and potential double descent.",
  },
  errorChart: {
    title: "Model Complexity vs Error",
    hint: "Click a point to inspect that model.",
    selected: (d: number) => `Selected: degree ${d}.`,
    empty: "Model complexity vs error will appear here after you run an experiment.",
    log: "Log",
    linear: "Linear",
    xAxis: "Model Complexity (degree)",
    yAxisLog: "MSE (log)",
    yAxis: "MSE",
    trainError: "Training Error",
    testError: "Test Error",
    interpolationThreshold: "Interpolation Threshold",
    degree: (d: number | string) => `Degree ${d}`,
  },
  modelExplorer: {
    title: "Selected Model",
    empty: "Select a complexity on the error chart to inspect that model.",
    polynomialDegree: "Polynomial Degree",
    parameters: "Parameters",
    trainMSE: "Training MSE",
    testMSE: "Test MSE",
    generalizationGap: "Generalization Gap",
    input: "Input (x)",
    training: "Training",
    test: "Test",
    prediction: (d: number) => `Prediction (deg ${d})`,
  },
  analysis: {
    title: "Experiment Analysis",
    subtitle: "Only patterns observed in this run are described below.",
    empty: "Automatic analysis notes will appear after an experiment.",
    underfitting:
      "At low model complexity, both training and test error are relatively high. This is consistent with underfitting: the model is too simple to capture the pattern in the data.",
    testDecreases:
      "As model complexity increases from the simplest models, test error decreases. The model is gaining enough flexibility to fit the underlying pattern.",
    threshold: (degree: number, mse?: string) =>
      `Training error first drops below the interpolation threshold near degree ${degree}` +
      (mse ? ` (train MSE ≈ ${mse})` : "") +
      ". Around this complexity the model can nearly interpolate the training set.",
    peakNearThreshold: (degree: number) =>
      `Near the interpolation threshold, training error is very low while test error rises (peak near degree ${degree}). This matches the expected behaviour around the interpolation threshold.`,
    clearDoubleDescent:
      "After the test-error peak near the interpolation region, test error decreases again as complexity grows further. This second descent is a clear instance of the double descent pattern in this run.",
    possibleDoubleDescent:
      "After a rise in test error, a later decrease is visible. This may indicate double descent, but the pattern is not strong enough to call it conclusive for this run.",
    numericalDivergence:
      "Test error increased by orders of magnitude and did not recover to a competitive level. This run shows numerical divergence, not double descent; treat the affected high-degree fits as unstable.",
    noDoubleDescent:
      "No clear second descent in test error was observed after the classical U-shaped region (or the interpolation peak). Double descent is not claimed for this run.",
  },
  history: {
    title: "Experiment History",
    clear: "Clear",
    empty: "Past runs are saved in this browser (localStorage) and will appear here.",
    experiment: (n: number) => `Experiment #${n}`,
    loadSettings: "Load settings",
  },
  concepts: {
    title: "Concepts",
    subtitle: "Short explanations for the ideas behind this experiment.",
    overfittingTitle: "What is Overfitting?",
    overfitting:
      "Overfitting happens when a model memorizes the training data — including noise — instead of learning the general pattern. The training error looks great, but the test error gets worse because the model fails on new examples.",
    thresholdTitle: "What is Interpolation Threshold?",
    threshold:
      "The interpolation threshold is the complexity where the model has enough parameters to fit the training set almost perfectly (near-zero training error). Around this point, test error often peaks before behaviour can change again in the overparameterized regime.",
    doubleDescentTitle: "What is Double Descent?",
    doubleDescent:
      "Classical wisdom says more complexity past a sweet spot only hurts. Double descent is the surprising pattern where test error rises near the interpolation threshold, then falls again as the model becomes even more overparameterized. It does not appear in every experiment — this lab reports only what your run actually shows.",
  },
  about: {
    title: "About",
    p1: "AI Research Lab is an interactive machine-learning experiment platform. This MVP focuses on one phenomenon: how training and test error change with model complexity in polynomial regression, including the interpolation threshold and — when it appears — double descent.",
    p2: "All calculations run in your browser. Models are fit with minimum-norm least squares on a Chebyshev polynomial basis (with arcsine-distributed inputs) so high-degree fits stay numerically stable. Results are never fabricated: if double descent is unclear, the lab says so.",
    p3: "Built for students exploring machine learning — no login, no backend, and experiment history stored only in localStorage.",
  },
  footer: "AI Research Lab · Educational experiment platform",
  verdicts: {
    "Clear Double Descent": "Clear Double Descent",
    "Possible Double Descent": "Possible Double Descent",
    "No Clear Double Descent": "No Clear Double Descent",
    "Numerical Divergence": "Numerical Divergence",
  } satisfies Record<DoubleDescentVerdict, string>,
} as const;

const ko = {
  siteName: "AI Research Lab",
  nav: { experiments: "실험", concepts: "개념", about: "소개" },
  languageToggle: "English",
  hero: {
    eyebrow: "AI Research Lab",
    title1: "머신러닝을 탐구하세요.",
    title2: "그저 배우기만 하지 마세요.",
    subtitle:
      "실험을 실행하고, 모델을 시각화하며, 머신러닝이 실제로 어떻게 동작하는지 발견해 보세요.",
    cta: "실험 시작하기",
  },
  experiment: {
    title: "Double Descent 실험",
    description:
      "설정을 바꾸고 실험을 실행한 뒤, 모델 복잡도가 증가할 때 학습·테스트 오차가 어떻게 변하는지 관찰하세요 — 보간 임계값 이후까지 포함합니다.",
    settings: "실험 설정",
    datasetSize: "데이터셋 크기",
    noiseLevel: "노이즈 수준",
    maxComplexity: "최대 모델 복잡도",
    trainTestSplit: "학습 / 테스트 분할",
    splitHelp: "이 MVP에서는 80 / 20으로 고정됩니다.",
    randomSeed: "랜덤 시드",
    run: "실험 실행",
    running: "실행 중…",
    degreeProgress: "차수 진행",
    interpolationHint: (deg: number, nTrain: number) =>
      `보간은 차수 ${deg} 근처(학습 크기 ${nTrain})에서 예상됩니다.`,
    beyondCap:
      " 이 임계값은 복잡도 상한을 넘습니다 — 더 작은 데이터셋으로 관찰해 보세요.",
  },
  dataset: {
    title: "데이터셋",
    caption: (train: number, test: number) =>
      `y = sin(2πx) + noise · x ~ arcsine[-1,1] · 학습 ${train} · 테스트 ${test}`,
    empty: "실험을 실행하면 합성 데이터셋 미리보기가 표시됩니다.",
    input: "입력 (x)",
    target: "목표 (y)",
    training: "학습",
    test: "테스트",
  },
  summary: {
    title: "실험 요약",
    empty: "실험 실행 후 요약이 여기에 표시됩니다.",
    datasetSize: "데이터셋 크기",
    noiseLevel: "노이즈 수준",
    randomSeed: "랜덤 시드",
    bestTest: "최고 테스트 성능",
    bestDegree: (d: number) => `차수 ${d}`,
    interpolationThreshold: "보간 임계값",
    degree: (d: number) => `차수 ${d}`,
    notReached: "도달하지 않음",
    minTrain: "최소 학습 오차",
    minTest: "최소 테스트 오차",
    doubleDescent: "Double Descent 근거",
    beyondSweep:
      "예상 보간 임계값(학습 집합 크기 근처)이 이번 스윕의 최대 복잡도를 넘습니다. 임계값과 잠재적 double descent를 보려면 더 작은 데이터셋을 사용해 보세요.",
  },
  errorChart: {
    title: "모델 복잡도 vs 오차",
    hint: "점을 클릭하면 해당 모델을 확인할 수 있습니다.",
    selected: (d: number) => `선택됨: 차수 ${d}.`,
    empty: "실험 실행 후 모델 복잡도 대 오차 그래프가 표시됩니다.",
    log: "로그",
    linear: "선형",
    xAxis: "모델 복잡도 (차수)",
    yAxisLog: "MSE (로그)",
    yAxis: "MSE",
    trainError: "학습 오차",
    testError: "테스트 오차",
    interpolationThreshold: "보간 임계값",
    degree: (d: number | string) => `차수 ${d}`,
  },
  modelExplorer: {
    title: "선택된 모델",
    empty: "오차 그래프에서 복잡도를 선택하면 해당 모델을 확인할 수 있습니다.",
    polynomialDegree: "다항식 차수",
    parameters: "파라미터 수",
    trainMSE: "학습 MSE",
    testMSE: "테스트 MSE",
    generalizationGap: "일반화 격차",
    input: "입력 (x)",
    training: "학습",
    test: "테스트",
    prediction: (d: number) => `예측 (차수 ${d})`,
  },
  analysis: {
    title: "실험 분석",
    subtitle: "이번 실행에서 실제로 관찰된 패턴만 아래에 설명합니다.",
    empty: "실험 후 자동 분석이 표시됩니다.",
    underfitting:
      "모델 복잡도가 낮을 때 학습·테스트 오차가 모두 상대적으로 높습니다. 이는 과소적합(underfitting)과 일치할 수 있습니다 — 모델이 데이터의 패턴을 포착하기에 너무 단순합니다.",
    testDecreases:
      "가장 단순한 모델에서 복잡도가 증가하면 테스트 오차가 감소합니다. 모델이 기저 패턴을 맞출 만큼 유연해지고 있습니다.",
    threshold: (degree: number, mse?: string) =>
      `학습 오차가 보간 임계값 아래로 처음 떨어지는 지점은 차수 ${degree} 근처입니다` +
      (mse ? ` (학습 MSE ≈ ${mse})` : "") +
      ". 이 복잡도에서 모델은 학습 집합을 거의 완벽히 맞출 수 있습니다.",
    peakNearThreshold: (degree: number) =>
      `보간 임계값 근처에서 학습 오차는 매우 낮지만 테스트 오차는 상승합니다(피크: 차수 ${degree} 근처). 이는 보간 임계값 주변에서 기대되는 동작과 일치합니다.`,
    clearDoubleDescent:
      "보간 구간 근처의 테스트 오차 피크 이후, 복잡도가 더 커지면 테스트 오차가 다시 감소합니다. 이번 실행에서는 double descent 패턴이 뚜렷하게 관찰됩니다.",
    possibleDoubleDescent:
      "테스트 오차 상승 이후 다시 감소하는 패턴이 보입니다. double descent를 시사할 수 있으나, 이번 실행만으로는 확정하기 어렵습니다.",
    numericalDivergence:
      "테스트 오차가 여러 자릿수 규모로 증가한 뒤 경쟁력 있는 수준으로 회복되지 않았습니다. 이번 실행은 double descent가 아니라 수치적 발산을 보이며, 해당 고차수 적합은 불안정한 것으로 해석해야 합니다.",
    noDoubleDescent:
      "고전적인 U자형 구간(또는 보간 피크) 이후 테스트 오차의 뚜렷한 두 번째 하강은 관찰되지 않았습니다. 이번 실행에서는 double descent를 주장하지 않습니다.",
  },
  history: {
    title: "실험 기록",
    clear: "지우기",
    empty: "이 브라우저(localStorage)에 저장된 이전 실행이 여기에 표시됩니다.",
    experiment: (n: number) => `실험 #${n}`,
    loadSettings: "설정 불러오기",
  },
  concepts: {
    title: "개념",
    subtitle: "이 실험의 핵심 아이디어를 짧게 설명합니다.",
    overfittingTitle: "과적합(Overfitting)이란?",
    overfitting:
      "과적합은 모델이 일반적인 패턴 대신 학습 데이터(노이즈 포함)를 암기할 때 발생합니다. 학습 오차는 좋아 보이지만, 새 데이터에서는 테스트 오차가 나빠집니다.",
    thresholdTitle: "보간 임계값(Interpolation Threshold)이란?",
    threshold:
      "보간 임계값은 모델이 학습 집합을 거의 완벽히 맞출 만큼 파라미터가 충분해지는 복잡도입니다. 이 지점 근처에서 테스트 오차가 종종 피크를 찍은 뒤, 과매개변수 영역에서 다시 달라질 수 있습니다.",
    doubleDescentTitle: "Double Descent란?",
    doubleDescent:
      "전통적으로 복잡도가 지나치면 성능만 나빠진다고 배웁니다. Double descent는 보간 임계값 근처에서 테스트 오차가 오른 뒤, 더 과매개변수화되면 다시 떨어지는 놀라운 패턴입니다. 모든 실험에서 나타나지는 않으며, 이 랩은 실행 결과에 따라만 보고합니다.",
  },
  about: {
    title: "소개",
    p1: "AI Research Lab은 인터랙티브 머신러닝 실험 플랫폼입니다. 이 MVP는 다항 회귀에서 모델 복잡도에 따른 학습·테스트 오차 변화, 보간 임계값, 그리고 나타날 때의 double descent에 초점을 맞춥니다.",
    p2: "모든 계산은 브라우저에서 실행됩니다. 모델은 Chebyshev 다항 기저와 arcsine 분포 입력으로 최소 노름 최소제곱에 맞춰져 고차수에서도 수치적으로 안정적입니다. 결과는 조작하지 않으며, double descent가 불분명하면 그대로 표시합니다.",
    p3: "머신러닝을 탐구하는 학생을 위해 만들었습니다 — 로그인·백엔드 없음, 실험 기록은 localStorage에만 저장됩니다.",
  },
  footer: "AI Research Lab · 교육용 실험 플랫폼",
  verdicts: {
    "Clear Double Descent": "뚜렷한 Double Descent",
    "Possible Double Descent": "가능한 Double Descent",
    "No Clear Double Descent": "뚜렷하지 않은 Double Descent",
    "Numerical Divergence": "수치적 발산",
  } satisfies Record<DoubleDescentVerdict, string>,
} as const;

export type Messages = {
  siteName: string;
  nav: { experiments: string; concepts: string; about: string };
  languageToggle: string;
  hero: {
    eyebrow: string;
    title1: string;
    title2: string;
    subtitle: string;
    cta: string;
  };
  experiment: {
    title: string;
    description: string;
    settings: string;
    datasetSize: string;
    noiseLevel: string;
    maxComplexity: string;
    trainTestSplit: string;
    splitHelp: string;
    randomSeed: string;
    run: string;
    running: string;
    degreeProgress: string;
    interpolationHint: (deg: number, nTrain: number) => string;
    beyondCap: string;
  };
  dataset: {
    title: string;
    caption: (train: number, test: number) => string;
    empty: string;
    input: string;
    target: string;
    training: string;
    test: string;
  };
  summary: {
    title: string;
    empty: string;
    datasetSize: string;
    noiseLevel: string;
    randomSeed: string;
    bestTest: string;
    bestDegree: (d: number) => string;
    interpolationThreshold: string;
    degree: (d: number) => string;
    notReached: string;
    minTrain: string;
    minTest: string;
    doubleDescent: string;
    beyondSweep: string;
  };
  errorChart: {
    title: string;
    hint: string;
    selected: (d: number) => string;
    empty: string;
    log: string;
    linear: string;
    xAxis: string;
    yAxisLog: string;
    yAxis: string;
    trainError: string;
    testError: string;
    interpolationThreshold: string;
    degree: (d: number | string) => string;
  };
  modelExplorer: {
    title: string;
    empty: string;
    polynomialDegree: string;
    parameters: string;
    trainMSE: string;
    testMSE: string;
    generalizationGap: string;
    input: string;
    training: string;
    test: string;
    prediction: (d: number) => string;
  };
  analysis: {
    title: string;
    subtitle: string;
    empty: string;
    underfitting: string;
    testDecreases: string;
    threshold: (degree: number, mse?: string) => string;
    peakNearThreshold: (degree: number) => string;
    clearDoubleDescent: string;
    possibleDoubleDescent: string;
    numericalDivergence: string;
    noDoubleDescent: string;
  };
  history: {
    title: string;
    clear: string;
    empty: string;
    experiment: (n: number) => string;
    loadSettings: string;
  };
  concepts: {
    title: string;
    subtitle: string;
    overfittingTitle: string;
    overfitting: string;
    thresholdTitle: string;
    threshold: string;
    doubleDescentTitle: string;
    doubleDescent: string;
  };
  about: {
    title: string;
    p1: string;
    p2: string;
    p3: string;
  };
  footer: string;
  verdicts: Record<DoubleDescentVerdict, string>;
};

export function getMessages(locale: Locale): Messages {
  return locale === "ko" ? ko : en;
}

export function formatVerdict(
  locale: Locale,
  verdict: DoubleDescentVerdict,
): string {
  return getMessages(locale).verdicts[verdict];
}
