import gql from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import type { Mutation } from "@td/codegen-back";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import {
  AdminRequestStatus,
  AdminRequestValidationMethod
} from "@prisma/client";
import { prisma } from "@td/prisma";
import { sendMail } from "../../../../mailer/mailing";
import { cleanse } from "../../../../__tests__/utils";

// No mails
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

const REFUSE_ADMIN_REQUEST = gql`
  mutation refuseAdminRequest($adminRequestId: ID!) {
    refuseAdminRequest(adminRequestId: $adminRequestId) {
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

describe("Mutation refuseAdminRequest", () => {
  afterEach(async () => {
    await resetDatabase();
    jest.resetAllMocks();
  });

  it("user must be logged in", async () => {
    // Given

    // When
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "refuseAdminRequest">>(
      REFUSE_ADMIN_REQUEST,
      {
        variables: {
          adminRequestId: "someId"
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
    const { errors } = await mutate<Pick<Mutation, "refuseAdminRequest">>(
      REFUSE_ADMIN_REQUEST,
      {
        variables: {
          adminRequestId: "clsioob1g000lk6jymb1ma4c2"
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
    const { errors } = await mutate<Pick<Mutation, "refuseAdminRequest">>(
      REFUSE_ADMIN_REQUEST,
      {
        variables: {
          adminRequestId: adminRequest.id
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "Vous n'êtes pas autorisé à effectuer cette action."
    );
  });

  it("should throw if request has already been accepted", async () => {
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
    const { errors } = await mutate<Pick<Mutation, "refuseAdminRequest">>(
      REFUSE_ADMIN_REQUEST,
      {
        variables: {
          adminRequestId: adminRequest.id
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      `La demande a déjà été acceptée et n'est plus modifiable.`
    );
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
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "refuseAdminRequest">>(
      REFUSE_ADMIN_REQUEST,
      {
        variables: {
          adminRequestId: adminRequest.id
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      `La demande a déjà été bloquée et n'est plus modifiable.`
    );
  });

  it("should refuse pending request", async () => {
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
    const { errors, data } = await mutate<Pick<Mutation, "refuseAdminRequest">>(
      REFUSE_ADMIN_REQUEST,
      {
        variables: {
          adminRequestId: adminRequest.id
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(data.refuseAdminRequest.status).toBe(AdminRequestStatus.REFUSED);

    const updatedAdminRequest = await prisma.adminRequest.findUniqueOrThrow({
      where: { id: adminRequest.id }
    });

    expect(updatedAdminRequest.status).toBe(AdminRequestStatus.REFUSED);
  });

  it("Trackdéchets admin can refuse a pending request", async () => {
    // Given
    const { company } = await userWithCompanyFactory();
    const requestAuthor = await userFactory();
    const tdAdmin = await userFactory({ isAdmin: true });

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: requestAuthor.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
      }
    });

    // When
    const { mutate } = makeClient(tdAdmin);
    const { errors, data } = await mutate<Pick<Mutation, "refuseAdminRequest">>(
      REFUSE_ADMIN_REQUEST,
      {
        variables: {
          adminRequestId: adminRequest.id
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(data.refuseAdminRequest.status).toBe(AdminRequestStatus.REFUSED);

    const updatedAdminRequest = await prisma.adminRequest.findUniqueOrThrow({
      where: { id: adminRequest.id }
    });

    expect(updatedAdminRequest.status).toBe(AdminRequestStatus.REFUSED);
  });

  it("should not throw if request has already been refused", async () => {
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
    const { errors, data } = await mutate<Pick<Mutation, "refuseAdminRequest">>(
      REFUSE_ADMIN_REQUEST,
      {
        variables: {
          adminRequestId: adminRequest.id
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(data.refuseAdminRequest.status).toBe(AdminRequestStatus.REFUSED);

    const updatedAdminRequest = await prisma.adminRequest.findUniqueOrThrow({
      where: { id: adminRequest.id }
    });

    expect(updatedAdminRequest.status).toBe(AdminRequestStatus.REFUSED);
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
    const { errors } = await mutate<Pick<Mutation, "refuseAdminRequest">>(
      REFUSE_ADMIN_REQUEST,
      {
        variables: {
          adminRequestId: adminRequest.id
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
  <b>${company.name} - ${company.orgId}</b> a été refusée.
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
    const { errors } = await mutate<Pick<Mutation, "refuseAdminRequest">>(
      REFUSE_ADMIN_REQUEST,
      {
        variables: {
          adminRequestId: adminRequest.id
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
    expect(subject).toBe(`Demande d’accès administrateur refusée`);

    const expectedBody = `<p>
Votre demande pour rejoindre l’établissement <b>${company.name} - ${company.orgId}</b>
en tant qu’administrateur a été <b>refusée</b>.
</p>

<br />

<p>
Conformément à nos règles, vous ne pourrez pas effectuer de nouvelle demande pour accéder 
à ces droits avant <b>1 semaine</b>. Passé ce délai, vous pourrez renouveler votre demande si 
vous le jugez nécessaire.
</p>

<br />

<p>Pour toute question, vous pouvez contacter l'assistance  Trackdéchets.</p>
  `;

    expect(cleanse(body)).toBe(cleanse(expectedBody));
  });
});
