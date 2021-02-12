import prisma from "../prisma";
import { client, index } from "../common/elastic";
import { FormSearchResult } from "../generated/graphql/types";
import { FullForm } from "./types";

function toFormSearchResult(form: FullForm): FormSearchResult {
  const sirets: Array<string | null> = [
    form.emitterCompanySiret,
    form.transporterCompanySiret,
    ...form.transportSegments.map(segment => segment.transporterCompanySiret),
    form.temporaryStorageDetail?.destinationCompanySiret,
    form.temporaryStorageDetail?.transporterCompanySiret,
    form.recipientCompanySiret,
    form.traderCompanySiret,
    form.ecoOrganismeSiret
  ];
  const waitingForSirets: Array<string | null> = [];

  // FIXME: what about multimodal?
  switch (form.status) {
    case "DRAFT":
      // the BSD is still a draft and thus not ready to start its journey
      break;

    case "SEALED":
      // the transporter has to take the waste to its next recipient
      waitingForSirets.push(form.transporterCompanySiret);
      break;

    case "SENT":
      // the temporary storage or recipient has to declare the waste as received
      waitingForSirets.push(form.recipientCompanySiret);
      break;

    case "TEMP_STORED":
      // the temporary storage has to declare the waste as accepted or refused
      waitingForSirets.push(form.recipientCompanySiret);
      break;

    case "TEMP_STORER_ACCEPTED":
      // the temporary storage has to reseal the BSD
      waitingForSirets.push(form.recipientCompanySiret);
      break;

    case "RESEALED":
      // the temporary storage's transporter has to take the waste over to the next recipient
      waitingForSirets.push(
        form.temporaryStorageDetail.transporterCompanySiret
      );
      break;

    case "RESENT":
      // the waste left the temporary storage for the next recipient
      waitingForSirets.push(
        form.temporaryStorageDetail.destinationCompanySiret
      );
      break;

    case "RECEIVED":
      // the final recipient has to declare the waste as accepted or refused
      waitingForSirets.push(
        form.temporaryStorageDetail?.destinationCompanySiret ??
          form.recipientCompanySiret
      );
      break;

    case "ACCEPTED":
      // the recipient has to declare the waste as processed
      waitingForSirets.push(form.recipientCompanySiret);
      break;

    case "REFUSED":
      // the waste was refused so there's nothing left to do
      break;

    case "AWAITING_GROUP":
      // there's nothing companies on this BSD can do to progress further
      // another BSD has to be created to group
      break;

    case "GROUPED":
      // there's nothing companies on this BSD can do to progress further
      // the other BSD has to declare the waste as "PROCESSED"
      break;

    case "NO_TRACEABILITY":
      // there's nothing to do as the tracking was lost
      break;

    case "PROCESSED":
      // the waste completed its journey
      break;

    default:
      break;
  }

  return {
    id: form.id,
    readableId: form.readableId,
    type: "FORM",
    status: form.status,
    emitter: form.emitterCompanyName,
    recipient: form.recipientCompanyName,
    waste: form.wasteDetailsCode,
    sirets: sirets.filter(Boolean),
    waitingForSirets: waitingForSirets.filter(Boolean)
  };
}

export async function indexAllForms({ skip = 0 }: { skip?: number } = {}) {
  const take = 1000;
  const forms = await prisma.form.findMany({
    skip,
    take,
    where: {
      isDeleted: false
    },
    include: {
      temporaryStorageDetail: true,
      transportSegments: true
    }
  });

  if (forms.length === 0) {
    // on the first call forms may be empty if the database is empty
    return;
  }

  await client.bulk({
    refresh: true,
    body: forms.flatMap(form => [
      {
        index: {
          _index: index.index,
          _id: form.id
        }
      },
      toFormSearchResult(form)
    ])
  });

  if (forms.length < take) {
    // all forms have been indexed
    return;
  }

  return indexAllForms({ skip: skip + take });
}

export async function indexForm(form: FullForm) {
  await client.index({
    index: index.index,
    id: form.id,
    body: toFormSearchResult(form)
  });
}
