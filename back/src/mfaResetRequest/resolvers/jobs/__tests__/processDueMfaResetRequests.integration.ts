import { resetDatabase } from "../../../../../integration-tests/helper";
import { userFactory } from "../../../../__tests__/factories";
import { prisma, MfaResetRequestStatus } from "@td/prisma";
import { processDueMfaResetRequests } from "../processDueMfaResetRequests";
import { addHours, subHours } from "date-fns";
import { sendMail } from "../../../../mailer/mailing";

jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

// Let the Node.js event loop drain pending I/O callbacks (crypto + DB inside
// fire-and-forget sendMfaResetDoneEmail) before asserting on sendMail / token.
const flushAsync = async (times = 5) => {
  for (let i = 0; i < times; i++) {
    await new Promise(resolve => setImmediate(resolve));
  }
};

async function createRequest(
  userId: string,
  opts: { dueAt?: Date; status?: MfaResetRequestStatus } = {}
) {
  return prisma.mfaResetRequest.create({
    data: {
      userId,
      status: opts.status ?? MfaResetRequestStatus.PENDING,
      dueAt: opts.dueAt ?? subHours(new Date(), 1) // échu par défaut
    }
  });
}

describe("processDueMfaResetRequests", () => {
  afterEach(async () => {
    await resetDatabase();
    jest.resetAllMocks();
  });

  it("ne traite pas les demandes dont dueAt est dans le futur", async () => {
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date()
    });
    await createRequest(target.id, { dueAt: addHours(new Date(), 24) });

    await processDueMfaResetRequests();

    const req = await prisma.mfaResetRequest.findFirst({
      where: { userId: target.id }
    });
    expect(req!.status).toBe(MfaResetRequestStatus.PENDING);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("traitement réussi : révoque TOTP, invalide recovery codes, passe en DONE", async () => {
    const target = await userFactory({
      totpSeed: "SEED_TOTP",
      totpActivatedAt: new Date(),
      mfaResetSuspended: true
    });
    await prisma.totpRecoveryCode.create({
      data: { userId: target.id, codeHash: "hash1" }
    });
    await createRequest(target.id);

    await processDueMfaResetRequests();

    const req = await prisma.mfaResetRequest.findFirst({
      where: { userId: target.id }
    });
    expect(req!.status).toBe(MfaResetRequestStatus.DONE);

    const updatedUser = await prisma.user.findUnique({
      where: { id: target.id }
    });
    expect(updatedUser!.totpSeed).toBeNull();
    expect(updatedUser!.totpActivatedAt).toBeNull();
    expect(updatedUser!.mustReconfigureMfa).toBe(true);
    // mfaResetSuspended reste true : levé uniquement par exchangeMfaReconfigToken
    expect(updatedUser!.mfaResetSuspended).toBe(true);

    const codes = await prisma.totpRecoveryCode.findMany({
      where: { userId: target.id }
    });
    expect(codes.length).toBe(0);
  });

  // ── E-mail 5 ────────────────────────────────────────────────────────────────

  it("e-mail 5 : envoyé au titulaire après réinitialisation réussie", async () => {
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date(),
      mfaResetSuspended: true
    });
    await createRequest(target.id);

    await processDueMfaResetRequests();
    await flushAsync();

    expect(sendMail).toHaveBeenCalledTimes(1);
    const [renderedMail] = (sendMail as jest.Mock).mock.calls[0];
    expect(renderedMail.to[0].email).toBe(target.email);
    expect(renderedMail.subject).toMatch(
      /double authentification.*réinitialisée/i
    );
  });

  it("e-mail 5 : le corps contient le lien de reconfiguration", async () => {
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date(),
      mfaResetSuspended: true
    });
    await createRequest(target.id);

    await processDueMfaResetRequests();
    await flushAsync();

    const [renderedMail] = (sendMail as jest.Mock).mock.calls[0];
    expect(renderedMail.body).toContain("mfa-reconfiguration");
  });

  it("e-mail 5 : un MfaReconfigToken valable 24h est créé en base", async () => {
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date(),
      mfaResetSuspended: true
    });
    await createRequest(target.id);

    const before = new Date();
    await processDueMfaResetRequests();
    await flushAsync();
    const after = new Date();

    const token = await prisma.mfaReconfigToken.findFirst({
      where: { userId: target.id }
    });
    expect(token).not.toBeNull();
    expect(token!.used).toBe(false);
    const expiresMs = new Date(token!.tokenExpires).getTime();
    const expectedMin = addHours(before, 23).getTime();
    const expectedMax = addHours(after, 25).getTime();
    expect(expiresMs).toBeGreaterThan(expectedMin);
    expect(expiresMs).toBeLessThan(expectedMax);
  });

  it("e-mail 5 : le token stocké en base est le hash sha256 du token envoyé dans l'URL", async () => {
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date(),
      mfaResetSuspended: true
    });
    await createRequest(target.id);

    await processDueMfaResetRequests();

    const [renderedMail] = (sendMail as jest.Mock).mock.calls[0];
    // Extrait le token brut depuis l'URL dans le corps de l'e-mail
    const match = renderedMail.body.match(/token=([a-f0-9]+)/i);
    expect(match).not.toBeNull();
    const rawToken = decodeURIComponent(match![1]);

    const storedRecord = await prisma.mfaReconfigToken.findFirst({
      where: { userId: target.id }
    });
    expect(storedRecord).not.toBeNull();

    // Le hash sha256 du token brut doit correspondre à la valeur stockée
    const { createHash } = await import("crypto");
    const expectedHash = createHash("sha256").update(rawToken).digest("hex");
    expect(storedRecord!.token).toBe(expectedHash);
    // La valeur stockée ne doit pas être le token brut lui-même
    expect(storedRecord!.token).not.toBe(rawToken);
  });

  it("e-mail 5 : non envoyé si le compte est désactivé → demande FAILED", async () => {
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date(),
      isActive: false,
      mfaResetSuspended: true
    });
    await createRequest(target.id);

    await processDueMfaResetRequests();

    expect(sendMail).not.toHaveBeenCalled();
    const token = await prisma.mfaReconfigToken.findFirst({
      where: { userId: target.id }
    });
    expect(token).toBeNull();
  });

  it("e-mail 5 : non envoyé si la réinitialisation échoue (erreur technique)", async () => {
    // On simule une erreur en créant un état incohérent (userId inexistant dans la tx)
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date(),
      mfaResetSuspended: true
    });
    const req = await createRequest(target.id);

    // Supprime le user avant l'exécution pour provoquer un FAILED
    await prisma.mfaResetRequest.update({
      where: { id: req.id },
      data: { status: MfaResetRequestStatus.PENDING }
    });
    await prisma.user.update({
      where: { id: target.id },
      data: { isActive: false }
    });

    await processDueMfaResetRequests();

    expect(sendMail).not.toHaveBeenCalled();
  });

  // ── Autres cas existants ─────────────────────────────────────────────────────

  it("compte désactivé → demande FAILED, note automatique, suspension levée", async () => {
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date(),
      isActive: false,
      mfaResetSuspended: true
    });
    await createRequest(target.id);

    await processDueMfaResetRequests();

    const req = await prisma.mfaResetRequest.findFirst({
      where: { userId: target.id }
    });
    expect(req!.status).toBe(MfaResetRequestStatus.FAILED);
    expect(req!.note).toContain("Compte introuvable ou désactivé");

    const updatedUser = await prisma.user.findUnique({
      where: { id: target.id }
    });
    expect(updatedUser!.mfaResetSuspended).toBe(false);
    // TOTP non modifié puisque la réinitialisation a été avortée
    expect(updatedUser!.totpSeed).toBe("SEED");
  });

  it("preserve la note existante en ajoutant la note d'échec automatique", async () => {
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date(),
      isActive: false,
      mfaResetSuspended: true
    });
    await prisma.mfaResetRequest.create({
      data: {
        userId: target.id,
        status: MfaResetRequestStatus.PENDING,
        note: "Note initiale ticket #42",
        dueAt: subHours(new Date(), 1)
      }
    });

    await processDueMfaResetRequests();

    const req = await prisma.mfaResetRequest.findFirst({
      where: { userId: target.id }
    });
    expect(req!.note).toContain("Note initiale ticket #42");
    expect(req!.note).toContain("ÉCHEC AUTOMATIQUE");
  });

  it("ne traite que les demandes PENDING (ignore DONE, CANCELLED, FAILED)", async () => {
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date()
    });
    await prisma.mfaResetRequest.createMany({
      data: [
        {
          userId: target.id,
          status: MfaResetRequestStatus.DONE,
          dueAt: subHours(new Date(), 2)
        },
        {
          userId: target.id,
          status: MfaResetRequestStatus.CANCELLED,
          dueAt: subHours(new Date(), 2)
        },
        {
          userId: target.id,
          status: MfaResetRequestStatus.FAILED,
          dueAt: subHours(new Date(), 2)
        }
      ]
    });

    await processDueMfaResetRequests();

    const reqs = await prisma.mfaResetRequest.findMany({
      where: { userId: target.id }
    });
    // Aucune ne doit avoir été modifiée
    expect(reqs.every(r => r.status !== MfaResetRequestStatus.PENDING)).toBe(
      true
    );
    // L'utilisateur n'a pas été modifié
    const updatedUser = await prisma.user.findUnique({
      where: { id: target.id }
    });
    expect(updatedUser!.totpSeed).toBe("SEED");
<<<<<<< HEAD
    expect(sendMail).not.toHaveBeenCalled();
=======
>>>>>>> 5e3a3d78b (feat(TRA-17931): Panneau d'administration : gestion des réinitialisations MFA)
  });
});
