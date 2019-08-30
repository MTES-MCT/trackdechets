import { UserSubscriptionPayload, prisma } from "../generated/prisma-client";
import { addContact } from "../common/mails.helper";
import { verifyPrestataire, anomalies } from "../companies/verif";
import { getUserCompanies } from "../companies/helper";
import {
  createSiretUnknownAlertCard,
  createNotICPEAlertCard,
  alertTypes
} from "../common/trello";


export async function usersSubscriptionCallback(
  payload: UserSubscriptionPayload
) {
  // As soon as you send an email though mailjet, he is added to the contacts
  // As we send welcome emails, no need to add him ourself
  // addNewUserAsContact(payload).catch(err =>
  //   console.error("Error on addNewUserAsContact subscription", err)
  // );
  verifyPresta(payload).catch(err => {
    console.error("Error on company verification form subscription", err)
  });
}

function addNewUserAsContact(payload: UserSubscriptionPayload) {
  if (payload.mutation !== "CREATED") {
    return;
  }

  return addContact({ email: payload.node.email, name: payload.node.name });
}

async function verifyPresta(payload: UserSubscriptionPayload){

  if (payload.mutation === "CREATED") {

    const user = payload.node;

    const prestaTypes = [
      "COLLECTOR",
      "WASTE_CENTER",
      "WASTE_VEHICLES",
      "WASTEPROCESSOR"]

    let isPresta = false;

    user.userType.forEach(t => {
      if (prestaTypes.includes(t)) {
        isPresta = true;
      }
    });

    if (isPresta) {

      const userCompanies = await getUserCompanies(user.id)

      if (userCompanies.length > 0) {

        const siret = userCompanies[0].siret;

        const [company, anomaly] = await verifyPrestataire(siret)

        // do not send password hash with alert
        delete user.password

        switch(anomaly) {
          case anomalies.SIRET_UNKNOWN:
            // Raise an internal alert => the siret was not recognized
            createSiretUnknownAlertCard(userCompanies[0], alertTypes.INSCRIPTION, {user});
            break;
          case anomalies.NOT_ICPE_27XX_35XX:
            // Raise an internal alert => a producer is sending a waste
            // to a company that is not ICPE
            createNotICPEAlertCard(company, alertTypes.INSCRIPTION, {user});
        }

      }


    }
  }
}
