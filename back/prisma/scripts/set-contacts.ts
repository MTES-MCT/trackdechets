import { User } from "@prisma/client";
import axios from "axios";
import { addContact } from "../../src/mailer/mailing";
import { prisma } from "@td/prisma";
import { Updater, registerUpdater } from "./helper/helper";

type Contact = { Email: string; Name?: string };

@registerUpdater(
  "Set contacts in Mailjet",
  `Add every user to Mailjet, so that the newsletter are automatically sent to everyone`,
  false
)
export class SetContactsUpdater implements Updater {
  run() {
    console.info("Starting script to set contacts in mailjet...");

    try {
      return prisma.user
        .findMany({ orderBy: { createdAt: "desc" } })
        .then(async users => {
          const latestContacts = await axios.get<Contact[]>(
            "http://td-mail/contact"
          );

          const contactsToCreate: User[] = [];
          for (const user of users) {
            // As soon as one of the user is in the 10 latest contacts, stop picking users
            if (
              latestContacts.data.find(e => e.Email === user.email) !==
              undefined
            ) {
              break;
            }
            contactsToCreate.push(user);
          }

          return Promise.all(
            contactsToCreate.map(c =>
              addContact({ email: c.email, name: c.name })
            )
          );
        });
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
