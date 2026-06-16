import gql from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import { adminFactory, userFactory } from "../../../../__tests__/factories";
import { prisma } from "@td/prisma";
import { sendMail } from "../../../../mailer/mailing";
import { addHours } from "date-fns";

jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

const CREATE_MFA_RESET_REQUEST = gql`
  mutation createMfaResetRequest($input: CreateMfaResetRequestInput!) {
    createMfaResetRequest(input: $input) {
      id
      status
      note
      createdAt
      dueAt
      user {
        email
        name
      }
    }
  }
`;

describe("Mutation createMfaResetRequest", () => {
  afterEach(async () => {
    await resetDatabase();
    jest.resetAllMocks();
  });

  it("un utilisateur non connecté ne peut pas accéder", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate(CREATE_MFA_RESET_REQUEST, {
      variables: { input: { email: "test@example.com" } }
    });
    expect(errors).not.toBeUndefined();
    expect(errors![0].message).toMatch(/connecté/);
  });

  it("un utilisateur non super-admin ne peut pas accéder", async () => {
    const user = await userFactory();
    const { mutate } = makeClient(user);
    const { errors } = await mutate(CREATE_MFA_RESET_REQUEST, {
      variables: { input: { email: "test@example.com" } }
    });
    expect(errors).not.toBeUndefined();
    expect(errors![0].message).toMatch(/admin/i);
  });

  it("création bloquée si le compte cible n'a pas de MFA active", async () => {
    const admin = await adminFactory();
    const target = await userFactory(); // pas de MFA
    const { mutate } = makeClient(admin);
    const { errors } = await mutate(CREATE_MFA_RESET_REQUEST, {
      variables: { input: { email: target.email } }
    });
    expect(errors).not.toBeUndefined();
    expect(errors![0].message).toMatch(/double authentification/i);
  });

  it("création bloquée si le compte cible est introuvable", async () => {
    const admin = await adminFactory();
    const { mutate } = makeClient(admin);
    const { errors } = await mutate(CREATE_MFA_RESET_REQUEST, {
      variables: { input: { email: "inexistant@td.io" } }
    });
    expect(errors).not.toBeUndefined();
    expect(errors![0].message).toMatch(/Aucun compte/);
  });

  it("création valide : demande PENDING créée et compte suspendu immédiatement", async () => {
    const admin = await adminFactory();
    const target = await userFactory({
      totpSeed: "SEED123",
      totpActivatedAt: new Date()
    });
    const { mutate } = makeClient(admin);

    const { data, errors } = await mutate(CREATE_MFA_RESET_REQUEST, {
      variables: { input: { email: target.email, note: "Ticket #1234" } }
    });

    expect(errors).toBeUndefined();
    expect(data!.createMfaResetRequest.status).toBe("PENDING");
    expect(data!.createMfaResetRequest.note).toBe("Ticket #1234");
    expect(data!.createMfaResetRequest.user.email).toBe(target.email);

    // Vérification BDD : dueAt ≈ createdAt + 48h
    const stored = await prisma.mfaResetRequest.findFirst({
      where: { userId: target.id }
    });
    expect(stored).not.toBeNull();
    expect(stored!.status).toBe("PENDING");
    const dueAtMs = new Date(stored!.dueAt).getTime();
    const expectedDueAt = addHours(new Date(stored!.createdAt), 48).getTime();
    expect(Math.abs(dueAtMs - expectedDueAt)).toBeLessThan(5000); // tolérance 5s

    // Le compte est suspendu
    const updatedUser = await prisma.user.findUnique({
      where: { id: target.id }
    });
    expect(updatedUser!.mfaResetSuspended).toBe(true);
  });

  it("doublon bloqué : impossible de créer deux demandes PENDING pour le même compte", async () => {
    const admin = await adminFactory();
    const target = await userFactory({
      totpSeed: "SEED123",
      totpActivatedAt: new Date()
    });
    const { mutate } = makeClient(admin);

    // Première création
    const first = await mutate(CREATE_MFA_RESET_REQUEST, {
      variables: { input: { email: target.email } }
    });
    expect(first.errors).toBeUndefined();

    // Deuxième tentative
    const second = await mutate(CREATE_MFA_RESET_REQUEST, {
      variables: { input: { email: target.email } }
    });
    expect(second.errors).not.toBeUndefined();
    expect(second.errors![0].message).toMatch(/déjà en cours/);
  });

  it("une note optionnelle est conservée dans la demande", async () => {
    const admin = await adminFactory();
    const target = await userFactory({
      totpSeed: "SEED123",
      totpActivatedAt: new Date()
    });
    const { mutate } = makeClient(admin);

    const { data } = await mutate(CREATE_MFA_RESET_REQUEST, {
      variables: {
        input: { email: target.email, note: "Support ticket TRA-99999" }
      }
    });
    expect(data!.createMfaResetRequest.note).toBe("Support ticket TRA-99999");
  });
});
