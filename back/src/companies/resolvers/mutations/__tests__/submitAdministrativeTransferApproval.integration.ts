import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationSubmitAdministrativeTransferApprovalArgs
} from "../../../../generated/graphql/types";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { AdministrativeTransferStatus, UserRole } from "@prisma/client";
import { prisma } from "@td/prisma";

const SUBMIT_ADMINISTRATIVE_TRANSFER_APPROVAL = `
  mutation SubmitAdministrativeTransferApproval($input: SubmitAdministrativeTransferApprovalInput!) {
    submitAdministrativeTransferApproval(input: $input) { status }
  }
`;

describe("submitAdministrativeTransferApproval", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("should throw an error if user is not admin of the company", async () => {
    const { user, company: toCompany } = await userWithCompanyFactory(
      UserRole.MEMBER
    );
    const fromCompany = await companyFactory();
    const { mutate } = makeClient(user);

    const administrativeTransfer = await prisma.administrativeTransfer.create({
      data: { fromId: fromCompany.id, toId: toCompany.id }
    });

    const { errors } = await mutate<
      Pick<Mutation, "submitAdministrativeTransferApproval">,
      MutationSubmitAdministrativeTransferApprovalArgs
    >(SUBMIT_ADMINISTRATIVE_TRANSFER_APPROVAL, {
      variables: { input: { id: administrativeTransfer.id, isApproved: true } }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Vous n'êtes pas administrateur de l'entreprise portant le siret "${toCompany.siret}".`
      })
    ]);
  });

  it("should throw an error if the administrative transfer doesnt exist", async () => {
    const { user } = await userWithCompanyFactory();
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "submitAdministrativeTransferApproval">,
      MutationSubmitAdministrativeTransferApprovalArgs
    >(SUBMIT_ADMINISTRATIVE_TRANSFER_APPROVAL, {
      variables: { input: { id: "False ID", isApproved: true } }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: expect.stringContaining(
          `An operation failed because it depends on one or more records that were required but not found. Expected a record, found none.`
        )
      })
    ]);
  });

  it("should approve an administrative transfer", async () => {
    const { user, company: toCompany } = await userWithCompanyFactory();
    const fromCompany = await companyFactory();
    const { mutate } = makeClient(user);

    const administrativeTransfer = await prisma.administrativeTransfer.create({
      data: { fromId: fromCompany.id, toId: toCompany.id }
    });

    const { data } = await mutate<
      Pick<Mutation, "submitAdministrativeTransferApproval">,
      MutationSubmitAdministrativeTransferApprovalArgs
    >(SUBMIT_ADMINISTRATIVE_TRANSFER_APPROVAL, {
      variables: { input: { id: administrativeTransfer.id, isApproved: true } }
    });

    expect(data.submitAdministrativeTransferApproval.status).toBe(
      AdministrativeTransferStatus.ACCEPTED
    );
  });

  it("should refuse an administrative transfer", async () => {
    const { user, company: toCompany } = await userWithCompanyFactory();
    const fromCompany = await companyFactory();
    const { mutate } = makeClient(user);

    const administrativeTransfer = await prisma.administrativeTransfer.create({
      data: { fromId: fromCompany.id, toId: toCompany.id }
    });

    const { data } = await mutate<
      Pick<Mutation, "submitAdministrativeTransferApproval">,
      MutationSubmitAdministrativeTransferApprovalArgs
    >(SUBMIT_ADMINISTRATIVE_TRANSFER_APPROVAL, {
      variables: { input: { id: administrativeTransfer.id, isApproved: false } }
    });

    expect(data.submitAdministrativeTransferApproval.status).toBe(
      AdministrativeTransferStatus.REFUSED
    );
  });
});
