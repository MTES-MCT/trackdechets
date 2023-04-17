import axios from "axios";
import { resetDatabase } from "../../../integration-tests/helper";
import { CompanyType } from "@prisma/client";
import * as producer from "../../queue/producers/mail";
import { backend } from "../../mailer";

import {
  sendFirstOnboardingEmail,
  sendPendingRevisionRequestToAdminDetailsEmail,
  sendSecondOnboardingEmail,
  xDaysAgo
} from "../onboarding.helpers";

import {
  formFactory,
  userFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";
import prisma from "../../prisma";
import { bsdaFactory } from "../../bsda/__tests__/factories";

const TODAY = new Date();
const TWO_DAYS_AGO = xDaysAgo(TODAY, 2);

// Intercept calls
const mockedSendMailBackend = jest.spyOn(backend, "sendMail");
// Simulate queue error in order to test with sendMailSync
const mockAddToMailQueue = jest.spyOn(producer, "addToMailQueue");
mockAddToMailQueue.mockRejectedValue(
  new Error("any queue error to bypass job queue and sendmail synchronously")
);
// Integration tests EMAIL_BACKEND is supposed to use axios.
const mockedAxiosPost = jest.spyOn(axios, "post");
mockedAxiosPost.mockResolvedValue(null);

describe("sendOnboardingFirstStepMails", () => {
  afterEach(resetDatabase);
  beforeEach(() => {
    mockedAxiosPost.mockClear();
    mockedSendMailBackend.mockClear();
    mockAddToMailQueue.mockClear();
  });

  it("should send a request to mail service for onboarding first step", async () => {
    (mockedAxiosPost as jest.Mock<any>).mockImplementationOnce(() =>
      Promise.resolve({
        data: { results: "something" }
      })
    );
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const user = await userFactory({ firstAssociationDate: yesterday });
    // Users firstAssociationDate today and 2 days ago, should not receive any email
    await userFactory();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    await userFactory({ firstAssociationDate: twoDaysAgo });

    await sendFirstOnboardingEmail();

    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(1);
    expect(mockedAxiosPost).toHaveBeenCalledWith(
      "http://mailservice/smtp/email",
      {
        subject: "Bienvenue sur Trackdéchets, démarrez dès aujourd’hui !",
        templateId: 12, // hardcoded console FIRST_ONBOARDING_TEMPLATE_ID template ID
        sender: {
          email: "us@td.test",
          name: "Wastetracker corp."
        },
        to: [
          {
            email: user.email,
            name: user.name
          }
        ],
        params: {
          body: ""
        },

        cc: undefined
      },
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 5000
      })
    );
  });
});

