import { Form, Company, User } from "../generated/prisma-client";

function isFormTransporter(user: { companies: Company[] }, form: Form) {
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.transporterCompanySiret);
}

function isFormEmitter(user: { companies: Company[] }, form: Form) {
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.emitterCompanySiret);
}

function isFormRecipient(user: { companies: Company[] }, form: Form) {
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.recipientCompanySiret);
}

function isFormOwner(user: User, form: { owner: User }) {
  return form.owner.id === user.id;
}


export function canGetForm(
  user: User & { companies: Company[] },
  form: Form & { owner: User }
) {
  return (
    isFormOwner(user, form) ||
    isFormEmitter(user, form) ||
    isFormEmitter(user, form) ||
    isFormRecipient(user, form) ||
    isFormTransporter(user, form)
  );
}

}