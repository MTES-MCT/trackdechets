import { Job } from "bull";
import {
  getBsdaForElastic,
  toBsdElastic as toBsdaElastic
} from "../../bsda/elastic";
import {
  toBsdElastic as toBsdasriElastic,
  getBsdasriForElastic
} from "../../bsdasris/elastic";
import {
  getBsvhuForElastic,
  toBsdElastic as toBsvhuElastic
} from "../../bsvhu/elastic";
import { toBsdElastic as toBsffElastic } from "../../bsffs/elastic";
import { toBsdElastic as toBspaohElastic } from "../../bspaoh/elastic";
import { BsdElastic, indexBsd, getElasticBsdById } from "../../common/elastic";
import { getFormForElastic, indexForm } from "../../forms/elastic";
import { prisma } from "@td/prisma";
import { lookupUtils as bsdaLookupUtils } from "../../bsda/registryV2";
import { lookupUtils as bsdasriLookupUtils } from "../../bsdasris/registryV2";
import { lookupUtils as bsddLookupUtils } from "../../forms/registryV2";
import { lookupUtils as bsffLookupUtils } from "../../bsffs/registryV2";
import { lookupUtils as bspaohLookupUtils } from "../../bspaoh/registryV2";
import { lookupUtils as bsvhuLookupUtils } from "../../bsvhu/registryV2";

export async function indexBsdJob(
  job: Job<string>
): Promise<BsdElastic & { siretsBeforeUpdate: string[] }> {
  const bsdId = job.data;
  const indexed = await getElasticBsdById(bsdId);

  const hit = indexed?.body?.hits?.hits?.[0];

  // we keep track of previously indexed sirets in order to be able to notify a
  // company which would be removed from a bsd.
  // Next they're passed to the notify jobs (sse and webhooks)
  const siretsBeforeUpdate = hit?._source?.sirets || [];

  const optimisticCtx = {
    seqNo: hit?._seq_no,
    primaryTerm: hit?._primary_term
  };

  if (bsdId.startsWith("BSDA-")) {
    const bsda = await getBsdaForElastic({ id: bsdId });

    const elasticBsda = toBsdaElastic(bsda);
    await indexBsd(elasticBsda, { optimisticCtx });
    await bsdaLookupUtils.update(bsda);
    return { ...elasticBsda, siretsBeforeUpdate };
  }
  if (bsdId.startsWith("BSD-") || bsdId.startsWith("TD-")) {
    const rawForm = await getFormForElastic({ readableId: bsdId });
    const elasticBsdd = await indexForm(rawForm, { optimisticCtx });
    await bsddLookupUtils.update(rawForm);
    if (rawForm.forwardedIn) {
      await bsddLookupUtils.update({
        ...rawForm.forwardedIn,
        intermediaries: []
      });
    }
    return { ...elasticBsdd, siretsBeforeUpdate };
  }

  if (bsdId.startsWith("DASRI-")) {
    const bsdasri = await getBsdasriForElastic({ id: bsdId });

    const elasticBsdasri = toBsdasriElastic(bsdasri);
    await indexBsd(elasticBsdasri, { optimisticCtx });
    await bsdasriLookupUtils.update(bsdasri);
    return { ...elasticBsdasri, siretsBeforeUpdate };
  }

  if (bsdId.startsWith("VHU-")) {
    const bsvhu = await getBsvhuForElastic({ id: bsdId });

    const elasticBsvhu = toBsvhuElastic(bsvhu);
    await indexBsd(elasticBsvhu, { optimisticCtx });
    await bsvhuLookupUtils.update(bsvhu);

    return { ...elasticBsvhu, siretsBeforeUpdate };
  }

  if (bsdId.startsWith("FF-")) {
    const bsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsdId },
      include: {
        packagings: true,
        ficheInterventions: true,
        transporters: true
      }
    });

    const elasticBsff = toBsffElastic(bsff);
    await indexBsd(elasticBsff, { optimisticCtx });
    await bsffLookupUtils.update(bsff);

    return { ...elasticBsff, siretsBeforeUpdate };
  }

  if (bsdId.startsWith("PAOH-")) {
    const bspaoh = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bsdId },
      include: { transporters: true }
    });

    const elasticBspaoh = toBspaohElastic(bspaoh);

    await indexBsd(elasticBspaoh, { optimisticCtx });
    await bspaohLookupUtils.update(bspaoh);

    return { ...elasticBspaoh, siretsBeforeUpdate };
  }

  throw new Error("Indexing this type of BSD is not handled by this worker.");
}
