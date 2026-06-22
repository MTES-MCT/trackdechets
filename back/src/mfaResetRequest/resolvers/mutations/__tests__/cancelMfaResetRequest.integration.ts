import gql from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import { adminFactory, userFactory } from "../../../../__tests__/factories";
import { prisma, MfaResetRequestStatus } from "@td/prisma";
import { sendMail } from "../../../../mailer/mailing";
import { addHours } from "date-fns";

jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

const CANCEL_MFA_RESET_REQUEST = gql`
  mutation cancelMfaResetRequest($mfaResetRequestId: ID!) {
    cancelMfaResetRequest(mfaResetRequestId: $mfaResetRequestId) {
      id
      status
    }
  }
`;

async function createPendingRequest(userId: string, note?: string) {
  return prisma.mfaResetRequest.create({
    data: {
      userId,
      status: MfaResetRequestStatus.PENDING,
      note: note ?? null,
      dueAt: addHours(new Date(), 48)
    }
  });
}

describe("Mutation cancelMfaResetRequest", () => {
  afterEach(async () => {
    await resetDatabase();
    jest.clearAllMocks();
  });

  it("un non super-admin ne peut pas annuler", async () => {
    const user = await userFactory();
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date()
    });
    await prisma.user.update({
      where: { id: target.id },
      data: { mfaResetSuspended: true }
    });
    const req = await createPendingRequest(target.id);

    const { mutate } = makeClient(user);
    const { errors } = await mutate(CANCEL_MFA_RESET_REQUEST, {
      variables: { mfaResetRequestId: req.id }
    });
    expect(errors).not.toBeUndefined();
    expect(errors![0].message).toMatch(/admin/i);
  });

  it("annulation valide : demande PENDING → CANCELLED, suspension levée", async () => {
    const admin = await adminFactory();
    const target = await userFactory({
      totpSeed: "SEED123",
      totpActivatedAt: new Date()
    });
    await prisma.user.update({
      where: { id: target.id },
      data: { mfaResetSuspended: true }
    });
    const req = await createPendingRequest(target.id);

    const { mutate } = makeClient(admin);
    const { data, errors } = await mutate(CANCEL_MFA_RESET_REQUEST, {
      variables: { mfaResetRequestId: req.id }
    });

    expect(errors).toBeUndefined();
    expect(data!.cancelMfaResetRequest.status).toBe("CANCELLED");

    // Suspension levée
    const updatedUser = await prisma.user.findUnique({
      where: { id: target.id }
    });
    expect(updatedUser!.mfaResetSuspended).toBe(false);

    // TOTP intact
    expect(updatedUser!.totpSeed).toBe("SEED123");
    expect(updatedUser!.totpActivatedAt).not.toBeNull();

    // Recovery codes intacts (on en crée un pour vérifier)
    await prisma.totpRecoveryCode.create({
      data: { userId: target.id, codeHash: "hash123" }
    });
    const codes = await prisma.totpRecoveryCode.findMany({
      where: { userId: target.id }
    });
    expect(codes.length).toBeGreaterThan(0);
  });

  it("impossible d'annuler une demande déjà DONE", async () => {
    const admin = await adminFactory();
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date()
    });
    const req = await prisma.mfaResetRequest.create({
      data: {
        userId: target.id,
        status: MfaResetRequestStatus.DONE,
        dueAt: addHours(new Date(), -1)
      }
    });

    const { mutate } = makeClient(admin);
    const { errors } = await mutate(CANCEL_MFA_RESET_REQUEST, {
      variables: { mfaResetRequestId: req.id }
    });
    expect(errors).not.toBeUndefined();
    expect(errors![0].message).toMatch(/DONE/);
  });

  it("impossible d'annuler une demande déjà CANCELLED", async () => {
    const admin = await adminFactory();
    const target = await userFactory({
      totpSeed: "S",
      totpActivatedAt: new Date()
    });
    const req = await prisma.mfaResetRequest.create({
      data: {
        userId: target.id,
        status: MfaResetRequestStatus.CANCELLED,
        dueAt: addHours(new Date(), 48)
      }
    });

    const { mutate } = makeClient(admin);
    const { errors } = await mutate(CANCEL_MFA_RESET_REQUEST, {
      variables: { mfaResetRequestId: req.id }
    });
    expect(errors).not.toBeUndefined();
    expect(errors![0].message).toMatch(/CANCELLED/);
  });

  it("impossible d'annuler une demande FAILED", async () => {
    const admin = await adminFactory();
    const target = await userFactory({
      totpSeed: "S",
      totpActivatedAt: new Date()
    });
    const req = await prisma.mfaResetRequest.create({
      data: {
        userId: target.id,
        status: MfaResetRequestStatus.FAILED,
        dueAt: addHours(new Date(), -1)
      }
    });

    const { mutate } = makeClient(admin);
    const { errors } = await mutate(CANCEL_MFA_RESET_REQUEST, {
      variables: { mfaResetRequestId: req.id }
    });
    expect(errors).not.toBeUndefined();
    expect(errors![0].message).toMatch(/FAILED/);
  });

  it("un email d'annulation est envoyé au compte concerné", async () => {
    const admin = await adminFactory();
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date()
    });
    await prisma.user.update({
      where: { id: target.id },
      data: { mfaResetSuspended: true }
    });
    const req = await createPendingRequest(target.id);

    const { mutate } = makeClient(admin);
    await mutate(CANCEL_MFA_RESET_REQUEST, {
      variables: { mfaResetRequestId: req.id }
    });

    expect(sendMail).toHaveBeenCalledTimes(1);
  });
});
