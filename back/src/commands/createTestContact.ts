import { addContact } from "../mailer/mailing";

const addTestContact = () => {
  const [email, name] = process.argv.slice(2);
  addContact({
    email: email,
    name: name
  });
};

addTestContact();
