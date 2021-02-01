import {
  companyFactory,
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { AuthType } from "../../../../auth";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { CompanyType } from "@prisma/client";

const FAVORITES = `query Favorites($siret: String!, $type: FavoriteType!) {
  favorites(siret: $siret, type: $type) {
    siret
    isRegistered
    companyTypes
  }
}`;

describe("query favorites", () => {
  afterEach(resetDatabase);

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
    const { data } = await query(FAVORITES, {
      variables: {
        siret: company.siret,
        type: "EMITTER"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        siret: form.emitterCompanySiret
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
    const { data } = await query(FAVORITES, {
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
    const { data, errors } = await query(FAVORITES, {
      variables: {
        siret: company.siret,
        type: "EMITTER"
      }
    });

    expect(errors).toBeUndefined();
    expect(data.favorites).toEqual([
      expect.objectContaining({
        siret: company.siret
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
        emitterCompanySiret: "1".repeat(14)
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query(FAVORITES, {
      variables: {
        siret: company.siret,
        type: "EMITTER"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        siret: secondForm.emitterCompanySiret
      }),
      expect.objectContaining({
        siret: firstForm.emitterCompanySiret
      }),
      expect.objectContaining({
        siret: company.siret
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
    const { data } = await query(FAVORITES, {
      variables: {
        siret: company.siret,
        type: "EMITTER"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        siret: thirdForm.emitterCompanySiret
      }),
      expect.objectContaining({
        siret: company.siret
      }),
      expect.objectContaining({
        siret: firstForm.emitterCompanySiret
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
    const { data } = await query(FAVORITES, {
      variables: {
        siret: company.siret,
        type: "EMITTER"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        siret: firstForm.emitterCompanySiret
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
        recipientIsTempStorage: true,
        temporaryStorageDetail: {
          create: {}
        }
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query(FAVORITES, {
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
        temporaryStorageDetail: {
          create: {
            destinationCompanySiret: "1".repeat(14)
          }
        }
      }
    });
    const temporaryStorageDetail = await prisma.form
      .findUnique({ where: { id: form.id } })
      .temporaryStorageDetail();

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query(FAVORITES, {
      variables: {
        siret: company.siret,
        type: "DESTINATION"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        siret: temporaryStorageDetail.destinationCompanySiret
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
    const { data } = await query(FAVORITES, {
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

  it("should set isRegistered to false if company does not exist in TD", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: [CompanyType.COLLECTOR]
      }
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        // this siret is not registered
        emitterCompanySiret: "11111111111111"
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query(FAVORITES, {
      variables: {
        siret: company.siret,
        type: "EMITTER"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        siret: form.emitterCompanySiret,
        isRegistered: false,
        companyTypes: null
      })
    ]);
  });

  it("should provide companyTypes if company is registered in TD", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: [CompanyType.COLLECTOR]
      }
    });

    const emitter = await companyFactory({
      companyTypes: {
        set: [CompanyType.PRODUCER]
      }
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        // this siret is not registered
        emitterCompanySiret: emitter.siret
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query(FAVORITES, {
      variables: {
        siret: company.siret,
        type: "EMITTER"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        siret: form.emitterCompanySiret,
        isRegistered: true,
        companyTypes: emitter.companyTypes
      })
    ]);
  });
});
