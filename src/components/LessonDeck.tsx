"use client";

import Pressable from "@/components/Pressable";
import { useLanguage } from "@/components/LanguageProvider";
import { QUIZZES } from "@/content/quizzes";
import {
  getLesson,
  lessonPath,
  LESSONS,
} from "@/curriculum/curriculum";
import { pathNeighbors } from "@/curriculum/paths";
import { CURRICULUM_VERSION } from "@/curriculum/version";
import { isCourseLocale, type CourseLocale } from "@/lib/locales";
import { isCorrectChoice, localeText } from "@/lib/quiz";
import {
  emptyProgress,
  loadProgress,
  markLessonComplete,
  subscribeProgress,
} from "@/lib/progress";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from "react";

const STAGE_IDS = new Set([
  "what",
  "why",
  "intuition",
  "mathematics",
  "lesson-experiment",
  "summary",
]);

const knownSlugs = LESSONS.map((lesson) => lesson.slug);
const SERVER_PROGRESS = emptyProgress(CURRICULUM_VERSION);

interface Section {
  id: string;
  heading: ReactNode;
  body: ReactNode[];
}

function headingId(node: ReactNode): string | undefined {
  if (!isValidElement(node)) return undefined;
  const props = node.props as { id?: string; "data-stage"?: string };
  return props["data-stage"] ?? props.id;
}

function isStageHeading(node: ReactNode): node is ReactElement<{ id?: string }> {
  const id = headingId(node);
  return Boolean(id && STAGE_IDS.has(id));
}

function splitSections(children: ReactNode): Section[] {
  const nodes = Children.toArray(children).filter((node) =>
    typeof node === "string" ? node.trim().length > 0 : true,
  );
  const sections: Section[] = [];
  let current: Section | null = null;
  for (const node of nodes) {
    if (isStageHeading(node)) {
      if (current) sections.push(current);
      current = {
        id: headingId(node) ?? `s${sections.length}`,
        heading: node,
        body: [],
      };
    } else if (current) {
      current.body.push(node);
    } else {
      current = { id: `lead-${sections.length}`, heading: null, body: [node] };
    }
  }
  if (current) sections.push(current);
  return sections;
}

