import * as yup from "yup";
import { OperationMode } from "@prisma/client";
import { getOperationModesFromOperationCode } from "../operationModes";

export const destinationOperationModeValidation = () =>
  yup
    .mixed<OperationMode | null | undefined>()
    .oneOf([...Object.values(OperationMode), null, undefined])
    .nullable()
    .test(
      "processing-mode-matches-processing-operation",
      "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie",
      function (item) {
        const { destinationOperationCode } = this.parent;
        const destinationOperationMode = item;

        if (destinationOperationCode) {
          const modes = getOperationModesFromOperationCode(
            destinationOperationCode
          );

          if (modes.length && !destinationOperationMode) {
            return new yup.ValidationError(
              "Vous devez préciser un mode de traitement"
            );
          } else if (
            (modes.length &&
              destinationOperationMode &&
              !modes.includes(destinationOperationMode)) ||
            (!modes.length && destinationOperationMode)
          ) {
            return new yup.ValidationError(
              "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
            );
          }
        }

        return true;
      }
    );
