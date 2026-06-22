import gql from "graphql-tag";
import { resetDatabase } from "../../../../../../integration-tests/helper";
import makeClient from "../../../../../__tests__/testClient";
import {
  adminFactory,
  companyFactory,
  userFactory
} from "../../../../../__tests__/factories";
import { prisma, MfaResetRequestStatus, UserRole } from "@td/prisma";
import { addHours } from "date-fns";

async function attachUserToCompany(
  userId: string,
  companyId: string,
  role: UserRole
) {
  return prisma.companyAssociation.create({
    data: { userId, companyId, role }
  });
}

const MFA_RESET_REQUEST_SUMMARY = gql`
  query mfaResetRequestSummary($email: String!) {
    mfaResetRequestSummary(email: $email) {
      user {
        id
        email
        name
      }
      hasMfa
      hasPendingRequest
      companiesCount
      adminNotifiedCount
      noAdminWarning
    }
  }
`;

describe("Query mfaResetRequestSummary", () => {
  afterEach(resetDatabase);

  it("un non super-admin ne peut pas accéder au récapitulatif", async () => {
    const user = await userFactory();
    const { query } = makeClient(user);
    const { errors } = await query(MFA_RESET_REQUEST_SUMMARY, {
      variables: { email: "test@td.io" }
    });
    expect(errors).not.toBeUndefined();
    expect(errors![0].message).toMatch(/admin/i);
  });

  it("retourne user null si le compte est introuvable", async () => {
    const admin = await adminFactory();
    const { query } = makeClient(admin);
    const { data, errors } = await query(MFA_RESET_REQUEST_SUMMARY, {
      variables: { email: "inexistant@td.io" }
    });
    expect(errors).toBeUndefined();
    expect(data!.mfaResetRequestSummary.user).toBeNull();
    expect(data!.mfaResetRequestSummary.hasMfa).toBe(false);
    expect(data!.mfaResetRequestSummary.noAdminWarning).toBe(true);
  });

  it("hasMfa = false si le compte n'a pas de MFA active", async () => {
    const admin = await adminFactory();
    const target = await userFactory(); // pas de MFA
    const { query } = makeClient(admin);
    const { data } = await query(MFA_RESET_REQUEST_SUMMARY, {
      variables: { email: target.email }
    });
    expect(data!.mfaResetRequestSummary.hasMfa).toBe(false);
    expect(data!.mfaResetRequestSummary.user!.email).toBe(target.email);
  });

  it("hasMfa = true si le compte a une MFA active", async () => {
    const admin = await adminFactory();
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date()
    });
    const { query } = makeClient(admin);
    const { data } = await query(MFA_RESET_REQUEST_SUMMARY, {
      variables: { email: target.email }
    });
    expect(data!.mfaResetRequestSummary.hasMfa).toBe(true);
  });

  it("hasPendingRequest = true si une demande PENDING existe déjà", async () => {
    const admin = await adminFactory();
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date()
    });
    await prisma.mfaResetRequest.create({
      data: {
        userId: target.id,
        status: MfaResetRequestStatus.PENDING,
        dueAt: addHours(new Date(), 48)
      }
    });
    const { query } = makeClient(admin);
    const { data } = await query(MFA_RESET_REQUEST_SUMMARY, {
      variables: { email: target.email }
    });
    expect(data!.mfaResetRequestSummary.hasPendingRequest).toBe(true);
  });

  it("retourne le bon nombre d'établissements et d'admins notifiables", async () => {
    const admin = await adminFactory();
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date()
    });
    const company1 = await companyFactory();
    const company2 = await companyFactory();
    const otherAdmin = await userFactory();

    await attachUserToCompany(target.id, company1.id, UserRole.MEMBER);
    await attachUserToCompany(target.id, company2.id, UserRole.MEMBER);
    await attachUserToCompany(otherAdmin.id, company1.id, UserRole.ADMIN);

    const { query } = makeClient(admin);
    const { data } = await query(MFA_RESET_REQUEST_SUMMARY, {
      variables: { email: target.email }
    });

    expect(data!.mfaResetRequestSummary.companiesCount).toBe(2);
    expect(data!.mfaResetRequestSummary.adminNotifiedCount).toBe(1);
    expect(data!.mfaResetRequestSummary.noAdminWarning).toBe(false);
  });

  it("noAdminWarning = true si aucun admin d'établissement ne sera notifié", async () => {
    const admin = await adminFactory();
    const target = await userFactory({
      totpSeed: "SEED",
      totpActivatedAt: new Date()
    });
    const company = await companyFactory();
    // Seul l'utilisateur cible est dans l'établissement, pas d'autre admin
    await attachUserToCompany(target.id, company.id, UserRole.MEMBER);

    const { query } = makeClient(admin);
    const { data } = await query(MFA_RESET_REQUEST_SUMMARY, {
      variables: { email: target.email }
    });

    expect(data!.mfaResetRequestSummary.adminNotifiedCount).toBe(0);
    expect(data!.mfaResetRequestSummary.noAdminWarning).toBe(true);
  });
});
