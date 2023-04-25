import axios from "axios";
import { resetDatabase } from "../../../integration-tests/helper";
import { CompanyType, MembershipRequestStatus } from "@prisma/client";
import * as producer from "../../queue/producers/mail";
import { backend } from "../../mailer";

import {
  sendMembershipRequestDetailsEmail,
  sendPendingMembershipRequestDetailsEmail,
  sendPendingMembershipRequestToAdminDetailsEmail,
  sendPendingRevisionRequestToAdminDetailsEmail,
  sendSecondOnboardingEmail,
  xDaysAgo
} from "../onboarding.helpers";

import {
  companyFactory,
  createMembershipRequest,
  formFactory,
  userFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";
import prisma from "../../prisma";
import { bsdaFactory } from "../../bsda/__tests__/factories";

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

const TODAY = new Date();
const ONE_DAY_AGO = xDaysAgo(TODAY, 1);
const TWO_DAYS_AGO = xDaysAgo(TODAY, 2);
const THREE_DAYS_AGO = xDaysAgo(TODAY, 3);
const FOUR_DAYS_AGO = xDaysAgo(TODAY, 4);

describe("sendSecondOnboardingEmail", () => {
  afterEach(resetDatabase);
  beforeEach(() => {
    mockedAxiosPost.mockClear();
    mockedSendMailBackend.mockClear();
    mockAddToMailQueue.mockClear();
  });

  it.each([ONE_DAY_AGO, TWO_DAYS_AGO, FOUR_DAYS_AGO])(
    "should not send any mail request for onboarding second step (users created %p days ago)",
    async daysAgo => {
      // Producer
      await userWithCompanyFactory(
        "ADMIN",
        {
          createdAt: FOUR_DAYS_AGO,
          verifiedAt: FOUR_DAYS_AGO,
          companyTypes: {
            set: ["PRODUCER" as CompanyType]
          }
        },
        {},
        { createdAt: daysAgo }
      );

      // Professional
      await userWithCompanyFactory(
        "ADMIN",
        {
          createdAt: FOUR_DAYS_AGO,
          verifiedAt: FOUR_DAYS_AGO,
          companyTypes: {
            set: ["WASTEPROCESSOR" as CompanyType]
          }
        },
        {},
        { createdAt: daysAgo }
      );

      (mockedAxiosPost as jest.Mock<any>).mockImplementationOnce(() =>
        Promise.resolve({
          data: { results: "something" }
        })
      );

      await sendSecondOnboardingEmail(3);

      expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(0);
    }
  );

  it("should send a request to mail service for onboarding second step (producers)", async () => {
    // Producer
    const { user } = await userWithCompanyFactory(
      "ADMIN",
      {
        createdAt: FOUR_DAYS_AGO,
        verifiedAt: FOUR_DAYS_AGO,
        companyTypes: {
          set: ["PRODUCER" as CompanyType]
        }
      },
      {},
      { createdAt: THREE_DAYS_AGO }
    );

    (mockedAxiosPost as jest.Mock<any>).mockImplementationOnce(() =>
      Promise.resolve({
        data: { results: "something" }
      })
    );

    await sendSecondOnboardingEmail(3);

    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(1);
    expect(mockedAxiosPost).toHaveBeenCalledWith(
      "http://mailservice/smtp/email",
      {
        subject:
          "Signature dématérialisée, tableau de bord, explorez tout ce que fait Trackdéchets !",
        templateId: 248,
        sender: {
          email: "us@td.test",
          name: "Wastetracker corp."
        },
        messageVersions: [
          {
            to: [
              {
                email: user.email,
                name: user.name
              }
            ]
          }
        ],
        params: {
          body: ""
        }
      },
      expect.anything()
    );
  });

  it("should send a request to mail service for onboarding second step (professional)", async () => {
    // Professional
    const { user } = await userWithCompanyFactory(
      "ADMIN",
      {
        createdAt: FOUR_DAYS_AGO,
        verifiedAt: FOUR_DAYS_AGO,
        companyTypes: {
          set: ["WASTEPROCESSOR" as CompanyType]
        }
      },
      {},
      { createdAt: THREE_DAYS_AGO }
    );

    (mockedAxiosPost as jest.Mock<any>).mockImplementationOnce(() =>
      Promise.resolve({
        data: { results: "something" }
      })
    );

    await sendSecondOnboardingEmail(3);

    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(1);
    expect(mockedAxiosPost).toHaveBeenCalledWith(
      "http://mailservice/smtp/email",
      {
        subject:
          "Signature dématérialisée, tableau de bord, explorez tout ce que fait Trackdéchets !",
        templateId: 250,
        sender: {
          email: "us@td.test",
          name: "Wastetracker corp."
        },
        messageVersions: [
          {
            to: [
              {
                email: user.email,
                name: user.name
              }
            ]
          }
        ],
        params: {
          body: ""
        }
      },
      expect.anything()
    );
  });
});

describe("sendMembershipRequestDetailsEmail", () => {
  afterEach(resetDatabase);
  beforeEach(() => {
    mockedAxiosPost.mockClear();
    mockedSendMailBackend.mockClear();
    mockAddToMailQueue.mockClear();
  });

  it("no membership request > should not send any mail", async () => {
    (mockedAxiosPost as jest.Mock<any>).mockImplementationOnce(() =>
      Promise.resolve({
        data: { results: "something" }
      })
    );

    await sendMembershipRequestDetailsEmail(3);

    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(0);
  });

  it("new user without membership request > should send a mail", async () => {
    // Should be returned
    const user = await userFactory({ createdAt: THREE_DAYS_AGO });

    (mockedAxiosPost as jest.Mock<any>).mockImplementationOnce(() =>
      Promise.resolve({
        data: { results: "something" }
      })
    );

    await sendMembershipRequestDetailsEmail(3);

    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(1);
    expect(mockedAxiosPost).toHaveBeenCalledWith(
      "http://mailservice/smtp/email",
      {
        subject: "Passez à la prochaine étape sur Trackdéchets",
        templateId: 9,
        sender: {
          email: "us@td.test",
          name: "Wastetracker corp."
        },
        messageVersions: [
          {
            to: [
              {
                email: user.email,
                name: user.name
              }
            ]
          }
        ],
        params: {
          body: expect.any(String)
        }
      },
      expect.anything()
    );
  });
});

describe("sendPendingMembershipRequestDetailsEmail", () => {
  afterEach(resetDatabase);
  beforeEach(() => {
    mockedAxiosPost.mockClear();
    mockedSendMailBackend.mockClear();
    mockAddToMailQueue.mockClear();
  });

  it("no pending membership request > should not send any mail", async () => {
    (mockedAxiosPost as jest.Mock<any>).mockImplementationOnce(() =>
      Promise.resolve({
        data: { results: "something" }
      })
    );

    await sendPendingMembershipRequestDetailsEmail(3);

    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(0);
  });

  it("pending membership > should send a mail", async () => {
    // Should be returned
    const company = await companyFactory();

    // Should return this user
    const user = await userFactory();
    await createMembershipRequest(user, company, {
      createdAt: THREE_DAYS_AGO
    });

    (mockedAxiosPost as jest.Mock<any>).mockImplementationOnce(() =>
      Promise.resolve({
        data: { results: "something" }
      })
    );

    await sendPendingMembershipRequestDetailsEmail(3);

    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(1);
    expect(mockedAxiosPost).toHaveBeenCalledWith(
      "http://mailservice/smtp/email",
      {
        subject: "Suite à votre demande de rattachement sur Trackdéchets",
        templateId: 9,
        sender: {
          email: "us@td.test",
          name: "Wastetracker corp."
        },
        messageVersions: [
          {
            to: [
              {
                email: user.email,
                name: user.name
              }
            ]
          }
        ],
        params: {
          body: expect.any(String)
        }
      },
      expect.anything()
    );
  });
});

describe("sendPendingMembershipRequestToAdminDetailsEmail", () => {
  afterEach(resetDatabase);
  beforeEach(() => {
    mockedAxiosPost.mockClear();
    mockedSendMailBackend.mockClear();
    mockAddToMailQueue.mockClear();
  });

  it("no pending membership request > should not send any mail", async () => {
    (mockedAxiosPost as jest.Mock<any>).mockImplementationOnce(() =>
      Promise.resolve({
        data: { results: "something" }
      })
    );

    await sendPendingMembershipRequestToAdminDetailsEmail(3);

    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(0);
  });

  it("pending membership > should send a mail to admin", async () => {
    const user = await userFactory();

    const companyAndAdmin = await userWithCompanyFactory("ADMIN");

    await createMembershipRequest(user, companyAndAdmin.company, {
      createdAt: THREE_DAYS_AGO,
      status: MembershipRequestStatus.PENDING
    });

    (mockedAxiosPost as jest.Mock<any>).mockImplementationOnce(() =>
      Promise.resolve({
        data: { results: "something" }
      })
    );

    await sendPendingMembershipRequestToAdminDetailsEmail(3);

    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(1);
    expect(mockedAxiosPost).toHaveBeenCalledWith(
      "http://mailservice/smtp/email",
      {
        subject:
          "Un utilisateur est toujours en attente de réponse de votre part",
        templateId: 9,
        sender: {
          email: "us@td.test",
          name: "Wastetracker corp."
        },
        messageVersions: [
          {
            params: {
              body: expect.any(String)
            },
            to: [
              {
                email: companyAndAdmin.user.email,
                name: companyAndAdmin.user.name
              }
            ]
          }
        ],
        params: {
          body: expect.any(String)
        }
      },
      expect.anything()
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
        approvals: { create: { approverSiret: company.siret! } },
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
        approvals: { create: { approverSiret: company2.siret! } },
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
