import gql from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import type { Mutation } from "@td/codegen-back";
import {
  companyFactory,
  userFactory,
  userInCompany,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import {
  AdminRequestStatus,
  AdminRequestValidationMethod,
  UserRole
} from "@prisma/client";
import { prisma } from "@td/prisma";
import { sendMail } from "../../../../mailer/mailing";
import { cleanse } from "../../../../__tests__/utils";
import { getAdminOnlyEndDate } from "../utils/createAdminRequest.utils";

// No mails
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

const yesterday = (d => new Date(d.setDate(d.getDate() - 1)))(new Date());

const ACCEPT_ADMIN_REQUEST = gql`
  mutation acceptAdminRequest($input: AcceptAdminRequestInput!) {
    acceptAdminRequest(input: $input) {
      id
      company {
        orgId
        name
      }
      status
      createdAt
    }
  }
`;

describe("Mutation acceptAdminRequest", () => {
  afterEach(async () => {
    await resetDatabase();
    jest.resetAllMocks();
  });

  it("user must be logged in", async () => {
    // Given

    // When
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
      ACCEPT_ADMIN_REQUEST,
      {
        variables: {
          input: {
            adminRequestId: "orgId"
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual("Vous n'êtes pas connecté.");
  });

  it("should throw if request does not exist", async () => {
    // Given
    const user = await userFactory();

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
      ACCEPT_ADMIN_REQUEST,
      {
        variables: {
          input: {
            adminRequestId: "clsioob1g000lk6jymb1ma4c2"
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual("Cette demande n'existe pas.");
  });

  it("should throw if user does not belong to company", async () => {
    // Given
    const company = await companyFactory();
    const requestAuthor = await userFactory();
    const user = await userFactory();

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: requestAuthor.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
      ACCEPT_ADMIN_REQUEST,
      {
        variables: {
          input: {
            adminRequestId: adminRequest.id
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "Vous n'êtes pas autorisé à effectuer cette action."
    );
  });

  it("user cannot accept own request", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: user.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
      ACCEPT_ADMIN_REQUEST,
      {
        variables: {
          input: {
            adminRequestId: adminRequest.id
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "Vous n'êtes pas autorisé à effectuer cette action."
    );
  });

  it("should throw if providing all 3 params adminRequestId, orgId & code", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: user.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
      ACCEPT_ADMIN_REQUEST,
      {
        variables: {
          input: {
            adminRequestId: adminRequest.id,
            code: "78994566",
            orgId: company.orgId
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "Vous devez soit fournir l'adminRequestId, soit le tuple orgId / code."
    );
  });

  it("should throw if providing adminRequestId & orgId", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: user.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
      ACCEPT_ADMIN_REQUEST,
      {
        variables: {
          input: {
            adminRequestId: adminRequest.id,
            code: undefined,
            orgId: company.orgId
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "Vous devez soit fournir l'adminRequestId, soit le tuple orgId / code."
    );
  });

  it("should throw if providing adminRequestId & code", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: user.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
      ACCEPT_ADMIN_REQUEST,
      {
        variables: {
          input: {
            adminRequestId: adminRequest.id,
            code: "78994566",
            orgId: undefined
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "Vous devez soit fournir l'adminRequestId, soit le tuple orgId / code."
    );
  });

  it("should throw if providing code but missing orgId", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");

    await prisma.adminRequest.create({
      data: {
        user: { connect: { id: user.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
      ACCEPT_ADMIN_REQUEST,
      {
        variables: {
          input: {
            code: "78994566",
            orgId: undefined // Missing
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "Vous devez soit fournir l'adminRequestId, soit le tuple orgId / code."
    );
  });

  it("should throw if providing orgId but missing code", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");

    await prisma.adminRequest.create({
      data: {
        user: { connect: { id: user.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
      ACCEPT_ADMIN_REQUEST,
      {
        variables: {
          input: {
            code: undefined, // Missing
            orgId: company.orgId
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "Vous devez soit fournir l'adminRequestId, soit le tuple orgId / code."
    );
  });

  it("should throw if request has already been refused", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory();
    const requestAuthor = await userFactory();

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: requestAuthor.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.REFUSED,
        validationMethod: AdminRequestValidationMethod.SEND_MAIL,
        adminOnlyEndDate: yesterday
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
      ACCEPT_ADMIN_REQUEST,
      {
        variables: {
          input: {
            adminRequestId: adminRequest.id
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(`Cette demande a été refusée.`);
  });

  it("should throw if request has already been blocked", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory();
    const requestAuthor = await userFactory();

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: requestAuthor.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.BLOCKED,
        validationMethod: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
      ACCEPT_ADMIN_REQUEST,
      {
        variables: {
          input: {
            adminRequestId: adminRequest.id
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      `Cette demande a été bloquée en raison d'un trop grand nombre de codes erronés saisis.`
    );
  });

  it("should throw if request has expired", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory();
    const requestAuthor = await userFactory();

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: requestAuthor.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.EXPIRED,
        validationMethod: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
      ACCEPT_ADMIN_REQUEST,
      {
        variables: {
          input: {
            adminRequestId: adminRequest.id
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(`Cette demande a expiré.`);
  });

  it("should not throw if request has already been accepted", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const requestAuthor = await userFactory();

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: requestAuthor.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.ACCEPTED,
        validationMethod: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
      ACCEPT_ADMIN_REQUEST,
      {
        variables: {
          input: {
            adminRequestId: adminRequest.id
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(data.acceptAdminRequest.status).toBe(AdminRequestStatus.ACCEPTED);

    const updatedAdminRequest = await prisma.adminRequest.findUniqueOrThrow({
      where: { id: adminRequest.id }
    });

    expect(updatedAdminRequest.status).toBe(AdminRequestStatus.ACCEPTED);
  });

  it("should throw if user is already admin", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory();
    const requestAuthor = await userInCompany(UserRole.ADMIN, company.id);

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: requestAuthor.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
      ACCEPT_ADMIN_REQUEST,
      {
        variables: {
          input: {
            adminRequestId: adminRequest.id
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      `L'utilisateur est déjà administrateur de l'établissement.`
    );
  });

  it("Trackdéchets admins can accept a request (and don't need to provide mail code)", async () => {
    // Given
    const { company } = await userWithCompanyFactory();
    const requestAuthor = await userFactory();
    const tdAdmin = await userFactory({ isAdmin: true });

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: requestAuthor.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.SEND_MAIL,
        adminOnlyEndDate: yesterday
      }
    });

    // When
    const { mutate } = makeClient(tdAdmin);
    const { errors, data } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
      ACCEPT_ADMIN_REQUEST,
      {
        variables: {
          input: {
            adminRequestId: adminRequest.id
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(data.acceptAdminRequest.status).toBe(AdminRequestStatus.ACCEPTED);

    const updatedAdminRequest = await prisma.adminRequest.findUniqueOrThrow({
      where: { id: adminRequest.id }
    });

    expect(updatedAdminRequest.status).toBe(AdminRequestStatus.ACCEPTED);

    // User should now be admin
    const companyAssociation = await prisma.companyAssociation.findFirstOrThrow(
      {
        where: {
          userId: requestAuthor.id,
          companyId: company.id
        }
      }
    );
    expect(companyAssociation?.role).toBe(UserRole.ADMIN);
  });

  it("Trackdéchets admins can accept their own requests", async () => {
    // Given
    const { company } = await userWithCompanyFactory();
    const requestAuthor = await userFactory({ isAdmin: true });

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: requestAuthor.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.SEND_MAIL,
        adminOnlyEndDate: yesterday
      }
    });

    // When
    const { mutate } = makeClient(requestAuthor);
    const { errors, data } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
      ACCEPT_ADMIN_REQUEST,
      {
        variables: {
          input: {
            adminRequestId: adminRequest.id
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(data.acceptAdminRequest.status).toBe(AdminRequestStatus.ACCEPTED);

    const updatedAdminRequest = await prisma.adminRequest.findUniqueOrThrow({
      where: { id: adminRequest.id }
    });

    expect(updatedAdminRequest.status).toBe(AdminRequestStatus.ACCEPTED);

    // User should now be admin
    const companyAssociation = await prisma.companyAssociation.findFirstOrThrow(
      {
        where: {
          userId: requestAuthor.id,
          companyId: company.id
        }
      }
    );
    expect(companyAssociation?.role).toBe(UserRole.ADMIN);
  });

  it("if user does not belong to company, should be added and promoted to admin", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const requestAuthor = await userFactory();

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: requestAuthor.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
      ACCEPT_ADMIN_REQUEST,
      {
        variables: {
          input: {
            adminRequestId: adminRequest.id
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(data.acceptAdminRequest.status).toBe(AdminRequestStatus.ACCEPTED);

    const updatedAdminRequest = await prisma.adminRequest.findUniqueOrThrow({
      where: { id: adminRequest.id }
    });

    expect(updatedAdminRequest.status).toBe(AdminRequestStatus.ACCEPTED);

    // User should now be admin
    const companyAssociation = await prisma.companyAssociation.findFirstOrThrow(
      {
        where: {
          userId: requestAuthor.id,
          companyId: company.id
        }
      }
    );
    expect(companyAssociation?.role).toBe(UserRole.ADMIN);
  });

  it("if user belongs to company, should be promoted to admin", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const requestAuthor = await userInCompany(UserRole.MEMBER, company.id);

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: requestAuthor.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
      ACCEPT_ADMIN_REQUEST,
      {
        variables: {
          input: {
            adminRequestId: adminRequest.id
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(data.acceptAdminRequest.status).toBe(AdminRequestStatus.ACCEPTED);

    const updatedAdminRequest = await prisma.adminRequest.findUniqueOrThrow({
      where: { id: adminRequest.id }
    });

    expect(updatedAdminRequest.status).toBe(AdminRequestStatus.ACCEPTED);

    // User should now be admin
    const companyAssociation = await prisma.companyAssociation.findFirstOrThrow(
      {
        where: {
          userId: requestAuthor.id,
          companyId: company.id
        }
      }
    );
    expect(companyAssociation?.role).toBe(UserRole.ADMIN);
  });

  it("should send mail to admins", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {},
      {
        email: "admin@mail.com",
        name: "Company Admin"
      }
    );
    const requestAuthor = await userFactory({
      email: "author@mail.com",
      name: "Request Author"
    });

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: requestAuthor.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
      }
    });

    // No mails
    const { sendMail } = require("../../../../mailer/mailing");
    jest.mock("../../../../mailer/mailing");
    (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
      ACCEPT_ADMIN_REQUEST,
      {
        variables: {
          input: {
            adminRequestId: adminRequest.id
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(sendMail as jest.Mock).toHaveBeenCalledTimes(2); // Admin + author

    const { to, body, subject } = (sendMail as jest.Mock).mock.calls[0][0];

    expect(to).toMatchObject([
      { email: "admin@mail.com", name: "Company Admin" }
    ]);
    expect(subject).toBe(
      `Mise à jour concernant la demande de droits administrateur`
    );

    const expectedBody = `<p>
  Nous vous informons que la demande de l'utilisateur
  <b>${requestAuthor.name}</b> pour devenir administrateur de l'établissement
  <b>${company.name} - ${company.orgId}</b> a été validée.
</p>

<br />

<p>Pour toute question, vous pouvez contacter l'assistance Trackdéchets.</p>
`;

    expect(cleanse(body)).toBe(cleanse(expectedBody));
  });

  it("should send mail to author", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory();
    const requestAuthor = await userFactory({
      email: "author@mail.com",
      name: "Request Author"
    });

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: requestAuthor.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
      }
    });

    // No mails
    const { sendMail } = require("../../../../mailer/mailing");
    jest.mock("../../../../mailer/mailing");
    (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
      ACCEPT_ADMIN_REQUEST,
      {
        variables: {
          input: {
            adminRequestId: adminRequest.id
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(sendMail as jest.Mock).toHaveBeenCalledTimes(2); // Admin + author

    const { to, body, subject } = (sendMail as jest.Mock).mock.calls[1][0];

    expect(to).toMatchObject([
      { email: "author@mail.com", name: "Request Author" }
    ]);
    expect(subject).toBe(`Demande de droits administrateur acceptée`);

    const expectedBody = `<p>
  Votre demande de droits administrateur pour l'établissement
  <b>${company.name} - ${company.orgId}</b> a été <b>acceptée</b>.
</p>

<br />

<p>
  Vous pouvez dès à présent vous connecter à votre compte Trackdéchets et
  bénéficier de toutes les fonctionnalités de la plateforme en tant
  qu'administrateur (gestion de l'établissement et des utilisateurs, création,
  consultation et suivi des bordereaux, des registres, etc.).
</p>

<br />`;

    expect(cleanse(body)).toBe(cleanse(expectedBody));
  });

  describe("verification method = SEND_MAIL", () => {
    it("should throw if caller is not adminRequest author", async () => {
      // Given
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
      const requestAuthor = await userInCompany(UserRole.MEMBER, company.id);

      await prisma.adminRequest.create({
        data: {
          user: { connect: { id: requestAuthor.id } },
          company: { connect: { id: company.id } },
          status: AdminRequestStatus.PENDING,
          validationMethod: AdminRequestValidationMethod.SEND_MAIL,
          code: "12345678",
          adminOnlyEndDate: yesterday
        }
      });

      // When
      const { mutate } = makeClient(user);
      const { errors } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
        ACCEPT_ADMIN_REQUEST,
        {
          variables: {
            input: {
              orgId: company.orgId,
              code: "12345678"
            }
          }
        }
      );

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe("Cette demande n'existe pas.");
    });

    it("should throw if code is not valid", async () => {
      // Given
      const { company } = await userWithCompanyFactory(UserRole.ADMIN);
      const requestAuthor = await userInCompany(UserRole.MEMBER, company.id);

      const adminRequest = await prisma.adminRequest.create({
        data: {
          user: { connect: { id: requestAuthor.id } },
          company: { connect: { id: company.id } },
          status: AdminRequestStatus.PENDING,
          validationMethod: AdminRequestValidationMethod.SEND_MAIL,
          code: "12345678",
          adminOnlyEndDate: yesterday
        }
      });

      // When
      const { mutate } = makeClient(requestAuthor);
      const { errors } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
        ACCEPT_ADMIN_REQUEST,
        {
          variables: {
            input: {
              orgId: company.orgId,
              code: "12345679"
            }
          }
        }
      );

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Le code de vérification est erroné. Il vous reste 2 tentatives."
      );

      const updatedAdminRequest = await prisma.adminRequest.findUniqueOrThrow({
        where: { id: adminRequest.id }
      });

      expect(updatedAdminRequest.codeAttempts).toBe(1);
    });

    it("should block the request if too many attempts", async () => {
      // Given
      const { company } = await userWithCompanyFactory(UserRole.ADMIN);
      const requestAuthor = await userInCompany(UserRole.MEMBER, company.id);

      const adminRequest = await prisma.adminRequest.create({
        data: {
          user: { connect: { id: requestAuthor.id } },
          company: { connect: { id: company.id } },
          status: AdminRequestStatus.PENDING,
          validationMethod: AdminRequestValidationMethod.SEND_MAIL,
          code: "12345678",
          adminOnlyEndDate: yesterday
        }
      });

      // When
      const { mutate } = makeClient(requestAuthor);
      const sendAcceptation = async () =>
        await mutate<Pick<Mutation, "acceptAdminRequest">>(
          ACCEPT_ADMIN_REQUEST,
          {
            variables: {
              input: {
                orgId: company.orgId,
                code: "12345679"
              }
            }
          }
        );

      await sendAcceptation();
      await sendAcceptation();
      const { errors } = await sendAcceptation();

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Le code de vérification est erroné. La demande a été bloquée."
      );

      const updatedAdminRequest = await prisma.adminRequest.findUniqueOrThrow({
        where: { id: adminRequest.id }
      });

      expect(updatedAdminRequest.codeAttempts).toBe(3);
      expect(updatedAdminRequest.status).toBe(AdminRequestStatus.BLOCKED);
    });

    it("if code is valid, should promote user to admin", async () => {
      // Given
      const { company } = await userWithCompanyFactory();
      const requestAuthor = await userInCompany(UserRole.MEMBER, company.id);

      const adminRequest = await prisma.adminRequest.create({
        data: {
          user: { connect: { id: requestAuthor.id } },
          company: { connect: { id: company.id } },
          status: AdminRequestStatus.PENDING,
          validationMethod: AdminRequestValidationMethod.SEND_MAIL,
          code: "12345678",
          adminOnlyEndDate: yesterday
        }
      });

      // When
      const { mutate } = makeClient(requestAuthor);
      const { errors, data } = await mutate<
        Pick<Mutation, "acceptAdminRequest">
      >(ACCEPT_ADMIN_REQUEST, {
        variables: {
          input: {
            orgId: company.orgId,
            code: "12345678"
          }
        }
      });

      // Then
      expect(errors).toBeUndefined();

      expect(data.acceptAdminRequest.status).toBe(AdminRequestStatus.ACCEPTED);

      const updatedAdminRequest = await prisma.adminRequest.findUniqueOrThrow({
        where: { id: adminRequest.id }
      });

      expect(updatedAdminRequest.status).toBe(AdminRequestStatus.ACCEPTED);

      // User should now be admin
      const companyAssociation =
        await prisma.companyAssociation.findFirstOrThrow({
          where: {
            userId: requestAuthor.id,
            companyId: company.id
          }
        });
      expect(companyAssociation?.role).toBe(UserRole.ADMIN);
    });
  });

  describe("adminOnlyEndDate", () => {
    it("Trackdéchets admins user can accept request during admin only period", async () => {
      // Given
      const { company } = await userWithCompanyFactory();
      const tdAdmin = await userFactory({ isAdmin: true });
      const requestAuthor = await userInCompany(UserRole.MEMBER, company.id);

      const adminRequest = await prisma.adminRequest.create({
        data: {
          user: { connect: { id: requestAuthor.id } },
          company: { connect: { id: company.id } },
          status: AdminRequestStatus.PENDING,
          validationMethod: AdminRequestValidationMethod.SEND_MAIL,
          code: "12345678",
          adminOnlyEndDate: getAdminOnlyEndDate()
        }
      });

      // When
      const { mutate } = makeClient(tdAdmin);
      const { errors, data } = await mutate<
        Pick<Mutation, "acceptAdminRequest">
      >(ACCEPT_ADMIN_REQUEST, {
        variables: {
          input: {
            adminRequestId: adminRequest.id
          }
        }
      });

      // Then
      expect(errors).toBeUndefined();
      expect(data.acceptAdminRequest.status).toBe(AdminRequestStatus.ACCEPTED);
    });

    it("verification method = SEND_MAIL > user cannot enter code during admin only period", async () => {
      // Given
      const { company } = await userWithCompanyFactory();
      const requestAuthor = await userInCompany(UserRole.MEMBER, company.id);

      await prisma.adminRequest.create({
        data: {
          user: { connect: { id: requestAuthor.id } },
          company: { connect: { id: company.id } },
          status: AdminRequestStatus.PENDING,
          validationMethod: AdminRequestValidationMethod.SEND_MAIL,
          code: "12345678",
          adminOnlyEndDate: getAdminOnlyEndDate()
        }
      });

      // When
      const { mutate } = makeClient(requestAuthor);
      const { errors } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
        ACCEPT_ADMIN_REQUEST,
        {
          variables: {
            input: {
              orgId: company.orgId,
              code: "12345678"
            }
          }
        }
      );

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Seuls les administrateurs de l'établissement peuvent approuver la demande à ce stade."
      );
    });

    it("verification method = SEND_MAIL > admin can approve during admin only period", async () => {
      // Given
      const { company, user: admin } = await userWithCompanyFactory(
        UserRole.ADMIN
      );
      const requestAuthor = await userInCompany(UserRole.MEMBER, company.id);

      const adminRequest = await prisma.adminRequest.create({
        data: {
          user: { connect: { id: requestAuthor.id } },
          company: { connect: { id: company.id } },
          status: AdminRequestStatus.PENDING,
          validationMethod: AdminRequestValidationMethod.SEND_MAIL,
          code: "12345678",
          adminOnlyEndDate: getAdminOnlyEndDate()
        }
      });

      // When
      const { mutate } = makeClient(admin);
      const { errors, data } = await mutate<
        Pick<Mutation, "acceptAdminRequest">
      >(ACCEPT_ADMIN_REQUEST, {
        variables: {
          input: {
            adminRequestId: adminRequest.id
          }
        }
      });

      // Then
      expect(errors).toBeUndefined();
      expect(data.acceptAdminRequest.status).toBe(AdminRequestStatus.ACCEPTED);
    });

    it("verification method = SEND_MAIL > user can enter code once admin only period is over", async () => {
      // Given
      const { company } = await userWithCompanyFactory();
      const requestAuthor = await userInCompany(UserRole.MEMBER, company.id);

      await prisma.adminRequest.create({
        data: {
          user: { connect: { id: requestAuthor.id } },
          company: { connect: { id: company.id } },
          status: AdminRequestStatus.PENDING,
          validationMethod: AdminRequestValidationMethod.SEND_MAIL,
          code: "12345678",
          adminOnlyEndDate: yesterday
        }
      });

      // When
      const { mutate } = makeClient(requestAuthor);
      const { errors, data } = await mutate<
        Pick<Mutation, "acceptAdminRequest">
      >(ACCEPT_ADMIN_REQUEST, {
        variables: {
          input: {
            orgId: company.orgId,
            code: "12345678"
          }
        }
      });

      // Then
      expect(errors).toBeUndefined();
      expect(data.acceptAdminRequest.status).toBe(AdminRequestStatus.ACCEPTED);
    });

    it("verification method = REQUEST_COLLABORATOR_APPROVAL > collaborator cannot accept during admin only period", async () => {
      // Given
      const { user: collaborator, company } = await userWithCompanyFactory(
        UserRole.MEMBER
      );
      const requestAuthor = await userInCompany(UserRole.MEMBER, company.id);

      const adminRequest = await prisma.adminRequest.create({
        data: {
          user: { connect: { id: requestAuthor.id } },
          company: { connect: { id: company.id } },
          status: AdminRequestStatus.PENDING,
          validationMethod:
            AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL,
          collaboratorId: collaborator.id,
          adminOnlyEndDate: getAdminOnlyEndDate()
        }
      });

      // When
      const { mutate } = makeClient(collaborator);
      const { errors } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
        ACCEPT_ADMIN_REQUEST,
        {
          variables: {
            input: {
              adminRequestId: adminRequest.id
            }
          }
        }
      );

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Seuls les administrateurs de l'établissement peuvent approuver la demande à ce stade."
      );
    });

    it("verification method = REQUEST_COLLABORATOR_APPROVAL > admins can accept during admin only period", async () => {
      // Given
      const { user: collaborator, company } = await userWithCompanyFactory(
        UserRole.ADMIN
      );
      const requestAuthor = await userInCompany(UserRole.MEMBER, company.id);

      const adminRequest = await prisma.adminRequest.create({
        data: {
          user: { connect: { id: requestAuthor.id } },
          company: { connect: { id: company.id } },
          status: AdminRequestStatus.PENDING,
          validationMethod:
            AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL,
          collaboratorId: collaborator.id,
          adminOnlyEndDate: getAdminOnlyEndDate()
        }
      });

      // When
      const { mutate } = makeClient(collaborator);
      const { errors, data } = await mutate<
        Pick<Mutation, "acceptAdminRequest">
      >(ACCEPT_ADMIN_REQUEST, {
        variables: {
          input: {
            adminRequestId: adminRequest.id
          }
        }
      });

      // Then
      expect(errors).toBeUndefined();
      expect(data.acceptAdminRequest.status).toBe(AdminRequestStatus.ACCEPTED);
    });

    it("verification method = REQUEST_COLLABORATOR_APPROVAL > collaborator can accept once admin only period is over", async () => {
      // Given
      const { user: collaborator, company } = await userWithCompanyFactory(
        UserRole.MEMBER
      );
      const requestAuthor = await userInCompany(UserRole.MEMBER, company.id);

      const adminRequest = await prisma.adminRequest.create({
        data: {
          user: { connect: { id: requestAuthor.id } },
          company: { connect: { id: company.id } },
          status: AdminRequestStatus.PENDING,
          validationMethod:
            AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL,
          collaboratorId: collaborator.id,
          adminOnlyEndDate: yesterday
        }
      });

      // When
      const { mutate } = makeClient(collaborator);
      const { errors, data } = await mutate<
        Pick<Mutation, "acceptAdminRequest">
      >(ACCEPT_ADMIN_REQUEST, {
        variables: {
          input: {
            adminRequestId: adminRequest.id
          }
        }
      });

      // Then
      expect(errors).toBeUndefined();
      expect(data.acceptAdminRequest.status).toBe(AdminRequestStatus.ACCEPTED);
    });
  });

  it("should throw if member is trying to validate but is not designated collaborator", async () => {
    // Given
    const { user: collaborator, company } = await userWithCompanyFactory(
      UserRole.MEMBER
    );
    const member = await userInCompany("MEMBER", company.id);
    const requestAuthor = await userInCompany(UserRole.MEMBER, company.id);

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: requestAuthor.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod:
          AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL,
        collaboratorId: collaborator.id,
        adminOnlyEndDate: yesterday
      }
    });

    // When
    const { mutate } = makeClient(member);
    const { errors } = await mutate<Pick<Mutation, "acceptAdminRequest">>(
      ACCEPT_ADMIN_REQUEST,
      {
        variables: {
          input: {
            adminRequestId: adminRequest.id
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      "Vous n'êtes pas autorisé à effectuer cette action."
    );
  });
});
