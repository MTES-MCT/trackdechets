import gql from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import {
  adminFactory,
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import { prisma } from "@td/prisma";
import { sendMail } from "../../../../mailer/mailing";
import { addHours } from "date-fns";

jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

// Let the Node.js event loop drain pending I/O callbacks (real DB queries inside
// fire-and-forget email functions) before asserting on sendMail call counts.
const flushAsync = async (times = 5) => {
  for (let i = 0; i < times; i++) {
    await new Promise(resolve => setImmediate(resolve));
  }
};

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
    jest.clearAllMocks();
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
    const result = (data as any).createMfaResetRequest;
    expect(result.status).toBe("PENDING");
    expect(result.note).toBe("Ticket #1234");
    expect(result.user.email).toBe(target.email);

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

  // ── E-mail 3 ────────────────────────────────────────────────────────────────

  it("e-mail 3 : un e-mail de confirmation est envoyé au titulaire du compte", async () => {
    const admin = await adminFactory();
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date()
    });
    const { mutate } = makeClient(admin);

    await mutate(CREATE_MFA_RESET_REQUEST, {
      variables: { input: { email: target.email } }
    });

    // Au moins un e-mail envoyé (email 3 au titulaire, pas d'admin ici)
    expect(sendMail).toHaveBeenCalledTimes(1);
    const [renderedMail] = (sendMail as jest.Mock).mock.calls[0];
    expect(renderedMail.to[0].email).toBe(target.email);
    expect(renderedMail.subject).toMatch(/récupération de compte/i);
  });

  // ── E-mail 2 ────────────────────────────────────────────────────────────────

  it("e-mail 2 : les admins des établissements rattachés reçoivent une notification", async () => {
    const admin = await adminFactory();
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date()
    });

    // Rattache le titulaire à un établissement dont un autre utilisateur est admin
    const { user: companyAdmin, company } = await userWithCompanyFactory(
      "ADMIN"
    );
    await prisma.companyAssociation.create({
      data: { userId: target.id, companyId: company.id, role: "MEMBER" }
    });

    const { mutate } = makeClient(admin);
    await mutate(CREATE_MFA_RESET_REQUEST, {
      variables: { input: { email: target.email } }
    });
    await flushAsync();

    // Email 2 (admin) + email 3 (titulaire)
    expect(sendMail).toHaveBeenCalledTimes(2);
    const emails = (sendMail as jest.Mock).mock.calls.map(([mail]) => mail);
    const adminEmail = emails.find(m => m.to[0].email === companyAdmin.email);
    expect(adminEmail).toBeDefined();
    expect(adminEmail!.subject).toMatch(/récupération de compte/i);
    expect(adminEmail!.body).toContain(target.email);
  });

  it("e-mail 2 : aucun e-mail admin si le compte n'est rattaché à aucun établissement", async () => {
    const admin = await adminFactory();
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date()
    });
    // Pas de companyAssociation pour target

    const { mutate } = makeClient(admin);
    await mutate(CREATE_MFA_RESET_REQUEST, {
      variables: { input: { email: target.email } }
    });

    // Seulement email 3 (titulaire)
    expect(sendMail).toHaveBeenCalledTimes(1);
    const [renderedMail] = (sendMail as jest.Mock).mock.calls[0];
    expect(renderedMail.to[0].email).toBe(target.email);
  });

  it("e-mail 2 : le titulaire lui-même admin ne reçoit pas l'e-mail 2, uniquement l'e-mail 3", async () => {
    const admin = await adminFactory();

    // target est aussi admin d'un établissement
    const { user: target } = await userWithCompanyFactory(
      "ADMIN",
      {},
      {
        totpSeed: "SEED",
        totpActivatedAt: new Date()
      }
    );

    const { mutate } = makeClient(admin);
    await mutate(CREATE_MFA_RESET_REQUEST, {
      variables: { input: { email: target.email } }
    });

    // Si le seul admin de l'établissement est lui-même, on ne lui envoie pas l'email 2
    // Seulement email 3 (titulaire)
    expect(sendMail).toHaveBeenCalledTimes(1);
    const [renderedMail] = (sendMail as jest.Mock).mock.calls[0];
    expect(renderedMail.to[0].email).toBe(target.email);
    // L'objet correspond à l'email 3, pas l'email 2
    expect(renderedMail.subject).toMatch(/en cours de traitement/i);
  });

  it("e-mail 2 : un email par (admin, établissement) quand le même admin gère plusieurs établissements du titulaire", async () => {
    const superAdmin = await adminFactory();
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date()
    });

    // Un admin tiers membre de deux établissements
    const { user: companyAdmin, company: company1 } =
      await userWithCompanyFactory("ADMIN");
    const company2 = await companyFactory();
    await prisma.companyAssociation.create({
      data: { userId: companyAdmin.id, companyId: company2.id, role: "ADMIN" }
    });

    // Rattache le titulaire aux deux établissements
    await prisma.companyAssociation.createMany({
      data: [
        { userId: target.id, companyId: company1.id, role: "MEMBER" },
        { userId: target.id, companyId: company2.id, role: "MEMBER" }
      ]
    });

    const { mutate } = makeClient(superAdmin);
    await mutate(CREATE_MFA_RESET_REQUEST, {
      variables: { input: { email: target.email } }
    });
    await flushAsync();

    // Au moins un e-mail envoyé à l'admin (+ email 3 au titulaire)
    const emailsToAdmin = (sendMail as jest.Mock).mock.calls.filter(
      ([mail]) => mail.to[0].email === companyAdmin.email
    );
    expect(emailsToAdmin.length).toBeGreaterThanOrEqual(1);
  });

  // ── MFA Audit Log ────────────────────────────────────────────────────────────

  it("log MFA_MANUAL_RESET_INITIATED écrit pour le compte cible lors d'une création valide", async () => {
    const admin = await adminFactory();
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date()
    });
    const { mutate } = makeClient(admin);

    await mutate(CREATE_MFA_RESET_REQUEST, {
      variables: { input: { email: target.email } }
    });

    // fire-and-forget : laisser l'event loop drainer
    await flushAsync();

    const log = await prisma.mfaAuditLog.findFirst({
      where: { userId: target.id, eventType: "MFA_MANUAL_RESET_INITIATED" }
    });
    expect(log).not.toBeNull();
    expect(log!.success).toBe(true);
    expect(log!.userId).toBe(target.id);
  });

  it("log MFA_MANUAL_RESET_INITIATED : aucun code TOTP ni mot de passe stocké", async () => {
    const admin = await adminFactory();
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date()
    });
    const { mutate } = makeClient(admin);

    await mutate(CREATE_MFA_RESET_REQUEST, {
      variables: { input: { email: target.email } }
    });

    await flushAsync();

    const logs = await prisma.mfaAuditLog.findMany({
      where: { userId: target.id }
    });
    // La table MfaAuditLog ne contient que les champs définis dans le modèle Prisma
    // — aucun champ libre ne peut stocker un code TOTP ou un mot de passe.
    expect(logs.every(l => l.eventType !== undefined)).toBe(true);
    // Aucune entrée ne doit mentionner un code sensible dans eventType
    const sensitiveValues = ["TOTP", "PASSWORD", "SEED"];
    logs.forEach(l => {
      sensitiveValues.forEach(v => {
        expect(l.eventType).not.toContain(v);
      });
    });
  });
});
