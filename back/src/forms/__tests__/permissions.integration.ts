import { Form, User, Status } from "@prisma/client";
import prisma from "../../prisma";
import { resetDatabase } from "../../../integration-tests/helper";
import { ErrorCode } from "../../common/errors";
import {
  companyFactory,
  formFactory,
  formWithTempStorageFactory,
  userFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";
import {
  checkCanRead,
  checkCanDuplicate,
  checkCanDelete,
  checkCanMarkAsProcessed,
  checkCanMarkAsReceived,
  checkCanMarkAsResent,
  checkCanMarkAsSealed,
  checkCanMarkAsTempStored,
  checkCanSignedByTransporter
} from "../permissions";
import { checkSecurityCode } from "../../common/permissions";

async function checkEmitterPermission(
  permission: (user: User, form: Form) => Promise<boolean>,
  formStatus = Status.DRAFT
) {
  const owner = await userFactory();
  const { user, company } = await userWithCompanyFactory("MEMBER");
  const form = await formFactory({
    ownerId: owner.id,
    opt: { emitterCompanySiret: company.siret, status: formStatus }
  });
  return permission(user, form);
}

async function checkRecipientPermission(
  permission: (user: User, form: Form) => Promise<boolean>,
  formStatus = Status.DRAFT
) {
  const owner = await userFactory();
  const { user, company } = await userWithCompanyFactory("MEMBER");
  const form = await formFactory({
    ownerId: owner.id,
    opt: { recipientCompanySiret: company.siret, status: formStatus }
  });
  return permission(user, form);
}

async function checkTransporterPermission(
  permission: (user: User, form: Form) => Promise<boolean>,
  formStatus = Status.DRAFT
) {
  const owner = await userFactory();
  const { user, company } = await userWithCompanyFactory("MEMBER");
  const form = await formFactory({
    ownerId: owner.id,
    opt: {
      status: formStatus,
      transporters: {
        create: { transporterCompanySiret: company.siret, number: 1 }
      }
    }
  });
  return permission(user, form);
}

async function checkTraderPermission(
  permission: (user: User, form: Form) => Promise<boolean>,
  formStatus = Status.DRAFT
) {
  const owner = await userFactory();
  const { user, company } = await userWithCompanyFactory("MEMBER");
  const form = await formFactory({
    ownerId: owner.id,
    opt: { traderCompanySiret: company.siret, status: formStatus }
  });
  return permission(user, form);
}

async function checkEcoOrganismePermission(
  permission: (user: User, form: Form) => Promise<boolean>,
  formStatus = Status.DRAFT
) {
  const owner = await userFactory();
  const { user, company } = await userWithCompanyFactory("MEMBER");
  const ecoOrganisme = await prisma.ecoOrganisme.create({
    data: {
      siret: company.siret!,
      name: "EO",
      address: ""
    }
  });
  const form = await formFactory({
    ownerId: owner.id,
    opt: {
      ecoOrganismeSiret: ecoOrganisme.siret,
      ecoOrganismeName: ecoOrganisme.name,
      status: formStatus
    }
  });
  return permission(user, form);
}

async function checkTransporterAfterTempStoragePermission(
  permission: (user: User, form: Form) => Promise<boolean>,
  formStatus = Status.DRAFT
) {
  const owner = await userFactory();
  const { user, company } = await userWithCompanyFactory("MEMBER");
  const form = await formWithTempStorageFactory({
    ownerId: owner.id,
    opt: {
      status: formStatus
    }
  });
  await prisma.form.update({
    where: { id: form.id },
    data: {
      forwardedIn: {
        update: {
          transporters: {
            updateMany: {
              where: { number: 1 },
              data: { transporterCompanySiret: company.siret }
            }
          }
        }
      }
    }
  });
  return permission(user, form);
}

async function checkDestinationAfterTempStoragePermission(
  permission: (user: User, form: Form) => Promise<boolean>,
  formStatus = Status.DRAFT
) {
  const owner = await userFactory();
  const { user, company } = await userWithCompanyFactory("MEMBER");
  const form = await formWithTempStorageFactory({
    ownerId: owner.id,
    opt: {
      status: formStatus
    }
  });
  await prisma.form.update({
    where: { id: form.id },
    data: {
      forwardedIn: { update: { recipientCompanySiret: company.siret } }
    }
  });
  return permission(user, form);
}

async function checkMultiModalTransporterPermission(
  permission: (user: User, form: Form) => Promise<boolean>,
  formStatus = Status.DRAFT
) {
  const owner = await userFactory();
  const { user, company } = await userWithCompanyFactory("MEMBER");
  const form = await formWithTempStorageFactory({
    ownerId: owner.id,
    opt: {
      status: formStatus
    }
  });
  await prisma.bsddTransporter.create({
    data: {
      form: { connect: { id: form.id } },
      transporterCompanySiret: company.siret,
      number: 2
    }
  });
  return permission(user, form);
}

async function checkRandomUserPermission(
  permission: (user: User, form: Form) => Promise<boolean>,
  formStatus = Status.DRAFT
) {
  const owner = await userFactory();
  const user = await userFactory();
  const form = await formWithTempStorageFactory({
    ownerId: owner.id,
    opt: {
      status: formStatus
    }
  });
  return permission(user, form);
}

describe.each([
  checkCanRead,
  checkCanDuplicate,
  //checkCanUpdate,
  checkCanDelete,
  checkCanMarkAsSealed
])("%p", permission => {
  afterAll(resetDatabase);

  it("should deny access to random user", async () => {
    expect.assertions(1);
    try {
      await checkRandomUserPermission(permission);
    } catch (err) {
      expect(err.extensions.code).toEqual(ErrorCode.FORBIDDEN);
    }
  });

  it("should allow emitter", async () => {
    const check = await checkEmitterPermission(permission);
    expect(check).toEqual(true);
  });

  it("should allow recipient", async () => {
    const check = await checkRecipientPermission(permission);
    expect(check).toEqual(true);
  });

  it("should allow transporter", async () => {
    const check = await checkTransporterPermission(permission);
    expect(check).toEqual(true);
  });

  it("should allow trader", async () => {
    const check = await checkTraderPermission(permission);
    expect(check).toEqual(true);
  });

  it("should allow ecoOrganisme", async () => {
    const check = await checkEcoOrganismePermission(permission);
    expect(check).toEqual(true);
  });

  it("should allow transporter after temp storage", async () => {
    const check = await checkTransporterAfterTempStoragePermission(permission);
    expect(check).toEqual(true);
  });

  it("should allow destination after temp storage", async () => {
    const check = await checkDestinationAfterTempStoragePermission(permission);
    expect(check).toEqual(true);
  });

  it("should allow multimodal transporter", async () => {
    const check = await checkMultiModalTransporterPermission(permission);
    expect(check).toEqual(true);
  });
});

describe("checkCanSignedByTransporter", () => {
  afterAll(resetDatabase);

  const permission = checkCanSignedByTransporter;

  it("should deny access to random user", async () => {
    expect.assertions(1);
    try {
      await checkRandomUserPermission(permission);
    } catch (err) {
      expect(err.extensions.code).toEqual(ErrorCode.FORBIDDEN);
    }
  });

  it("should allow transporter", async () => {
    const check = await checkTransporterPermission(permission);
    expect(check).toEqual(true);
  });

  it("should allow transporter after temp storage", async () => {
    const check = await checkTransporterAfterTempStoragePermission(permission);
    expect(check).toEqual(true);
  });
});

describe("checkCanMarkAsReceived", () => {
  afterAll(resetDatabase);

  const permission = checkCanMarkAsReceived;

  it("should deny access to random user", async () => {
    expect.assertions(1);
    try {
      await checkRandomUserPermission(permission);
    } catch (err) {
      expect(err.extensions.code).toEqual(ErrorCode.FORBIDDEN);
    }
  });

  it("should allow recipient", async () => {
    const check = await checkRecipientPermission(permission);
    expect(check).toEqual(true);
  });

  it("should allow destination after temp storage", async () => {
    const check = await checkDestinationAfterTempStoragePermission(permission);
    expect(check).toEqual(true);
  });
});

describe("checkCanMarkAsProcessed", () => {
  afterAll(resetDatabase);

  const permission = checkCanMarkAsProcessed;

  it("should deny access to random user", async () => {
    expect.assertions(1);
    try {
      await checkRandomUserPermission(permission);
    } catch (err) {
      expect(err.extensions.code).toEqual(ErrorCode.FORBIDDEN);
    }
  });

  it("should allow recipient", async () => {
    const check = await checkRecipientPermission(permission);
    expect(check).toEqual(true);
  });

  it("should allow destination after temp storage", async () => {
    const check = await checkDestinationAfterTempStoragePermission(permission);
    expect(check).toEqual(true);
  });
});

describe("checkCanMarkAsTempStored", () => {
  afterAll(resetDatabase);

  const permission = checkCanMarkAsTempStored;

  it("should deny access to random user", async () => {
    expect.assertions(1);
    try {
      await checkRandomUserPermission(permission);
    } catch (err) {
      expect(err.extensions.code).toEqual(ErrorCode.FORBIDDEN);
    }
  });

  it("should allow recipient", async () => {
    const check = await checkRecipientPermission(permission);
    expect(check).toEqual(true);
  });
});

describe("checkCanMarkAsResent", () => {
  afterAll(resetDatabase);

  const permission = checkCanMarkAsResent;

  it("should deny access to random user", async () => {
    expect.assertions(1);
    try {
      await checkRandomUserPermission(permission);
    } catch (err) {
      expect(err.extensions.code).toEqual(ErrorCode.FORBIDDEN);
    }
  });

  it("should allow recipient", async () => {
    const check = await checkRecipientPermission(permission);
    expect(check).toEqual(true);
  });
});

describe("checkSecurityCode", () => {
  afterAll(resetDatabase);

  test("securityCode is valid", async () => {
    const company = await companyFactory();
    const check = await checkSecurityCode(company.siret!, company.securityCode);
    expect(check).toEqual(true);
  });

  test("securityCode is valid for foreign transporter", async () => {
    const company = await companyFactory({
      siret: null,
      vatNumber: "BE0541696005"
    });
    const check = await checkSecurityCode(company.orgId, company.securityCode);
    expect(check).toEqual(true);
  });

  test("securityCode is invalid", async () => {
    const company = await companyFactory();
    const checkFn = () => checkSecurityCode(company.siret!, 1258478956);
    expect(checkFn).rejects.toThrow("Le code de signature est invalide.");
  });
});

describe("checkCanRed", () => {
  afterAll(resetDatabase);

  it("should allow initial emitter", async () => {
    const { user: initialEmitter, company: initialEmitterCompany } =
      await userWithCompanyFactory("ADMIN");
    const { user: ttr, company: ttrCompany } = await userWithCompanyFactory(
      "ADMIN"
    );
    const initialForm = await formFactory({
      ownerId: initialEmitter.id,
      opt: {
        emitterCompanySiret: initialEmitterCompany.siret,
        recipientCompanySiret: ttrCompany.siret,
        quantityReceived: 1
      }
    });

    const groupementForm = await formFactory({
      ownerId: ttr.id,
      opt: {
        emitterType: "APPENDIX2",
        emitterCompanySiret: ttrCompany.siret,
        grouping: {
          create: {
            initialFormId: initialForm.id,
            quantity: initialForm.quantityReceived!
          }
        }
      }
    });

    const check = await checkCanRead(initialEmitter, groupementForm);
    expect(check).toBe(true);
  });
});
