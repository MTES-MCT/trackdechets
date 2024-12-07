import gql from "graphql-tag";
import {
  bsddFinalOperationFactory,
  formFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import { Mutation } from "@td/codegen-back";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "@td/prisma";
import {
  bsdaInclude,
  bsdasriInclude,
  bsddInclude,
  bsffInclude,
  bspaohInclude,
  bsvhuInclude
} from "../utils/clone.utils";
import { isDefinedStrict } from "../../../../common/helpers";
import {
  bsdaFactory,
  bsdaFinalOperationFactory
} from "../../../../bsda/__tests__/factories";
import {
  bsdasriFactory,
  bsdasriFinalOperationFactory
} from "../../../../bsdasris/__tests__/factories";
import {
  createBsff,
  createBsffPackagingFinalOperation,
  createFicheIntervention
} from "../../../../bsffs/__tests__/factories";
import { bsvhuFactory } from "../../../../bsvhu/__tests__/factories.vhu";
import { bspaohFactory } from "../../../../bspaoh/__tests__/factories";
import { UserRole } from "@prisma/client";

const CLONE_BSD = gql`
  mutation cloneBsd($id: String!) {
    cloneBsd(id: $id) {
      id
    }
  }
`;

const NON_CLONED_KEYS = [
  "id",
  "readableId",
  "rowNumber",
  "createdAt",
  "updatedAt",
  "formId",
  "bsdaId",
  "bsffId",
  "bspaohId",
  "finalBsdaId",
  "initialBsdaId",
  "finalBsdasriId",
  "initialBsdasriId",
  "initialFormId",
  "finalFormId",
  "finalBsffPackagingId",
  "initialBsffPackagingId"
];
/**
 * Removes null, undefined and empty strings / arrays from object, AND keys that we
 * do NOT clone on purpose
 */
const removeIrrelevantKeys = obj => {
  for (const key in obj) {
    if (
      !isDefinedStrict(obj[key]) ||
      NON_CLONED_KEYS.includes(key) ||
      (Array.isArray(obj[key]) && !obj[key].length)
    ) {
      delete obj[key];
    } else if (typeof obj[key] === "object") {
      removeIrrelevantKeys(obj[key]);
    }
  }
  return obj;
};

const clone = obj => JSON.parse(JSON.stringify(obj));

const expectBsdsToMatch = (bsd1, bsd2) => {
  const cleanedUpBsd1 = removeIrrelevantKeys(clone(bsd1));
  const cleanedUpBsd2 = removeIrrelevantKeys(clone(bsd2));

  expect(cleanedUpBsd1).toEqual(cleanedUpBsd2);
};

describe("mutation cloneBsd", () => {
  it("should clone regular BSDD", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formFactory({ ownerId: user.id });

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "cloneBsd">>(
      CLONE_BSD,
      {
        variables: {
          id: bsdd.id
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const initialBsdd = await prisma.form.findFirstOrThrow({
      where: { id: bsdd.id },
      include: bsddInclude
    });

    const newBsdd = await prisma.form.findFirstOrThrow({
      where: { id: data.cloneBsd.id },
      include: bsddInclude
    });

    expectBsdsToMatch(initialBsdd, newBsdd);
  });

  it("should clone BSDD with final operations", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formFactory({ ownerId: user.id });
    await bsddFinalOperationFactory({
      bsddId: bsdd.id,
      opts: {
        noTraceability: true,
        operationCode: "OP CODE",
        quantity: 101
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "cloneBsd">>(
      CLONE_BSD,
      {
        variables: {
          id: bsdd.id
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const initialBsdd = await prisma.form.findFirstOrThrow({
      where: { id: bsdd.id },
      include: bsddInclude
    });

    const newBsdd = await prisma.form.findFirstOrThrow({
      where: { id: data.cloneBsd.id },
      include: bsddInclude
    });

    expectBsdsToMatch(initialBsdd, newBsdd);
  });

  it("should clone regular BSDA", async () => {
    // Given
    const user = await userFactory();
    const bsda = await bsdaFactory({ userId: user.id });

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "cloneBsd">>(
      CLONE_BSD,
      {
        variables: {
          id: bsda.id
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const initialBsda = await prisma.bsda.findFirstOrThrow({
      where: { id: bsda.id },
      include: bsdaInclude
    });

    const newBsda = await prisma.bsda.findFirstOrThrow({
      where: { id: data.cloneBsd.id },
      include: bsdaInclude
    });

    expectBsdsToMatch(initialBsda, newBsda);
  });

  it("should clone BSDA with final operations", async () => {
    // Given
    const user = await userFactory();
    const bsda = await bsdaFactory({ userId: user.id });
    await bsdaFinalOperationFactory({
      bsdaId: bsda.id,
      opts: {
        operationCode: "OP CODE",
        quantity: 77
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "cloneBsd">>(
      CLONE_BSD,
      {
        variables: {
          id: bsda.id
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const initialBsda = await prisma.bsda.findFirstOrThrow({
      where: { id: bsda.id },
      include: bsdaInclude
    });

    const newBsda = await prisma.bsda.findFirstOrThrow({
      where: { id: data.cloneBsd.id },
      include: bsdaInclude
    });

    expectBsdsToMatch(initialBsda, newBsda);
  });

  it("should clone regular BSDASRI", async () => {
    // Given
    const user = await userFactory();
    const bsdasri = await bsdasriFactory({});

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "cloneBsd">>(
      CLONE_BSD,
      {
        variables: {
          id: bsdasri.id
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const initialBsdasri = await prisma.bsdasri.findFirstOrThrow({
      where: { id: bsdasri.id },
      include: bsdasriInclude
    });

    const newBsdasri = await prisma.bsdasri.findFirstOrThrow({
      where: { id: data.cloneBsd.id },
      include: bsdasriInclude
    });

    expectBsdsToMatch(initialBsdasri, newBsdasri);
  });

  it("should clone BSDASRI with final operations", async () => {
    // Given
    const user = await userFactory();
    const bsdasri = await bsdasriFactory({});
    await bsdasriFinalOperationFactory({
      bsdasriId: bsdasri.id,
      opts: {
        operationCode: "OP CODE",
        quantity: 88
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "cloneBsd">>(
      CLONE_BSD,
      {
        variables: {
          id: bsdasri.id
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const initialBsdasri = await prisma.bsdasri.findFirstOrThrow({
      where: { id: bsdasri.id },
      include: bsdasriInclude
    });

    const newBsdasri = await prisma.bsdasri.findFirstOrThrow({
      where: { id: data.cloneBsd.id },
      include: bsdasriInclude
    });

    expectBsdsToMatch(initialBsdasri, newBsdasri);
  });

  it("should clone regular BSFF", async () => {
    // Given
    const user = await userFactory();
    const bsff = await createBsff();

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "cloneBsd">>(
      CLONE_BSD,
      {
        variables: {
          id: bsff.id
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const initialBsff = await prisma.bsff.findFirstOrThrow({
      where: { id: bsff.id },
      include: bsffInclude
    });

    const newBsff = await prisma.bsff.findFirstOrThrow({
      where: { id: data.cloneBsd.id },
      include: bsffInclude
    });

    expectBsdsToMatch(initialBsff, newBsff);
  });

  it("should clone BSFF with final operations in packagings", async () => {
    // Given
    const user = await userFactory();
    const bsff = await createBsff();
    await createBsffPackagingFinalOperation({
      bsffPackagingId: bsff.packagings[0].id,
      opts: {
        noTraceability: true,
        quantity: 17
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "cloneBsd">>(
      CLONE_BSD,
      {
        variables: {
          id: bsff.id
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const initialBsff = await prisma.bsff.findFirstOrThrow({
      where: { id: bsff.id },
      include: bsffInclude
    });

    const newBsff = await prisma.bsff.findFirstOrThrow({
      where: { id: data.cloneBsd.id },
      include: bsffInclude
    });

    expectBsdsToMatch(initialBsff, newBsff);
  });

  it("should clone BSFF with fiche d'intervention", async () => {
    // Given
    const user = await userFactory();
    const operateur = await userWithCompanyFactory(UserRole.ADMIN);
    const detenteur = await userWithCompanyFactory(UserRole.ADMIN);
    const ficheIntervention = await createFicheIntervention({
      operateur,
      detenteur
    });
    const bsff = await createBsff(
      {},
      {
        data: {
          ficheInterventions: { connect: { id: ficheIntervention.id } },
          detenteurCompanySirets: [detenteur.company.orgId]
        }
      }
    );

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "cloneBsd">>(
      CLONE_BSD,
      {
        variables: {
          id: bsff.id
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const initialBsff = await prisma.bsff.findFirstOrThrow({
      where: { id: bsff.id },
      include: bsffInclude
    });

    const newBsff = await prisma.bsff.findFirstOrThrow({
      where: { id: data.cloneBsd.id },
      include: bsffInclude
    });

    expectBsdsToMatch(initialBsff, newBsff);
  });

  it("should clone regular BSVHU", async () => {
    // Given
    const user = await userFactory();
    const bsvhu = await bsvhuFactory({});

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "cloneBsd">>(
      CLONE_BSD,
      {
        variables: {
          id: bsvhu.id
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const initialBsvhu = await prisma.bsvhu.findFirstOrThrow({
      where: { id: bsvhu.id },
      include: bsvhuInclude
    });

    const newBsvhu = await prisma.bsvhu.findFirstOrThrow({
      where: { id: data.cloneBsd.id },
      include: bsvhuInclude
    });

    expectBsdsToMatch(initialBsvhu, newBsvhu);
  });

  it("should clone regular BSPAOH", async () => {
    // Given
    const user = await userFactory();
    const bspaoh = await bspaohFactory({});

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "cloneBsd">>(
      CLONE_BSD,
      {
        variables: {
          id: bspaoh.id
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const initialBspaoh = await prisma.bspaoh.findFirstOrThrow({
      where: { id: bspaoh.id },
      include: bspaohInclude
    });

    const newBspaoh = await prisma.bspaoh.findFirstOrThrow({
      where: { id: data.cloneBsd.id },
      include: bspaohInclude
    });

    expectBsdsToMatch(initialBspaoh, newBspaoh);
  });
});
