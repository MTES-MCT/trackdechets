import axios from "axios";

import {
  xDaysAgo,
  sendOnboardingFirstStepMails,
  sendOnboardingSecondStepMails
} from "../onboarding.helpers";

// Let's mock prima DB
jest.mock("../../prisma", () => ({
  user: {
    findMany: jest.fn(() => [
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
  it("should return a relative past date", () => {
    const someDate = new Date(2019, 9, 3, 10, 0, 0);
    const threeDaysBefore = xDaysAgo(someDate, 3);
    expect(threeDaysBefore.toISOString()).toEqual("2019-09-30T00:00:00.000Z");
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
    expect(mockedAxiosPost).toHaveBeenCalledWith(
      "http://mailservice/smtp/email",
      {
        body: "_",
        subject: "Bienvenue sur Trackdéchets, démarrez dès aujourd’hui !",
        templateId: 2000, // hardcoded console FIRST_ONBOARDING_TEMPLATE_ID template ID
        title: "Bienvenue sur Trackdéchets, démarrez dès aujourd’hui !",
        toEmail: "user@example.com",
        toName: "Rick Hunter",
        baseUrl: `https://${process.env.UI_HOST}`
      }
    );
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
    expect(mockedAxiosPost).toHaveBeenCalledWith(
      "http://mailservice/smtp/email",
      {
        body: "_",
        subject:
          "Registre, FAQ, explorez tout ce que peut faire Trackdéchets !",
        templateId: 3000, // hardcoded console SECOND_ONBOARDING_TEMPLATE_ID
        title: "Registre, FAQ, explorez tout ce que peut faire Trackdéchets !",
        toEmail: "user@example.com",
        toName: "Rick Hunter",
        baseUrl: `https://${process.env.UI_HOST}`
      }
    );
  });
});
