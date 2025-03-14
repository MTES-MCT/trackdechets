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

// No mails
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

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
    expect(errors[0].message).toEqual("La demande n'existe pas.");
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
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
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
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
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

  it("should throw if request has already been refused", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory();
    const requestAuthor = await userFactory();

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: requestAuthor.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.REFUSED,
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
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
      `La demande a déjà été refusée et n'est plus modifiable.`
    );
  });

  it("should not throw if request has already been accepted", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory();
    const requestAuthor = await userFactory();

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: requestAuthor.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.ACCEPTED,
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
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
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
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
      `L'utilisateur est déjà administrateur de l'entreprise.`
    );
  });

  it("if user does not belong to company, should be added and promoted to admin", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory();
    const requestAuthor = await userFactory();

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: requestAuthor.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
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
    const { user, company } = await userWithCompanyFactory();
    const requestAuthor = await userInCompany(UserRole.MEMBER, company.id);

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: requestAuthor.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
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
      "ADMIN",
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
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
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
      `Mise à jour concernant la demande d’accès administrateur`
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
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
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
    expect(subject).toBe(`Demande d’accès administrateur acceptée`);

    const expectedBody = `<p>
  Votre demande pour rejoindre l’établissement
  <b>${company.name} - ${company.orgId}</b> en tant qu’administrateur a
  été <b>acceptée</b>.
</p>

<br />

<p>
  Vous pouvez dès à présent vous connecter à votre compte Trackdéchets et
  bénéficier de toutes les fonctionnalités de la plateforme en tant
  qu’administrateur (gestion de l'établissement et des utilisateurs, création,
  consultation et suivi des documents, etc.).
</p>

<br />

<p>En cas de question, n’hésitez pas à contacter l'assistance Trackdéchets.</p>
    `;

    expect(cleanse(body)).toBe(cleanse(expectedBody));
  });
});