describe("sendOnboardingSecondStepMails", () => {
  afterEach(resetDatabase);
  beforeEach(() => {
    mockedAxiosPost.mockClear();
    mockedSendMailBackend.mockClear();
    mockAddToMailQueue.mockClear();
  });
  it.each([1, 2, 4])(
    "should not send any mail request for onboarding second step (users created %p days ago)",
    async daysAgo => {
      const someDaysAgo = new Date();
      someDaysAgo.setDate(someDaysAgo.getDate() - daysAgo);

      const { user: producer } = await userWithCompanyFactory("ADMIN", {
        companyTypes: {
          set: ["PRODUCER" as CompanyType]
        }
      });

      await prisma.user.update({
        where: { id: producer.id },
        data: { firstAssociationDate: someDaysAgo }
      });
      const { user: professional } = await userWithCompanyFactory("ADMIN", {
        companyTypes: {
          set: ["WASTEPROCESSOR" as CompanyType]
        }
      }); // professional

      await prisma.user.update({
        where: { id: professional.id },
        data: { firstAssociationDate: someDaysAgo }
      });

      (mockedAxiosPost as jest.Mock<any>).mockImplementationOnce(() =>
        Promise.resolve({
          data: { results: "something" }
        })
      );

      await sendSecondOnboardingEmail();

      expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(0);
    }
  );
  it("should send a request to mail service for onboarding second step (producers)", async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { user } = await userWithCompanyFactory("ADMIN", {
      companyTypes: {
        set: ["PRODUCER" as CompanyType]
      }
    }); // producer

    await prisma.user.update({
      where: { id: user.id },
      data: { firstAssociationDate: threeDaysAgo }
    });

    (mockedAxiosPost as jest.Mock<any>).mockImplementationOnce(() =>
      Promise.resolve({
        data: { results: "something" }
      })
    );

    await sendSecondOnboardingEmail();

    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(1);
    expect(mockedAxiosPost).toHaveBeenCalledWith(
      "http://mailservice/smtp/email",
      {
        subject:
          "Signature dématérialisée, tableau de bord, explorez tout ce que fait Trackdéchets !",
        templateId: 10, // hardcoded console PRODUCER_SECOND_ONBOARDING_TEMPLATE_ID template ID
        sender: {
          email: "us@td.test",
          name: "Wastetracker corp."
        },
        to: [
          {
            email: user.email,
            name: user.name
          }
        ],
        params: {
          body: ""
        },

        cc: undefined
      },
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 5000
      })
    );
  });

  it("should send a request to mail service for onboarding second step (professional)", async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { user } = await userWithCompanyFactory("ADMIN", {
      companyTypes: {
        set: ["WASTEPROCESSOR" as CompanyType]
      }
    }); // professional

    await prisma.user.update({
      where: { id: user.id },
      data: { firstAssociationDate: threeDaysAgo }
    });

    (mockedAxiosPost as jest.Mock<any>).mockImplementationOnce(() =>
      Promise.resolve({
        data: { results: "something" }
      })
    );

    await sendSecondOnboardingEmail();

    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(1);
    expect(mockedAxiosPost).toHaveBeenCalledWith(
      "http://mailservice/smtp/email",
      {
        subject:
          "Trackdéchets vous accompagne pour mettre en oeuvre la traçabilité dématérialisée",
        templateId: 11, // hardcoded console PROFESSIONAL_SECOND_ONBOARDING_TEMPLATE_ID template ID
        sender: {
          email: "us@td.test",
          name: "Wastetracker corp."
        },
        to: [
          {
            email: user.email,
            name: user.name
          }
        ],
        params: {
          body: ""
        },

        cc: undefined
      },
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 5000
      })
    );
  });
});

describe("sendPendingRevisionRequestToAdminDetailsEmail", () => {
  afterEach(resetDatabase);
  beforeEach(() => {
    mockedAxiosPost.mockClear();
    mockedSendMailBackend.mockClear();
    mockAddToMailQueue.mockClear();
  });

  it("no request > should not send anything", async () => {
    // Given
    (mockedAxiosPost as jest.Mock<any>).mockImplementationOnce(() =>
      Promise.resolve({
        data: { results: "something" }
      })
    );

    // When
    await sendPendingRevisionRequestToAdminDetailsEmail(5);

    // Then
    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(0);
  });

  it("requests > should not send mails", async () => {
    // Given

    // BSDD
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    await prisma.bsddRevisionRequest.create({
      data: {
        createdAt: TWO_DAYS_AGO,
        bsddId: bsdd.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret } },
        comment: ""
      }
    });

    const { user: user2, company: company2 } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { company: companyOfSomeoneElse2 } = await userWithCompanyFactory(
      "ADMIN"
    );

    // BSDA
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company2.siret,
        transporterCompanySiret: companyOfSomeoneElse2.siret
      }
    });

    await prisma.bsdaRevisionRequest.create({
      data: {
        createdAt: TWO_DAYS_AGO,
        bsdaId: bsda.id,
        authoringCompanyId: companyOfSomeoneElse2.id,
        approvals: { create: { approverSiret: company2.siret } },
        comment: ""
      }
    });

    (mockedAxiosPost as jest.Mock<any>).mockImplementationOnce(() =>
      Promise.resolve({
        data: { results: "something" }
      })
    );

    // When
    await sendPendingRevisionRequestToAdminDetailsEmail(2);

    // Then
    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(1);
    expect(mockedAxiosPost).toHaveBeenCalledWith(
      "http://mailservice/smtp/email",
      {
        subject: "Votre action est attendue sur une demande de révision",
        templateId: 9, // hardcoded console FIRST_ONBOARDING_TEMPLATE_ID template ID
        params: { body: expect.any(String) },
        sender: {
          email: "us@td.test",
          name: "Wastetracker corp."
        },
        messageVersions: [
          {
            to: [{ name: user.name, email: user.email }],
            params: { body: expect.any(String) }
          },
          {
            to: [{ name: user2.name, email: user2.email }],
            params: { body: expect.any(String) }
          }
        ]
      },
      expect.anything()
    );
  });
});
