import { resetDatabase } from "../../../../integration-tests/helper";

import {
  userFactory,
  formFactory,
  userWithCompanyFactory,
  transportSegmentFactory,
} from "../../../__tests__/factories";
import makeClient from "../../../__tests__/testClient";

describe("Integration / Forms query", () => {
  afterEach(() => resetDatabase());

  it.each([
    "emitterCompanySiret",
    "recipientCompanySiret",
    "transporterCompanySiret",
  ])(
    "should return a given form which user is emitter, receiver or transporter (%p)",
    async (fieldName) => {
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const owner = await userFactory();

      const form = await formFactory({
        ownerId: owner.id,
        opt: {
          [fieldName]: company.siret,
        },
      });

      const { query } = makeClient(user);
      const { data } = await query(
        `query {
             form(id: "${form.id}") {
               id
             }
           }
         `
      );
      expect(data.form.id).toBe(form.id);
    }
  );
  it("should return a given form for segment transporters", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const owner = await userFactory();

    const form = await formFactory({
      ownerId: owner.id,
    });

    await transportSegmentFactory({
      formId: form.id,
      segmentPayload: { transporterCompanySiret: company.siret },
    });
    const { query } = makeClient(user);
    const { data } = await query(
      `query {
           form(id: "${form.id}") {
             id
           }
         }
       `
    );

    expect(data.form.id).toBe(form.id);
  });
});
