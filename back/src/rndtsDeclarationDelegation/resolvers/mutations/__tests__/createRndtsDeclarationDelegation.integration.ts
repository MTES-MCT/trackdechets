import gql from "graphql-tag";
import makeClient from "../../../../__tests__/testClient";
import {
  CreateRndtsDeclarationDelegationInput,
  Mutation
} from "../../../../generated/graphql/types";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import { User, RndtsDeclarationDelegation } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { GraphQLFormattedError } from "graphql";

const CREATE_RNDTS_DECLARATION_DELEGATION = gql`
  mutation createRndtsDeclarationDelegation(
    $input: CreateRndtsDeclarationDelegationInput!
  ) {
    createRndtsDeclarationDelegation(input: $input) {
      id
      createdAt
      updatedAt
      delegateOrgId
      delegatorOrgId
      validityStartDate
      validityEndDate
      comment
      isAccepted
      isActive
    }
  }
`;

interface CreateDelegation {
  errors: readonly GraphQLFormattedError[];
  data: Pick<Mutation, "createRndtsDeclarationDelegation">;
  delegation?: RndtsDeclarationDelegation;
}
const createDelegation = async (
  user: User | null,
  input: CreateRndtsDeclarationDelegationInput
): Promise<CreateDelegation> => {
  const { mutate } = makeClient(user);
  const { errors, data } = await mutate<
    Pick<Mutation, "createRndtsDeclarationDelegation">
  >(CREATE_RNDTS_DECLARATION_DELEGATION, {
    variables: {
      input
    }
  });

  if (errors) {
    return { errors, data };
  }

  const delegation = await prisma.rndtsDeclarationDelegation.findFirstOrThrow({
    where: {
      id: data.createRndtsDeclarationDelegation.id
    }
  });

  return { errors, data, delegation };
};

const nowPlusXHours = (hours: number) => {
  const NOW_PLUS_X_HOURS = new Date();
  NOW_PLUS_X_HOURS.setHours(NOW_PLUS_X_HOURS.getHours() + hours);
  return NOW_PLUS_X_HOURS;
};

describe("mutation createRndtsDeclarationDelegation", () => {
  afterAll(resetDatabase);

  describe("successful use-cases", () => {
    it("should create a delegation declaration", async () => {
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
      expect(data.createRndtsDeclarationDelegation.delegatorOrgId).toBe(
        delegator.orgId
      );
      expect(data.createRndtsDeclarationDelegation.delegateOrgId).toBe(
        delegate.orgId
      );

      // Persisted value should be OK
      expect(delegation?.delegatorOrgId).toBe(delegator.orgId);
      expect(delegation?.delegateOrgId).toBe(delegate.orgId);
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
      expect(data.createRndtsDeclarationDelegation.createdAt).not.toBeNull();
      expect(data.createRndtsDeclarationDelegation.updatedAt).not.toBeNull();
      expect(
        data.createRndtsDeclarationDelegation.validityStartDate
      ).not.toBeNull();
      expect(data.createRndtsDeclarationDelegation.validityEndDate).toBeNull();
      expect(data.createRndtsDeclarationDelegation.comment).toBeNull();
      expect(data.createRndtsDeclarationDelegation.isAccepted).toBeTruthy();

      // Persisted value should be OK
      expect(delegation?.createdAt).not.toBeNull();
      expect(delegation?.updatedAt).not.toBeNull();
      expect(delegation?.validityStartDate).not.toBeNull();
      expect(delegation?.validityEndDate).toBeNull();
      expect(delegation?.comment).toBeNull();
      expect(delegation?.isAccepted).toBeTruthy();
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
      expect(data.createRndtsDeclarationDelegation.comment).toBe(COMMENT);

      // Persisted value should be OK
      expect(delegation?.comment).toBe(COMMENT);
    });
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
        "Vous devez être admin pour pouvoir créer une délégation."
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
        "L'entreprise 40081510600010 visée comme délégataire n'existe pas"
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
        "L'entreprise 40081510600010 visée comme délégante n'existe pas"
      );
    });
  });

  describe("prevent duplicates", () => {
    it("should throw if there is already an active delegation for those companies (no end date)", async () => {
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
        `Une délégation est déjà active pour ce délégataire et ce délégant (id ${delegation?.id})`
      );
    });

    // TODO: solve issue with multiple delegation with overlapping dates
    // it("should throw if there is already an active delegation for those companies (end date)", async () => {
    //   // Given
    //   const delegate = await companyFactory();
    //   const { user, company: delegator } = await userWithCompanyFactory();

    //   // When: create first delegation
    //   const { errors, delegation } = await createDelegation(user, {
    //     delegateOrgId: delegate.orgId,
    //     delegatorOrgId: delegator.orgId,
    //     validityStartDate: new Date() as any,
    //     validityEndDate: nowPlusXHours(1).toISOString() as any
    //   });

    //   // Then
    //   expect(errors).toBeUndefined();

    //   // When: create second delegation
    //   const { errors: errors2 } = await createDelegation(user, {
    //     delegateOrgId: delegate.orgId,
    //     delegatorOrgId: delegator.orgId
    //   });

    //   // Then
    //   expect(errors2).not.toBeUndefined();
    //   expect(errors2[0].message).toBe(
    //     `Une délégation est déjà active pour ce délégataire et ce délégant (id ${delegation?.id})`
    //   );
    // });
  });

  // TODO: move in query and test isActive
  describe("isActive sub-resolver", () => {
    it("should return true", async () => {
      // Given
      const delegate = await companyFactory();
      const { user, company: delegator } = await userWithCompanyFactory();

      // When
      const { errors, data } = await createDelegation(user, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId
      });

      // Then
      expect(errors).toBeUndefined();
      expect(data.createRndtsDeclarationDelegation.isActive).toBeTruthy();
    });

    it("should return false because validityStartDate is in the future", async () => {
      // Given
      const delegate = await companyFactory();
      const { user, company: delegator } = await userWithCompanyFactory();

      // When
      const { errors, data } = await createDelegation(user, {
        delegateOrgId: delegate.orgId,
        delegatorOrgId: delegator.orgId,
        validityStartDate: nowPlusXHours(1).toISOString() as any
      });

      // Then
      expect(errors).toBeUndefined();
      expect(data.createRndtsDeclarationDelegation.isActive).toBeFalsy();
    });

    // TODO: how to test this?
    // it("should return false because validityEndDate is in the past", async () => {
    //   // Given
    //   const delegate = await companyFactory();
    //   const { user, company: delegator } = await userWithCompanyFactory();

    //   // When
    //   const { errors, data } = await createDelegation(user, {
    //     delegateOrgId: delegate.orgId,
    //     delegatorOrgId: delegator.orgId,
    //     validityStartDate: nowPlusXHours(-2).toISOString() as any,
    //     validityEndDate: new Date().toISOString() as any,
    //   });

    //   // Then
    //   expect(errors).toBeUndefined();
    //   expect(data.createRndtsDeclarationDelegation.isActive).toBeFalsy();
    // });

    // TODO: how to test this?
    // it("should return false because isAccepted is false", async () => {
    //   // Given
    //   const delegate = await companyFactory();
    //   const { user, company: delegator } = await userWithCompanyFactory();

    //   // When
    //   const { errors, data } = await createDelegation(user, {
    //     delegateOrgId: delegate.orgId,
    //     delegatorOrgId: delegator.orgId
    //   });

    //   // Then
    //   expect(errors).toBeUndefined();
    //   expect(data.createRndtsDeclarationDelegation.isActive).toBeTruthy();
    // });
  });
});
