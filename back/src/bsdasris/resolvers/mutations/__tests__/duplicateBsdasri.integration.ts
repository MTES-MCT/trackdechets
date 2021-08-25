import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsdasriFactory, initialData } from "../../../__tests__/factories";
import { Mutation } from "../../../../generated/graphql/types";

import { BsdasriStatus, BsdasriType } from "@prisma/client";
import prisma from "../../../../prisma";

const DUPLICATE_DASRI = `
mutation DuplicateDasri($id: ID!){
  duplicateBsdasri(id: $id)  {
    id
    status
    isDraft
  }
}
`;
describe("Mutation.duplicateBsdasri", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(); // unauthenticated user
    const { errors } = await mutate<Pick<Mutation, "duplicateBsdasri">>(
      DUPLICATE_DASRI,
      {
        variables: {
          id: dasri.id
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
  });

  it("should disallow users not belonging to the duplicated dasri", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");
    const {
      user: otherUser,
      company: otherCompany
    } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      ownerId: otherUser.id,
      opt: {
        ...initialData(otherCompany)
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { errors } = await mutate<Pick<Mutation, "duplicateBsdasri">>(
      DUPLICATE_DASRI,
      {
        variables: {
          id: dasri.id
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas.",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should duplicate a  dasri", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        ...initialData(company)
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { data } = await mutate<Pick<Mutation, "duplicateBsdasri">>(
      DUPLICATE_DASRI,
      {
        variables: {
          id: dasri.id
        }
      }
    );

    expect(data.duplicateBsdasri.status).toBe("INITIAL");
    expect(data.duplicateBsdasri.isDraft).toBe(true);
  });

  it("should not copy regroupedOnBsdasriId field", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const toGroup = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        status: BsdasriStatus.PROCESSED,
        emitterCompanySiret: "1234",
        recipientCompanySiret: company.siret,
        processingOperation: "R12"
      }
    });

    await bsdasriFactory({
      ownerId: user.id,
      opt: {
        status: BsdasriStatus.INITIAL,
        emitterCompanySiret: company.siret,
        regroupedBsdasris: { connect: [{ id: toGroup.id }] }
      }
    });
    const { mutate } = makeClient(user); // emitter

    const { data } = await mutate<Pick<Mutation, "duplicateBsdasri">>(
      DUPLICATE_DASRI,
      {
        variables: {
          id: toGroup.id
        }
      }
    );

    const duplicated = await prisma.bsdasri.findUnique({
      where: { id: data.duplicateBsdasri.id }
    });

    expect(duplicated.status).toBe("INITIAL");
    expect(duplicated.isDraft).toBe(true);

    expect(duplicated.regroupedOnBsdasriId).toBe(null);
    expect(duplicated.synthesizedOnBsdasriId).toBe(null);
  });

  it("should not copy sythesizedOnBsdasriId field", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const toGroup = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        status: BsdasriStatus.PROCESSED,
        emitterCompanySiret: "1234",
        recipientCompanySiret: company.siret,
        processingOperation: "R12"
      }
    });

    await bsdasriFactory({
      ownerId: user.id,
      opt: {
        status: BsdasriStatus.INITIAL,
        emitterCompanySiret: company.siret,
        synthesizedBsdasris: { connect: [{ id: toGroup.id }] }
      }
    });
    const { mutate } = makeClient(user); // emitter

    const { data } = await mutate<Pick<Mutation, "duplicateBsdasri">>(
      DUPLICATE_DASRI,
      {
        variables: {
          id: toGroup.id
        }
      }
    );

    const duplicated = await prisma.bsdasri.findUnique({
      where: { id: data.duplicateBsdasri.id }
    });

    expect(duplicated.status).toBe("INITIAL");
    expect(duplicated.isDraft).toBe(true);

    expect(duplicated.regroupedOnBsdasriId).toBe(null);
    expect(duplicated.synthesizedOnBsdasriId).toBe(null);
  });

  it("should set bsdasriType to simple", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        status: BsdasriStatus.INITIAL,
        emitterCompanySiret: company.siret,

        bsdasriType: BsdasriType.SYNTHESIS
      }
    });
    const { mutate } = makeClient(user); // emitter

    const { data } = await mutate<Pick<Mutation, "duplicateBsdasri">>(
      DUPLICATE_DASRI,
      {
        variables: {
          id: dasri.id
        }
      }
    );

    const duplicated = await prisma.bsdasri.findUnique({
      where: { id: data.duplicateBsdasri.id }
    });

    expect(duplicated.bsdasriType).toBe("SIMPLE");
  });
});
