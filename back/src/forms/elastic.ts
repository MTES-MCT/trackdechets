import { Form } from "@prisma/client";
import prisma from "../prisma";
import { client, index } from "../common/elastic";
import { FormSearchResult } from "../generated/graphql/types";

function toFormSearchResult(form: Form): FormSearchResult {
  return {
    id: form.id,
    readableId: form.readableId,
    status: form.status,
    recipientCompany: form.recipientCompanySiret
      ? {
          siret: form.recipientCompanySiret,
          name: form.recipientCompanyName
        }
      : null,
    sirets: [form.recipientCompanySiret]
  };
}

export async function indexAllForms({ skip = 0 }: { skip?: number } = {}) {
  const take = 1000;
  const forms = await prisma.form.findMany({
    skip,
    take
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
          _index: index.index
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

export async function indexForm(form: Form) {
  await client.index({
    index: index.index,
    body: toFormSearchResult(form)
  });
}
