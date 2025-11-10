import { resetDatabase } from "./../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  companyAssociatedToExistingUserFactory
} from "../../__tests__/factories";
import { UserRole } from "@td/prisma";
import { createBsff } from "./factories";

describe("Bsff factories", () => {
  afterEach(resetDatabase);

  it("should denormalize all user sirets on draft bsff", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await companyAssociatedToExistingUserFactory(
      emitter.user,
      UserRole.ADMIN
    );
    const transporter = await companyAssociatedToExistingUserFactory(
      emitter.user,
      UserRole.ADMIN
    );
    const bsff = await createBsff(
      {
        emitter,
        destination: { company: destination, user: emitter.user },
        transporter: { company: transporter, user: emitter.user }
      },
      { data: { isDraft: true }, userId: emitter.user.id }
    );

    expect(bsff.canAccessDraftOrgIds).toEqual([
      emitter.company.siret,
      destination.siret,
      transporter.siret
    ]);
  });

  it("should only denormalize user sirets on draft bsff", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);

    const bsff = await createBsff(
      {
        emitter,
        destination,
        transporter
      },
      { data: { isDraft: true }, userId: emitter.user.id }
    );

    expect(bsff.canAccessDraftOrgIds).toEqual([emitter.company.siret]);
  });
});
