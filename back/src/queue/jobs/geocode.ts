import { Job } from "bull";
import { prisma } from "@td/prisma";
import { geocode } from "../../companies/geo/geocode";
import { GeocodeJobData } from "../producers/company";
import { Company } from "@prisma/client";

export async function geocodeJob(
  job: Job<GeocodeJobData>
): Promise<Pick<Company, "siret" | "latitude" | "longitude"> | null> {
  const { latitude, longitude } = await geocode(job.data.address);
  if (latitude && longitude) {
    return prisma.company.update({
      where: { siret: job.data.siret },
      data: { latitude, longitude },
      select: { siret: true, latitude: true, longitude: true }
    });
  }
  return null;
}
