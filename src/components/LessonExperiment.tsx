import LinearRegressionLab from "@/components/LinearRegressionLab";
import GradientDescentLab from "@/components/GradientDescentLab";
import OverfittingLab from "@/components/OverfittingLab";
import ExperimentWorkspace from "@/components/ExperimentWorkspace";
import ActivationsLab from "@/experiments/ActivationsLab";
import BackpropCheck from "@/experiments/BackpropCheck";
import BiasVarianceLab from "@/experiments/BiasVarianceLab";
import RidgeLab from "@/experiments/RidgeLab";

export default function LessonExperiment({
  experimentId,
  slug,
}: {
  experimentId: string;
  lang: string;
  slug?: string;
}) {
  if (experimentId === "linear-regression") return <LinearRegressionLab />;
  if (experimentId === "gradient-descent") return <GradientDescentLab />;
  if (experimentId === "activations") {
    return (
      <div className="space-y-8">
        {slug === "backpropagation" && <BackpropCheck />}
        <ActivationsLab />
      </div>
    );
  }
  if (experimentId === "overfitting") {
    return (
      <div className="space-y-8">
        <OverfittingLab />
        <BiasVarianceLab />
      </div>
    );
  }
  if (experimentId === "ridge") return <RidgeLab />;
  if (experimentId === "double-descent") return <ExperimentWorkspace />;
  return null;
}
