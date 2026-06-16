import { resetDatabase } from "../../../../../integration-tests/helper";
import { userFactory } from "../../../../../__tests__/factories";
import { prisma, MfaResetRequestStatus } from "@td/prisma";
import { processDueMfaResetRequests } from "../processDueMfaResetRequests";
import { addHours, subHours } from "date-fns";

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
  afterEach(resetDatabase);

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
    expect(updatedUser!.mfaResetSuspended).toBe(false);

    const codes = await prisma.totpRecoveryCode.findMany({
      where: { userId: target.id }
    });
    expect(codes.length).toBe(0);
  });

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
  });
});
