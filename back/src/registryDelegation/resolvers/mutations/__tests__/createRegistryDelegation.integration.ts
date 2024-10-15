import gql from "graphql-tag";
import makeClient from "../../../../__tests__/testClient";
import {
  CreateRegistryDelegationInput,
  Mutation
} from "../../../../generated/graphql/types";
import {
  companyFactory,
  userInCompany,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import { User, RegistryDelegation } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { GraphQLFormattedError } from "graphql";
import { nowPlusXHours, todayAtMidnight, toddMMYYYY } from "../../../../utils";
import { sendMail } from "../../../../mailer/mailing";
import { renderMail, registryDelegationCreation } from "@td/mail";
import { getStream } from "../../../../activity-events/data";

// Mock emails
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

const CREATE_REGISTRY_DELEGATION = gql`
  mutation createRegistryDelegation($input: CreateRegistryDelegationInput!) {
    createRegistryDelegation(input: $input) {
      id
      createdAt
      updatedAt
      delegate {
        orgId
        givenName
      }
      delegator {
        orgId
      }
      startDate
      endDate
      comment
      isRevoked
    }
  }
`;

interface CreateDelegation {
  errors: readonly GraphQLFormattedError[];
  data: Pick<Mutation, "createRegistryDelegation">;
  delegation?: RegistryDelegation;
}
export const createDelegation = async (
  user: User | null,
  input: CreateRegistryDelegationInput
): Promise<CreateDelegation> => {
  const { mutate } = makeClient(user);
  const { errors, data } = await mutate<
    Pick<Mutation, "createRegistryDelegation">
  >(CREATE_REGISTRY_DELEGATION, {
    variables: {
      input
    }
  });

  if (errors) {
    return { errors, data };
  }

  const delegation = await prisma.registryDelegation.findFirstOrThrow({
    where: {
      id: data.createRegistryDelegation.id
    }
  });

  return { errors, data, delegation };
};

describe("mutation createRegistryDelegation", () => {
  afterAll(resetDatabase);

  afterEach(async () => {
    jest.resetAllMocks();
  });

  describe("successful use-cases", () => {
    it("should create a delegation declaration", async () => {
      // Given
      const delegate = await companyFactory({ givenName: "Some given name" });
      const { user, company: delegator } = await userWithCompanyFactory();

      // When
      const { errors, data, delegation } = await createDelegation(user, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId
      });

      // Then
      expect(errors).toBeUndefined();

      // Mutation return value should be OK
      expect(data.createRegistryDelegation.delegator.orgId).toBe(
        delegator.orgId
      );
      expect(data.createRegistryDelegation.delegate.orgId).toBe(delegate.orgId);
      expect(data.createRegistryDelegation.delegate.givenName).toBe(
        "Some given name"
      );

      // Persisted value should be OK
      expect(delegation?.delegatorId).toBe(delegator.id);
      expect(delegation?.delegateId).toBe(delegate.id);

      // Should create an event
      const eventsAfterCreate = await getStream(delegation!.id);
      expect(eventsAfterCreate.length).toBe(1);
      expect(eventsAfterCreate[0]).toMatchObject({
        type: "RegistryDelegationCreated",
        actor: user.id,
        streamId: delegation!.id
      });
    });

    it("should populate default values", async () => {
      // Given
      const delegate = await companyFactory();
      const { user, company: delegator } = await userWithCompanyFactory();

      // When
      const { errors, data, delegation } = await createDelegation(user, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId
      });

      // Then
      expect(errors).toBeUndefined();

      // Mutation return value should be OK
      // Can't really do better for dates: https://github.com/prisma/prisma/issues/16719
      expect(data.createRegistryDelegation.createdAt).not.toBeNull();
      expect(data.createRegistryDelegation.updatedAt).not.toBeNull();
      expect(data.createRegistryDelegation.startDate).toBe(
        todayAtMidnight().toISOString()
      );
      expect(data.createRegistryDelegation.endDate).toBeNull();
      expect(data.createRegistryDelegation.comment).toBeNull();
      expect(data.createRegistryDelegation.isRevoked).toBeFalsy();

      // Persisted value should be OK
      expect(delegation?.createdAt).not.toBeNull();
      expect(delegation?.updatedAt).not.toBeNull();
      expect(delegation?.startDate.toISOString()).toBe(
        todayAtMidnight().toISOString()
      );
      expect(delegation?.endDate).toBeNull();
      expect(delegation?.comment).toBeNull();
      expect(delegation?.isRevoked).toBeFalsy();
    });

    it("user can add a comment", async () => {
      // Given
      const delegate = await companyFactory();
      const { user, company: delegator } = await userWithCompanyFactory();

      // When
      const COMMENT = "A super comment to explain delegation";
      const { errors, data, delegation } = await createDelegation(user, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId,
        comment: COMMENT
      });

      // Then
      expect(errors).toBeUndefined();

      // Mutation return value should be OK
      expect(data.createRegistryDelegation.comment).toBe(COMMENT);

      // Persisted value should be OK
      expect(delegation?.comment).toBe(COMMENT);
    });

    it("test with null values", async () => {
      // Given
      const delegate = await companyFactory();
      const { user, company: delegator } = await userWithCompanyFactory();

      // When
      const { errors, data, delegation } = await createDelegation(user, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId,
        startDate: null,
        endDate: null
      });

      // Then
      expect(errors).toBeUndefined();

      // Mutation return value should be OK
      expect(data.createRegistryDelegation.delegator.orgId).toBe(
        delegator.orgId
      );
      expect(data.createRegistryDelegation.delegate.orgId).toBe(delegate.orgId);

      // Persisted value should be OK
      expect(delegation?.delegatorId).toBe(delegator.id);
      expect(delegation?.delegateId).toBe(delegate.id);
    });

    it("should send an email to companies admins", async () => {
      // Given
      const delegate = await companyFactory({ givenName: "Some given name" });
      const { user: delegatorAdmin, company: delegator } =
        await userWithCompanyFactory();
      await userInCompany("MEMBER", delegator.id); // Not an admin, shoud not receive mail
      await userInCompany("MEMBER", delegate.id); // Not an admin, shoud not receive mail
      const delegateAdmin = await userInCompany("ADMIN", delegate.id); // Admin, should receive mail
      await userWithCompanyFactory("ADMIN"); // Not part of the delegation, should not receive mail

      // When
      const { errors, delegation } = await createDelegation(delegatorAdmin, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId
      });

      // Then
      expect(errors).toBeUndefined();

      // Email
      jest.mock("../../../../mailer/mailing");
      (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

      expect(sendMail as jest.Mock).toHaveBeenCalledTimes(1);

      // Onboarding email
      expect(sendMail as jest.Mock).toHaveBeenCalledWith(
        renderMail(registryDelegationCreation, {
          variables: {
            startDate: toddMMYYYY(delegation!.startDate!),
            delegator,
            delegate
          },
          messageVersions: [
            {
              to: expect.arrayContaining([
                { email: delegatorAdmin.email, name: delegatorAdmin.name },
                { email: delegateAdmin.email, name: delegateAdmin.name }
              ])
            }
          ]
        })
      );
    });
  });

  it("testing email content - no end date", async () => {
    // Given
    const delegate = await companyFactory({ givenName: "Some given name" });
    const { user: delegatorAdmin, company: delegator } =
      await userWithCompanyFactory();

    // Email
    jest.mock("../../../../mailer/mailing");
    (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

    // When
    const { errors, delegation } = await createDelegation(delegatorAdmin, {
      delegateOrgId: delegate.orgId,
      delegatorOrgId: delegator.orgId
    });

    // Then
    expect(errors).toBeUndefined();
    expect(sendMail as jest.Mock).toHaveBeenCalledTimes(1);
    expect(delegation).not.toBeUndefined();

    if (!delegation) return;

    const formattedStartDate = toddMMYYYY(delegation.startDate).replace(
      /\//g,
      "&#x2F;"
    );
    expect(sendMail as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining(`effective à partir du ${formattedStartDate}
  <span>pour une durée illimitée.</span>`),
        subject: `Émission d'une demande de délégation de l'établissement ${delegator.name} (${delegator.siret})`
      })
    );
  });

  it("testing email content - with end date", async () => {
    // Given
    const delegate = await companyFactory({ givenName: "Some given name" });
    const { user: delegatorAdmin, company: delegator } =
      await userWithCompanyFactory();
    const endDate = new Date("2050-10-10");

    // Email
    jest.mock("../../../../mailer/mailing");
    (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

    // When
    const { errors, delegation } = await createDelegation(delegatorAdmin, {
      delegateOrgId: delegate.orgId,
      delegatorOrgId: delegator.orgId,
      endDate: endDate.toISOString() as any
    });

    // Then
    expect(errors).toBeUndefined();
    expect(sendMail as jest.Mock).toHaveBeenCalledTimes(1);

    if (!delegation) return;

    const formattedStartDate = toddMMYYYY(delegation.startDate).replace(
      /\//g,
      "&#x2F;"
    );
    const formattedEndDate = toddMMYYYY(endDate).replace(/\//g, "&#x2F;");
    expect(sendMail as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining(`effective à partir du ${formattedStartDate}
  <span>et jusqu'au ${formattedEndDate}.</span>`),
        subject: `Émission d'une demande de délégation de l'établissement ${delegator.name} (${delegator.siret})`
      })
    );
  });

  describe("authentication & roles", () => {
    it("user must be authenticated", async () => {
      // Given
      const delegate = await companyFactory();
      const delegator = await companyFactory();

      // When
      const { errors } = await createDelegation(null, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe("Vous n'êtes pas connecté.");
    });

    it("user must be admin", async () => {
      // Given
      const delegate = await companyFactory();
      const { user, company: delegator } = await userWithCompanyFactory(
        "MEMBER"
      );

      // When
      const { errors } = await createDelegation(user, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Vous n'avez pas les permissions suffisantes pour pouvoir créer une délégation."
      );
    });

    it("user must belong to delegator company", async () => {
      // Given
      const delegate = await companyFactory();
      const delegator = await companyFactory();
      const { user } = await userWithCompanyFactory("ADMIN");

      // When
      const { errors } = await createDelegation(user, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Vous devez faire partie de l'entreprise délégante pour pouvoir créer une délégation."
      );
    });
  });

  describe("async validation", () => {
    it("delegate company must exist", async () => {
      // Given
      const { user, company: delegator } = await userWithCompanyFactory();

      // When
      const { errors } = await createDelegation(user, {
        delegateOrgId: "40081510600010",
        delegatorOrgId: delegator.orgId
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "L'entreprise 40081510600010 visée comme délégataire n'existe pas dans Trackdéchets"
      );
    });

    it("delegator company must exist", async () => {
      // Given
      const { user, company: delegate } = await userWithCompanyFactory();

      // When
      const { errors } = await createDelegation(user, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: "40081510600010"
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "L'entreprise 40081510600010 visée comme délégante n'existe pas dans Trackdéchets"
      );
    });
  });

  describe("prevent simultaneous valid delegations", () => {
    it("should throw if there is already an active delegation for those companies (no start date, no end date)", async () => {
      // Given
      const delegate = await companyFactory();
      const { user, company: delegator } = await userWithCompanyFactory();

      // When: create first delegation
      const { errors, delegation } = await createDelegation(user, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId
      });

      // Then
      expect(errors).toBeUndefined();

      // When: create second delegation
      const { errors: errors2 } = await createDelegation(user, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId
      });

      // Then
      expect(errors2).not.toBeUndefined();
      expect(errors2[0].message).toBe(
        `Une délégation existe déjà pour ce délégataire et ce délégant (id ${delegation?.id})`
      );
    });

    it("should throw if there is already an active delegation for those companies (no start date, end date)", async () => {
      // Given
      const delegate = await companyFactory();
      const { user, company: delegator } = await userWithCompanyFactory();

      // When: create first delegation
      const { errors, delegation } = await createDelegation(user, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId,
        endDate: nowPlusXHours(2).toISOString() as any
      });

      // Then
      expect(errors).toBeUndefined();

      // When: create second delegation
      const { errors: errors2 } = await createDelegation(user, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId
      });

      // Then
      expect(errors2).not.toBeUndefined();
      expect(errors2[0].message).toBe(
        `Une délégation existe déjà pour ce délégataire et ce délégant (id ${delegation?.id})`
      );
    });

    it("should throw if there is already an active delegation for those companies (start date, end date)", async () => {
      // Given
      const delegate = await companyFactory();
      const { user, company: delegator } = await userWithCompanyFactory();

      // When: create first delegation
      const { errors, delegation } = await createDelegation(user, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId,
        startDate: new Date().toISOString() as any,
        endDate: nowPlusXHours(2).toISOString() as any
      });

      // Then
      expect(errors).toBeUndefined();

      // When: create second delegation
      const { errors: errors2 } = await createDelegation(user, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId
      });

      // Then
      expect(errors2).not.toBeUndefined();
      expect(errors2[0].message).toBe(
        `Une délégation existe déjà pour ce délégataire et ce délégant (id ${delegation?.id})`
      );
    });

    it("should throw if there is already an existing delegation programmed in the future", async () => {
      // Given
      const delegate = await companyFactory();
      const { user, company: delegator } = await userWithCompanyFactory();

      // When: create first delegation
      const { errors, delegation } = await createDelegation(user, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId,
        startDate: nowPlusXHours(2).toISOString() as any,
        endDate: nowPlusXHours(3).toISOString() as any
      });

      // Then
      expect(errors).toBeUndefined();

      // When: create second delegation
      const { errors: errors2 } = await createDelegation(user, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId
      });

      // Then
      expect(errors2).not.toBeUndefined();
      expect(errors2[0].message).toBe(
        `Une délégation existe déjà pour ce délégataire et ce délégant (id ${delegation?.id})`
      );
    });

    it("should not throw if there is an overlapping delegation but it's been refused", async () => {
      // Given
      const delegate = await companyFactory();
      const { user, company: delegator } = await userWithCompanyFactory();

      // When: create first delegation
      const { errors, delegation } = await createDelegation(user, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId,
        endDate: nowPlusXHours(3).toISOString() as any
      });

      // Then
      expect(errors).toBeUndefined();

      // Refuse the delegation
      await prisma.registryDelegation.update({
        where: { id: delegation?.id },
        data: { isRevoked: true }
      });

      // When: create second delegation
      const { errors: errors2 } = await createDelegation(user, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId
      });

      // Then
      expect(errors2).toBeUndefined();
    });

    it("should not throw if there is an existing delegation in the future but it's been refused", async () => {
      // Given
      const delegate = await companyFactory();
      const { user, company: delegator } = await userWithCompanyFactory();

      // When: create first delegation
      const { errors, delegation } = await createDelegation(user, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId,
        startDate: nowPlusXHours(2).toISOString() as any,
        endDate: nowPlusXHours(3).toISOString() as any
      });

      // Then
      expect(errors).toBeUndefined();

      // Refuse the delegation
      await prisma.registryDelegation.update({
        where: { id: delegation?.id },
        data: { isRevoked: true }
      });

      // When: create second delegation
      const { errors: errors2 } = await createDelegation(user, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId
      });

      // Then
      expect(errors2).toBeUndefined();
    });
  });
});
