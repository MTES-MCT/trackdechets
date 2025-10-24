import { COMPANY_INFOS_CACHE_KEY } from "../../companies/sirene/cache";
import { cachedGet } from "../../common/redis";

import { formFactory, userWithCompanyFactory } from "../../__tests__/factories";
import { CompanyType, Prisma } from "@td/prisma";

export const storeRedisCompanyInfo = async ({
  company,
  companyTypes = []
}: {
  company;
  companyTypes: CompanyType[];
}) => {
  const companyInfos = async () => [
    {
      id: company.id,
      siret: company.siret,
      securityCode: "1234",
      companyTypes
    }
  ];
  await cachedGet(companyInfos, COMPANY_INFOS_CACHE_KEY, company.siret, {
    parser: JSON,
    options: { EX: 60 }
  });
};

export const prepareRedis = async ({ emitterCompany, recipientCompany }) => {
  await storeRedisCompanyInfo({
    company: emitterCompany,
    companyTypes: ["PRODUCER"]
  });
  await storeRedisCompanyInfo({
    company: recipientCompany,
    companyTypes: ["WASTEPROCESSOR"]
  });
};

export const prepareDB = async (opt?: Partial<Prisma.FormCreateInput>) => {
  const { user: emitter, company: emitterCompany } =
    await userWithCompanyFactory("ADMIN");
  const { user: recipient, company: recipientCompany } =
    await userWithCompanyFactory("ADMIN");

  const form = await formFactory({
    ownerId: emitter.id,
    opt: {
      emitterCompanyName: emitterCompany.name,
      emitterCompanySiret: emitterCompany.siret,
      recipientCompanySiret: recipientCompany.siret,
      recipientsSirets: [recipientCompany.siret!],
      ...opt
    }
  });

  return { emitter, emitterCompany, recipient, recipientCompany, form };
};
