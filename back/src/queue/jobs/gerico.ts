import { Job } from "bull";
import { GericoQueueItem } from "../producers/gerico";
import { CompanyDigestStatus } from "@prisma/client";
import { initSentry } from "../../common/sentry";
import gericoBackend from "../../common/post/backends/gerico";
import { prisma } from "@td/prisma";

const Sentry = initSentry();

/**
 *
 * @param job
 * create a sheet computation  on Gerico and update companyDigest state
 */
export async function postGericoJob(job: Job<GericoQueueItem>) {
  console.log("postGericoJob");

  const companyDigest = await prisma.companyDigest.findUnique({
    where: { id: job.data.companyDigestId }
  });

  if (!companyDigest) {
    return;
  }
  try {
    const responseData = await gericoBackend.create(
      companyDigest?.orgId,
      companyDigest.year
    );

    console.log(responseData);
    // gerico companyDigest might be already ready
    const state =
      responseData.state == CompanyDigestStatus.PROCESSED
        ? CompanyDigestStatus.PROCESSED
        : CompanyDigestStatus.PENDING;

    await prisma.companyDigest.update({
      where: { id: companyDigest.id },
      data: { state, distantId: responseData.id }
    });
    return responseData;
  } catch (err) {
    await prisma.companyDigest.update({
      where: { id: companyDigest.id },
      data: {
        state: CompanyDigestStatus.ERROR
      }
    });
    Sentry?.captureException(err);
  }
}
