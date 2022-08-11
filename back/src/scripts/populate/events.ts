import prisma from "../../prisma";
import { subSeconds } from "date-fns";

import { randomChoice, getReadableId } from "./utils";

import { getUid } from "../../utils";
const metadata = {
  authType: "BEARER"
};
const eventData = {
  content: {
    id: "abcd",
    sentAt: "2019-06-18T00:00:00.000Z",
    sentBy: null,
    status: "SEALED",
    ownerId: "xyz",
    customId: null,
    signedAt: null,
    signedBy: null,
    createdAt: "2019-01-17T10:20:43.837Z",
    isDeleted: false,
    updatedAt: "2020-11-30T19:49:33.300Z",
    isAccepted: null,
    readableId: "TD-19-AAA00027",
    receivedAt: null,
    receivedBy: null,
    emitterType: "PRODUCER",
    processedAt: null,
    processedBy: null,
    recipientCap: "",
    brokerReceipt: null,
    traderReceipt: null,
    noTraceability: null,
    wasteDetailsPop: false,
    brokerDepartment: null,
    ecoOrganismeName: null,
    quantityReceived: null,
    traderDepartment: null,
    wasteDetailsCode: "01 03 04*",
    wasteDetailsName: "Test",
    brokerCompanyMail: null,
    brokerCompanyName: null,
    ecoOrganismeSiret: null,
    emitterPickupSite: "",
    traderCompanyMail: null,
    traderCompanyName: null,
    brokerCompanyPhone: null,
    brokerCompanySiret: null,
    emitterCompanyMail: "test@test.fr",
    emitterCompanyName: "LOREM",
    traderCompanyPhone: null,
    traderCompanySiret: null,
    transporterReceipt: "aaa",
    wasteRefusalReason: null,
    appendix2RootFormId: null,
    brokerValidityLimit: null,
    emitterCompanyPhone: "01",
    emitterCompanySiret: "4679",
    emitterWorkSiteCity: null,
    emitterWorkSiteName: null,
    isImportedFromPaper: false,
    signedByTransporter: true,
    traderValidityLimit: null,
    wasteDetailsOnuCode: "",
    brokerCompanyAddress: null,
    brokerCompanyContact: null,
    emitterWorkSiteInfos: null,
    nextTransporterSiret: null,
    recipientCompanyMail: "e-lorem@test.fr",
    recipientCompanyName: "IPSUM",
    traderCompanyAddress: null,
    traderCompanyContact: null,
    wasteDetailsQuantity: 2,
    emitterCompanyAddress: "16 PL MICHEL FROMENT, 75018 PARIS 18",
    emitterCompanyContact: "Orion",
    recipientCompanyPhone: "06",
    recipientCompanySiret: "864",
    transporterCustomInfo: null,
    transporterDepartment: "82",
    emitterWorkSiteAddress: null,
    recipientIsTempStorage: false,
    transporterCompanyMail: "t@test.fr",
    transporterCompanyName: "DOLOR",
    transporterNumberPlate: "123",
    wasteAcceptationStatus: null,
    currentTransporterSiret: null,
    processingOperationDone: null,
    recipientCompanyAddress: "1 PLACE J JAURES, 33000 BORDEAUX",
    recipientCompanyContact: "Emmanuel",
    transporterCompanyPhone: "01",
    transporterCompanySiret: "HJK",
    wasteDetailsConsistence: null,
    wasteDetailsIsDangerous: true,
    temporaryStorageDetailId: null,
    transporterTransportMode: "ROAD",
    transporterValidityLimit: "2019-01-17T00:00:00.000Z",
    wasteDetailsQuantityType: "ESTIMATED",
    emitterWorkSitePostalCode: null,
    transporterCompanyAddress: "6 PL JACQUES MARCHAND, 75013 PARIS 13",
    transporterCompanyContact: "Transporteur",
    nextDestinationCompanyMail: null,
    nextDestinationCompanyName: null,
    wasteDetailsPackagingInfos: [
      {
        type: "CITERNE",
        other: null,
        quantity: 1
      }
    ],
    nextDestinationCompanyPhone: null,
    nextDestinationCompanySiret: null,
    recipientProcessingOperation: "D 13",
    nextDestinationCompanyAddress: null,
    nextDestinationCompanyContact: null,
    nextDestinationCompanyCountry: null,
    processingOperationDescription: null,
    transporterIsExemptedOfReceipt: null,
    nextDestinationProcessingOperation: null
  }
};
const bulkEventsFactory = async ({
  pageSize = 1,
  batchs = 1
}: {
  pageSize: number;
  batchs: number;
}) => {
  const baseDate = new Date();

  for (let batch = 0; batch < batchs; batch++) {
    const data = [];
    console.log(batch);
    for (let i = 0; i < pageSize; i++) {
    

      const date = subSeconds(baseDate, i * 10);
      data.push({
        createdAt: date,
        streamId: getReadableId(
          date,
          randomChoice(["BSDA", "BSFF", "BSDD", "BSVU", "BSDASRI"])
        ),
        type: "BsddUpdated",
        data: eventData,
        metadata: metadata,
        actor: getUid(10)
      });
    }
    console.log(data.length);
    await prisma.event.createMany({
      data
    });
  }
};

export async function createEvents(pageSize, batchs) {
  await bulkEventsFactory({
    pageSize,
    batchs
  });
}
