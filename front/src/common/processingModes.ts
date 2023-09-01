import { ProcessingMode } from "generated/graphql/types";

export const getProcessingModesFromProcessingOperation = (
  processingOperationCode: string
): ProcessingMode[] => {
  const splitted = processingOperationCode.split(" ");
  const letter = splitted[0];
  const number = parseInt(splitted[1]);

  if (letter === "D" && number <= 12) {
    return [ProcessingMode.Elimination];
  }

  if (processingOperationCode === "R 1") {
    return [ProcessingMode.EnergyRecovery];
  }

  if (
    ["R 2", "R 3", "R 4", "R 5", "R 7", "R 9", "R 11"].includes(
      processingOperationCode
    )
  ) {
    return [ProcessingMode.Reuse, ProcessingMode.Recycling];
  }

  if (["R 6", "R 8", "R 10"].includes(processingOperationCode)) {
    return [ProcessingMode.Recycling];
  }

  // Regroupements: D13, D14, D15, R12, R13
  return [];
};
