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
    // test the job is completed
    const jobs = await mailQueue.getJobs([
      "active",
      "completed",
      "delayed",
      "failed",
      "paused",
      "waiting"
    ]);
    expect(jobs.length).toEqual(1);
    await Promise.allSettled(
      jobs.map(job => {
        // Returns a promise that resolves or rejects when the job completes or fails.
        job.finished();
      })
    );

    const [{ data }] = await mailQueue.getCompleted();
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
