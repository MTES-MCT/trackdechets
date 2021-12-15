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
  mutation CreateBsddRevisionRequest($input: CreateBsddRevisionRequestInput!) {
    createBsddRevisionRequest(input: $input) {
      id
      bsdd {
        id
      }
      content {
        wasteDetails { code }
      }
      authoringCompany {
        siret
      }
      approvals {
        approverSiret
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
        input: {
          bsddId,
          content: {},
          comment: "A comment"
        }
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
        input: { bsddId: bsdd.id, content: {}, comment: "A comment" }
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
          input: { bsddId: bsdd.id, content: {}, comment: "A comment" }
        }
      }
    );

    expect(data.createBsddRevisionRequest.bsdd.id).toBe(bsdd.id);
    expect(data.createBsddRevisionRequest.authoringCompany.siret).toBe(company.siret);
  });

  it("should create a revisionRequest and an approval targetting the company not requesting the revisionRequest", async () => {
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
          input: { bsddId: bsdd.id, content: {}, comment: "A comment" }
        }
      }
    );

    expect(data.createBsddRevisionRequest.bsdd.id).toBe(bsdd.id);
    expect(data.createBsddRevisionRequest.approvals.length).toBe(1);
    expect(data.createBsddRevisionRequest.approvals[0].approverSiret).toBe(
      recipientCompany.siret
    );
    expect(data.createBsddRevisionRequest.approvals[0].status).toBe("PENDING");
  });

  it("should fail if unknown fields are provided", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");

    const { mutate } = makeClient(user);
    expect.assertions(2);
    try {
      await mutate(CREATE_BSDD_REVISION_REQUEST, {
        variables: {
          input: {
            bsddId: "",
            content: { wasteDetails: { name: "I cannot change the name" } },
            comment: "A comment"
          }
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
        input: {
          bsddId: bsdd.id,
          content: { wasteDetails: { code: "Made up code" } },
          comment: "A comment"
        }
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
        input: {
          bsddId: bsdd.id,
          content: { wasteDetails: { code: "01 03 08" } },
          comment: "A comment"
        }
      }
    });

    expect(data.createBsddRevisionRequest.content).toEqual({
      wasteDetails: { code: "01 03 08" }
    });
  });
});
