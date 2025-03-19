import gql from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import type { Mutation } from "@td/codegen-back";
import {
  companyFactory,
  siretify,
  userFactory,
  userInCompany,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import {
  AdminRequestStatus,
  AdminRequestValidationMethod
} from "@prisma/client";
import { prisma } from "@td/prisma";
import { sendMail } from "../../../../mailer/mailing";
import { cleanse } from "../../../../__tests__/utils";
import { sendAdminRequestVerificationCodeLetter } from "../../../../common/post";
import { getAdminOnlyEndDate } from "../utils/createAdminRequest.utils";

// Mock mail sending service
jest.mock("../../../../common/post");

// No mails
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

const CREATE_ADMIN_REQUEST = gql`
  mutation createAdminRequest($input: CreateAdminRequestInput!) {
    createAdminRequest(input: $input) {
      id
      user {
        name
      }
      company {
        orgId
        name
      }
      status
      createdAt
    }
  }
`;

describe("Mutation createAdminRequest", () => {
  afterEach(async () => {
    await resetDatabase();
    jest.resetAllMocks();
  });

  it("user must be logged in", async () => {
    // Given

    // When
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: "orgId"
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual("Vous n'êtes pas connecté.");
  });

  it("should throw error if target company does not exist", async () => {
    // Given
    const user = await userFactory();

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: siretify(1),
            validationMethod:
              AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "L'entreprise ciblée n'existe pas dans Trackdéchets."
    );
  });

  it("should throw error if user is already ADMIN of target company", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN");

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod:
              AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "Vous êtes déjà administrateur de cette entreprise."
    );
  });

  it("should throw error if collaborator email does not exist", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod:
              AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL,
            collaboratorEmail: "non.existing@mail.com"
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual("Le collaborateur ciblé n'existe pas.");
  });

  it("should throw error if collaborator does not belong to target company", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const collaborator = await userFactory({ email: "collaborator@mail.com" });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod:
              AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL,
            collaboratorEmail: collaborator.email
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "Le collaborateur ne fait pas partie de l'entreprise ciblée."
    );
  });

  it("should throw if requesting validation by collaborator email but providing no collaborator email", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod:
              AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "L'adresse email d'un collaborateur est requise pour cette méthode de validation."
    );
  });

  it("should create an admin request", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory(
      "MEMBER",
      {
        name: "Company name"
      },
      {
        name: "User name",
        email: "user@mail.com"
      }
    );
    const collaborator = await userInCompany("MEMBER", company.id, {
      email: "collaborator@mail.com"
    });

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod:
              AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL,
            collaboratorEmail: collaborator.email
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(data.createAdminRequest.user.name).toBe(user.name);
    expect(data.createAdminRequest.company.name).toBe(company.name);
    expect(data.createAdminRequest.company.orgId).toBe(company.orgId);
    expect(data.createAdminRequest.status).toBe(AdminRequestStatus.PENDING);

    const companyAdminRequest = await prisma.adminRequest.findFirstOrThrow({
      where: {
        id: data.createAdminRequest.id
      }
    });

    expect(companyAdminRequest.userId).toEqual(user.id);
    expect(companyAdminRequest.companyId).toEqual(company.id);
    expect(companyAdminRequest.collaboratorId).toEqual(collaborator.id);
    expect(companyAdminRequest.status).toEqual(AdminRequestStatus.PENDING);
    expect(companyAdminRequest.validationMethod).toEqual(
      AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL
    );
  });

  it("should throw if there is already a pending request for this company", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");
    await prisma.adminRequest.create({
      data: {
        userId: user.id,
        status: AdminRequestStatus.PENDING,
        companyId: company.id,
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod: AdminRequestValidationMethod.SEND_MAIL
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      "Une demande est déjà en attente pour cette entreprise."
    );
  });

  it("should allow creating admin requests for different companies", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const company2 = await companyFactory();
    await prisma.adminRequest.create({
      data: {
        userId: user.id,
        status: AdminRequestStatus.PENDING,
        companyId: company.id,
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company2.orgId,
            validationMethod: AdminRequestValidationMethod.SEND_MAIL
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();
  });

  it("API should return expected fields", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const collaborator = await userInCompany("MEMBER", company.id, {
      email: "collaborator@mail.com"
    });

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod:
              AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL,
            collaboratorEmail: collaborator.email
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();
    expect(data.createAdminRequest.id).not.toBeUndefined();
    expect(data.createAdminRequest.createdAt).not.toBeUndefined();
    expect(data.createAdminRequest.company.orgId).toBe(company.orgId);
    expect(data.createAdminRequest.company.name).toBe(company.name);
    expect(data.createAdminRequest.status).toBe(AdminRequestStatus.PENDING);
  });

  it("should send mail to warn admins - verification = SEND_MAIL", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      name: "Super company"
    });
    await userInCompany("ADMIN", company.id, {
      email: "admin@mail.com",
      name: "Company admin"
    });

    // No mails
    const { sendMail } = require("../../../../mailer/mailing");
    jest.mock("../../../../mailer/mailing");
    (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod: AdminRequestValidationMethod.SEND_MAIL
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(sendMail as jest.Mock).toHaveBeenCalledTimes(2); // Admin + author

    const { to, body, subject } = (sendMail as jest.Mock).mock.calls[0][0];

    expect(to).toMatchObject([
      { email: "admin@mail.com", name: "Company admin" }
    ]);
    expect(subject).toBe(
      `Demande d’accès administrateur pour l’établissement ${company.name} - ${company.orgId}`
    );

    const expectedBody = `<p>
  Nous vous informons qu’un utilisateur <b>${user.name}</b> (email: ${user.email}) 
  souhaite obtenir les droits d’administrateur pour
  l’établissement <b>${company.name} - ${company.orgId}</b>. En tant
  qu’administrateur actuel, nous vous invitons à prendre connaissance de cette
  demande et à <b>l’accepter ou la refuser</b> en cliquant
  <a href="http:&#x2F;&#x2F;trackdechets.local/companies/manage/admin-request/${data.createAdminRequest.id}"
    >sur ce lien</a
  >.
</p>

<br />

<p><b>En cas d'absence de réponse</b></p>

<br />

<p>
  Si aucune décision n’est prise de votre part <b>sous 24 heures</b>,
  Trackdéchets mettra en place une procédure de vérification alternative visant
  à confirmer la légitimité de la demande.
  <b>Un courrier comprenant un code de vérification</b> sera alors expédié au
  siège social de l’établissement.
</p>

<br />

<p>
  Ce code pourra alors être renseigné sur le compte Trackdéchets du demandeur,
  ce qui lui permettra de devenir administrateur de cet établissement.
</p>

<p>
  Nous restons à votre disposition pour toute information complémentaire et vous
  remercions de votre coopération.
</p>
`;

    expect(cleanse(body)).toBe(cleanse(expectedBody));
  });

  it("should send mail to warn admins - verification = REQUEST_COLLABORATOR_APPROVAL", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      name: "Super company"
    });
    await userInCompany("ADMIN", company.id, {
      email: "admin@mail.com",
      name: "Company admin"
    });
    const collaborator = await userInCompany("MEMBER", company.id, {
      email: "collaborator@mail.com",
      name: "Company collaborator"
    });
    // No mails
    const { sendMail } = require("../../../../mailer/mailing");
    jest.mock("../../../../mailer/mailing");
    (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod:
              AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL,
            collaboratorEmail: collaborator.email
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(sendMail as jest.Mock).toHaveBeenCalledTimes(2); // Admin + author

    const { to, body, subject } = (sendMail as jest.Mock).mock.calls[0][0];

    expect(to).toMatchObject([
      { email: "admin@mail.com", name: "Company admin" }
    ]);
    expect(subject).toBe(
      `Demande d’accès administrateur pour l’établissement ${company.name} - ${company.orgId}`
    );

    const expectedBody = `<p>
  Nous vous informons qu’un utilisateur <b>${user.name}</b> (email: ${user.email}) 
  souhaite obtenir les droits d’administrateur pour
  l’établissement <b>${company.name} - ${company.orgId}</b>. En tant
  qu’administrateur actuel, nous vous invitons à prendre connaissance de cette
  demande et à <b>l’accepter ou la refuser</b> en cliquant
  <a href="http:&#x2F;&#x2F;trackdechets.local/companies/manage/admin-request/${data.createAdminRequest.id}"
    >sur ce lien</a
  >.
</p>

<br />

<p><b>En cas d'absence de réponse</b></p>

<br />

<p>
  Si aucune décision n’est prise de votre part <b>sous 24 heures</b>,
  Trackdéchets mettra en place une procédure de vérification alternative visant
  à confirmer la légitimité de la demande. Nous solliciterons alors un
  <b>collaborateur rattaché à votre établissement</b>, dont l’adresse e-mail a
  été communiquée par le demandeur. Celui-ci pourra alors valider la demande et
  permettre l’octroi des droits d’administrateur.
</p>

<p>
  Nous restons à votre disposition pour toute information complémentaire et vous
  remercions de votre coopération.
</p>
`;

    expect(cleanse(body)).toBe(cleanse(expectedBody));
  });

  it("should send mail to warn admins - verification = REQUEST_ADMIN_APPROVAL", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      name: "Super company"
    });
    await userInCompany("ADMIN", company.id, {
      email: "admin@mail.com",
      name: "Company admin"
    });

    // No mails
    const { sendMail } = require("../../../../mailer/mailing");
    jest.mock("../../../../mailer/mailing");
    (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod:
              AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(sendMail as jest.Mock).toHaveBeenCalledTimes(2); // Admin + author

    const { to, body, subject } = (sendMail as jest.Mock).mock.calls[0][0];

    expect(to).toMatchObject([
      { email: "admin@mail.com", name: "Company admin" }
    ]);
    expect(subject).toBe(
      `Demande d’accès administrateur pour l’établissement ${company.name} - ${company.orgId}`
    );

    const expectedBody = `<p>
  Nous vous informons qu’un utilisateur <b>${user.name}</b> (email: ${user.email}) 
  souhaite obtenir les droits d’administrateur pour
  l’établissement <b>${company.name} - ${company.orgId}</b>. En tant
  qu’administrateur actuel, nous vous invitons à prendre connaissance de cette
  demande et à <b>l’accepter ou la refuser</b> en cliquant
  <a href="http:&#x2F;&#x2F;trackdechets.local/companies/manage/admin-request/${data.createAdminRequest.id}"
    >sur ce lien</a
  >.
</p>

<br />

<p>
  Nous restons à votre disposition pour toute information complémentaire et vous
  remercions de votre coopération.
</p>
`;

    expect(cleanse(body)).toBe(cleanse(expectedBody));
  });

  it("should send confirmation mail to author - verification = REQUEST_ADMIN_APPROVAL", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory(
      "MEMBER",
      {
        name: "Super company"
      },
      {
        name: "User name",
        email: "user@mail.com"
      }
    );
    await userInCompany("ADMIN", company.id);

    // No mails
    const { sendMail } = require("../../../../mailer/mailing");
    jest.mock("../../../../mailer/mailing");
    (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod:
              AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(sendMail as jest.Mock).toHaveBeenCalledTimes(2); // Admin + author

    const { to, body, subject } = (sendMail as jest.Mock).mock.calls[1][0];

    expect(to).toMatchObject([{ email: "user@mail.com", name: "User name" }]);
    expect(subject).toBe(
      `Votre demande d’accès administrateur pour l’établissement ${company.name} - ${company.orgId}`
    );

    const expectedBody = `<p>
Nous accusons réception de votre demande pour obtenir les droits d’administrateur de 
l’établissement <b>${company.name} - ${company.orgId}</b>. Un email vient d’être envoyé aux
administrateurs actuels afin pour les informer de votre démarche. Ils pourront <b>accepter ou
refuser</b> votre demande.
</p>

<br />

<p>
Si votre demande est acceptée ou refusée, vous serez informé(e) par email.
</p>
`;

    expect(cleanse(body)).toBe(cleanse(expectedBody));
  });

  it("should send confirmation mail to author - verification = REQUEST_COLLABORATOR_APPROVAL", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory(
      "MEMBER",
      {
        name: "Super company"
      },
      {
        name: "User name",
        email: "user@mail.com"
      }
    );
    await userInCompany("ADMIN", company.id);
    const collaborator = await userInCompany("MEMBER", company.id);

    // No mails
    const { sendMail } = require("../../../../mailer/mailing");
    jest.mock("../../../../mailer/mailing");
    (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod:
              AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL,
            collaboratorEmail: collaborator.email
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(sendMail as jest.Mock).toHaveBeenCalledTimes(2); // Admin + author

    const { to, body, subject } = (sendMail as jest.Mock).mock.calls[1][0];

    expect(to).toMatchObject([{ email: "user@mail.com", name: "User name" }]);
    expect(subject).toBe(
      `Votre demande d’accès administrateur pour l’établissement ${company.name} - ${company.orgId}`
    );

    const expectedBody = `<p>
Nous accusons réception de votre demande pour obtenir les droits d’administrateur de 
l’établissement <b>${company.name} - ${company.orgId}</b>. Un email vient d’être envoyé aux
administrateurs actuels afin pour les informer de votre démarche. Ils pourront <b>accepter ou
refuser</b> votre demande.
</p>

<br />

<p>
Si les administrateurs ne répondent pas sous 24 heures, <b>le collaborateur</b> que vous avez renseigné 
sera sollicité à son tour pour <b>valider ou refuser</b> la demande. 
</p>

<br />

<p>
Si votre demande est acceptée ou refusée, vous serez informé(e) par email.
</p>
`;

    expect(cleanse(body)).toBe(cleanse(expectedBody));
  });

  it("should send confirmation mail to author - verification = SEND_MAIL", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory(
      "MEMBER",
      {
        name: "Super company"
      },
      {
        name: "User name",
        email: "user@mail.com"
      }
    );
    await userInCompany("ADMIN", company.id);

    // No mails
    const { sendMail } = require("../../../../mailer/mailing");
    jest.mock("../../../../mailer/mailing");
    (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod: AdminRequestValidationMethod.SEND_MAIL
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(sendMail as jest.Mock).toHaveBeenCalledTimes(2); // Admin + author

    const { to, body, subject } = (sendMail as jest.Mock).mock.calls[1][0];

    expect(to).toMatchObject([{ email: "user@mail.com", name: "User name" }]);
    expect(subject).toBe(
      `Votre demande d’accès administrateur pour l’établissement ${company.name} - ${company.orgId}`
    );

    const expectedBody = `<p>
Nous accusons réception de votre demande pour obtenir les droits d’administrateur de 
l’établissement <b>${company.name} - ${company.orgId}</b>. Un email vient d’être envoyé aux
administrateurs actuels afin pour les informer de votre démarche. Ils pourront <b>accepter ou
refuser</b> votre demande.
</p>

<br />

<p>
Un <b>courrier contenant un code de vérification</b> a été envoyé au siège social de l’établissement concerné. 
</p>

<br />

<p>
Si aucune réponse n’est donnée de la part des administrateurs avant réception du courrier, vous pourrez alors 
finaliser votre demande grâce au code de vérification, que vous pourrez renseigner dans 
l'onglet <b>Mes établissements > Gestion avancée > Saisir un code reçu par courrier</b >. 
</p>

<p>
Si votre demande est acceptée ou refusée, vous serez informé(e) par email.
</p>
`;

    expect(cleanse(body)).toBe(cleanse(expectedBody));
  });

  it("should generate a mail code if validationMethod is SEND_MAIL", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory(
      "MEMBER",
      {
        name: "Company name"
      },
      {
        name: "User name",
        email: "user@mail.com"
      }
    );

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod: AdminRequestValidationMethod.SEND_MAIL
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const companyAdminRequest = await prisma.adminRequest.findFirstOrThrow({
      where: {
        id: data.createAdminRequest.id
      }
    });

    expect(companyAdminRequest.userId).toEqual(user.id);
    expect(companyAdminRequest.companyId).toEqual(company.id);
    expect(companyAdminRequest.status).toEqual(AdminRequestStatus.PENDING);
    expect(companyAdminRequest.validationMethod).toEqual(
      AdminRequestValidationMethod.SEND_MAIL
    );
    expect(companyAdminRequest.code).not.toBeNull();
    expect(companyAdminRequest.code?.length).toEqual(8);
  });

  it("should send verification code by mail", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory(
      "MEMBER",
      {
        name: "Company name"
      },
      {
        name: "User name",
        email: "user@mail.com"
      }
    );

    jest.mock("../../../../common/post");
    (sendAdminRequestVerificationCodeLetter as jest.Mock).mockImplementation(
      () => Promise.resolve()
    );

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod: AdminRequestValidationMethod.SEND_MAIL
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const companyAdminRequest = await prisma.adminRequest.findFirstOrThrow({
      where: {
        id: data.createAdminRequest.id
      }
    });

    expect(
      sendAdminRequestVerificationCodeLetter as jest.Mock
    ).toHaveBeenCalledTimes(1);

    const [letterCompany, letterUser, letterCode] = (
      sendAdminRequestVerificationCodeLetter as jest.Mock
    ).mock.calls[0];

    expect(letterCompany.orgId).toEqual(company.orgId);
    expect(letterUser.name).toEqual(user.name);
    expect(letterCode).toEqual(companyAdminRequest.code);
  });

  it("validation method = SEND_MAIL > should add adminOnlyEndDate", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory(
      "MEMBER",
      {
        name: "Company name"
      },
      {
        name: "User name",
        email: "user@mail.com"
      }
    );

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod: AdminRequestValidationMethod.SEND_MAIL
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const companyAdminRequest = await prisma.adminRequest.findFirstOrThrow({
      where: {
        id: data.createAdminRequest.id
      }
    });

    expect(companyAdminRequest.adminOnlyEndDate).not.toBeNull();
    expect(companyAdminRequest.adminOnlyEndDate?.toString()).toBe(
      getAdminOnlyEndDate().toString()
    );
  });

  it("validation method = REQUEST_COLLABORATOR_APPROVAL > should add adminOnlyEndDate", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory(
      "MEMBER",
      {
        name: "Company name"
      },
      {
        name: "User name",
        email: "user@mail.com"
      }
    );
    await userInCompany("MEMBER", company.id, {
      email: "collaborator@mail.com"
    });

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod:
              AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL,
            collaboratorEmail: "collaborator@mail.com"
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const companyAdminRequest = await prisma.adminRequest.findFirstOrThrow({
      where: {
        id: data.createAdminRequest.id
      }
    });

    expect(companyAdminRequest.adminOnlyEndDate).not.toBeNull();
    expect(companyAdminRequest.adminOnlyEndDate?.toString()).toBe(
      getAdminOnlyEndDate().toString()
    );
  });

  it("validation method = REQUEST_ADMIN_APPROVAL > should *not* add adminOnlyEndDate", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory(
      "MEMBER",
      {
        name: "Company name"
      },
      {
        name: "User name",
        email: "user@mail.com"
      }
    );

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod:
              AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const companyAdminRequest = await prisma.adminRequest.findFirstOrThrow({
      where: {
        id: data.createAdminRequest.id
      }
    });

    expect(companyAdminRequest.adminOnlyEndDate).toBeNull();
  });
});
