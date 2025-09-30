import { BsddTransporter, Form, Prisma } from "@td/prisma";
import {
  onSignup,
  inviteUserToJoin,
  notifyUserOfInvite,
  createPasswordResetRequest,
  formNotAccepted,
  formPartiallyRefused,
  membershipRequestConfirmation,
  membershipRequest,
  membershipRequestAccepted,
  membershipRequestRefused,
  verificationProcessInfo,
  verificationDone,
  yourCompanyIsIdentifiedOnABsd
} from "..";
import { toFrFormat } from "../../helpers";
import { renderMail } from "../renderers";
import "@td/env";

const to = [{ name: "John Snow", email: "john.snow@trackdechets.fr" }];

describe("templates", () => {
  test("onSignup", () => {
    const activationHash = "abcd/";
    const rendered = renderMail(onSignup, {
      variables: { activationHash: "abcd/" },
      to
    });
    expect(rendered.body).toContain(activationHash);
  });

  test("yourCompanyIsIdentifiedOnABsd", () => {
    const emitter = { siret: "000000000000001", name: "ACME" };
    const destination = { siret: "000000000000002", name: "ACME 2" };
    const rendered = renderMail(yourCompanyIsIdentifiedOnABsd, {
      variables: { emitter, destination },
      to
    });
    expect(rendered.body).toContain(emitter.siret);
    expect(rendered.body).toContain(emitter.name);
    expect(rendered.body).toContain(destination.siret);
    expect(rendered.body).toContain(destination.name);
  });

  test("inviteUserToJoin", () => {
    const hash = "abcd";
    const companyName = "ACME";
    const companyOrgId = "12345";
    const rendered = renderMail(inviteUserToJoin, {
      variables: { hash, companyName, companyOrgId },
      to
    });
    expect(rendered.body).toContain(hash);
    expect(rendered.body).toContain(companyName);
    expect(rendered.body).toContain(companyOrgId);
  });

  test("notifyUserOfInvite", () => {
    const companyName = "ACME";
    const companyOrgId = "12345";
    const rendered = renderMail(notifyUserOfInvite, {
      variables: { companyName, companyOrgId },
      to
    });
    expect(rendered.body).toContain(companyName);
    expect(rendered.body).toContain(companyOrgId);
  });

  test("createPasswordResetRequest", () => {
    const resetHash = "secret";
    const rendered = renderMail(createPasswordResetRequest, {
      variables: { resetHash },
      to
    });
    expect(rendered.body).toContain(resetHash);
  });

  test("formNotAccepted", () => {
    const form: Partial<Form & BsddTransporter> = {
      recipientCompanyName: "Recipient",
      signedAt: new Date("2021-01-02"),
      emitterCompanyName: "Emitter",
      emitterCompanyAddress: "1 rue du déchet",
      readableId: "BSDD-XXX",
      wasteDetailsName: "waste",
      wasteDetailsCode: "01 01 01*",
      wasteDetailsQuantity: new Prisma.Decimal(1),
      wasteRefusalReason: "parce que",
      transporterIsExemptedOfReceipt: false,
      transporterCompanyName: "Transporteur",
      sentBy: "Someone"
    };

    const rendered = renderMail(formNotAccepted, {
      variables: { form },
      to
    });
    expect(rendered.body).toContain(form.recipientCompanyName);
    expect(rendered.body).toContain(toFrFormat(form.signedAt!));
    expect(rendered.body).toContain(form.emitterCompanyName);
    expect(rendered.body).toContain(form.emitterCompanyAddress);
    expect(rendered.body).toContain(form.readableId);
    expect(rendered.body).toContain(form.wasteDetailsName);
    expect(rendered.body).toContain(form.wasteDetailsCode);
    expect(rendered.body).toContain(form.wasteDetailsQuantity!.toString());
    expect(rendered.body).toContain(form.wasteRefusalReason);
    expect(rendered.body).toContain(form.transporterCompanyName);
    expect(rendered.body).toContain(form.sentBy);
  });

  test("formNotAccepted with exemption of receipt", () => {
    const form: Partial<Form & BsddTransporter> = {
      recipientCompanyName: "Recipient",
      signedAt: new Date("2021-01-02"),
      emitterCompanyName: "Emitter",
      emitterCompanyAddress: "1 rue du déchet",
      readableId: "BSDD-XXX",
      wasteDetailsName: "waste",
      wasteDetailsCode: "01 01 01*",
      wasteDetailsQuantity: new Prisma.Decimal(1),
      wasteRefusalReason: "parce que",
      transporterIsExemptedOfReceipt: true,
      transporterCompanyName: "Transporteur",
      sentBy: "Someone"
    };

    const rendered = renderMail(formNotAccepted, {
      variables: { form },
      to
    });
    expect(rendered.body)
      .toContain(`Exemption relevant de l'article R.541-50 du code de
      l'Environnement`);
  });

  test("formNotAccepted with wasteRefusalReason nullish", () => {
    const form: Partial<Form & BsddTransporter> = {
      recipientCompanyName: "Recipient",
      signedAt: new Date("2021-01-02"),
      emitterCompanyName: "Emitter",
      emitterCompanyAddress: "1 rue du déchet",
      readableId: "BSDD-XXX",
      wasteDetailsName: "waste",
      wasteDetailsCode: "01 01 01*",
      wasteDetailsQuantity: new Prisma.Decimal(1),
      wasteRefusalReason: undefined,
      transporterIsExemptedOfReceipt: false,
      transporterCompanyName: "Transporteur",
      sentBy: "Someone"
    };

    const rendered = renderMail(formNotAccepted, {
      variables: { form },
      to
    });
    expect(rendered.body).toContain("Non précisé");
  });

  test("formPartiallyRefused", () => {
    const form: Partial<Form & BsddTransporter> = {
      recipientCompanyName: "Recipient",
      signedAt: new Date("2021-01-02"),
      emitterCompanyName: "Emitter",
      emitterCompanyAddress: "1 rue du déchet",
      readableId: "BSDD-XXX",
      wasteDetailsName: "waste",
      wasteDetailsCode: "01 01 01*",
      wasteDetailsQuantity: new Prisma.Decimal(1),
      quantityReceived: new Prisma.Decimal(0.5),
      wasteRefusalReason: "parce que",
      transporterIsExemptedOfReceipt: false,
      transporterCompanyName: "Transporteur",
      sentBy: "Someone"
    };

    const rendered = renderMail(formPartiallyRefused, {
      variables: { form },
      to
    });
    expect(rendered.body).toContain(form.recipientCompanyName);
    expect(rendered.body).toContain(toFrFormat(form.signedAt!));
    expect(rendered.body).toContain(form.emitterCompanyName);
    expect(rendered.body).toContain(form.emitterCompanyAddress);
    expect(rendered.body).toContain(form.readableId);
    expect(rendered.body).toContain(form.wasteDetailsName);
    expect(rendered.body).toContain(form.wasteDetailsCode);
    expect(rendered.body).toContain(form.wasteDetailsQuantity!.toString());
    expect(rendered.body).toContain(form.wasteRefusalReason);
    expect(rendered.body).toContain(form.transporterCompanyName);
    expect(rendered.body).toContain(form.sentBy);
  });

  test("formPartiallyRefused with exemption of receipt", () => {
    const form: Partial<Form & BsddTransporter> = {
      recipientCompanyName: "Recipient",
      signedAt: new Date("2021-01-02"),
      emitterCompanyName: "Emitter",
      emitterCompanyAddress: "1 rue du déchet",
      readableId: "BSDD-XXX",
      wasteDetailsName: "waste",
      wasteDetailsCode: "01 01 01*",
      wasteDetailsQuantity: new Prisma.Decimal(1),
      quantityReceived: new Prisma.Decimal(0.5),
      wasteRefusalReason: "parce que",
      transporterIsExemptedOfReceipt: true,
      transporterCompanyName: "Transporteur",
      sentBy: "Someone"
    };

    const rendered = renderMail(formPartiallyRefused, {
      variables: { form },
      to
    });
    expect(rendered.body)
      .toContain(`Exemption relevant de l'article R.541-50 du code de
      l'Environnement`);
  });

  test("formPartiallyRefused with wasteRefusalReason nullish", () => {
    const form: Partial<Form & BsddTransporter> = {
      recipientCompanyName: "Recipient",
      signedAt: new Date("2021-01-02"),
      emitterCompanyName: "Emitter",
      emitterCompanyAddress: "1 rue du déchet",
      readableId: "BSDD-XXX",
      wasteDetailsName: "waste",
      wasteDetailsCode: "01 01 01*",
      wasteDetailsQuantity: new Prisma.Decimal(1),
      quantityReceived: new Prisma.Decimal(0.5),
      wasteRefusalReason: undefined,
      transporterIsExemptedOfReceipt: false,
      transporterCompanyName: "Transporteur",
      sentBy: "Someone"
    };

    const rendered = renderMail(formPartiallyRefused, {
      variables: { form },
      to
    });
    expect(rendered.body).toContain("Non précisé");
  });

  test("membershipRequestConfirmation", () => {
    const companyName = "ACME";
    const companySiret = "000000000000001";
    const adminEmailsInfo = "emails info";
    const rendered = renderMail(membershipRequestConfirmation, {
      variables: { companyName, companySiret, adminEmailsInfo },
      to
    });
    expect(rendered.body).toContain(companyName);
    expect(rendered.body).toContain(companySiret);
    expect(rendered.body).toContain(adminEmailsInfo);
  });

  test("membershipRequest", () => {
    const userEmail = "john.snow@trackdechets.fr";
    const companyName = "ACME";
    const companySiret = "000000000000001";
    const membershipRequestId = "4567";
    const companyGivenName = "The Company";
    const rendered = renderMail(membershipRequest, {
      variables: {
        userEmail,
        companyName,
        companySiret,
        membershipRequestId,
        companyGivenName
      },
      to
    });
    expect(rendered.body).toContain(companyName);
    expect(rendered.body).toContain(companyGivenName);
    expect(rendered.body).toContain(userEmail);
    expect(rendered.body).toContain(membershipRequestId);
  });

  test("membershipRequestAccepted", () => {
    const companyName = "ACME";
    const companySiret = "000000000000001";
    const rendered = renderMail(membershipRequestAccepted, {
      variables: {
        companyName,
        companySiret
      },
      to
    });
    expect(rendered.subject).toContain(companyName);
    expect(rendered.subject).toContain(companySiret);
    expect(rendered.body).toContain(companySiret);
    expect(rendered.body).toContain(companySiret);
  });

  test("membershipRequestRefused", () => {
    const companyName = "ACME";
    const companySiret = "000000000000001";
    const rendered = renderMail(membershipRequestRefused, {
      variables: {
        companyName,
        companySiret
      },
      to
    });
    expect(rendered.body).toContain(companyName);
    expect(rendered.body).toContain(companySiret);
  });

  test("verificationProcessInfo", () => {
    const companyName = "ACME";
    const companySiret = "000000000000001";
    const rendered = renderMail(verificationProcessInfo, {
      variables: {
        company: {
          name: companyName,
          orgId: companySiret
        }
      },
      to
    });
    expect(rendered.body).toContain(companyName);
    expect(rendered.body).toContain(companySiret);
  });

  test("verificationDone by letter", () => {
    const companyName = "ACME";
    const companySiret = "000000000000001";
    const rendered = renderMail(verificationDone, {
      variables: {
        company: {
          name: companyName,
          orgId: companySiret,
          verificationMode: "LETTER"
        }
      },
      to
    });
    expect(rendered.body).toContain(companyName);
    expect(rendered.body).toContain(companySiret);
    expect(rendered.body).toContain(
      "au renseignement du code de vérification envoyé par courrier"
    );
  });
  test("verificationDone by letter", () => {
    const companyName = "ACME";
    const companySiret = "000000000000001";
    const rendered = renderMail(verificationDone, {
      variables: {
        company: {
          name: companyName,
          orgId: companySiret,
          verificationMode: "MANUAL"
        }
      },
      to
    });
    expect(rendered.body).toContain(companyName);
    expect(rendered.body).toContain(companySiret);
    expect(rendered.body).toContain(
      "aux vérifications effectuées par nos équipes"
    );
  });
});
