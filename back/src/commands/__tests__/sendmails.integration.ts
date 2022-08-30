import axios from "axios";
import { resetDatabase } from "../../../integration-tests/helper";
import { CompanyType } from "@prisma/client";
import { mailQueue } from "../../queue/producer";
import sendMailJob from "../../queue/jobs/sendmail";
import * as mailing from "../../mailer/mailing";
import { backend } from "../../mailer";

import {
  sendFirstOnboardingEmail,
  sendSecondOnboardingEmail
} from "../onboarding.helpers";

import { userFactory, userWithCompanyFactory } from "../../__tests__/factories";
import prisma from "../../prisma";

// Intercept calls
const mockedSendMailBackend = jest.spyOn(backend, "sendMail");
const mockedSendMailSync = jest.spyOn(mailing, "sendMailSync");
// Integration tests EMAIL_BACKEND is supposed to use axios.
const mockedAxiosPost = jest.spyOn(axios, "post");
mockedAxiosPost.mockResolvedValue(null);
// test job worker attached to the queue singleton
mailQueue.process(sendMailJob);

describe("sendOnboardingFirstStepMails", () => {
  afterEach(resetDatabase);
  beforeEach(() => {
    mockedAxiosPost.mockClear();
    mockedSendMailBackend.mockClear();
    mockedSendMailSync.mockClear();
    return mailQueue.clean(1000);
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
    // test the job is completed
    const jobs = await mailQueue.getCompleted();
    expect(jobs.length).toEqual(1);
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

      {
        headers: { "Content-Type": "application/json", "api-key": undefined },
        timeout: 5000
      }
    );
  });
});

describe("sendOnboardingSecondStepMails", () => {
  afterEach(resetDatabase);
  beforeEach(() => {
    mockedAxiosPost.mockClear();
    mockedSendMailBackend.mockClear();
    mockedSendMailSync.mockClear();
    return mailQueue.clean(1000);
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

      {
        headers: { "Content-Type": "application/json", "api-key": undefined },
        timeout: 5000
      }
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
    // test the job is completed
    const jobs = await mailQueue.getCompleted();
    expect(jobs.length).toEqual(1);
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

      {
        headers: { "Content-Type": "application/json", "api-key": undefined },
        timeout: 5000
      }
    );
  });
});
