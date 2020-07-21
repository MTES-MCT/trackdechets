import { FormWhereInput } from "../../generated/prisma-client";
import { FormsRegisterExportType } from "../../generated/graphql/types";

/**
 * Returns a FormWhereInput used in prisma.forms({where: $input})
 * to filter forms for different types of register exports and filters
 */
export function formsWhereInput(
  exportType: FormsRegisterExportType,
  sirets: string[],
  startDate?: string,
  endDate?: string,
  wasteCode?: string
): FormWhereInput {
  // build prisma where input
  const whereInputs: FormWhereInput[] = [];

  if (startDate) {
    whereInputs.push({ sentAt_gte: startDate });
  }

  if (endDate) {
    whereInputs.push({ sentAt_lte: endDate });
  }

  if (wasteCode) {
    whereInputs.push({ wasteDetailsCode: wasteCode });
  }

  const mapping = {
    OUTGOING: outgoingWasteWhereInput(sirets),
    INCOMING: incomingWasteWhereInput(sirets),
    TRANSPORTED: transportedWasteWhereInput(sirets),
    TRADED: tradedWasteWhereInput(sirets),
    ALL: allWasteWhereInput(sirets)
  };

  whereInputs.push(mapping[exportType]);

  return { AND: whereInputs };
}

/**
 * Forms corresponding to outgoing wastes of a list of production companies
 */
function outgoingWasteWhereInput(sirets: string[]): FormWhereInput {
  return {
    AND: [
      { emitterCompanySiret_in: sirets },
      { status_not_in: ["DRAFT", "SEALED"] }
    ]
  };
}

/**
 * Forms corresponding to incoming wastes of a list of treatment or TTR companies
 * We need to handle cases whith a temp storage
 */
function incomingWasteWhereInput(sirets: string[]): FormWhereInput {
  return {
    OR: [
      {
        AND: [
          { recipientIsTempStorage: false },
          { recipientCompanySiret_in: sirets },
          { status_not_in: ["DRAFT", "SEALED", "SENT"] }
        ]
      },
      {
        AND: [
          { recipientIsTempStorage: true },
          {
            OR: [
              {
                AND: [
                  { recipientCompanySiret_in: sirets },
                  { status_not_in: ["DRAFT", "SEALED", "SENT"] }
                ]
              },
              {
                AND: [
                  {
                    temporaryStorageDetail: {
                      destinationCompanySiret_in: sirets
                    }
                  },
                  {
                    status_not_in: [
                      "DRAFT",
                      "SEALED",
                      "SENT",
                      "TEMP_STORED",
                      "RESENT"
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };
}

/**
 * Forms corresponding to transported wastes of a list of transporter companies
 * We need to handle cases of multiple transporters with temporary storage
 */
function transportedWasteWhereInput(sirets: string[]): FormWhereInput {
  return {
    OR: [
      {
        AND: [
          { recipientIsTempStorage: false },
          { transporterCompanySiret_in: sirets },
          { status_not_in: ["DRAFT", "SEALED"] }
        ]
      },
      // temporary storage
      {
        AND: [
          { recipientIsTempStorage: true },
          {
            temporaryStorageDetail: {
              transporterCompanySiret_in: sirets
            }
          },
          { status_not_in: ["DRAFT", "SEALED", "SENT", "TEMP_STORED"] }
        ]
      },
      // multi-modal
      {
        AND: [
          {
            transportSegments_some: {
              transporterCompanySiret_in: sirets
            }
          },
          { status_not_in: ["DRAFT", "SEALED"] }
        ]
      }
    ]
  };
}

/**
 * Forms corresponding to traded waste of a list of trader companies
 */
function tradedWasteWhereInput(sirets: string[]): FormWhereInput {
  return {
    AND: [
      {
        status_not_in: ["DRAFT", "SEALED"]
      },
      { traderCompanySiret_in: sirets }
    ]
  };
}

/**
 * Forms where a list of companies are present for any status
 * excepted DRAFT and SEALED
 */
function allWasteWhereInput(sirets: string[]): FormWhereInput {
  return {
    AND: [
      {
        status_not_in: ["DRAFT", "SEALED"]
      },
      {
        OR: [
          { emitterCompanySiret_in: sirets },
          { recipientCompanySiret_in: sirets },
          { traderCompanySiret_in: sirets },
          {
            temporaryStorageDetail: { destinationCompanySiret_in: sirets }
          },
          { traderCompanySiret_in: sirets },
          { traderCompanySiret_in: sirets },
          { transporterCompanySiret_in: sirets },
          {
            temporaryStorageDetail: { transporterCompanySiret_in: sirets }
          },
          {
            transportSegments_some: {
              transporterCompanySiret_in: sirets
            }
          }
        ]
      }
    ]
  };
}
