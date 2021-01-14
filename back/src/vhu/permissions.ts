import { User, VhuForm } from "@prisma/client";
import { NotFormContributor } from "../forms/errors";
import { getFullUser } from "../users/database";

export async function checkIsFormContributor(
  user: User,
  form: Partial<
    Pick<
      VhuForm,
      | "emitterCompanySiret"
      | "recipientCompanySiret"
      | "transporterCompanySiret"
    >
  >,
  errorMsg: string
) {
  const isContributor = await isFormContributor(user, form);

  if (!isContributor) {
    throw new NotFormContributor(errorMsg);
  }

  return true;
}

export async function isFormContributor(user: User, form: Partial<VhuForm>) {
  const fullUser = await getFullUser(user);
  const userSirets = fullUser.companies.map(c => c.siret);

  const formSirets = [
    form.emitterCompanySiret,
    form.recipientCompanySiret,
    form.transporterCompanySiret
  ];

  const siretsInCommon = userSirets.filter(siret => formSirets.includes(siret));

  return siretsInCommon.length;
}
