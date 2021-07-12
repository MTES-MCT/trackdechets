import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function takeOverSegment(company: string): WorkflowStep {
  return {
    description: `Le transporteur 2 peut alors prendre en charge le déchet grâce à la mutation takeOverSegment,
qui vaudra pour signature et lui transfère la responsabilité du déchet. Pour cette mutation, certains champs
du segments sont obligatoires et devront être renseignés.`,
    mutation: mutations.takeOverSegment,
    variables: ({ transportSegment }) => ({
      id: transportSegment.id,
      takeOverInfo: fixtures.takeOverInfoInput
    }),
    expected: { takenOverBy: fixtures.takeOverInfoInput.takenOverBy },
    data: response => response.takeOverSegment,
    company
  };
}
