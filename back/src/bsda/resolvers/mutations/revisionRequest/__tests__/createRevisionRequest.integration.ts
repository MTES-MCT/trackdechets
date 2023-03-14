import { resetDatabase } from "../../../../../../integration-tests/helper";
import {
  Mutation,
  MutationCreateBsdaRevisionRequestArgs
} from "../../../../../generated/graphql/types";
import { userWithCompanyFactory } from "../../../../../__tests__/factories";
import makeClient from "../../../../../__tests__/testClient";
import { bsdaFactory } from "../../../../__tests__/factories";

const CREATE_BSDA_REVISION_REQUEST = `
  mutation CreateBsdaRevisionRequest($input: CreateBsdaRevisionRequestInput!) {
    createBsdaRevisionRequest(input: $input) {
      id
      bsda {
        id
      }
      content {
        waste { code }
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

describe("Mutation.createBsdaRevisionRequest", () => {
  afterEach(() => resetDatabase());

  it("should fail if bsda doesnt exist", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdaId = "123";
    const { errors } = await mutate<
      Pick<Mutation, "createBsdaRevisionRequest">,
      MutationCreateBsdaRevisionRequestArgs
    >(CREATE_BSDA_REVISION_REQUEST, {
      variables: {
        input: {
          bsdaId,
          content: {},
          comment: "A comment",
          authoringCompanySiret: company.siret
        }
      }
    });

    expect(errors[0].message).toBe(
      `Le bordereau avec l'identifiant "${bsdaId}" n'existe pas.`
    );
  });

  it("should fail if revision is empty", async () => {
    const { company: destinationCompany } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationCompanySiret: destinationCompany.siret,
        status: "SENT"
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsdaRevisionRequest">,
      MutationCreateBsdaRevisionRequestArgs
    >(CREATE_BSDA_REVISION_REQUEST, {
      variables: {
        input: {
          bsdaId: bsda.id,
          content: {},
          comment: "A comment",
          authoringCompanySiret: company.siret
        }
      }
    });

    expect(errors[0].message).toBe(
      "Impossible de créer une révision sans modifications."
    );
  });

  it("should fail if current user is neither emitter or recipient of the bsda", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsda = await bsdaFactory({
      opt: { emitterCompanySiret: emitterCompany.siret }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsdaRevisionRequest">,
      MutationCreateBsdaRevisionRequestArgs
    >(CREATE_BSDA_REVISION_REQUEST, {
      variables: {
        input: {
          bsdaId: bsda.id,
          content: {},
          comment: "A comment",
          authoringCompanySiret: company.siret
        }
      }
    });

    expect(errors[0].message).toBe(
      `Vous n'êtes pas autorisé à réviser ce bordereau`
    );
  });

  it("should create a revisionRequest and identifying current user as the requester", async () => {
    const { company: destinationCompany } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationCompanySiret: destinationCompany.siret,
        status: "SENT"
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createBsdaRevisionRequest">,
      MutationCreateBsdaRevisionRequestArgs
    >(CREATE_BSDA_REVISION_REQUEST, {
      variables: {
        input: {
          bsdaId: bsda.id,
          content: { waste: { code: "16 01 11*" } },
          comment: "A comment",
          authoringCompanySiret: company.siret
        }
      }
    });

    expect(data.createBsdaRevisionRequest.bsda.id).toBe(bsda.id);
    expect(data.createBsdaRevisionRequest.authoringCompany.siret).toBe(
      company.siret
    );
  });

  it("should create a revisionRequest and an approval targetting the company not requesting the revisionRequest", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationCompanySiret: recipientCompany.siret,
        status: "SENT"
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createBsdaRevisionRequest">,
      MutationCreateBsdaRevisionRequestArgs
    >(CREATE_BSDA_REVISION_REQUEST, {
      variables: {
        input: {
          bsdaId: bsda.id,
          content: { waste: { code: "16 01 11*" } },
          comment: "A comment",
          authoringCompanySiret: company.siret
        }
      }
    });

    expect(data.createBsdaRevisionRequest.bsda.id).toBe(bsda.id);
    expect(data.createBsdaRevisionRequest.approvals.length).toBe(2);
    expect(data.createBsdaRevisionRequest.approvals[0].approverSiret).toBe(
      recipientCompany.siret
    );
    expect(data.createBsdaRevisionRequest.approvals[0].status).toBe("PENDING");
  });

  it("should fail if unknown fields are provided", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");

    const { mutate } = makeClient(user);
    expect.assertions(2);
    try {
      await mutate<Pick<Mutation, "createBsdaRevisionRequest">>(
        CREATE_BSDA_REVISION_REQUEST,
        {
          variables: {
            input: {
              bsdaId: "",
              content: { waste: { name: "I cannot change the name" } },
              comment: "A comment"
            }
          }
        }
      );
    } catch (err) {
      expect(err.message).toContain('{"code":"BAD_USER_INPUT"}');
      expect(err.message).toContain(
        'Field \\"name\\" is not defined by type \\"BsdaRevisionRequestWasteInput\\".'
      );
    }
  });

  it("should fail if fields validation fails", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsda = await bsdaFactory({
      opt: { emitterCompanySiret: company.siret, status: "SENT" }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsdaRevisionRequest">,
      MutationCreateBsdaRevisionRequestArgs
    >(CREATE_BSDA_REVISION_REQUEST, {
      variables: {
        input: {
          bsdaId: bsda.id,
          content: { waste: { code: "Made up code" } },
          comment: "A comment",
          authoringCompanySiret: company.siret
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
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationCompanySiret: recipientCompany.siret,
        status: "SENT"
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createBsdaRevisionRequest">,
      MutationCreateBsdaRevisionRequestArgs
    >(CREATE_BSDA_REVISION_REQUEST, {
      variables: {
        input: {
          bsdaId: bsda.id,
          content: { waste: { code: "16 01 11*" } },
          comment: "A comment",
          authoringCompanySiret: company.siret
        }
      }
    });

    expect(data.createBsdaRevisionRequest.content).toEqual({
      waste: { code: "16 01 11*" }
    });
  });

  it("should create an auto-approved revisionRequest all roles have the same siret", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationCompanySiret: company.siret,
        workerCompanySiret: company.siret,
        status: "SENT"
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createBsdaRevisionRequest">,
      MutationCreateBsdaRevisionRequestArgs
    >(CREATE_BSDA_REVISION_REQUEST, {
      variables: {
        input: {
          bsdaId: bsda.id,
          content: { waste: { code: "16 01 11*" } },
          comment: "A comment",
          authoringCompanySiret: company.siret
        }
      }
    });

    expect(data.createBsdaRevisionRequest.bsda.id).toBe(bsda.id);
    expect(data.createBsdaRevisionRequest.approvals.length).toBe(0);
    expect(data.createBsdaRevisionRequest.status).toBe("ACCEPTED");
  });

  it("should only create one approval if two approving roles have the same siret", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationCompanySiret: recipientCompany.siret,
        workerCompanySiret: recipientCompany.siret,
        status: "SENT"
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createBsdaRevisionRequest">,
      MutationCreateBsdaRevisionRequestArgs
    >(CREATE_BSDA_REVISION_REQUEST, {
      variables: {
        input: {
          bsdaId: bsda.id,
          content: { waste: { code: "16 01 11*" } },
          comment: "A comment",
          authoringCompanySiret: company.siret
        }
      }
    });

    expect(data.createBsdaRevisionRequest.bsda.id).toBe(bsda.id);
    expect(data.createBsdaRevisionRequest.approvals.length).toBe(1);
  });

  it("should fail if trying to cancel AND modify the bsda", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationCompanySiret: recipientCompany.siret,
        workerCompanySiret: recipientCompany.siret,
        status: "SENT"
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsdaRevisionRequest">,
      MutationCreateBsdaRevisionRequestArgs
    >(CREATE_BSDA_REVISION_REQUEST, {
      variables: {
        input: {
          bsdaId: bsda.id,
          content: { isCanceled: true, waste: { code: "16 01 11*" } },
          comment: "A comment",
          authoringCompanySiret: company.siret
        }
      }
    });

    expect(errors[0].message).toBe(
      `Impossible d'annuler et de modifier un bordereau.`
    );
  });

  it("should fail if the bsda is canceled", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationCompanySiret: recipientCompany.siret,
        workerCompanySiret: recipientCompany.siret,
        status: "CANCELED"
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsdaRevisionRequest">,
      MutationCreateBsdaRevisionRequestArgs
    >(CREATE_BSDA_REVISION_REQUEST, {
      variables: {
        input: {
          bsdaId: bsda.id,
          content: { waste: { code: "16 01 11*" } },
          comment: "A comment",
          authoringCompanySiret: company.siret
        }
      }
    });

    expect(errors[0].message).toBe(
      `Impossible de créer une révision sur ce bordereau, il a été annulé.`
    );
  });
});
