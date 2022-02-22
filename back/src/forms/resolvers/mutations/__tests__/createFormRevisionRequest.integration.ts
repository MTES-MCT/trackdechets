import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationCreateFormRevisionRequestArgs
} from "../../../../generated/graphql/types";
import {
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const CREATE_FORM_REVISION_REQUEST = `
  mutation CreateFormRevisionRequest($input: CreateFormRevisionRequestInput!) {
    createFormRevisionRequest(input: $input) {
      id
      form {
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

describe("Mutation.createFormRevisionRequest", () => {
  afterEach(() => resetDatabase());

  it("should fail if bsdd doesnt exist", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const formId = "123";
    const { errors } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId,
          content: {},
          comment: "A comment",
          authoringCompanySiret: company.siret
        }
      }
    });

    expect(errors[0].message).toBe(
      `Le bordereau avec l'identifiant "${formId}" n'existe pas.`
    );
  });

  it("should fail if current user is neither emitter or recipient of the bsdd", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: emitterCompany.siret }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: bsdd.id,
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
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: bsdd.id,
          content: { wasteDetails: { code: "01 03 08" } },
          comment: "A comment",
          authoringCompanySiret: company.siret
        }
      }
    });

    expect(data.createFormRevisionRequest.form.id).toBe(bsdd.id);
    expect(data.createFormRevisionRequest.authoringCompany.siret).toBe(
      company.siret
    );
  });

  it("should create a revisionRequest and identifying current user as the requester (temporary storage) ", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: "1234",
        recipientCompanySiret: "5678",
        temporaryStorageDetail: {
          create: {
            tempStorerQuantityType: "REAL",
            tempStorerQuantityReceived: 2.4,
            tempStorerWasteAcceptationStatus: "ACCEPTED",
            tempStorerReceivedAt: "2022-03-20T00:00:00.000Z",
            tempStorerReceivedBy: "John Doe",
            tempStorerSignedAt: "2022-03-20T00:00:00.000Z",
            destinationIsFilledByEmitter: false,
            destinationCompanyName: company.name,
            destinationCompanySiret: company.siret,
            destinationCap: "",
            destinationProcessingOperation: "R 6",
            transporterCompanyName: "9876",
            transporterCompanySiret: "Transporter",
            transporterIsExemptedOfReceipt: false,
            transporterReceipt: "Dabcd",
            transporterDepartment: "10",
            transporterValidityLimit: "2054-11-20T00:00:00.000Z",
            transporterNumberPlate: ""
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: bsdd.id,
          content: { wasteDetails: { code: "01 03 08" } },
          comment: "A comment",
          authoringCompanySiret: company.siret
        }
      }
    });

    expect(data.createFormRevisionRequest.form.id).toBe(bsdd.id);
    expect(data.createFormRevisionRequest.authoringCompany.siret).toBe(
      company.siret
    );
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
    const { data } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: bsdd.id,
          content: { wasteDetails: { code: "01 03 08" } },
          comment: "A comment",
          authoringCompanySiret: company.siret
        }
      }
    });

    expect(data.createFormRevisionRequest.form.id).toBe(bsdd.id);
    expect(data.createFormRevisionRequest.approvals.length).toBe(1);
    expect(data.createFormRevisionRequest.approvals[0].approverSiret).toBe(
      recipientCompany.siret
    );
    expect(data.createFormRevisionRequest.approvals[0].status).toBe("PENDING");
  });

  it("should fail if unknown fields are provided", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");

    const { mutate } = makeClient(user);
    expect.assertions(2);
    try {
      await mutate(CREATE_FORM_REVISION_REQUEST, {
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
        'Field \\"name\\" is not defined by type \\"FormRevisionRequestWasteDetailsInput\\".'
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
    const { errors } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: bsdd.id,
          content: { wasteDetails: { code: "Made up code" } },
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
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: bsdd.id,
          content: { wasteDetails: { code: "01 03 08" } },
          comment: "A comment",
          authoringCompanySiret: company.siret
        }
      }
    });

    expect(data.createFormRevisionRequest.content).toEqual({
      wasteDetails: { code: "01 03 08" }
    });
  });
});
