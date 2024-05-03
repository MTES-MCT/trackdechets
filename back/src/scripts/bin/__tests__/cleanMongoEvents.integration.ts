import { resetDatabase } from "../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../__tests__/factories";
import { bsdasriFactory } from "../../../bsdasris/__tests__/factories";
import { getStreamEvents, insertStreamEvents } from "../../../events/mongodb";
import { cleanMongoEvents } from "../cleanMongoEvents.helper";

describe("cleanMongoEvents script", () => {
  afterEach(resetDatabase);

  it("should remove duplicate events", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    // Create a BSDASRI
    const dasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    // Simulate 10 updates
    const events = Array.from({ length: 10 }).map((_, index) => ({
      id: `event-${index}`,
      streamId: dasri.id,
      data: { emitterCompanyMail: "test@test.test" },
      createdAt: new Date(),
      type: "BsdasriUpdate",
      metadata: {},
      actor: user.id
    }));
    await insertStreamEvents(events);

    // Check that we have 11 events
    const eventsBeforeClean = await getStreamEvents(dasri.id).toArray();
    expect(eventsBeforeClean).toBe(10);

    // Run the script
    await cleanMongoEvents();

    // Check that we have 2 events remaining
    const eventsAfterClean = await getStreamEvents(dasri.id).toArray();
    expect(eventsAfterClean).toBe(1);
  });
});
