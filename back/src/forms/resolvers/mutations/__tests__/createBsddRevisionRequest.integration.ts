import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationCreateBsddRevisionRequestArgs
} from "../../../../generated/graphql/types";
import {
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const CREATE_BSDD_REVISION_REQUEST = `
  mutation CreateBsddRevisionRequest($bsddId: ID!, $input: BsddRevisionRequestFormInput!, $comment: String!) {
    createBsddRevisionRequest(bsddId: $bsddId, input: $input, comment: $comment) {
      id
      bsddId
      content {
        wasteDetails { code }
      }
      requestedBy {
        siret
      }
      validations {
        company {
          siret
        }
        status
      }
      status
    }
  }
`;

describe("Mutation.createBsddRevisionRequest", () => {
  afterEach(() => resetDatabase());

  it("should fail if bsdd doesnt exist", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsddId = "123";
    const { errors } = await mutate(CREATE_BSDD_REVISION_REQUEST, {
      variables: {
        bsddId,
        input: {},
        comment: "A comment"
      }
    });

    expect(errors[0].message).toBe(
      `Le bordereau avec l'identifiant "${bsddId}" n'existe pas.`
    );
  });

  it("should fail if current user is neither emitter or recipient of the bsdd", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("ADMIN");
    const { user } = await userWithCompanyFactory("ADMIN");

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: emitterCompany.siret }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate(CREATE_BSDD_REVISION_REQUEST, {
      variables: {
        bsddId: bsdd.id,
        input: {},
        comment: "A comment"
      }
    });

    expect(errors[0].message).toBe(
      `Vous n'êtes pas autorisé à réviser ce bordereau`
    );
  });

  it("should create a revisionRequest and identifying current user as the requester", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsddRevisionRequest">>(
      CREATE_BSDD_REVISION_REQUEST,
      {
        variables: {
          bsddId: bsdd.id,
          input: {},
          comment: "A comment"
        }
      }
    );

    expect(data.createBsddRevisionRequest.bsddId).toBe(bsdd.id);
    expect(data.createBsddRevisionRequest.requestedBy.siret).toBe(
      company.siret
    );
  });

  it("should create a revisionRequest and a validation targetting the company not requesting the revisionRequest", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsddRevisionRequest">>(
      CREATE_BSDD_REVISION_REQUEST,
      {
        variables: {
          bsddId: bsdd.id,
          input: {},
          comment: "A comment"
        }
      }
    );

    expect(data.createBsddRevisionRequest.bsddId).toBe(bsdd.id);
    expect(data.createBsddRevisionRequest.validations.length).toBe(1);
    expect(data.createBsddRevisionRequest.validations[0].company.siret).toBe(
      recipientCompany.siret
    );
    expect(data.createBsddRevisionRequest.validations[0].status).toBe(
      "PENDING"
    );
  });

  it("should fail if unknown fields are provided", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");

    const { mutate } = makeClient(user);
    expect.assertions(2);
    try {
      await mutate(CREATE_BSDD_REVISION_REQUEST, {
        variables: {
          bsddId: "",
          input: { wasteDetails: { name: "I cannot change the name" } },
          comment: "A comment"
        }
      });
    } catch (err) {
      expect(err.message).toContain('{"code":"BAD_USER_INPUT"}');
      expect(err.message).toContain(
        'Field \\"name\\" is not defined by type \\"BsddRevisionRequestWasteDetailsInput\\".'
      );
    }
  });

  it("should fail if fields validation fails", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate(CREATE_BSDD_REVISION_REQUEST, {
      variables: {
        bsddId: bsdd.id,
        input: { wasteDetails: { code: "Made up code" } },
        comment: "A comment"
      }
    });

    expect(errors[0].message).toBe(
      "Le code déchet n'est pas reconnu comme faisant partie de la liste officielle du code de l'environnement."
    );
  });

  it("should store flattened input in revision content", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createBsddRevisionRequest">,
      MutationCreateBsddRevisionRequestArgs
    >(CREATE_BSDD_REVISION_REQUEST, {
      variables: {
        bsddId: bsdd.id,
        input: { wasteDetails: { code: "01 03 08" } },
        comment: "A comment"
      }
    });

    expect(data.createBsddRevisionRequest.content).toEqual({
      wasteDetails: { code: "01 03 08" }
    });
  });
});