export default function LessonDeck({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t, locale } = useLanguage();
  const parts = pathname.split("/").filter(Boolean);
  const lang: CourseLocale = isCourseLocale(parts[0]) ? parts[0] : locale;
  const slug = parts[2] ?? "";
  const questions = QUIZZES[slug] ?? [];
  const sections = useMemo(() => splitSections(children), [children]);

  const progress = useSyncExternalStore(
    subscribeProgress,
    () => loadProgress(knownSlugs, CURRICULUM_VERSION),
    () => SERVER_PROGRESS,
  );
  const { nextSlug } = pathNeighbors(slug, progress.activePathId);
  const next = nextSlug ? getLesson(nextSlug) : null;
  const lesson = getLesson(slug);
  const total = sections.length + questions.length;
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [shake, setShake] = useState(false);

  const inQuiz = step >= sections.length && step < total;
  const quizIndex = step - sections.length;
  const question = inQuiz ? questions[quizIndex] : undefined;
  const done = step >= total;
  const reading = step < sections.length;
  const section = reading ? sections[step] : undefined;
  const ratio = total === 0 ? 1 : Math.min(1, (done ? total : step) / Math.max(total, 1));

  const check = useCallback(() => {
    if (!question || picked === null || checked) return;
    const ok = isCorrectChoice(question, picked);
    setChecked(true);
    if (ok) setCorrectCount((n) => n + 1);
    else {
      setShake(true);
      window.setTimeout(() => setShake(false), 280);
    }
  }, [checked, picked, question]);

  const goNext = useCallback(() => {
    if (inQuiz && !checked) return;
    if (done) return;
    setStep((current) => current + 1);
    setPicked(null);
    setChecked(false);
  }, [checked, done, inQuiz]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (inQuiz && !checked && event.key >= "1" && event.key <= "9") {
        const index = Number(event.key) - 1;
        if (question && index < question.choices.length) setPicked(index);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        if (inQuiz && !checked) check();
        else goNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [check, checked, goNext, inQuiz, question]);

  useEffect(() => {
    if (done && questions.length > 0 && correctCount === questions.length) {
      markLessonComplete(slug, knownSlugs, CURRICULUM_VERSION);
    }
  }, [correctCount, done, questions.length, slug]);

  if (sections.length === 0) {
    return <div className="lesson-prose">{children}</div>;
  }

  const qz = t.quiz;
  const perfect = correctCount === questions.length;

  return (
    <div className="lesson-player">
      <div
        className="flex items-center gap-3"
        aria-label={t.course.progressOf(Math.min(step + 1, total), total)}
      >
        <div className="hud-bar min-w-0 flex-1">
          <span style={{ transform: `scaleX(${ratio})` }} />
        </div>
        <p className="text-xs font-extrabold tabular-nums text-accent">
          {t.course.progressOf(Math.min(step + (done ? 0 : 1), total), total)}
        </p>
      </div>

      <div className="lesson-stage" key={step}>
        {reading && section && (
          <>
            <Speech heading={section.heading} />
            <div className="lesson-card lesson-prose">{section.body}</div>
          </>
        )}

        {inQuiz && question && (
          <>
            <Speech
              heading={
                <h2 className="mt-0 text-xl font-extrabold">
                  {qz.questionOf(quizIndex + 1, questions.length)}
                </h2>
              }
            />
            <p className="text-lg font-extrabold text-pretty">
              {localeText(question.prompt, lang)}
            </p>
            <ul className={`mt-4 space-y-3 ${shake ? "lesson-shake" : ""}`}>
              {question.choices.map((choice, index) => {
                const selected = picked === index;
                const reveal = checked;
                const isRight = index === question.correctIndex;
                const state = reveal
                  ? isRight
                    ? "choice-right"
                    : selected
                      ? "choice-wrong"
                      : "choice-dim"
                  : selected
                    ? "choice-picked"
                    : "";
                return (
                  <li key={question.id + String(index)}>
                    <button
                      type="button"
                      className={`choice ${state}`}
                      aria-pressed={selected}
                      disabled={checked}
                      onClick={() => setPicked(index)}
                    >
                      <span className="choice-key" aria-hidden="true">
                        {index + 1}
                      </span>
                      {localeText(choice, lang)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {done && (
          <>
            <Speech
              heading={
                <h2 className="mt-0 text-xl font-extrabold">
                  {perfect ? qz.passed : qz.keepGoing}
                </h2>
              }
            />
            <p className="text-lg font-extrabold tabular-nums">
              {qz.score(correctCount, questions.length)}
            </p>
            <p className="mt-2 text-muted">
              {perfect ? qz.passedHint : qz.retryHint}
            </p>
          </>
        )}
      </div>

      {inQuiz && checked && question && (
        <div
          className={`feedback ${isCorrectChoice(question, picked ?? -1) ? "feedback-ok" : "feedback-bad"}`}
          role="status"
          aria-live="polite"
        >
          <p className="font-extrabold">
            {isCorrectChoice(question, picked ?? -1) ? qz.correct : qz.wrong}
          </p>
          <p className="mt-1 text-sm">{localeText(question.why, lang)}</p>
        </div>
      )}

      <div className="lesson-footer">
        {reading && (
          <Pressable className="w-full" onClick={goNext}>
            {step === sections.length - 1 && questions.length > 0
              ? qz.startReview
              : t.course.continue}
          </Pressable>
        )}
        {inQuiz && !checked && (
          <Pressable className="w-full" disabled={picked === null} onClick={check}>
            {qz.check}
          </Pressable>
        )}
        {inQuiz && checked && (
          <Pressable className="w-full" onClick={goNext}>
            {t.course.continue}
          </Pressable>
        )}
        {done && (
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            {!perfect && (
              <Pressable
                className="w-full"
                variant="secondary"
                onClick={() => {
                  setStep(sections.length);
                  setPicked(null);
                  setChecked(false);
                  setCorrectCount(0);
                }}
              >
                {qz.retry}
              </Pressable>
            )}
            {lesson?.experimentId && (
              <Pressable
                href="#experiment"
                variant={perfect ? "secondary" : "primary"}
                className="w-full"
              >
                {qz.openLab}
              </Pressable>
            )}
            {next && (
              <Pressable href={lessonPath(lang, next.slug)} className="w-full">
                {t.course.next}: {next.title[lang]}
              </Pressable>
            )}
            <Link href={`/${lang}/learn`} className="press press-ghost w-full">
              {t.course.map}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Speech({ heading }: { heading: ReactNode }) {
  if (!heading) return null;
  return (
    <div className="speech">
      <Mascot />
      <div className="speech-bubble">{heading}</div>
    </div>
  );
}

function Mascot() {
  return (
    <svg viewBox="0 0 32 32" className="h-12 w-12 shrink-0" aria-hidden="true">
      <rect width="32" height="32" rx="10" fill="#58cc02" />
      <rect x="0" y="24" width="32" height="8" rx="4" fill="#46a302" />
      <circle cx="12" cy="13" r="2.2" fill="#14532d" />
      <circle cx="20" cy="13" r="2.2" fill="#14532d" />
      <path
        d="M12 20h8"
        stroke="#14532d"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
