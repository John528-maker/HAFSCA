import type { DoubleDescentVerdict } from "@/types/experiment";

export type Locale = "en" | "ko";

export const LOCALE_STORAGE_KEY = "ai-research-lab.locale";

const en = {
  siteName: "AI Research Lab",
  nav: {
    home: "Home",
    learn: "Course",
    experiments: "Lab",
    concepts: "Concepts",
    about: "About",
  },
  course: {
    start: "Start the course",
    lab: "Open the interpolation lab",
    map: "Course map",
    coming: "This lesson is not published yet.",
    prereq: "Recommended first:",
    prev: "Previous",
    next: "Next",
    experiment: "Experiment",
    briefing:
      "This lab shows a genuine variance explosion near interpolation, then partial recovery. It does not claim a second descent that beats the first minimum.",
  },
  gd: {
    title: "Gradient descent",
    play: "Play",
    pause: "Pause",
    step: "Step",
    reset: "Reset",
    alpha: "Learning rate α",
    scale: "Feature scale s",
    w0: "Initial w",
    b0: "Initial b",
    iterations: "Iterations T",
    noise: "Noise σ",
    seed: "Seed",
    status: "Status",
    monotonic: "Monotonic",
    oscillating: "Oscillating",
    diverging: "Diverging",
    aha: "Lock α at 0.2 and drag feature scale to 10, then play. The same algorithm flies off the bowl because you stretched a feature.",
    lossVsT: "Loss vs iteration",
    logLoss: "Log J",
    linearLoss: "Linear J",
  },
  lr: {
    title: "Live least squares",
    guide:
      "This line is not drawn by eye. It is the unique intercept and slope that make the average squared vertical gap as small as possible.",
    hint: "Drag a point. Click empty space to add one (up to 24). Residuals are vertical: ŷ − y.",
    noise: "Noise σ",
    seed: "Seed",
    intercept: "Intercept",
    truth: "Show truth",
    residuals: "Show residuals",
    reset: "Reset",
    outlier: "Add outlier",
    deletePoint: "Delete selected",
    status: "Status",
    ok: "Unique fit",
    needSpread: "No unique slope — spread the points in x.",
    needPoints: "Need at least two points.",
    aha: "The rightmost large residual accounts for more than 40% of the MSE. Drag that point onto the line and watch MSE collapse.",
  },
  overfit: {
    title: "Overfitting",
    run: "Fit degrees 0–12",
    seed: "Seed",
    noise: "Noise σ",
    plateau:
      "On a typical sample the test-error minimum is a plateau across degrees 3–5, not a single true degree.",
    noSweet:
      "This sample does not show a clean sweet spot. That is expected for some seeds — change the seed.",
    uCurve:
      "Training error falls while test error eventually rises: a U-shaped test curve, not a proof that degree 3 is uniquely best.",
    best: (degree: number, cap: number) =>
      `Best degree on the truth-target test MSE: ${degree}. Cap ${cap}.`,
  },
  act: {
    title: "Activations",
    guide:
      "A deep chain multiplies one φ′(z) per layer (and a weight). If each factor is small, ten layers leave almost nothing. Drag depth with sigmoid, then switch to ReLU or identity.",
    activation: "Activation",
    saturated: "saturated",
    sigmoidNote: "σ′ = 0.01 at z = ±log(99)",
    chain: "1-wide chain",
    chainNote:
      "Live recurrence is the truth. For sigmoid, |δ_L| ≤ (|w|/4)^L is a bound, not the measured value at a₀ = 0, b = 0.",
    bound: "Textbook bound |δ_L| ≤ (|w|/4)^L for sigmoid, shown only as a bound.",
    exploded: "exploded",
    dead: "Dead ReLU",
    deadNote:
      "ReLU φ′(0) = 0 on this site. If every z ≤ 0, the gradient in (w, b) is exactly 0 on this batch.",
    useLeaky: "Use leaky ReLU (never fully dies)",
    deadFrac: "Dead fraction",
    allDead:
      "Gradient w.r.t. (w, b) is exactly 0 on this batch. GD cannot revive this unit.",
  },
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
      "Observe the expected variance explosion near interpolation, then test how far error recovers. The lab distinguishes partial recovery, a competitive second descent, an exhausted sweep, and an actual numerical failure.",
    settings: "Experiment Settings",
    datasetSize: "Dataset Size",
    noiseLevel: "Noise Level",
    maxComplexity: "Max Model Complexity",
    trainTestSplit: "Train / Test Split",
    splitHelp: "Adjust the split; at least 10 points are kept for training.",
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
    minTest: "Minimum Test MSE vs True Function",
    minNoisyTest: "Minimum Test MSE vs Noisy Labels",
    doubleDescent: "Double Descent Evidence",
    beyondSweep:
      "The expected interpolation threshold (near train-set size) is beyond this sweep's max complexity. Try a smaller dataset size to observe the threshold and potential double descent.",
    sweepRangeExhausted:
      "Test error was still falling at the end of the sweep. Extend the complexity range before drawing a conclusion.",
    testEstimateWarning:
      "This verdict is low-confidence because the test set has fewer than 160 points. Small test sets produced unstable verdicts in calibration.",
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
    testError: "Test Error vs True Function",
    noisyTestError: "Test Error vs Noisy Labels",
    interpolationThreshold: "Interpolation Threshold",
    degree: (d: number | string) => `Degree ${d}`,
  },
  modelExplorer: {
    title: "Selected Model",
    empty: "Select a complexity on the error chart to inspect that model.",
    polynomialDegree: "Polynomial Degree",
    parameters: "Parameters",
    trainMSE: "Training MSE",
    testMSE: "Test MSE vs True Function",
    noisyTestMSE: "Test MSE vs Noisy Labels",
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
      `The theoretical interpolation threshold p = n is degree ${degree}` +
      (mse ? ` (train MSE ≈ ${mse})` : "") +
      ". The displayed training error shows how closely the regularized fit interpolates.",
    peakNearThreshold: (degree: number) =>
      `Near the interpolation threshold, test error peaks around degree ${degree}. This is the genuine statistical variance explosion predicted by theory, not evidence that the computation failed.`,
    trueDoubleDescent:
      "After the interpolation peak, test error fell below the first sweet-spot minimum. With a sufficiently large test set, this run shows true double descent.",
    competitiveSecondDescent:
      "After the interpolation peak, test error fell to at most twice the first sweet-spot minimum. The second descent is competitive, although it did not meet the reliable true-double-descent criterion.",
    partialRecovery:
      "After the interpolation peak, test error fell substantially but remained more than twice the first sweet-spot minimum. This is a real partial recovery, not a competitive double descent.",
    variancePeakWithoutRecovery:
      "A genuine variance peak appeared near interpolation, but no substantial second descent followed within the completed sweep.",
    numericalFailure:
      "The run produced non-finite values or a conditioning bound that leaves too little meaningful float64 precision. This is an actual numerical failure rather than statistical variance.",
    sweepRangeExhausted:
      "The sweep ended while test error was still falling, so the endpoint is not a second minimum. Extend the complexity range before deciding whether double descent occurred.",
    noSecondDescent:
      "No visible interpolation-peak-to-second-descent pattern was observed. Double descent is not claimed for this run.",
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
    "True Double Descent": "True Double Descent",
    "Competitive Second Descent": "Competitive Second Descent",
    "Partial Recovery": "Partial Recovery",
    "Variance Peak Without Recovery": "Variance Peak Without Recovery",
    "No Second Descent Observed": "No Second Descent Observed",
    "Sweep Range Exhausted": "Sweep Range Exhausted",
    "Numerical Failure": "Numerical Failure",
  } satisfies Record<DoubleDescentVerdict, string>,
} as const;

