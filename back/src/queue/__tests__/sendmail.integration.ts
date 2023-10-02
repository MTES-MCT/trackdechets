import templateIds from "../../mailer/templates/provider/templateIds";
import { sendMail } from "../../mailer/mailing";
import { Mail } from "../../mailer/types";
import { mailQueue } from "../producers/mail";
import { resetCache } from "../../../integration-tests/helper";
import { backend } from "../../mailer";

jest.mock("../../mailer");

describe("Test the mail job queue", () => {
  afterAll(resetCache);

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
    const completedBeforeSend = await mailQueue.getCompletedCount();
    // add to the queue
    await sendMail(mail);

    // wait for the queue to finish
    await drainedPromise;
    // test the job is completed
    const jobs = await mailQueue.getCompleted();
    expect(jobs.length).toEqual(completedBeforeSend + 1);
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
    // Closing queue so add() fails
    await mailQueue.close();

    // create the fake job
    const mail: Mail = {
      to: [{ email: "test@trackdechets.local", name: "test" }],
      subject: "Email fallback",
      body: "Bonjour, ceci est un email de test de Trackdéchets.",
      templateId: templateIds.LAYOUT
    };
    // try to add to the queue but fallback to sendMailSync
    await sendMail(mail);
    expect(backend.sendMail as jest.Mock).toHaveBeenCalledTimes(1);
  });
});
