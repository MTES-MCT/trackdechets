import { Prisma } from "@prisma/client";
import { prisma } from "@td/prisma";
import { GenericWasteV2 } from "./types";
import { IncomingWasteV2, OutgoingWasteV2, SsdWasteV2 } from "@td/codegen-back";

type CompanyCache = {
  [siret: string]: Prisma.CompanyGetPayload<{
    select: {
      orgId: true;
      givenName: true;
    };
  }>;
};

type WasteField = keyof (SsdWasteV2 & IncomingWasteV2 & OutgoingWasteV2);

const GIVEN_NAMES_AND_SIRET_FIELDS: [WasteField, WasteField][] = [
  ["emitterCompanyGivenName", "emitterCompanySiret"],
  ["destinationCompanyGivenName", "destinationCompanySiret"],
  ["transporter1CompanyGivenName", "transporter1CompanySiret"],
  ["transporter2CompanyGivenName", "transporter2CompanySiret"],
  ["transporter3CompanyGivenName", "transporter3CompanySiret"],
  ["transporter4CompanyGivenName", "transporter4CompanySiret"],
  ["transporter5CompanyGivenName", "transporter5CompanySiret"]
];

export class CompanyCachedFetcher {
  private cache: CompanyCache = {};

  async getCompanies(sirets: string[]): Promise<CompanyCache> {
    // Filter out sirets that are not in cache
    const dedupedSirets = [...new Set(sirets)].filter(Boolean) as string[];
    const uncachedSirets = dedupedSirets.filter(siret => !this.cache[siret]);

    // If there are uncached sirets, fetch them from the database
    if (uncachedSirets.length > 0) {
      const newCompanies = await prisma.company.findMany({
        where: {
          orgId: {
            in: uncachedSirets
          }
        },
        select: {
          orgId: true,
          givenName: true
        }
      });
      // Add newly fetched companies to cache
      newCompanies.forEach(company => {
        this.cache[company.orgId] = company;
      });
      uncachedSirets.forEach(siret => {
        if (!this.cache[siret]) {
          this.cache[siret] = {
            orgId: siret,
            givenName: null
          };
        }
      });
    }

    // Create result object with only the requested sirets
    const result: CompanyCache = {};
    dedupedSirets.forEach(siret => {
      if (this.cache[siret]) {
        result[siret] = this.cache[siret];
      }
    });

    return result;
  }

  async getCompaniesGivenNames(
    registryWaste: GenericWasteV2
  ): Promise<GenericWasteV2> {
    // givenName enrichement is only used on BSD lines, so skip if not
    if (registryWaste.source !== "BSD") {
      return registryWaste;
    }
    const sirets: string[] = [];
    GIVEN_NAMES_AND_SIRET_FIELDS.forEach(([_, siretField]) => {
      if (registryWaste[siretField]) {
        sirets.push(registryWaste[siretField]);
      }
    });

    const companies = await this.getCompanies(sirets);

    GIVEN_NAMES_AND_SIRET_FIELDS.forEach(([givenNameField, siretField]) => {
      if (registryWaste[siretField] && companies[registryWaste[siretField]]) {
        registryWaste[givenNameField] =
          companies[registryWaste[siretField]].givenName ?? null;
      }
    });
    return registryWaste;
  }
}