const ko = {
  siteName: "AI Research Lab",
  nav: {
    home: "홈",
    learn: "수업",
    experiments: "실험실",
    concepts: "개념",
    about: "소개",
  },
  course: {
    start: "수업 시작하기",
    lab: "보간 실험 열기",
    map: "수업 지도",
    coming: "이 수업은 아직 공개되지 않았습니다.",
    prereq: "먼저 보면 좋은 수업:",
    prev: "이전",
    next: "다음",
    experiment: "실험",
    briefing:
      "이 실험은 보간 근처의 실제 분산 폭증과 그 이후의 부분 회복을 보여 줍니다. 두 번째 하강이 첫 최소점보다 좋아진다고 주장하지 않습니다.",
  },
  gd: {
    title: "경사 하강법",
    play: "재생",
    pause: "일시정지",
    step: "한 걸음",
    reset: "초기화",
    alpha: "학습률 α",
    scale: "특성 스케일 s",
    w0: "초기 w",
    b0: "초기 b",
    iterations: "반복 T",
    noise: "노이즈 σ",
    seed: "시드",
    status: "상태",
    monotonic: "단조 수렴",
    oscillating: "진동하며 수렴",
    diverging: "발산",
    aha: "α를 0.2에 고정하고 특성 스케일을 10으로 올린 뒤 재생해 보세요. 알고리즘은 그대로인데 특성을 늘렸기 때문에 사발을 벗어납니다.",
    lossVsT: "반복 대비 손실",
    logLoss: "로그 J",
    linearLoss: "선형 J",
  },
  lr: {
    title: "실시간 최소제곱",
    guide:
      "이 직선은 눈으로 그린 것이 아닙니다. 세로 방향 제곱 오차의 평균을 가장 작게 만드는 유일한 기울기와 절편입니다.",
    hint: "점을 드래그하세요. 빈 곳을 클릭하면 점을 추가합니다(최대 24). 잔차는 세로입니다: ŷ − y.",
    noise: "노이즈 σ",
    seed: "시드",
    intercept: "절편",
    truth: "참 직선",
    residuals: "잔차",
    reset: "초기화",
    outlier: "이상점 추가",
    deletePoint: "선택 삭제",
    status: "상태",
    ok: "유일한 적합",
    needSpread: "기울기가 유일하지 않습니다. x 방향으로 점을 벌리세요.",
    needPoints: "점이 두 개 이상 필요합니다.",
    aha: "가장 큰 잔차가 MSE의 40%를 넘습니다. 그 점을 직선 위로 끌어 보세요. MSE가 무너집니다.",
  },
  overfit: {
    title: "과적합",
    run: "차수 0–12 적합",
    seed: "시드",
    noise: "노이즈 σ",
    plateau:
      "전형적인 표본에서 테스트 오차 최솟값은 차수 3–5의 평탄 구간이며, 진짜 차수 하나만이 최적이라고 말할 수 없습니다.",
    noSweet:
      "이 표본은 깨끗한 최적 구간을 보여 주지 않습니다. 일부 시드에서는 정상이니 시드를 바꿔 보세요.",
    uCurve:
      "학습 오차는 내려가고 테스트 오차는 결국 올라갑니다. U자 곡선이지, 차수 3이 유일하게 최적이라는 증명은 아닙니다.",
    best: (degree: number, cap: number) =>
      `참 함수 기준 테스트 MSE가 가장 낮은 차수: ${degree}. 상한 ${cap}.`,
  },
  act: {
    title: "활성화 함수",
    guide:
      "깊은 연쇄는 층마다 φ′(z)와 가중치를 곱합니다. 인자가 작으면 열 층에서 거의 남지 않습니다. 시그모이드로 깊이를 올린 뒤 ReLU나 identity로 바꿔 보세요.",
    activation: "활성화",
    saturated: "포화",
    sigmoidNote: "σ′ = 0.01 인 지점 z = ±log(99)",
    chain: "너비 1 연쇄",
    chainNote:
      "살아 있는 점화식이 진실입니다. 시그모이드에서 |δ_L| ≤ (|w|/4)^L 은 상한이지, a₀ = 0, b = 0 에서의 측정값이 아닙니다.",
    bound: "시그모이드 교과서 상한 |δ_L| ≤ (|w|/4)^L — 측정값이 아니라 상한으로만 표시합니다.",
    exploded: "폭발",
    dead: "죽은 ReLU",
    deadNote:
      "이 사이트에서 ReLU φ′(0) = 0입니다. 모든 z ≤ 0이면 이 배치에서 (w, b)에 대한 기울기는 정확히 0입니다.",
    useLeaky: "leaky ReLU 사용 (완전히 죽지 않음)",
    deadFrac: "죽은 비율",
    allDead:
      "이 배치에서 (w, b)에 대한 기울기는 정확히 0입니다. GD가 이 유닛을 되살릴 수 없습니다.",
  },
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
      "보간 근처에서 예상되는 분산 폭증을 관찰한 뒤 오차가 얼마나 회복되는지 확인해 보세요. 부분 회복, 경쟁력 있는 두 번째 하강, 스윕 범위 부족, 실제 수치 계산 실패를 구분해 보고합니다.",
    settings: "실험 설정",
    datasetSize: "데이터셋 크기",
    noiseLevel: "노이즈 수준",
    maxComplexity: "최대 모델 복잡도",
    trainTestSplit: "학습 / 테스트 분할",
    splitHelp: "분할을 조정할 수 있으며, 학습용 데이터는 최소 10개로 유지됩니다.",
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
    minTest: "최소 테스트 MSE (참 함수 기준)",
    minNoisyTest: "최소 테스트 MSE (노이즈 레이블 기준)",
    doubleDescent: "Double Descent 근거",
    beyondSweep:
      "예상 보간 임계값(학습 집합 크기 근처)이 이번 스윕의 최대 복잡도를 넘습니다. 임계값과 잠재적 double descent를 보려면 더 작은 데이터셋을 사용해 보세요.",
    sweepRangeExhausted:
      "스윕이 끝날 때에도 테스트 오차가 계속 감소했습니다. 결론을 내리기 전에 복잡도 범위를 더 확장하세요.",
    testEstimateWarning:
      "테스트 집합이 160개 미만이므로 이 판정의 신뢰도가 낮습니다. 보정 실험에서 작은 테스트 집합은 불안정한 판정을 만들었습니다.",
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
    testError: "테스트 오차 (참 함수 기준)",
    noisyTestError: "테스트 오차 (노이즈 레이블 기준)",
    interpolationThreshold: "보간 임계값",
    degree: (d: number | string) => `차수 ${d}`,
  },
  modelExplorer: {
    title: "선택된 모델",
    empty: "오차 그래프에서 복잡도를 선택하면 해당 모델을 확인할 수 있습니다.",
    polynomialDegree: "다항식 차수",
    parameters: "파라미터 수",
    trainMSE: "학습 MSE",
    testMSE: "테스트 MSE (참 함수 기준)",
    noisyTestMSE: "테스트 MSE (노이즈 레이블 기준)",
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
      `이론적 보간 임계값 p = n은 차수 ${degree}입니다` +
      (mse ? ` (학습 MSE ≈ ${mse})` : "") +
      ". 표시된 학습 오차는 정규화된 적합이 학습 데이터를 얼마나 가깝게 보간하는지 보여 줍니다.",
    peakNearThreshold: (degree: number) =>
      `보간 임계값 근처의 차수 ${degree} 부근에서 테스트 오차가 피크를 보입니다. 이는 이론이 예측하는 실제 통계적 분산 폭증이며, 계산 실패를 뜻하지 않습니다.`,
    trueDoubleDescent:
      "보간 피크 이후 테스트 오차가 첫 번째 최적 구간의 최솟값보다 낮아졌습니다. 테스트 집합도 충분히 크므로 이번 실행은 실제 double descent를 보여 줍니다.",
    competitiveSecondDescent:
      "보간 피크 이후 테스트 오차가 첫 번째 최적 구간 최솟값의 2배 이내로 낮아졌습니다. 두 번째 하강은 경쟁력 있지만, 신뢰 가능한 실제 double descent 기준에는 이르지 못했습니다.",
    partialRecovery:
      "보간 피크 이후 테스트 오차가 크게 낮아졌지만 첫 번째 최적 구간 최솟값의 2배보다 높은 수준에 머물렀습니다. 이는 실제 부분 회복이며, 경쟁력 있는 double descent는 아닙니다.",
    variancePeakWithoutRecovery:
      "보간 근처에서 실제 분산 피크가 나타났지만, 완료된 스윕 안에서는 뚜렷한 두 번째 하강이 뒤따르지 않았습니다.",
    numericalFailure:
      "유한하지 않은 값이 발생했거나 조건수 상한상 float64의 의미 있는 정밀도가 너무 적게 남았습니다. 이는 통계적 분산이 아니라 실제 수치 계산 실패입니다.",
    sweepRangeExhausted:
      "테스트 오차가 계속 감소하는 도중 스윕이 끝났으므로, 끝점은 두 번째 최솟값이 아닙니다. Double descent 발생 여부를 판단하기 전에 복잡도 범위를 더 확장하세요.",
    noSecondDescent:
      "보간 피크에서 두 번째 하강으로 이어지는 뚜렷한 패턴이 관찰되지 않았습니다. 이번 실행에서는 double descent를 주장하지 않습니다.",
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
    "True Double Descent": "실제 Double Descent",
    "Competitive Second Descent": "경쟁력 있는 두 번째 하강",
    "Partial Recovery": "부분 회복",
    "Variance Peak Without Recovery": "회복 없는 분산 피크",
    "No Second Descent Observed": "두 번째 하강 관찰되지 않음",
    "Sweep Range Exhausted": "스윕 범위 부족",
    "Numerical Failure": "수치 계산 실패",
  } satisfies Record<DoubleDescentVerdict, string>,
} as const;

