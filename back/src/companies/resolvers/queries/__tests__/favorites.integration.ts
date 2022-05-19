import {
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { AuthType } from "../../../../auth";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { Query } from "../../../../generated/graphql/types";
import getReadableId from "../../../../forms/readableId";

const FAVORITES = `query Favorites($siret: String!, $type: FavoriteType!) {
  favorites(siret: $siret, type: $type) {
    siret
    vatNumber
    codePaysEtrangerEtablissement
  }
}`;

describe("query favorites", () => {
  afterEach(resetDatabase);

  it("should return the right country code for a foreign transporter", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      vatNumber: "IT09301420155",
      companyTypes: {
        set: ["TRANSPORTER"]
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        transporterCompanyVatNumber: "IT09301420155"
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        siret: company.siret,
        type: "TRANSPORTER"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        vatNumber: "IT09301420155",
        codePaysEtrangerEtablissement: "IT"
      })
    ]);
  });

  it("should return the recent EMITTER", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["COLLECTOR"]
      }
    });
    const form = await formFactory({
      ownerId: user.id
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        siret: company.siret,
        type: "EMITTER"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        siret: form.emitterCompanySiret,
        codePaysEtrangerEtablissement: "FR"
      })
    ]);
  });

  it("should ignore drafts", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["COLLECTOR"]
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT"
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        siret: company.siret,
        type: "EMITTER"
      }
    });

    expect(data.favorites).toEqual([]);
  });

  it("should return the user's company if it matches the favorite type", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data, errors } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        siret: company.siret,
        type: "EMITTER"
      }
    });

    expect(errors).toBeUndefined();
    expect(data.favorites).toEqual([
      expect.objectContaining({
        siret: company.siret,
        codePaysEtrangerEtablissement: "FR"
      })
    ]);
  });

  it("should return the user's company even if there are other results", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const firstForm = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: "0".repeat(14)
      }
    });
    const secondForm = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: "2".repeat(14)
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        siret: company.siret,
        type: "EMITTER"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        siret: secondForm.emitterCompanySiret,
        codePaysEtrangerEtablissement: "FR"
      }),
      expect.objectContaining({
        siret: firstForm.emitterCompanySiret,
        codePaysEtrangerEtablissement: "FR"
      }),
      expect.objectContaining({
        siret: company.siret,
        codePaysEtrangerEtablissement: "FR"
      })
    ]);
  });

  it("should return the user's company based on an existing BSD", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const firstForm = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: "0".repeat(14)
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const thirdForm = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: "2".repeat(14)
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        siret: company.siret,
        type: "EMITTER"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        siret: thirdForm.emitterCompanySiret,
        codePaysEtrangerEtablissement: "FR"
      }),
      expect.objectContaining({
        siret: company.siret,
        codePaysEtrangerEtablissement: "FR"
      }),
      expect.objectContaining({
        siret: firstForm.emitterCompanySiret,
        codePaysEtrangerEtablissement: "FR"
      })
    ]);
  });

  it("should not return the same company twice", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["COLLECTOR"]
      }
    });
    const firstForm = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanyName: "A Name",
        emitterCompanySiret: "0".repeat(14)
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanyName: "Another Name",
        emitterCompanySiret: firstForm.emitterCompanySiret
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        siret: company.siret,
        type: "EMITTER"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        siret: firstForm.emitterCompanySiret,
        codePaysEtrangerEtablissement: "FR"
      })
    ]);

    // Test with VAT numbers
    await formFactory({
      ownerId: user.id,
      opt: {
        transporterCompanyName: "A Name",
        transporterCompanyVatNumber: "IT09301420155"
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        transporterCompanyName: "Another Name",
        transporterCompanyVatNumber: "IT09301420155"
      }
    });

    const { data: data2 } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        siret: company.siret,
        type: "TRANSPORTER"
      }
    });

    expect(data2.favorites).toEqual([
      expect.objectContaining({
        vatNumber: "IT09301420155",
        siret: "12345678974589",
        codePaysEtrangerEtablissement: "IT"
      })
    ]);
  });

  it("should suggest a temporary storer", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        recipientCompanySiret: "0".repeat(14),
        recipientIsTempStorage: true
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        siret: company.siret,
        type: "TEMPORARY_STORAGE_DETAIL"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        siret: form.recipientCompanySiret
      })
    ]);
  });

  it("should suggest a temporary storage detail destination", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        recipientCompanySiret: "0".repeat(14),
        recipientIsTempStorage: true,
        forwardedIn: {
          create: {
            readableId: getReadableId(),
            ownerId: user.id,
            recipientCompanySiret: "1".repeat(14)
          }
        }
      }
    });
    const forwardedIn = await prisma.form
      .findUnique({ where: { id: form.id } })
      .forwardedIn();

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        siret: company.siret,
        type: "DESTINATION"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        siret: forwardedIn.recipientCompanySiret
      })
    ]);
  });

  it("should suggest a next destination", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        nextDestinationCompanySiret: "0".repeat(14)
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        siret: company.siret,
        type: "NEXT_DESTINATION"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        siret: form.nextDestinationCompanySiret
      })
    ]);
  });
});
