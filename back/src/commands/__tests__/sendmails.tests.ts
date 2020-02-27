import axios from "axios";

import {
  xDaysAgo,
  sendOnboardingFirstStepMails,
  sendOnboardingSecondStepMails
} from "../onboarding.helpers";

// Let's mock prima DB
jest.mock("../../generated/prisma-client", () => ({
  prisma: {
    users: jest.fn(() => [
      {
        email: "user@example.com",
        id: "xy123",
        isActive: true,
        name: "Rick Hunter",
        password: "$2b$10$nabc",
        phone: "06 18 12 34 56"
      }
    ])
  }
}));

describe("xDaysAgo", () => {
  it("should return a formatted relative past date", () => {
    const someDate = new Date(2019, 9, 3, 10, 0, 0);
    const threeDaysBefore = xDaysAgo(someDate, 3);
    expect(threeDaysBefore).toEqual("2019-09-30");
  });
});

const mockedAxiosPost = jest.spyOn(axios, "post"); // spy on axios.post method

beforeEach(() => {
  mockedAxiosPost.mockClear();
});

describe("sendOnboardingFirstStepMails", () => {
  it("should send a request to td mail service for onboarding first step", async () => {
    (mockedAxiosPost as jest.Mock<any>).mockImplementationOnce(() =>
      Promise.resolve({
        data: { results: "something" }
      })
    );

    await sendOnboardingFirstStepMails();

    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(1);
    expect(mockedAxiosPost).toHaveBeenCalledWith("http://td-mail/send", {
      body: "_",
      subject: "Bienvenue sur Trackdéchets, démarrez dès aujourd’hui !",
      templateId: parseInt(process.env.MJ_FIRST_ONBOARDING_TEMPLATE_ID, 10), // hardcoded mailjet template ID, should match .env MJ_FIRST_ONBOARDING_TEMPLATE_ID
      title: "Bienvenue sur Trackdéchets, démarrez dès aujourd’hui !",
      toEmail: "user@example.com",
      toName: "Rick Hunter",
      baseUrl: `https://${process.env.UI_HOST}`
    });
  });
});

describe("sendOnboardingSecondStepMails", () => {
  it("should send a request to td mail service for onboarding second step", async () => {
    (mockedAxiosPost as jest.Mock<any>).mockImplementationOnce(() =>
      Promise.resolve({
        data: { results: "something" }
      })
    );

    await sendOnboardingSecondStepMails();

    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(1);
    expect(mockedAxiosPost).toHaveBeenCalledWith("http://td-mail/send", {
      body: "_",
      subject: "Registre, FAQ, explorez tout ce que peut faire Trackdéchets !",
      templateId: parseInt(process.env.MJ_SECOND_ONBOARDING_TEMPLATE_ID, 10), // hardcoded mailjet template ID, should match .env MJ_SECOND_ONBOARDING_TEMPLATE_ID
      title: "Registre, FAQ, explorez tout ce que peut faire Trackdéchets !",
      toEmail: "user@example.com",
      toName: "Rick Hunter",
      baseUrl: `https://${process.env.UI_HOST}`
    });
  });
});
