import { sendMail } from "../common/mails.helper";
import {
  alertTypes,
  createNotICPEAlertCard,
  createSiretUnknownAlertCard
} from "../common/trello";
import { anomalies, verifyPrestataire } from "../companies/verif";
import {
  CompanySubscriptionPayload,
  CompanyType,
  prisma
} from "../generated/prisma-client";

export async function companiesSubscriptionCallback(
  payload: CompanySubscriptionPayload
) {
  await Promise.all([
    verifyPresta(payload).catch(err => {
      console.error("Error on company verification form subscription", err);
    }),

    warnIfUserCreatesTooManyCompanies(payload).catch(err => {
      console.error(
        "Error on 'User creates too many Companies' subscription",
        err
      );
    })
  ]);
}

async function verifyPresta(payload: CompanySubscriptionPayload) {
  if (payload.mutation === "CREATED") {
    const company = payload.node;

    const prestaTypes: CompanyType[] = [
      "COLLECTOR",
      "WASTE_CENTER",
      "WASTE_VEHICLES",
      "WASTEPROCESSOR"
    ];

    let isPresta = false;

    company.companyTypes.forEach(t => {
      if (prestaTypes.includes(t)) {
        isPresta = true;
      }
    });

    if (isPresta) {
      const siret = company.siret;

      const [_, anomaly] = await verifyPrestataire(siret);

      switch (anomaly) {
        case anomalies.SIRET_UNKNOWN:
          // Raise an internal alert => the siret was not recognized
          createSiretUnknownAlertCard(company, alertTypes.INSCRIPTION);
          break;
        case anomalies.NOT_ICPE_27XX_35XX:
          // Raise an internal alert => the company is not ICPE
          createNotICPEAlertCard(company, alertTypes.INSCRIPTION);
      }
    }
  }
}

const NB_OF_COMAPNIES_BEFORE_ALERT = 5;

async function warnIfUserCreatesTooManyCompanies(
  payload: CompanySubscriptionPayload
) {
  if (payload.mutation !== "CREATED") {
    return Promise.resolve();
  }

  const company = payload.node;
  const associationsUsers = await prisma.companyAssociations({
    where: { company: { id: company.siret } }
  }).$fragment<{ user: { id: string; name: string } }[]>(`
    fragment Users on companyAssociations {
      user { id name }
    }
  `);

  if (associationsUsers.length !== 1) {
    throw new Error(
      "A newly created company should have exactly one association."
    );
  }

  const user = associationsUsers[0].user;

  const userCompaniesNumber = await prisma
    .companyAssociationsConnection({ where: { user: { id: user.id } } })
    .aggregate()
    .count();

  if (userCompaniesNumber <= NB_OF_COMAPNIES_BEFORE_ALERT) {
    return Promise.resolve();
  }

  return sendMail({
    body: `L'utilisateur ${user.name} (${user.id}) vient de créer sa ${userCompaniesNumber}ème entreprise: ${company.name} - ${company.siret}. A surveiller !`,
    subject:
      "Alerte: Grand mombre de compagnies créées par un même utilisateur",
    title: "Alerte: Grand mombre de compagnies créées par un même utilisateur",
    to: [
      {
        email: "tech@trackdechets.beta.gouv.fr ",
        name: "Equipe Trackdéchets"
      }
    ]
  });
}