export type Messages = {
  siteName: string;
  nav: {
    home: string;
    learn: string;
    experiments: string;
    concepts: string;
    about: string;
  };
  course: {
    start: string;
    lab: string;
    map: string;
    coming: string;
    prereq: string;
    prev: string;
    next: string;
    experiment: string;
    briefing: string;
  };
  gd: {
    title: string;
    play: string;
    pause: string;
    step: string;
    reset: string;
    alpha: string;
    scale: string;
    w0: string;
    b0: string;
    iterations: string;
    noise: string;
    seed: string;
    status: string;
    monotonic: string;
    oscillating: string;
    diverging: string;
    aha: string;
    lossVsT: string;
    logLoss: string;
    linearLoss: string;
  };
  lr: {
    title: string;
    guide: string;
    hint: string;
    noise: string;
    seed: string;
    intercept: string;
    truth: string;
    residuals: string;
    reset: string;
    outlier: string;
    deletePoint: string;
    status: string;
    ok: string;
    needSpread: string;
    needPoints: string;
    aha: string;
  };
  overfit: {
    title: string;
    run: string;
    seed: string;
    noise: string;
    plateau: string;
    noSweet: string;
    uCurve: string;
    best: (degree: number, cap: number) => string;
  };
  act: {
    title: string;
    guide: string;
    activation: string;
    saturated: string;
    sigmoidNote: string;
    chain: string;
    chainNote: string;
    bound: string;
    exploded: string;
    dead: string;
    deadNote: string;
    useLeaky: string;
    deadFrac: string;
    allDead: string;
  };
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
    minNoisyTest: string;
    doubleDescent: string;
    beyondSweep: string;
    sweepRangeExhausted: string;
    testEstimateWarning: string;
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
    noisyTestError: string;
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
    noisyTestMSE: string;
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
    trueDoubleDescent: string;
    competitiveSecondDescent: string;
    partialRecovery: string;
    variancePeakWithoutRecovery: string;
    numericalFailure: string;
    sweepRangeExhausted: string;
    noSecondDescent: string;
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
