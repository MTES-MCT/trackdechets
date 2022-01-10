import axios from "axios";
import sendMailJob from "../jobs/sendmail";
import templateIds from "../../mailer/templates/provider/templateIds";
import * as mailing from "../../mailer/mailing";
import { Mail } from "../../mailer/types";
import * as producer from "../producer";
import { mailQueue } from "../producer";
import { backend } from "../../mailer";

// Intercept calls
const mockedSendMailBackend = jest.spyOn(backend, "sendMail");
const mockedSendMailSync = jest.spyOn(mailing, "sendMailSync");
// Integration tests EMAIL_BACKEND is supposed to use axios.
const axiosSpy = jest.spyOn(axios, "post");
axiosSpy.mockResolvedValue(null);

// Top level function with queue and sync fallback
const { sendMail } = mailing;

describe("Test the mail job queue", () => {
  beforeAll(() => {
    // test job worker attached to the queue singleton
    mailQueue.process(sendMailJob);
  });
  beforeEach(() => {
    axiosSpy.mockClear();
    mockedSendMailBackend.mockClear();
    mockedSendMailSync.mockClear();
    return mailQueue.clean(1000);
  });

  test("sendMailJob to the consumer that sends the mail using axios", async () => {
    // create the fake email
    const mail: Mail = {
      to: [{ email: "test@trackdechets.local", name: "test" }],
      subject: "Email de test",
      body: "Bonjour, ceci est un email de test de Trackdéchets.",
      templateId: templateIds.LAYOUT
    };
    // add to the queue
    await sendMail(mail);
    // wait for the queue to finish
    await new Promise(resolve => {
      mailQueue.on("completed", () => resolve(null));
    });
    // test the job is completed
    const jobs = await mailQueue.getCompleted();
    expect(jobs.length).toEqual(1);
    expect(axiosSpy).toHaveBeenCalledTimes(1);
    expect(mockedSendMailBackend).toHaveBeenCalledTimes(1);
    expect(mockedSendMailSync).toHaveBeenCalledTimes(1);
    // assert parameters values
    const postArgs: any = mockedSendMailBackend.mock.calls[0];
    // to right person
    expect(postArgs[0].to[0].email).toEqual("test@trackdechets.local");
    // With right text
    expect(postArgs[0].subject).toContain("Email de test");
    // with right body
    expect(postArgs[0].body).toContain(
      "Bonjour, ceci est un email de test de Trackdéchets."
    );
  });

  test("fallback sendMailJob to sendMailSync when queue is broken", async () => {
    // mocking the redis queue is down
    const mockAddToMailQueue = jest.spyOn(producer, "addToMailQueue");
    mockAddToMailQueue.mockRejectedValueOnce(new Error("any queue error"));

    // create the fake job
    const mail: Mail = {
      to: [{ email: "test@trackdechets.local", name: "test" }],
      subject: "Email fallback",
      body: "Bonjour, ceci est un email de test de Trackdéchets.",
      templateId: templateIds.LAYOUT
    };
    // try to add to the queue but fallback to sendMailSync
    await sendMail(mail);
    expect(axiosSpy).toHaveBeenCalledTimes(1);
    expect(mockedSendMailBackend).toHaveBeenCalledTimes(1);
  });
});
