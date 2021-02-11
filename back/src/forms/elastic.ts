import prisma from "../prisma";
import { client, index } from "../common/elastic";
import { FormSearchResult } from "../generated/graphql/types";
import { FullForm } from "./types";

function toFormSearchResult(form: FullForm): FormSearchResult {
  return {
    id: form.id,
    readableId: form.readableId,
    type: "FORM",
    status: form.status,
    emitter: form.emitterCompanyName,
    recipient: form.recipientCompanyName,
    waste: form.wasteDetailsCode,
    sirets: [
      form.emitterCompanySiret,
      form.transporterCompanySiret,
      ...form.transportSegments.map(segment => segment.transporterCompanySiret),
      form.temporaryStorageDetail?.destinationCompanySiret,
      form.temporaryStorageDetail?.transporterCompanySiret,
      form.recipientCompanySiret,
      form.traderCompanySiret,
      form.ecoOrganismeSiret
    ].filter(Boolean)
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
