import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationCancelAdministrativeTransferArgs
} from "../../../../generated/graphql/types";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { UserRole } from "@prisma/client";
import { prisma } from "@td/prisma";

const CANCEL_ADMINISTRATIVE_TRANSFER = `
  mutation CancelAdministrativeTransfer($id: ID!) {
    cancelAdministrativeTransfer(id: $id)
  }
`;

describe("cancelAdministrativeTransfer", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("should throw an error if user is not admin of the company", async () => {
    const { user, company: fromCompany } = await userWithCompanyFactory(
      UserRole.MEMBER
    );
    const toCompany = await companyFactory();
    const { mutate } = makeClient(user);

    const administrativeTransfer = await prisma.administrativeTransfer.create({
      data: { fromId: fromCompany.id, toId: toCompany.id }
    });

    const { errors } = await mutate<
      Pick<Mutation, "cancelAdministrativeTransfer">,
      MutationCancelAdministrativeTransferArgs
    >(CANCEL_ADMINISTRATIVE_TRANSFER, {
      variables: { id: administrativeTransfer.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Vous n'êtes pas administrateur de l'entreprise portant le siret "${fromCompany.siret}".`
      })
    ]);
  });

  it("should throw an error if the administrative transfer doesnt exist", async () => {
    const { user } = await userWithCompanyFactory();
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "cancelAdministrativeTransfer">,
      MutationCancelAdministrativeTransferArgs
    >(CANCEL_ADMINISTRATIVE_TRANSFER, {
      variables: { id: "FALSE_ID" }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `No AdministrativeTransfer found`
      })
    ]);
  });

  it("should cancel an administrative transfer", async () => {
    const { user, company: fromCompany } = await userWithCompanyFactory();
    const toCompany = await companyFactory();
    const { mutate } = makeClient(user);

    const administrativeTransfer = await prisma.administrativeTransfer.create({
      data: { fromId: fromCompany.id, toId: toCompany.id }
    });

    const { data } = await mutate<
      Pick<Mutation, "cancelAdministrativeTransfer">,
      MutationCancelAdministrativeTransferArgs
    >(CANCEL_ADMINISTRATIVE_TRANSFER, {
      variables: { id: administrativeTransfer.id }
    });

    expect(data.cancelAdministrativeTransfer).toBe(true);
  });
});
