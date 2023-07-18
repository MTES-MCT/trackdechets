import { Mail, Contact } from "../types";

const yellow = "\x1b[33m";
const reset = "\x1b[0m";

const consoleBackend = {
  backendName: "Console",
  log: function (payload: Mail | Contact) {
    console.log(yellow, "-".repeat(30), "Email", "-".repeat(30), reset);
    console.log(`Backend: ${this.backendName}`);
    console.log(payload);
    console.log("\n");
  },
  // keep the async function to match the other mail backends
  sendMail: async function (mail: Mail): Promise<void> {
    if (!mail.templateId) {
      console.log(
        "\nTemplateId not provided, will use default provider template id\n"
      );
    }
    this.log(mail);
    return Promise.resolve();
  },
  addContact: function (contact: Contact) {
    this.log(contact);
    return Promise.resolve();
  }
};

export default consoleBackend;
