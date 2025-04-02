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
import { addDays } from "date-fns";

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
      "Cet établissement n'est pas inscrit sur Trackdéchets."
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
      "Vous êtes déjà administrateur de cet établissement."
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
    expect(errors[0].message).toEqual(
      "Ce collaborateur n'est pas inscrit sur Trackdéchets."
    );
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
      "Ce collaborateur n'est pas rattaché à cet établissement."
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
      "L'ajout d'un courriel d'un collaborateur est requis pour cette méthode de validation."
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

  it("should create an admin request with a VAT number", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory(
      "MEMBER",
      {
        name: "Company name",
        siret: null,
        vatNumber: "ATU25700701"
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

  it("should not allow validationMethod = SEND_MAIL for foreign companies", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory(
      "MEMBER",
      {
        name: "Company name",
        siret: null,
        vatNumber: "ATU25700701"
      },
      {
        name: "User name",
        email: "user@mail.com"
      }
    );

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
      "Le mode de vérification par courrier n'est pas autorisé pour les établissements étrangers."
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
      "Une demande est déjà en cours pour cet établissement."
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
      `Demande de droits administrateur pour l'établissement ${company.name} - ${company.orgId}`
    );

    const expectedBody = `<p>
  Nous vous informons que l'utilisateur <b>${user.name}</b> (courriel: ${user.email}) 
  souhaite obtenir les droits administrateur pour
  l'établissement <b>${company.name} - ${company.orgId}</b>. En tant
  qu'administrateur actuel, nous vous invitons à prendre connaissance de cette
  demande et à <b>l'accepter ou la refuser</b> en cliquant
  <a href="http:&#x2F;&#x2F;trackdechets.local/companies/${company.orgId}/admin-request/${data.createAdminRequest.id}#membres"
    >sur ce lien</a
  >.
</p>

<br />

<p><b>En cas d'absence de réponse</b></p>

<br />

<p>
  Si aucune décision n'est prise de votre part <b>sous un jour ouvré</b>,
  Trackdéchets mettra en place une procédure de vérification alternative visant
  à confirmer la légitimité de la demande.
  <b>Un courrier comprenant un code de vérification</b> sera alors expédié au
  siège social de l'établissement.
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
      `Demande de droits administrateur pour l'établissement ${company.name} - ${company.orgId}`
    );

    const expectedBody = `<p>
  Nous vous informons que l'utilisateur <b>${user.name}</b> (courriel: ${user.email}) 
  souhaite obtenir les droits administrateur pour
  l'établissement <b>${company.name} - ${company.orgId}</b>. En tant
  qu'administrateur actuel, nous vous invitons à prendre connaissance de cette
  demande et à <b>l'accepter ou la refuser</b> en cliquant
  <a href="http:&#x2F;&#x2F;trackdechets.local/companies/${company.orgId}/admin-request/${data.createAdminRequest.id}#membres"
    >sur ce lien</a
  >.
</p>

<br />

<p><b>En cas d'absence de réponse</b></p>

<br />

<p>
  Si aucune décision n'est prise de votre part <b>sous un jour ouvré</b>,
  Trackdéchets mettra en place une procédure de vérification alternative visant
  à confirmer la légitimité de la demande. Nous solliciterons alors un
  <b>collaborateur rattaché à votre établissement</b>, dont le courriel a
  été communiqué par le demandeur. Celui-ci pourra alors valider la demande et
  accorder les droits administrateur.
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
      `Demande de droits administrateur pour l'établissement ${company.name} - ${company.orgId}`
    );

    const expectedBody = `<p>
  Nous vous informons que l'utilisateur <b>${user.name}</b> (courriel: ${user.email}) 
  souhaite obtenir les droits administrateur pour
  l'établissement <b>${company.name} - ${company.orgId}</b>. En tant
  qu'administrateur actuel, nous vous invitons à prendre connaissance de cette
  demande et à <b>l'accepter ou la refuser</b> en cliquant
  <a href="http:&#x2F;&#x2F;trackdechets.local/companies/${company.orgId}/admin-request/${data.createAdminRequest.id}#membres"
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
      `Votre demande de droits administrateur pour l'établissement ${company.name} - ${company.orgId}`
    );

    const expectedBody = `<p>
Nous accusons réception de votre demande pour obtenir les droits administrateur pour 
l'établissement <b>${company.name} - ${company.orgId}</b>. Un courriel vient d'être envoyé aux
administrateurs actuels afin de les informer de votre démarche. Ils pourront <b>accepter ou
refuser</b> votre demande.
</p>

<br />

<p>
Si votre demande est acceptée ou refusée, vous serez informé(e) par courriel.
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
      `Votre demande de droits administrateur pour l'établissement ${company.name} - ${company.orgId}`
    );

    const expectedBody = `<p>
Nous accusons réception de votre demande pour obtenir les droits administrateur pour 
l'établissement <b>${company.name} - ${company.orgId}</b>. Un courriel vient d'être envoyé aux
administrateurs actuels afin de les informer de votre démarche. Ils pourront <b>accepter ou
refuser</b> votre demande.
</p>

<br />

<p>
Si les administrateurs ne répondent pas sous un jour ouvré, <b>le collaborateur</b> que vous avez renseigné 
sera sollicité à son tour pour <b>valider ou refuser</b> la demande. 
</p>

<br />

<p>
Si votre demande est acceptée ou refusée, vous serez informé(e) par courriel.
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
      `Votre demande de droits administrateur pour l'établissement ${company.name} - ${company.orgId}`
    );

    const expectedBody = `<p>
Nous accusons réception de votre demande pour obtenir les droits administrateur pour 
l'établissement <b>${company.name} - ${company.orgId}</b>. Un courriel vient d'être envoyé aux
administrateurs actuels afin de les informer de votre démarche. Ils pourront <b>accepter ou
refuser</b> votre demande.
</p>

<br />

<p>
Un <b>courrier contenant un code de vérification</b> a été envoyé au siège social de l'établissement concerné. 
</p>

<br />

<p>
Si aucune réponse n'est donnée de la part des administrateurs avant réception du courrier, vous pourrez alors 
finaliser votre demande grâce au code de vérification, que vous pourrez renseigner dans 
l'onglet <b>Mes établissements > Gestion avancée > Saisir un code reçu par courrier</b >. 
</p>

<p>
Si votre demande est acceptée ou refusée, vous serez informé(e) par courriel.
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

  it("if too many SEND_MAIL requests, block & throw", async () => {
    // Given
    const OLD_ENV = process.env;
    process.env.MAX_ADMIN_REQUESTS_MAILS_PER_WEEK = "1";

    const { user: user1, company } = await userWithCompanyFactory(
      "MEMBER",
      {
        name: "Company name"
      },
      {
        name: "User name",
        email: "user@mail.com"
      }
    );
    const user2 = await userFactory();

    // Already 1 request in the DB
    await prisma.adminRequest.create({
      data: {
        user: { connect: { id: user1.id } },
        company: { connect: { id: company.id } },
        validationMethod: AdminRequestValidationMethod.SEND_MAIL,
        code: "12345678",
        adminOnlyEndDate: new Date()
      }
    });

    // When
    const { mutate } = makeClient(user2);
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
      "La vérification par courrier a été temporairement désactivée. Veuillez choisir une autre méthode de vérification ou contacter le support."
    );

    // Finally
    process.env = OLD_ENV;
  });

  it("user has a recently REFUSED request for same company > should throw", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");

    // Already 1 request in the DB
    await prisma.adminRequest.create({
      data: {
        user: { connect: { id: user.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.REFUSED,
        validationMethod: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL,
        createdAt: addDays(new Date(), -7),
        updatedAt: addDays(new Date(), -6)
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
            validationMethod:
              AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      "Une demande a déjà été refusée pour cet établissement au cours des 7 derniers jours."
    );
  });

  it("should throw if user already has lots of pending requests", async () => {
    // Given
    const { user, company: company1 } = await userWithCompanyFactory("MEMBER");
    const company2 = await companyFactory();
    const company3 = await companyFactory();
    const company4 = await companyFactory();
    const company5 = await companyFactory();
    const company6 = await companyFactory();

    const createRequest = async companyId => {
      await prisma.adminRequest.create({
        data: {
          user: { connect: { id: user.id } },
          company: { connect: { id: companyId } },
          status: AdminRequestStatus.PENDING,
          validationMethod: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
        }
      });
    };

    await createRequest(company1.id);
    await createRequest(company2.id);
    await createRequest(company3.id);
    await createRequest(company4.id);
    await createRequest(company5.id);

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company6.orgId,
            validationMethod:
              AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      "Il n'est pas possible d'avoir plus de 5 demandes en cours."
    );
  });

  it("should throw if user is picking himself for the collaborator", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory(
      "MEMBER",
      {},
      {
        email: "author@mail.com"
      }
    );

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
            collaboratorEmail: user.email
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      "Vous ne pouvez pas vous désigner vous-même en temps que collaborateur."
    );
  });
});
