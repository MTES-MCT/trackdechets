import prisma from "../../src/prisma";
import { registerUpdater, Updater } from "./helper/helper";

const CHUNK_SIZE = 100;

@registerUpdater(
  "Init Form activity logs",
  "Create a `BsddCreated` event for every existing Form. It acts as a starting point in time.",
  true
)
export class LoadAnonymousCompaniesUpdater implements Updater {
  async run() {
    try {
      console.info("✨ Starting script to init Form activity logs...");

      const forms = await prisma.form.findMany();
      console.info(
        `🔢 There are ${forms.length} forms to process. Chunk size is ${CHUNK_SIZE}`
      );

      for (let i = 0; i < forms.length; i += CHUNK_SIZE) {
        const chunkForms = forms.slice(i, i + CHUNK_SIZE);

        await prisma.event.createMany({
          data: chunkForms.map(form => ({
            occurredAt: new Date("2018-01-01T00:00:00"), // A date that for sure is before any existing Form
            streamId: form.id,
            type: "BsddCreated",
            actorId: "script",
            data: {
              content: JSON.parse(JSON.stringify(form))
            },
            metadata: { fake: true, origin: "initial migration" }
          }))
        });
      }
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
