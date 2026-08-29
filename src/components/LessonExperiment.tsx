import LinearRegressionLab from "@/components/LinearRegressionLab";
import GradientDescentLab from "@/components/GradientDescentLab";
import OverfittingLab from "@/components/OverfittingLab";
import ExperimentWorkspace from "@/components/ExperimentWorkspace";
import ActivationsLab from "@/experiments/ActivationsLab";
import BiasVarianceLab from "@/experiments/BiasVarianceLab";

export default function LessonExperiment({
  experimentId,
}: {
  experimentId: string;
  lang: string;
}) {
  if (experimentId === "linear-regression") return <LinearRegressionLab />;
  if (experimentId === "gradient-descent") return <GradientDescentLab />;
  if (experimentId === "activations") return <ActivationsLab />;
  if (experimentId === "overfitting") {
    return (
      <div className="space-y-8">
        <OverfittingLab />
        <BiasVarianceLab />
      </div>
    );
  }
  if (experimentId === "double-descent") return <ExperimentWorkspace />;
  return null;
}
