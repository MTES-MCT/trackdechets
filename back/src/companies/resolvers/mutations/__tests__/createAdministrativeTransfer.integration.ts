import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationCreateAdministrativeTransferArgs
} from "../../../../generated/graphql/types";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { UserRole } from "@prisma/client";

const CREATE_ADMINISTRATIVE_TRANSFER = `
  mutation CreateAdministrativeTransfer($input: CreateAdministrativeTransferInput!) {
    createAdministrativeTransfer(input: $input) {
      id
    }
  }
`;

describe("createAdministrativeTransfer", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("should throw an error if user is not admin of the company", async () => {
    const { user, company: fromCompany } = await userWithCompanyFactory(
      UserRole.MEMBER
    );
    const toCompany = await companyFactory();
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createAdministrativeTransfer">,
      MutationCreateAdministrativeTransferArgs
    >(CREATE_ADMINISTRATIVE_TRANSFER, {
      variables: { input: { from: fromCompany.orgId, to: toCompany.orgId } }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Vous n'êtes pas administrateur de l'entreprise portant le siret "${fromCompany.siret}".`
      })
    ]);
  });

  it("should throw an error if the from company is not dormant", async () => {
    const { company: fromCompany, user } = await userWithCompanyFactory(
      UserRole.ADMIN,
      { isDormantSince: null }
    );
    const toCompany = await companyFactory();
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "createAdministrativeTransfer">,
      MutationCreateAdministrativeTransferArgs
    >(CREATE_ADMINISTRATIVE_TRANSFER, {
      variables: { input: { from: fromCompany.orgId, to: toCompany.orgId } }
    });

    expect(errors).toBeDefined();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe(
      "L'entreprise de départ n'est pas en sommeil. Impossible de réaliser un transfert administratif."
    );
  });

  it("should throw an error if there is a pending administrative transfer", async () => {
    const toCompany = await companyFactory();
    const { company: fromCompany, user } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {
        isDormantSince: new Date(),
        givenAdministrativeTransfers: {
          create: { status: "PENDING", toId: toCompany.id }
        }
      }
    );
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "createAdministrativeTransfer">,
      MutationCreateAdministrativeTransferArgs
    >(CREATE_ADMINISTRATIVE_TRANSFER, {
      variables: { input: { from: fromCompany.orgId, to: toCompany.orgId } }
    });

    expect(errors).toBeDefined();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe(
      "L'entreprise de départ a déjà un transfert administratif en cours."
    );
  });

  it("should throw an error if the from and to companies are the same", async () => {
    const { company: fromCompany, user } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {
        isDormantSince: new Date()
      }
    );
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "createAdministrativeTransfer">,
      MutationCreateAdministrativeTransferArgs
    >(CREATE_ADMINISTRATIVE_TRANSFER, {
      variables: { input: { from: fromCompany.orgId, to: fromCompany.orgId } }
    });

    expect(errors).toBeDefined();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe(
      "L'entreprise de départ est identique à celle d'arrivée."
    );
  });

  it("should throw an error if the to company does not have the same profiles as the from company", async () => {
    const { company: fromCompany, user } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {
        isDormantSince: new Date(),
        companyTypes: ["WASTEPROCESSOR", "COLLECTOR"]
      }
    );
    const toCompany = await companyFactory({
      companyTypes: ["WASTEPROCESSOR"]
    });
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "createAdministrativeTransfer">,
      MutationCreateAdministrativeTransferArgs
    >(CREATE_ADMINISTRATIVE_TRANSFER, {
      variables: { input: { from: fromCompany.orgId, to: toCompany.orgId } }
    });

    expect(errors).toBeDefined();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe(
      "L'établissement d'arrivée n'a pas les mêmes profils que l'établissement de départ. Impossible de réaliser le transfert."
    );
  });

  it("should create an administrative transfer if all conditions are met", async () => {
    const { company: fromCompany, user } = await userWithCompanyFactory(
      UserRole.ADMIN,
      { isDormantSince: new Date(), companyTypes: ["WASTEPROCESSOR"] }
    );
    const toCompany = await companyFactory({
      companyTypes: ["WASTEPROCESSOR"]
    });
    const { mutate } = makeClient(user);

    const { data } = await mutate<
      Pick<Mutation, "createAdministrativeTransfer">,
      MutationCreateAdministrativeTransferArgs
    >(CREATE_ADMINISTRATIVE_TRANSFER, {
      variables: { input: { from: fromCompany.orgId, to: toCompany.orgId } }
    });

    expect(data.createAdministrativeTransfer?.id).toBeDefined();
  });
});
