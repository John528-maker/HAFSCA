import type { QuizQuestion } from "@/lib/quiz";

function q(
  id: string,
  prompt: [string, string],
  choices: Array<[string, string]>,
  correctIndex: number,
  why: [string, string],
): QuizQuestion {
  return {
    id,
    prompt: { en: prompt[0], ko: prompt[1] },
    choices: choices.map(([en, ko]) => ({ en, ko })),
    correctIndex,
    why: { en: why[0], ko: why[1] },
  };
}

/** Three review items per published lesson, taken from that lesson’s own claims. */
export const QUIZZES: Record<string, QuizQuestion[]> = {
  "functions-and-parameters": [
    q(
      "model",
      [
        "In this course, what is a model?",
        "이 수업에서 모델은 무엇인가요?",
      ],
      [
        ["The list of training points (x, y)", "입력-출력 점들의 목록"],
        ["A function f(x; θ), with θ choosing the shape", "함수 f(x; θ). θ가 모양을 고릅니다"],
        ["The rule that updates θ, such as gradient descent", "경사 하강처럼 θ를 갱신하는 규칙"],
      ],
      1,
      [
        "A model is the function. Data go in; θ chooses which function you get. The update rule is separate.",
        "모델은 함수입니다. 데이터가 들어가고, θ가 어떤 함수인지를 정합니다. 갱신 규칙은 다른 것입니다.",
      ],
    ),
    q(
      "what-moves",
      [
        "When we fit a model, which thing do we change?",
        "모델을 맞출 때 우리가 바꾸는 것은 무엇인가요?",
      ],
      [
        ["The feature map φ(x) — how we rewrite x", "특징 맵 φ(x). x를 다시 쓰는 방법"],
        ["The dataset itself", "데이터셋 자체"],
        ["The parameter vector θ", "매개변수 벡터 θ"],
      ],
      2,
      [
        "The feature map stays fixed. Fitting only moves θ.",
        "특징 맵은 고정입니다. 맞추는 일은 θ만 움직입니다.",
      ],
    ),
    q(
      "count",
      [
        "A polynomial of degree d (with an intercept) has how many parameters p?",
        "절편이 있는 차수 d 다항식의 매개변수는 몇 개인가요?",
      ],
      [
        ["p = d", "p = d"],
        ["p = d + 1", "p = d + 1"],
        ["p = n, the number of data points", "p = n, 데이터 점의 개수"],
      ],
      1,
      [
        "Degree d plus the intercept is d + 1 numbers to choose. That is not the same as how many points you have.",
        "차수 d에 절편을 더하면 고를 숫자가 d + 1개입니다. 점의 개수 n과는 다릅니다.",
      ],
    ),
  ],
  "linear-regression": [
    q(
      "linear-in",
      [
        "Linear regression must be linear in which thing?",
        "선형 회귀는 무엇에 대해 선형이어야 하나요?",
      ],
      [
        ["x only — the plot must be a straight line", "x에 대해서만. 그림이 직선이어야 합니다"],
        ["The parameters θ, even if the curve in x is bent", "매개변수 θ. x 방향 곡선은 굽어도 됩니다"],
        ["The residuals, which must be horizontal", "잔차. 잔차는 가로 방향이어야 합니다"],
      ],
      1,
      [
        "ŷ = θᵀ φ(x). A polynomial in x is still linear in θ, so it still counts as linear regression.",
        "ŷ = θᵀ φ(x). x의 다항식이어도 θ에 대해 선형이면 선형 회귀입니다.",
      ],
    ),
    q(
      "vertical",
      [
        "The fitted line on this site makes which gaps as small as possible?",
        "이 사이트의 적합 직선은 어떤 간격을 작게 만드나요?",
      ],
      [
        ["Left–right gaps to the points", "점까지의 좌우 간격"],
        [
          "Up–down gaps: the average of (prediction − y)²",
          "위아래 간격: (예측 − y)²의 평균",
        ],
        ["How many points miss the line", "선을 빗나간 점의 개수"],
      ],
      1,
      [
        "Residuals are vertical: prediction minus y. The line is not drawn by eye.",
        "잔차는 위아래입니다: 예측 빼기 y. 눈으로 그린 선이 아닙니다.",
      ],
    ),
    q(
      "unique",
      [
        "When can we not name a unique slope?",
        "기울기를 하나로 정할 수 없는 때는 언제인가요?",
      ],
      [
        ["When every x value is the same", "모든 x 값이 같을 때"],
        ["When n, the number of points, is even", "점의 개수 n이 짝수일 때"],
        ["When the intercept is turned on", "절편을 켠 경우"],
      ],
      0,
      [
        "If x does not spread out, many slopes fit equally well. The lab checks that before solving.",
        "x가 퍼져 있지 않으면 여러 기울기가 똑같이 맞습니다. 실험은 풀기 전에 이를 확인합니다.",
      ],
    ),
  ],
  "loss-function": [
    q(
      "definition",
      [
        "What number is the loss J on this site?",
        "이 사이트에서 손실 J는 어떤 숫자인가요?",
      ],
      [
        [
          "Average of (prediction − y)², with no ½ in front",
          "(예측 − y)²의 평균. 앞에 ½가 없습니다",
        ],
        [
          "The textbook form with a ½ in front of the sum",
          "합 앞에 ½가 있는 교과서 형태",
        ],
        ["How many points were classified wrong", "잘못 분류된 점의 개수"],
      ],
      0,
      [
        "J = (1/n) Σ (ŷ − y)². The charts plot this J, not ½ J.",
        "J = (1/n) Σ (ŷ − y)². 차트가 그리는 숫자가 이 J입니다. ½ J가 아닙니다.",
      ],
    ),
    q(
      "job",
      [
        "What are the derivative and gradient descent for?",
        "도함수와 경사 하강법은 무엇을 위한 도구인가요?",
      ],
      [
        ["To add more training points", "학습 점을 늘리기 위한 것"],
        ["To make the loss J smaller", "이 손실 J를 작게 만들기 위한 것"],
        ["To choose the test set", "테스트 집합을 고르기 위한 것"],
      ],
      1,
      [
        "Once J has a name, “better fit” means a smaller J. Later tools exist to reduce that number.",
        "J에 이름이 있으면 ‘더 좋은 적합’은 J가 더 작다는 뜻입니다. 이후 도구는 그 숫자를 줄입니다.",
      ],
    ),
    q(
      "square",
      [
        "Why square the residual?",
        "잔차를 제곱하는 이유는 무엇인가요?",
      ],
      [
        ["To keep the sign: over- and under-prediction cancel", "부호를 남깁니다. 위·아래 오차가 서로 지워집니다"],
        [
          "To drop the sign, and to punish large misses more than small ones",
          "부호를 없애고, 큰 오차를 작은 오차보다 더 벌주기 위해서",
        ],
        ["So the 2 in the gradient formula cancels", "기울기 식의 2를 없애기 위해서"],
      ],
      1,
      [
        "A miss of −3 and a miss of +3 should both count. Squaring does that, and a miss of 10 hurts more than a miss of 1.",
        "−3과 +3은 둘 다 빗나간 것입니다. 제곱하면 부호가 사라지고, 10만큼 빗나가는 쪽이 1보다 더 큽니다.",
      ],
    ),
  ],
  "polynomial-regression": [
    q(
      "same-loss",
      [
        "If you raise the polynomial degree d, what changes?",
        "다항식 차수 d를 올리면 무엇이 바뀌나요?",
      ],
      [
        ["The meaning of the loss J", "손실 J의 뜻"],
        [
          "How many features you use. The loss is still the same MSE.",
          "특징의 개수. 손실은 같은 MSE입니다.",
        ],
        ["The solver: least squares is replaced by a neural net", "풀이가 최소제곱에서 신경망으로 바뀝니다"],
      ],
      1,
      [
        "Degree is a knob on how wide φ is (p = d + 1). The error is still 1/n MSE.",
        "차수는 특징을 얼마나 쓸지(p = d + 1)의 손잡이입니다. 오차는 여전히 1/n MSE입니다.",
      ],
    ),
    q(
      "basis",
      [
        "Which polynomial features does this site actually use?",
        "이 사이트가 실제로 쓰는 다항식 특징은 무엇인가요?",
      ],
      [
        ["Only the plain powers 1, x, x², …", "평범한 거듭제곱 1, x, x², … 만"],
        [
          "Chebyshev polynomials on [−1, 1], not plain powers",
          "구간 [−1, 1]의 체비쇼프 다항식. 평범한 거듭제곱이 아닙니다",
        ],
        ["Random Fourier features", "랜덤 푸리에 특징"],
      ],
      1,
      [
        "Chebyshev features keep high degree numerically usable. Plain powers 1, x, x², … are the ill-conditioned ones.",
        "체비쇼프 특징은 높은 차수도 숫자로 다루기 쉽습니다. 조건이 나빠지는 쪽은 1, x, x², … 입니다.",
      ],
    ),
    q(
      "degree-12",
      [
        "The true curve is a cubic, plus noise. What will a degree-12 fit often do?",
        "참 곡선이 삼차+노이즈일 때, 차수 12 적합은 자주 무엇을 하나요?",
      ],
      [
        ["Recover the true cubic on its own", "참 삼차식을 알아서 찾아냅니다"],
        ["Follow the noise as well as the cubic", "참 곡선뿐 아니라 노이즈까지 따라갑니다"],
        ["Use a different loss from degree 3", "차수 3과 다른 손실을 씁니다"],
      ],
      1,
      [
        "Same solver, more columns. Extra flexibility can chase noise.",
        "같은 풀이, 더 많은 열. 여분 유연성은 노이즈를 따라갈 수 있습니다.",
      ],
    ),
  ],
  derivative: [
    q(
      "slope",
      [
        "What does the derivative J′(θ) tell you?",
        "도함수 J′(θ)는 무엇을 알려 주나요?",
      ],
      [
        ["The next value of θ after a learning step", "학습 한 걸음 뒤의 θ 값"],
        ["The local slope of J, not the next value of θ", "J의 그 지점 기울기. θ의 다음 값이 아닙니다"],
        ["The error on the test set", "테스트 집합의 오차"],
      ],
      1,
      [
        "J′ is a slope. If J′ < 0, a tiny increase in θ lowers J. Moving θ is a later step (gradient descent).",
        "J′는 기울기입니다. J′ < 0이면 θ를 아주 조금 키울 때 J가 내려갑니다. θ를 옮기는 것은 나중 단계(경사 하강)입니다.",
      ],
    ),
    q(
      "two",
      [
        "This site’s J has no ½ in front. After you differentiate u², why is there still a 2 in J′?",
        "이 사이트의 J에는 앞에 ½가 없습니다. 그런데 J′에는 왜 2가 남나요?",
      ],
      [
        ["Because J secretly includes a ½ that we cancel later", "J 앞에 ½가 숨어 있다가 나중에 지워지기 때문입니다"],
        [
          "Because d(u²)/dθ = 2u, and J has no ½ to cancel it",
          "u²의 미분이 2u이고, J에는 그걸 지울 ½가 없기 때문입니다",
        ],
        ["Because every lab uses exactly two training points", "모든 실험이 학습 점을 정확히 두 개 쓰기 때문입니다"],
      ],
      1,
      [
        "d(u²)/dθ = 2u · (du/dθ). Some textbooks put ½ in J so the 2 cancels. This site does not.",
        "d(u²)/dθ = 2u · (du/dθ). 어떤 교과서는 J에 ½를 넣어 2를 지웁니다. 이 사이트는 그렇게 하지 않습니다.",
      ],
    ),
    q(
      "sign",
      [
        "In the two-point example, J′(2) = −3. If you increase θ a little, what happens to J?",
        "두 점 예에서 J′(2) = −3입니다. θ를 조금 키우면 J는 어떻게 되나요?",
      ],
      [
        ["J goes up", "J가 올라갑니다"],
        ["J goes down", "J가 내려갑니다"],
        ["J stays the same", "J가 그대로입니다"],
      ],
      1,
      [
        "Negative slope: J is decreasing as θ increases, so raising θ lowers J.",
        "기울기가 음수면 θ를 키울수록 J가 작아집니다. 그래서 θ를 올리면 J가 내려갑니다.",
      ],
    ),
  ],
  "partial-derivative": [
    q(
      "hold",
      [
        "When you take the partial ∂J/∂w, what must stay frozen?",
        "편도함수 ∂J/∂w를 구할 때 무엇이 고정되어야 하나요?",
      ],
      [
        ["The dataset, but w and b may both move", "데이터셋. 다만 w와 b는 같이 움직여도 됩니다"],
        ["The other parameters. Only w is nudged.", "나머지 매개변수. w만 살짝 움직입니다."],
        ["The learning rate α", "학습률 α"],
      ],
      1,
      [
        "A partial is one knob at a time. If b moves while you differentiate in w, it is not ∂J/∂w.",
        "편도함수는 손잡이 하나입니다. w로 미분하는 동안 b가 움직이면 ∂J/∂w가 아닙니다.",
      ],
    ),
    q(
      "two-knobs",
      [
        "The line ŷ = wx + b has two knobs. How many partial derivatives of J are there?",
        "직선 ŷ = wx + b의 손잡이는 둘입니다. J의 편도함수는 몇 개인가요?",
      ],
      [
        ["One: only ∂J/∂w", "하나: ∂J/∂w만"],
        ["Two: ∂J/∂w and ∂J/∂b", "둘: ∂J/∂w와 ∂J/∂b"],
        ["n: one for each training point", "n개: 학습 점마다 하나"],
      ],
      1,
      [
        "Two knobs, two partials. The next lesson stacks them into the gradient.",
        "손잡이가 둘이면 편도함수도 둘입니다. 다음 수업에서 기울기 벡터로 쌓습니다.",
      ],
    ),
    q(
      "formula",
      [
        "For this site’s MSE, what does ∂J/∂θⱼ depend on?",
        "이 사이트 MSE에서 ∂J/∂θⱼ는 무엇에 의존하나요?",
      ],
      [
        [
          "The residuals and column j of X (with the extra 2 from squaring)",
          "잔차와 X의 j번째 열 (제곱에서 온 2가 붙음)",
        ],
        ["The residuals only, not X", "잔차만. X는 쓰지 않습니다"],
        ["The condition number κ(X) only", "조건수 κ(X)만"],
      ],
      0,
      [
        "You weight each residual by how much column j participated. That is (2/n) Σ rᵢ Xᵢⱼ.",
        "각 잔차에 j열이 얼마나 들어갔는지를 곱합니다. 곧 (2/n) Σ rᵢ Xᵢⱼ입니다.",
      ],
    ),
  ],
  gradient: [
    q(
      "uphill",
      [
        "On the loss surface, which way does ∇J point by itself?",
        "손실 곡면에서 ∇J 자체는 어느 쪽을 가리키나요?",
      ],
      [
        ["Downhill: the way that lowers J fastest", "내리막. J를 가장 빨리 낮추는 쪽"],
        ["Uphill: the way that raises J fastest", "오르막. J를 가장 빨리 키우는 쪽"],
        ["Toward the test-set residual", "테스트 잔차 쪽"],
      ],
      1,
      [
        "∇J is steepest ascent. Gradient descent walks the other way: subtract α ∇J.",
        "∇J는 가장 가파른 오르막입니다. 경사 하강은 반대로 걷습니다. α ∇J를 뺍니다.",
      ],
    ),
    q(
      "stack",
      [
        "What is each entry of the vector ∇J?",
        "벡터 ∇J의 각 성분은 무엇인가요?",
      ],
      [
        ["A training input xᵢ", "학습 입력 xᵢ"],
        ["One partial derivative of J", "J의 편도함수 하나"],
        ["A singular value of X", "X의 특잇값"],
      ],
      1,
      [
        "∇J is just the list of every ∂J/∂θⱼ from the partial-derivative lesson.",
        "∇J는 편도함수 수업의 모든 ∂J/∂θⱼ를 모아 놓은 목록입니다.",
      ],
    ),
    q(
      "mse-form",
      [
        "For this site’s MSE, ∇J is built from X and which residual?",
        "이 사이트 MSE에서 ∇J는 X와 어떤 잔차로 만들어지나요?",
      ],
      [
        ["r = Xθ − y (prediction minus y)", "r = Xθ − y (예측 빼기 y)"],
        ["r = y only", "r = y 만"],
        ["κ₂(X), the condition number", "조건수 κ₂(X)"],
      ],
      0,
      [
        "∇J = (2/n) Xᵀ r with the same residual convention as the rest of the site.",
        "∇J = (2/n) Xᵀ r. 잔차 약속은 사이트 나머지와 같습니다.",
      ],
    ),
  ],
  "gradient-descent": [
    q(
      "update",
      [
        "Which update is gradient descent?",
        "경사 하강법의 갱신식은 어느 것인가요?",
      ],
      [
        ["θ ← θ + α ∇J (add the gradient)", "θ ← θ + α ∇J (기울기를 더함)"],
        ["θ ← θ − α ∇J (subtract the gradient)", "θ ← θ − α ∇J (기울기를 뺌)"],
        ["θ ← (XᵀX)⁻¹ Xᵀ y (solve in one shot)", "θ ← (XᵀX)⁻¹ Xᵀ y (한 번에 풂)"],
      ],
      1,
      [
        "∇J points uphill, so we subtract it. The last option is the normal equations, not a step.",
        "∇J는 오르막이므로 뺍니다. 마지막 선택지는 한 걸음이 아니라 정규 방정식입니다.",
      ],
    ),
    q(
      "crit",
      [
        "For this linear bowl, when is the step size α too large?",
        "이 선형 사발에서 보폭 α가 너무 큰 때는 언제인가요?",
      ],
      [
        [
          "When α is larger than 2 / (the bowl’s steepest curvature)",
          "α가 2 / (사발의 가장 가파른 곡률)보다 클 때",
        ],
        ["Whenever α is less than 1", "α가 1보다 작기만 하면"],
        ["Never: α = 0.2 is safe for every dataset", "없음. α = 0.2는 모든 데이터에 안전합니다"],
      ],
      0,
      [
        "Convergence needs 0 < α < 2 / λ_max(H). Stretching a feature changes that limit.",
        "수렴하려면 0 < α < 2 / λ_max(H)여야 합니다. 특성을 늘리면 그 한계가 바뀝니다.",
      ],
    ),
    q(
      "scale",
      [
        "α = 0.2 works at feature scale 1. What can happen if you stretch the feature to 10 and keep α = 0.2?",
        "특성 스케일 1에서 α = 0.2가 됩니다. 특성을 10으로 늘리고 α는 그대로 두면 어떻게 되나요?",
      ],
      [
        ["Nothing: α did not change, so the path stays calm", "α가 같아서 경로는 그대로 차분합니다"],
        [
          "The same α can blow up. “Small” depends on the curvature.",
          "같은 α로도 발산할 수 있습니다. 작은지는 곡률에 상대적입니다.",
        ],
        ["The loss function is replaced by another formula", "손실 공식이 다른 것으로 바뀝니다"],
      ],
      1,
      [
        "A learning rate is small or large compared with λ_max, not in absolute units. The lab shows this.",
        "학습률은 λ_max에 비해 작거나 큰 것입니다. 실험이 이를 보여 줍니다.",
      ],
    ),
  ],
  optimization: [
    q(
      "question",
      [
        "What question does “optimization” name?",
        "‘최적화’가 가리키는 질문은 무엇인가요?",
      ],
      [
        ["Which θ makes the loss J as small as possible?", "어떤 θ가 손실 J를 가장 작게 하는가?"],
        ["How should we split train and test?", "학습과 테스트를 어떻게 나눌까?"],
        ["Which programming language to use", "어떤 프로그래밍 언어를 쓸까?"],
      ],
      0,
      [
        "Gradient descent and the normal equations are two ways to answer that same question, not two different goals.",
        "경사 하강과 정규 방정식은 그 같은 질문을 푸는 두 방법이지, 목표가 다른 것이 아닙니다.",
      ],
    ),
    q(
      "convex",
      [
        "This site’s MSE (linear in θ) is convex. If ∇J = 0, what kind of point is that?",
        "이 사이트의 MSE(θ에 선형)는 볼록합니다. ∇J = 0인 점은 어떤 점인가요?",
      ],
      [
        ["A saddle, never a minimizer", "안장점이지 최소점이 아닙니다"],
        ["A global minimizer", "전역 최소점입니다"],
        ["Undefined unless you have more parameters than points", "p > n이 아니면 정의되지 않습니다"],
      ],
      1,
      [
        "On a differentiable convex bowl, every critical point is a global min. Neural nets are not convex in general.",
        "미분 가능한 볼록 사발에서는 임계점이 곧 전역 최소입니다. 신경망은 일반적으로 볼록하지 않습니다.",
      ],
    ),
    q(
      "critical",
      [
        "If ∇J = 0, is that always a local minimum?",
        "∇J = 0이면 항상 국소 최소점인가요?",
      ],
      [
        ["Yes, for every differentiable J", "네. 미분 가능한 J면 항상 그렇습니다"],
        [
          "Not always. It can also be a maximum or a saddle.",
          "아닙니다. 최대점이나 안장점일 수도 있습니다.",
        ],
        ["Yes, but only for neural nets", "신경망에서만 그렇습니다"],
      ],
      1,
      [
        "∇J = 0 is required at an interior minimum, but maxima and saddles are critical too. Convexity is what rules those out here.",
        "내부 최소에서는 ∇J = 0이 필요하지만, 최대점과 안장점도 임계점입니다. 여기서 그걸 막는 것은 볼록성입니다.",
      ],
    ),
  ],
  "normal-equations": [
    q(
      "system",
      [
        "You set the MSE gradient to zero. Which linear system do you get?",
        "MSE 기울기를 0으로 두면 어떤 선형 방정식이 나오나요?",
      ],
      [
        ["Xθ = y", "Xθ = y"],
        ["XᵀX θ = Xᵀy", "XᵀX θ = Xᵀy"],
        ["θ ← θ − α ∇J", "θ ← θ − α ∇J"],
      ],
      1,
      [
        "That system is the normal equations. The last option is a gradient-descent step, not a solved equation.",
        "그 식이 정규 방정식입니다. 마지막은 푼 방정식이 아니라 경사 하강 한 걸음입니다.",
      ],
    ),
    q(
      "normal",
      [
        "Why is the leftover error called “normal” (perpendicular) here?",
        "남은 오차를 여기서 ‘정규(수직)’라고 부르는 이유는 무엇인가요?",
      ],
      [
        ["Because the residual is always exactly zero", "잔차가 항상 정확히 0이기 때문입니다"],
        [
          "Because the residual is perpendicular to every column of X",
          "잔차가 X의 모든 열에 수직이기 때문입니다",
        ],
        ["Because residuals are measured left–right, not up–down", "잔차를 위아래가 아니라 좌우로 재기 때문입니다"],
      ],
      1,
      [
        "Xᵀ r = 0 with r = prediction − y. The leftover error has no component along the features.",
        "Xᵀ r = 0, r = 예측 − y. 남은 오차는 특징 방향으로 성분이 없습니다.",
      ],
    ),
    q(
      "wide",
      [
        "When there are more parameters than points (p > n), which interpolator does this site pick?",
        "매개변수 수가 점보다 많으면 (p > n) 이 사이트는 어느 보간해를 고르나요?",
      ],
      [
        ["Any interpolator, chosen at random", "아무 보간해나 무작위로"],
        ["The interpolator whose θ has the smallest length", "θ의 길이가 가장 짧은 보간해"],
        ["The interpolator whose θ has the largest length", "θ의 길이가 가장 긴 보간해"],
      ],
      1,
      [
        "Many θ hit the training y exactly. The site takes the shortest one (minimum ‖θ‖₂), with a tiny ridge floor.",
        "학습 y를 맞추는 θ가 많습니다. 사이트는 가장 짧은 것(최소 ‖θ‖₂)을 고르고, 아주 작은 ridge를 깔습니다.",
      ],
    ),
  ],
  generalization: [
    q(
      "question",
      [
        "Generalization is error on which points?",
        "일반화는 어느 점에 대한 오차인가요?",
      ],
      [
        ["The same points used to fit θ", "θ를 맞출 때 쓴 바로 그 점"],
        ["New inputs that were not used to fit θ", "θ를 맞출 때 쓰지 않은 새 입력"],
        ["A condition number of X, not points at all", "점이 아니라 X의 조건수"],
      ],
      1,
      [
        "Training MSE is the number you minimized. Generalization asks how you do on points you did not fit.",
        "학습 MSE는 최소화한 숫자입니다. 일반화는 맞추지 않은 점에서 얼마나 되는지를 묻습니다.",
      ],
    ),
    q(
      "primary",
      [
        "When this site plots the main test error, what is it usually compared to?",
        "이 사이트가 그리는 주된 테스트 오차는 보통 무엇과 비교하나요?",
      ],
      [
        ["Only the noisy labels", "노이즈 있는 라벨만"],
        ["The true function f (the noiseless curve)", "참 함수 f (노이즈 없는 곡선)"],
        ["Only the training residuals", "학습 잔차만"],
      ],
      1,
      [
        "The main number is test error versus the true f. Error versus noisy labels is a separate, extra curve.",
        "주된 숫자는 참 f에 대한 테스트 오차입니다. 노이즈 라벨과의 비교는 따로 그리는 곡선입니다.",
      ],
    ),
    q(
      "tiny-test",
      [
        "Why is a very small test set a problem?",
        "테스트 점이 아주 적으면 왜 문제인가요?",
      ],
      [
        ["It is not a problem. Extra test points never help.", "문제가 아닙니다. 테스트 점을 늘려도 소용 없습니다."],
        [
          "The score can jump from sample to sample, so a “winner” may be luck",
          "표본마다 점수가 흔들려, ‘승자’가 우연일 수 있습니다",
        ],
        ["It changes the definition of the training loss J", "학습 손실 J의 뜻이 바뀝니다"],
      ],
      1,
      [
        "A tiny test set is a noisy measuring stick. That is why this site warns when the test set is small.",
        "테스트가 작으면 자가 흔들립니다. 그래서 이 사이트는 테스트가 작을 때 경고합니다.",
      ],
    ),
  ],
  overfitting: [
    q(
      "def",
      [
        "Which pattern is overfitting?",
        "과적합은 어떤 패턴인가요?",
      ],
      [
        ["Train error and test error both go down", "학습 오차와 테스트 오차가 같이 내려갑니다"],
        [
          "Train error keeps going down, while error on new x goes up",
          "학습 오차는 계속 내려가는데, 새 x의 오차는 올라갑니다",
        ],
        ["The number of parameters equals the number of points", "매개변수 수가 점 수와 같습니다"],
      ],
      1,
      [
        "The model is using extra room to memorize noise. A smaller training MSE is not proof of a better model.",
        "여분 용량으로 노이즈를 외우는 것입니다. 학습 MSE가 작다고 더 좋은 모형이 아닙니다.",
      ],
    ),
    q(
      "plateau",
      [
        "The true curve is cubic. Should the lab always declare degree 3 the unique winner?",
        "참 곡선이 삼차이면, 실험은 항상 차수 3을 유일한 승자로 말해야 하나요?",
      ],
      [
        [
          "No. Nearby degrees often look similar, and some seeds have no clean winner.",
          "아니요. 근처 차수가 비슷해 보이기 쉽고, 어떤 시드는 승자가 없습니다.",
        ],
        ["Yes. The degree-12 cap forbids every other degree.", "네. 차수 12 상한이 다른 차수를 금지합니다."],
        ["Yes. Degree 3 always has the lowest training error.", "네. 차수 3이 항상 학습 오차가 가장 낮습니다."],
      ],
      0,
      [
        "A plateau is not a unique champion. The lab will say so when the seed is messy.",
        "평탄한 구간은 유일한 우승자가 아닙니다. 시드가 지저분하면 실험이 그렇게 말합니다.",
      ],
    ),
    q(
      "bars",
      [
        "What do the bias–variance bars show?",
        "편향-분산 막대는 무엇을 보여 주나요?",
      ],
      [
        ["Test error from a single train/test split", "학습/테스트를 한 번 나눈 테스트 오차"],
        [
          "An average over many resampled datasets, not one split",
          "여러 번 다시 뽑은 데이터의 평균. 한 번 나눈 값이 아닙니다",
        ],
        ["The condition number κ(X)", "조건수 κ(X)"],
      ],
      1,
      [
        "Those bars estimate noise + bias² + variance across many datasets. That is a different picture from one test curve.",
        "그 막대는 여러 데이터에서 노이즈 + bias² + 분산을 어림합니다. 테스트 곡선 하나와는 다른 그림입니다.",
      ],
    ),
  ],
  regularization: [
    q(
      "penalty",
      [
        "What extra term does ridge add to the fit?",
        "Ridge가 적합에 더하는 추가 항은 무엇인가요?",
      ],
      [
        ["A penalty on the size of θ (λ times ‖θ‖²)", "가중치 크기 벌점 (λ × ‖θ‖²)"],
        ["More training points", "학습 점 추가"],
        ["A second test set", "테스트 집합을 하나 더"],
      ],
      0,
      [
        "The penalty pays for large weights. Setting the gradient to zero gives (XᵀX + λI) θ = Xᵀy.",
        "큰 가중치에 값을 매깁니다. 기울기를 0으로 두면 (XᵀX + λI) θ = Xᵀy입니다.",
      ],
    ),
    q(
      "relative",
      [
        "In the ridge lab, which knob do you actually move?",
        "Ridge 실험에서 여러분이 실제로 움직이는 손잡이는 무엇인가요?",
      ],
      [
        ["A raw textbook λ, unrelated to X", "교과서식 절대 λ. X와 무관합니다"],
        [
          "A relative knob ρ. Applied λ = ρ times the typical size of XᵀX.",
          "상대 손잡이 ρ. 실제로 쓰는 λ = ρ × (XᵀX의 전형적인 크기)",
        ],
        ["The polynomial degree, which replaces ridge", "차수. ridge 대신 차수를 바꿉니다"],
      ],
      1,
      [
        "ρ is in the same units as the rest of the site. Larger ρ is to the right. log₁₀ ρ = 0 means ρ = 1, not “off.”",
        "ρ는 사이트 나머지와 같은 단위입니다. 오른쪽이 더 큰 ρ입니다. log₁₀ ρ = 0은 ρ = 1이지 ‘꺼짐’이 아닙니다.",
      ],
    ),
    q(
      "toward",
      [
        "Ridge pulls θ toward which target?",
        "Ridge는 θ를 어디로 끌어당기나요?",
      ],
      [
        ["The true cubic (0, 0.2, 0, 0.7)", "참 삼차식 (0, 0.2, 0, 0.7)"],
        ["Zero, in the features we used — not the true cubic", "우리가 쓴 특징의 0. 참 삼차식이 아닙니다"],
        ["The interpolation threshold p = n", "보간 임계값 p = n"],
      ],
      1,
      [
        "Ridge does not know the true cubic. It shrinks toward the origin of the basis you chose.",
        "Ridge는 참 삼차식을 모릅니다. 고른 기저의 원점으로 줄어듭니다.",
      ],
    ),
  ],
  "interpolation-threshold": [
    q(
      "count",
      [
        "How does this site define the interpolation threshold?",
        "이 사이트는 보간 임계값을 어떻게 정하나요?",
      ],
      [
        ["It searches for the degree where training MSE looks small enough", "학습 MSE가 작아 보이는 차수를 찾아냅니다"],
        [
          "By a count: p = n_train, so degree n_train − 1 for these polynomials",
          "개수로: p = n_train. 이 다항식에서는 차수 n_train − 1",
        ],
        ["p = n_test, the test-set size", "p = n_test, 테스트 점 수"],
      ],
      1,
      [
        "It is a parameter count, not a hunt for tiny training error. For these polynomials, p = d + 1.",
        "개수이지, 학습 오차가 작아질 때까지 찾는 값이 아닙니다. 이 다항식에서 p = d + 1입니다.",
      ],
    ),
    q(
      "beyond",
      [
        "When p reaches n_train, what becomes possible?",
        "p가 n_train에 닿으면 무엇이 가능해지나요?",
      ],
      [
        [
          "Hitting every training y (and if p is larger, many ways to do it)",
          "모든 학습 y를 맞추는 것 (p가 더 크면 방법이 여러 가지)",
        ],
        ["Training error is forced to stay large", "학습 오차가 반드시 크게 남습니다"],
        ["The model stops being linear in θ", "모형이 θ에 대해 선형이기를 멈춥니다"],
      ],
      0,
      [
        "Below the threshold, leftover training error is normal. At or above it, interpolators exist.",
        "임계값보다 작으면 학습 오차가 남는 것이 정상입니다. 닿거나 넘으면 보간해가 있습니다.",
      ],
    ),
    q(
      "not-dd",
      [
        "Is interpolation the same thing as overfitting?",
        "보간은 과적합과 같은 말인가요?",
      ],
      [
        ["Yes. Interpolation is just another name for overfitting.", "네. 보간은 과적합의 다른 이름입니다."],
        [
          "No. Interpolation is the crossing p = n_train. Overfitting is train vs new-x error.",
          "아니요. 보간은 p = n_train 교차입니다. 과적합은 학습 오차 대 새 x 오차입니다.",
        ],
        ["Yes. Interpolation means the computer failed to solve.", "네. 보간은 컴퓨터가 풀이에 실패했다는 뜻입니다."],
      ],
      1,
      [
        "Interpolation is a count. Overfitting is a train/test pattern. Neither one means the solver returned NaN.",
        "보간은 개수이고, 과적합은 학습/새 점 패턴입니다. 둘 다 풀이가 NaN을 냈다는 뜻이 아닙니다.",
      ],
    ),
  ],
  conditioning: [
    q(
      "kappa",
      [
        "A large condition number κ(X) means what?",
        "조건수 κ(X)가 크다는 것은 무슨 뜻인가요?",
      ],
      [
        [
          "The columns of X are nearly parallel, so small data changes can swing θ a lot",
          "X의 열이 거의 나란해서, 데이터가 조금만 바뀌어도 θ가 크게 흔들릴 수 있습니다",
        ],
        ["The formula for θ must be wrong", "θ 공식이 틀렸습니다"],
        ["The test MSE is large, by definition", "정의상 테스트 MSE가 큽니다"],
      ],
      0,
      [
        "κ is about the problem’s geometry, not a proof that the algebra is false. A correct formula can still be shaky.",
        "κ는 문제의 모양이지, 대수가 틀렸다는 증거가 아닙니다. 공식이 맞아도 숫자는 흔들릴 수 있습니다.",
      ],
    ),
    q(
      "cheb",
      [
        "This site uses Chebyshev features. At moderate degree, what is κ(X) usually like?",
        "이 사이트는 체비쇼프 특징을 씁니다. 중간 차수에서 κ(X)는 보통 어떤가요?",
      ],
      [
        ["Huge and growing exponentially, like plain powers 1, x, x², …", "단항식 1, x, x², … 처럼 지수적으로 커집니다"],
        ["Small and fairly flat (about 1.5–3 up to degree around 20)", "작고 거의 평탄합니다 (차수 20 근처까지 약 1.5–3)"],
        ["Undefined", "정의되지 않습니다"],
      ],
      1,
      [
        "Plain powers are the exponential story. Here, late blow-up is p approaching n, not “high degree is always ill-conditioned.”",
        "지수적으로 커지는 이야기는 평범한 거듭제곱입니다. 여기서 늦게 커지는 것은 p가 n에 가까워지기 때문입니다.",
      ],
    ),
    q(
      "two-kappas",
      [
        "Are the lesson’s κ(X) and the solver’s “can I trust this?” bound the same number?",
        "수업의 κ(X)와 풀이의 ‘이 계산을 믿어도 되나’ 한계는 같은 숫자인가요?",
      ],
      [
        ["Yes. This site has only one κ.", "네. 이 사이트의 κ는 하나뿐입니다."],
        ["No. They are two numbers with two different jobs.", "아니요. 할 일이 다른 두 숫자입니다."],
        ["Yes. Both equal training MSE.", "네. 둘 다 학습 MSE입니다."],
      ],
      1,
      [
        "Lesson κ(X) is how aligned the columns are. The solve guard only says how many digits the regularized system can claim.",
        "수업의 κ(X)는 열이 얼마나 나란한지입니다. 풀이 가드는 정규화된 식이 믿을 자릿수일 뿐입니다.",
      ],
    ),
  ],
  "double-descent": [
    q(
      "claim",
      [
        "What does the phrase “double descent” claim about test error?",
        "‘이중 하강’이라는 말은 테스트 오차에 대해 무엇을 주장하나요?",
      ],
      [
        ["Test error only falls. It never rises.", "테스트 오차는 내려가기만 하고 오르지 않습니다."],
        [
          "Test error can rise near p = n, then fall again as the model grows further",
          "p = n 근처에서 올랐다가, 모형이 더 커지면 다시 내려갈 수 있습니다",
        ],
        ["Test error equals training error at every degree", "모든 차수에서 테스트 오차 = 학습 오차입니다"],
      ],
      1,
      [
        "The name is about a second drop after a peak near interpolation — not about training error matching test error.",
        "이름은 보간 근처 봉우리 다음의 두 번째 하락을 말합니다. 학습 오차와 테스트 오차가 같다는 뜻이 아닙니다.",
      ],
    ),
    q(
      "honest",
      [
        "On this site’s polynomial lab, what should you usually expect to see?",
        "이 사이트의 다항식 실험에서 보통 무엇을 기대해야 하나요?",
      ],
      [
        ["True double descent on every random seed", "시드마다 항상 진짜 이중 하강"],
        [
          "A spike in test error near interpolation, then only a partial recovery",
          "보간 근처에서 테스트 오차가 솟고, 그다음 부분적으로만 회복",
        ],
        ["NaN at p = n every time", "p = n에서 매번 NaN"],
      ],
      1,
      [
        "A second descent can appear, but it does not reliably beat the first minimum. Partial recovery is an honest result here.",
        "두 번째 하강이 보일 수는 있어도, 첫 최소를 이긴다고 보기 어렵습니다. 여기선 부분 회복이 정직한 결과입니다.",
      ],
    ),
    q(
      "finite",
      [
        "Test error is huge near p = n, but it is still an ordinary number (not NaN). What does that usually mean?",
        "p = n 근처에서 테스트 오차가 아주 커도, NaN이 아닌 보통 숫자이면 무슨 뜻인가요?",
      ],
      [
        ["The computer broke", "컴퓨터가 고장 났습니다"],
        [
          "The model’s variance blew up. That is not the same as a failed solve.",
          "모형의 분산이 커진 것입니다. 풀이 실패와는 다릅니다.",
        ],
        ["That peak is the definition of interpolation", "그것이 보간의 정의입니다"],
      ],
      1,
      [
        "A huge but ordinary number is usually the model, not a crash. The run is a numerical failure only when you see NaN or infinity.",
        "아주 커도 보통 숫자이면 대개 모형이지 고장이 아닙니다. NaN이나 무한대일 때만 수치 실패입니다.",
      ],
    ),
  ],
  "neural-network": [
    q(
      "composed",
      [
        "In this lesson, what is a neural network?",
        "이 수업에서 신경망은 무엇인가요?",
      ],
      [
        ["A new kind of loss J", "새로운 종류의 손실 J"],
        [
          "Stacked functions: usually a linear step plus a bend φ",
          "쌓아 올린 함수. 보통 선형 한 걸음 더하기 굽은 φ",
        ],
        ["Linear regression, but with a larger dataset", "데이터만 늘린 선형 회귀"],
      ],
      1,
      [
        "You still have f(x; θ), a loss J, and a gradient. A net is those same objects stacked.",
        "이전과 같이 f(x; θ), 손실 J, 기울기가 있습니다. 신경망은 그 대상들을 쌓은 것입니다.",
      ],
    ),
    q(
      "identity",
      [
        "If every layer is only multiply-and-add, with no bend φ, what is a “deep” net?",
        "모든 층이 곱하고 더하기만 하고 굽은 φ가 없으면, ‘깊은’ 망은 무엇인가요?",
      ],
      [
        ["A deep nonlinear network", "깊은 비선형 망"],
        ["Still just one multiply-and-add map", "여전히 곱하고 더하기 맵 하나"],
        ["Backpropagation", "역전파"],
      ],
      1,
      [
        "Without φ, stacked linear maps collapse to one linear map. The bends are what extra depth can buy.",
        "φ가 없으면 선형 맵을 쌓아도 선형 하나와 같습니다. 깊이가 사는 것은 그 굽힘입니다.",
      ],
    ),
    q(
      "no-train",
      [
        "Does this lesson train a multilayer net in the browser?",
        "이 수업은 브라우저에서 다층 신경망을 학습시키나요?",
      ],
      [
        ["Yes. That is the experiment on this page.", "네. 이 페이지의 실험이 그것입니다."],
        [
          "No. It explains stacking. Training a full net is not in this lesson.",
          "아니요. 쌓기를 설명합니다. 전체 망 학습은 이 수업에 없습니다.",
        ],
        ["Yes, but only if you choose ReLU", "네. ReLU를 고를 때만 그렇습니다."],
      ],
      1,
      [
        "The interactive piece is the chain of φ and φ′. Fitting a multilayer net is out of scope here.",
        "인터랙티브한 부분은 φ와 φ′의 연쇄입니다. 다층 망을 맞추는 것은 여기 범위 밖입니다.",
      ],
    ),
  ],
  backpropagation: [
    q(
      "what",
      [
        "What is backpropagation?",
        "역전파는 무엇인가요?",
      ],
      [
        ["The rule that updates θ (the step)", "θ를 갱신하는 규칙 (한 걸음)"],
        [
          "The chain rule through the stacked model, used to compute ∇J",
          "쌓인 모형에 연쇄 법칙을 써서 ∇J를 구하는 것",
        ],
        ["A different loss from mean squared error", "평균 제곱 오차와 다른 손실"],
      ],
      1,
      [
        "Backprop computes the gradient. Gradient descent is the step that uses that gradient.",
        "역전파는 기울기를 구합니다. 경사 하강은 그 기울기를 쓰는 한 걸음입니다.",
      ],
    ),
    q(
      "bound",
      [
        "In the default sigmoid demo, is |δ_L| = (1/4)^L the actual measured value?",
        "기본 시그모이드 데모에서 |δ_L| = (1/4)^L이 실제로 측정된 값인가요?",
      ],
      [
        ["Yes. That is the live number at the default settings.", "네. 기본 설정의 실제 숫자입니다."],
        [
          "No. That formula is only an upper bound. Trust the number on the demo.",
          "아니요. 그 식은 상한일 뿐입니다. 믿을 숫자는 화면의 값입니다.",
        ],
        ["Yes. That is the definition of ReLU.", "네. 그것이 ReLU의 정의입니다."],
      ],
      1,
      [
        "|δ_L| ≤ (|w|/4)^L is a bound. Activations move, so the demo’s recurrence is the number to trust.",
        "|δ_L| ≤ (|w|/4)^L은 상한입니다. 활성화가 움직이므로, 믿을 숫자는 데모의 점화식입니다.",
      ],
    ),
    q(
      "check",
      [
        "How does this lesson’s experiment check that backprop is the chain rule?",
        "이 수업의 실험은 역전파가 연쇄 법칙인지 어떻게 확인하나요?",
      ],
      [
        ["By training a deep net until training error is 0", "학습 오차가 0이 될 때까지 깊은 망을 학습시킵니다"],
        [
          "By matching the calculus formula for ∂J/∂w to a finite-difference estimate",
          "∂J/∂w의 미적분 식과 유한차분 추정이 같은지 봅니다",
        ],
        ["By comparing training MSE with test MSE", "학습 MSE와 테스트 MSE를 비교합니다"],
      ],
      1,
      [
        "If the two derivatives agree, backprop is not a different algorithm — it is the chain rule on this sample.",
        "두 도함수가 같으면 역전파는 다른 알고리즘이 아니라, 이 표본에서의 연쇄 법칙입니다.",
      ],
    ),
  ],
};
