import { Company, CompanyType } from "@prisma/client";
import {
  alertTypes,
  createNotICPEAlertCard,
  createSiretUnknownAlertCard
} from "../common/trello";
import { anomalies, verifyPrestataire } from "../companies/verif";
import { TDEventPayload } from "./emitter";

export async function companiesSubscriptionCallback(
  payload: TDEventPayload<Company>
) {
  await Promise.all([
    verifyPresta(payload).catch(err => {
      console.error("Error on company verification form subscription", err);
    })
  ]);
}

async function verifyPresta(payload: TDEventPayload<Company>) {
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
