import axios from "axios";
import templateIds from "../../mailer/templates/provider/templateIds";
import * as mailing from "../../mailer/mailing";
import { Mail } from "../../mailer/types";
import * as producer from "../producers/mail";
import { mailQueue } from "../producers/mail";
import { backend } from "../../mailer";
import { sendMailJob } from "../jobs/sendmail";

mailQueue.process(sendMailJob);
// Intercept calls
const mockedSendMailBackend = jest.spyOn(backend, "sendMail");
const mockedSendMailSync = jest.spyOn(mailing, "sendMailSync");
// Integration tests EMAIL_BACKEND is supposed to use axios.
const axiosSpy = jest.spyOn(axios, "post");
axiosSpy.mockResolvedValue(null);

// Top level function with queue and sync fallback
const { sendMail } = mailing;

describe("Test the mail job queue", () => {
  beforeEach(() => {
    axiosSpy.mockClear();
    mockedSendMailBackend.mockClear();
    mockedSendMailSync.mockClear();
    return mailQueue.clean(1000);
  });

  it("sends the mail using the mail job queue", async () => {
    // create the fake email
    const mail: Mail = {
      to: [{ email: "test@trackdechets.local", name: "test" }],
      subject: "Email de test",
      body: "Bonjour, ceci est un email de test de Trackdéchets.",
      templateId: templateIds.LAYOUT
    };
    const drainedPromise = new Promise<void>(resolve =>
      mailQueue.once("global:drained", resolve)
    );
    // add to the queue
    await sendMail(mail);
    // wait for the queue to finish
    await drainedPromise;
    // test the job is completed
    const jobs = await mailQueue.getCompleted();
    expect(jobs.length).toEqual(1);
    const { data } = jobs[0];
    // assert parameters values
    // to right person
    expect(data.to[0].email).toEqual("test@trackdechets.local");
    // With right text
    expect(data.subject).toContain("Email de test");
    // with right body
    expect(data.body).toContain(
      "Bonjour, ceci est un email de test de Trackdéchets."
    );
  });

  it("fallback to sendMailSync when queue is broken which directly call axios.post", async () => {
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
