import { COMPANY_INFOS_CACHE_KEY } from "../../companies/sirene/cache";
import { cachedGet } from "../../common/redis";

import { formFactory, userWithCompanyFactory } from "../../__tests__/factories";

export const storeRedisCompanyInfo = async ({ company, companyTypes = [] }) => {
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
    companyTypes: ["WASTE_PROCESSOR"]
  });
  // const emitterCompanyInfos = async () => [
  //   {
  //     id: emitterCompany.id,
  //     siret: emitterCompany.siret,
  //     securityCode: "1234",
  //     companyTypes: ["PRODUCER"]
  //   }
  // ];

  // await cachedGet(
  //   emitterCompanyInfos,
  //   COMPANY_INFOS_CACHE_KEY,
  //   emitterCompany.siret,
  //   {
  //     parser: JSON,
  //     options: { EX: 60 }
  //   }
  // );
  // const recipientCompanyInfos = async () => [
  //   {
  //     id: recipientCompany.id,
  //     siret: recipientCompany.siret,
  //     securityCode: "1234",
  //     companyTypes: ["WASTE_PROCESSOR"]
  //   }
  // ];

  // await cachedGet(
  //   recipientCompanyInfos,
  //   COMPANY_INFOS_CACHE_KEY,
  //   recipientCompany.siret,
  //   {
  //     parser: JSON,
  //     options: { EX: 60 }
  //   }
  // );
};

export const prepareDB = async () => {
  const {
    user: emitter,
    company: emitterCompany
  } = await userWithCompanyFactory("ADMIN");
  const {
    user: recipient,
    company: recipientCompany
  } = await userWithCompanyFactory("ADMIN");

  const form = await formFactory({
    ownerId: emitter.id,
    opt: {
      emitterCompanyName: emitterCompany.name,
      emitterCompanySiret: emitterCompany.siret,
      recipientCompanySiret: recipientCompany.siret
    }
  });

  return { emitter, emitterCompany, recipient, recipientCompany, form };
};
