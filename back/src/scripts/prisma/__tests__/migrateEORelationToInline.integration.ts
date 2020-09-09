import { resetDatabase } from "../../../../integration-tests/helper";
import { prisma } from "../../../generated/prisma-client";
import { formFactory, userFactory } from "../../../__tests__/factories";
import migrateEORelationToInline from "../migrateEORelationToInline";

describe("migrateEORelationToInline", () => {
  afterEach(() => resetDatabase());

  it("should add inline fields and disconnect EO", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        ecoOrganisme: {
          create: {
            address: "123 EO street, Somewhere",
            name: "Awesome EO",
            siret: "1".repeat(14)
          }
        }
      }
    });
    const formEO = await prisma.form({ id: form.id }).ecoOrganisme();

    await migrateEORelationToInline();

    const updatedForm = await prisma.form({ id: form.id });
    expect(updatedForm).toMatchObject({
      ecoOrganismeName: formEO.name,
      ecoOrganismeSiret: formEO.siret
    });

    const updatedFormEO = await prisma.form({ id: form.id }).ecoOrganisme();
    expect(updatedFormEO).toBe(null);
  });
});
