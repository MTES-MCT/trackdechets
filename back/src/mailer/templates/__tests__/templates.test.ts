import { Form } from "@prisma/client";
import {
  onSignup,
  inviteUserToJoin,
  notifyUserOfInvite,
  resetPassword,
  formNotAccepted,
  formPartiallyRefused,
  membershipRequestConfirmation,
  membershipRequest,
  membershipRequestAccepted,
  membershipRequestRefused,
  verificationProcessInfo,
  verificationDone,
  contentAwaitsGuest
} from "..";
import { toFrFormat } from "../../helpers";
import { renderMail } from "../renderers";

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

  test("contentAwaitsGuest", () => {
    const company = { siret: "11111111111111", name: "ACME" };
    const rendered = renderMail(contentAwaitsGuest, {
      variables: { company },
      to
    });
    expect(rendered.body).toContain(company.siret);
    expect(rendered.body).toContain(company.name);
  });

  test("inviteUserToJoin", () => {
    const hash = "abcd";
    const companyName = "ACME";
    const rendered = renderMail(inviteUserToJoin, {
      variables: { hash, companyName },
      to
    });
    expect(rendered.body).toContain(hash);
    expect(rendered.body).toContain(companyName);
  });

  test("notifyUserOfInvite", () => {
    const companyName = "ACME";
    const rendered = renderMail(notifyUserOfInvite, {
      variables: { companyName },
      to
    });
    expect(rendered.body).toContain(companyName);
  });

  test("resetPassword", () => {
    const resetHash = "secret";
    const rendered = renderMail(resetPassword, {
      variables: { resetHash },
      to
    });
    expect(rendered.body).toContain(resetHash);
  });

  test("formNotAccepted", () => {
    const form: Partial<Form> = {
      recipientCompanyName: "Recipient",
      receivedAt: new Date("2021-01-01"),
      emitterCompanyName: "Emitter",
      emitterCompanyAddress: "1 rue du déchet",
      readableId: "BSDD-XXX",
      wasteDetailsName: "waste",
      wasteDetailsCode: "01 01 01*",
      wasteDetailsQuantity: 1,
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
    expect(rendered.body).toContain(toFrFormat(form.receivedAt));
    expect(rendered.body).toContain(form.emitterCompanyName);
    expect(rendered.body).toContain(form.emitterCompanyAddress);
    expect(rendered.body).toContain(form.readableId);
    expect(rendered.body).toContain(form.wasteDetailsName);
    expect(rendered.body).toContain(form.wasteDetailsCode);
    expect(rendered.body).toContain(form.wasteDetailsQuantity.toString());
    expect(rendered.body).toContain(form.wasteRefusalReason);
    expect(rendered.body).toContain(form.transporterCompanyName);
    expect(rendered.body).toContain(form.sentBy);
  });

  test("formNotAccepted with exemption of receipt", () => {
    const form: Partial<Form> = {
      recipientCompanyName: "Recipient",
      receivedAt: new Date("2021-01-01"),
      emitterCompanyName: "Emitter",
      emitterCompanyAddress: "1 rue du déchet",
      readableId: "BSDD-XXX",
      wasteDetailsName: "waste",
      wasteDetailsCode: "01 01 01*",
      wasteDetailsQuantity: 1,
      wasteRefusalReason: "parce que",
      transporterIsExemptedOfReceipt: true,
      transporterCompanyName: "Transporteur",
      sentBy: "Someone"
    };

    const rendered = renderMail(formNotAccepted, {
      variables: { form },
      to
    });
    expect(rendered.body).toContain(
      "Exemption relevant de l'article R.541-50 du code de l'Environnement"
    );
  });

  test("formNotAccepted with wasteRefusalReason nullish", () => {
    const form: Partial<Form> = {
      recipientCompanyName: "Recipient",
      receivedAt: new Date("2021-01-01"),
      emitterCompanyName: "Emitter",
      emitterCompanyAddress: "1 rue du déchet",
      readableId: "BSDD-XXX",
      wasteDetailsName: "waste",
      wasteDetailsCode: "01 01 01*",
      wasteDetailsQuantity: 1,
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
    const form: Partial<Form> = {
      recipientCompanyName: "Recipient",
      receivedAt: new Date("2021-01-01"),
      emitterCompanyName: "Emitter",
      emitterCompanyAddress: "1 rue du déchet",
      readableId: "BSDD-XXX",
      wasteDetailsName: "waste",
      wasteDetailsCode: "01 01 01*",
      wasteDetailsQuantity: 1,
      quantityReceived: 0.5,
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
    expect(rendered.body).toContain(toFrFormat(form.receivedAt));
    expect(rendered.body).toContain(form.emitterCompanyName);
    expect(rendered.body).toContain(form.emitterCompanyAddress);
    expect(rendered.body).toContain(form.readableId);
    expect(rendered.body).toContain(form.wasteDetailsName);
    expect(rendered.body).toContain(form.wasteDetailsCode);
    expect(rendered.body).toContain(form.wasteDetailsQuantity.toString());
    expect(rendered.body).toContain(form.wasteRefusalReason);
    expect(rendered.body).toContain(form.transporterCompanyName);
    expect(rendered.body).toContain(form.sentBy);
  });

  test("formPartiallyRefused with exemption of receipt", () => {
    const form: Partial<Form> = {
      recipientCompanyName: "Recipient",
      receivedAt: new Date("2021-01-01"),
      emitterCompanyName: "Emitter",
      emitterCompanyAddress: "1 rue du déchet",
      readableId: "BSDD-XXX",
      wasteDetailsName: "waste",
      wasteDetailsCode: "01 01 01*",
      wasteDetailsQuantity: 1,
      quantityReceived: 0.5,
      wasteRefusalReason: "parce que",
      transporterIsExemptedOfReceipt: true,
      transporterCompanyName: "Transporteur",
      sentBy: "Someone"
    };

    const rendered = renderMail(formPartiallyRefused, {
      variables: { form },
      to
    });
    expect(rendered.body).toContain(
      "Exemption relevant de l'article R.541-50 du code de l'Environnement"
    );
  });

  test("formPartiallyRefused with wasteRefusalReason nullish", () => {
    const form: Partial<Form> = {
      recipientCompanyName: "Recipient",
      receivedAt: new Date("2021-01-01"),
      emitterCompanyName: "Emitter",
      emitterCompanyAddress: "1 rue du déchet",
      readableId: "BSDD-XXX",
      wasteDetailsName: "waste",
      wasteDetailsCode: "01 01 01*",
      wasteDetailsQuantity: 1,
      quantityReceived: 0.5,
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
    const companySiret = "11111111111111";
    const rendered = renderMail(membershipRequestConfirmation, {
      variables: { companyName, companySiret },
      to
    });
    expect(rendered.body).toContain(companyName);
    expect(rendered.body).toContain(companySiret);
  });

  test("membershipRequest", () => {
    const userEmail = "john.snow@trackdechets.fr";
    const companyName = "ACME";
    const companySiret = "11111111111111";
    const membershipRequestId = "4567";
    const rendered = renderMail(membershipRequest, {
      variables: {
        userEmail,
        companyName,
        companySiret,
        membershipRequestId
      },
      to
    });
    expect(rendered.body).toContain(companyName);
    expect(rendered.body).toContain(userEmail);
    expect(rendered.body).toContain(membershipRequestId);
  });

  test("membershipRequestAccepted", () => {
    const companyName = "ACME";
    const companySiret = "11111111111111";
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
    const companySiret = "11111111111111";
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
    const companySiret = "11111111111111";
    const rendered = renderMail(verificationProcessInfo, {
      variables: {
        company: {
          name: companyName,
          siret: companySiret
        }
      },
      to
    });
    expect(rendered.body).toContain(companyName);
    expect(rendered.body).toContain(companySiret);
  });

  test("verificationDone by letter", () => {
    const companyName = "ACME";
    const companySiret = "11111111111111";
    const rendered = renderMail(verificationDone, {
      variables: {
        company: {
          name: companyName,
          siret: companySiret,
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
    const companySiret = "11111111111111";
    const rendered = renderMail(verificationDone, {
      variables: {
        company: {
          name: companyName,
          siret: companySiret,
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
