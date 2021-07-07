import { WorkflowStep } from "../../../common/workflow";
import mutations from "../mutations";

export function markSegmentAsReadyToTakeOver(company: string): WorkflowStep {
  return {
    description: `Dès que le transporteur (transporteur 1) est prêt à transférer son déchet et bordereau,
  il marque le bordereau grâce à la mutation markSegmentAsReadyToTakeOver. Le transporteur
  suivant (transporteur 2) peut alors le compléter ou le prendre en charge. Le transporteur 1 ne peut plus modifier le segment.`,
    mutation: mutations.markSegmentAsReadyToTakeOver,
    variables: ({ transportSegment }) => ({ id: transportSegment.id }),
    expected: { readyToTakeOver: true },
    data: response => response.markSegmentAsReadyToTakeOver,
    company
  };
}
