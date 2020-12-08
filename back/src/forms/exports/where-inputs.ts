import { Prisma } from "@prisma/client";
import { FormsRegisterExportType } from "../../generated/graphql/types";

/**
 * Returns a FormWhereInput used in prisma.forms({where: $input})
 * to filter forms for different types of register exports and filters
 */
export function formsWhereInput(
  exportType: FormsRegisterExportType,
  sirets: string[],
  startDate?: Date,
  endDate?: Date,
  wasteCode?: string
): Prisma.FormWhereInput {
  // build prisma where input
  const whereInputs: Prisma.FormWhereInput[] = [];

  if (startDate) {
    whereInputs.push({ sentAt: { gte: startDate } });
  }

  if (endDate) {
    whereInputs.push({ sentAt: { lte: endDate } });
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
function outgoingWasteWhereInput(sirets: string[]): Prisma.FormWhereInput {
  return {
    OR: [
      { emitterCompanySiret: { in: sirets } },
      { ecoOrganismeSiret: { in: sirets } }
    ],
    AND: [{ status: { notIn: ["DRAFT", "SEALED"] } }]
  };
}

/**
 * Forms corresponding to incoming wastes of a list of treatment or TTR companies
 * We need to handle cases whith a temp storage
 */
function incomingWasteWhereInput(sirets: string[]): Prisma.FormWhereInput {
  return {
    OR: [
      {
        AND: [
          { recipientIsTempStorage: false },
          { recipientCompanySiret: { in: sirets } },
          { status: { notIn: ["DRAFT", "SEALED", "SENT"] } }
        ]
      },
      {
        AND: [
          { recipientIsTempStorage: true },
          {
            OR: [
              {
                AND: [
                  { recipientCompanySiret: { in: sirets } },
                  { status: { notIn: ["DRAFT", "SEALED", "SENT"] } }
                ]
              },
              {
                AND: [
                  {
                    temporaryStorageDetail: {
                      destinationCompanySiret: { in: sirets }
                    }
                  },
                  {
                    status: {
                      notIn: [
                        "DRAFT",
                        "SEALED",
                        "SENT",
                        "TEMP_STORED",
                        "TEMP_STORER_ACCEPTED",
                        "RESENT"
                      ]
                    }
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
function transportedWasteWhereInput(sirets: string[]): Prisma.FormWhereInput {
  return {
    OR: [
      {
        AND: [
          { recipientIsTempStorage: false },
          { transporterCompanySiret: { in: sirets } },
          { status: { notIn: ["DRAFT", "SEALED"] } }
        ]
      },
      // temporary storage
      {
        AND: [
          { recipientIsTempStorage: true },
          {
            temporaryStorageDetail: {
              transporterCompanySiret: { in: sirets }
            }
          },
          {
            status: {
              notIn: [
                "DRAFT",
                "SEALED",
                "SENT",
                "TEMP_STORED",
                "TEMP_STORER_ACCEPTED"
              ]
            }
          }
        ]
      },
      // multi-modal
      {
        AND: [
          {
            transportSegments: {
              some: {
                transporterCompanySiret: { in: sirets }
              }
            }
          },
          { status: { notIn: ["DRAFT", "SEALED"] } }
        ]
      }
    ]
  };
}

/**
 * Forms corresponding to traded waste of a list of trader companies
 */
function tradedWasteWhereInput(sirets: string[]): Prisma.FormWhereInput {
  return {
    AND: [
      {
        status: { notIn: ["DRAFT", "SEALED"] }
      },
      { traderCompanySiret: { in: sirets } }
    ]
  };
}

/**
 * Forms where a list of companies are present for any status
 * excepted DRAFT and SEALED
 */
function allWasteWhereInput(sirets: string[]): Prisma.FormWhereInput {
  return {
    AND: [
      {
        status: { notIn: ["DRAFT", "SEALED"] }
      },
      {
        OR: [
          { emitterCompanySiret: { in: sirets } },
          { ecoOrganismeSiret: { in: sirets } },
          { recipientCompanySiret: { in: sirets } },
          { traderCompanySiret: { in: sirets } },
          {
            temporaryStorageDetail: { destinationCompanySiret: { in: sirets } }
          },
          { traderCompanySiret: { in: sirets } },
          { traderCompanySiret: { in: sirets } },
          { transporterCompanySiret: { in: sirets } },
          {
            temporaryStorageDetail: { transporterCompanySiret: { in: sirets } }
          },
          {
            transportSegments: {
              some: {
                transporterCompanySiret: { in: sirets }
              }
            }
          }
        ]
      }
    ]
  };
}
