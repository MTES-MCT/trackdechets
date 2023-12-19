import { Job } from "bull";
import { prisma } from "@td/prisma";
import { SetDepartementJobData } from "../producers/company";
import { getDepartement } from "../../companies/geo/getDepartement";
import searchCompany from "../../companies/sirene/searchCompany";
import { Company } from "@prisma/client";

export async function setDepartementJob(
  job: Job<SetDepartementJobData>
): Promise<Pick<Company, "siret" | "codeDepartement"> | null> {
  if (!job.data.siret?.length) {
    return null;
  }
  let codeCommune = job.data?.codeCommune;
  if (!codeCommune?.length) {
    try {
      const company = await searchCompany(job.data.siret);
      codeCommune = company?.codeCommune;
    } catch (_) {
      return null;
    }
  }
  const codeDepartement = await getDepartement(codeCommune!);
  if (codeDepartement) {
    return prisma.company.update({
      where: { siret: job.data.siret },
      data: { codeDepartement },
      select: { siret: true, codeDepartement: true }
    });
  }
  return null;
}
