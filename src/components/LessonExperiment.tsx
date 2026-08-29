import LinearRegressionLab from "@/components/LinearRegressionLab";
import GradientDescentLab from "@/components/GradientDescentLab";
import OverfittingLab from "@/components/OverfittingLab";
import ExperimentWorkspace from "@/components/ExperimentWorkspace";

export default function LessonExperiment({
  experimentId,
}: {
  experimentId: string;
  lang: string;
}) {
  if (experimentId === "linear-regression") return <LinearRegressionLab />;
  if (experimentId === "gradient-descent") return <GradientDescentLab />;
  if (experimentId === "overfitting") return <OverfittingLab />;
  if (experimentId === "double-descent") return <ExperimentWorkspace />;
  return null;
}
