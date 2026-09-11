import LinearRegressionLab from "@/components/LinearRegressionLab";
import GradientDescentLab from "@/components/GradientDescentLab";
import OverfittingLab from "@/components/OverfittingLab";
import ExperimentWorkspace from "@/components/ExperimentWorkspace";
import GeneralizationLab from "@/components/GeneralizationLab";
import ConditioningLab from "@/components/ConditioningLab";
import ActivationsLab from "@/experiments/ActivationsLab";
import BackpropCheck from "@/experiments/BackpropCheck";
import BiasVarianceLab from "@/experiments/BiasVarianceLab";
import RidgeLab from "@/experiments/RidgeLab";
import FiniteDiffLab from "@/components/FiniteDiffLab";

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
  if (experimentId === "finite-diff") return <FiniteDiffLab />;
  if (experimentId === "activations") {
    return (
      <div className="space-y-8">
        {slug === "backpropagation" && <BackpropCheck />}
        <ActivationsLab />
      </div>
    );
  }
  if (experimentId === "overfitting") return <OverfittingLab />;
  if (experimentId === "bias-variance") return <BiasVarianceLab />;
  if (experimentId === "ridge") return <RidgeLab />;
  if (experimentId === "generalization") return <GeneralizationLab />;
  if (experimentId === "conditioning") return <ConditioningLab />;
  if (experimentId === "double-descent") return <ExperimentWorkspace />;
  return null;
}
