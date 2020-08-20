import {
  Form,
  Company,
  User,
  EcoOrganisme,
  TemporaryStorageDetail,
  TransportSegment
} from "../generated/prisma-client";

function isFormOwner(user: User, form: { owner: User }) {
  return form.owner?.id === user.id;
}

function isFormEmitter(user: { companies: Company[] }, form: Form) {
  if (!form.emitterCompanySiret) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.emitterCompanySiret);
}

function isFormRecipient(user: { companies: Company[] }, form: Form) {
  if (!form.recipientCompanySiret) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.recipientCompanySiret);
}

function isFormTransporter(user: { companies: Company[] }, form: Form) {
  if (!form.transporterCompanySiret) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.transporterCompanySiret);
}

function isFormTrader(user: { companies: Company[] }, form: Form) {
  if (!form.traderCompanySiret) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.traderCompanySiret);
}

function isFormEcoOrganisme(
  user: { companies: Company[] },
  form: { ecoOrganisme: EcoOrganisme }
) {
  if (!form.ecoOrganisme) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.ecoOrganisme.siret);
}

function isFormDestinationAfterTempStorage(
  user: { companies: Company[] },
  form: {
    temporaryStorage: TemporaryStorageDetail;
  }
) {
  if (!form.temporaryStorage) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.temporaryStorage.destinationCompanySiret);
}

function isFormTransporterAfterTempStorage(
  user: { companies: Company[] },
  form: {
    temporaryStorage: TemporaryStorageDetail;
  }
) {
  if (!form.temporaryStorage) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.temporaryStorage.transporterCompanySiret);
}

function isFormMultiModalTransporter(
  user: { companies: Company[] },
  form: { transportSegments: TransportSegment[] }
) {
  const sirets = user.companies.map(c => c.siret);
  const transportSegmentSirets = form.transportSegments.map(
    segment => segment.transporterCompanySiret
  );
  return transportSegmentSirets.some(s => sirets.includes(s));
}

export function canGetForm(
  user: User & { companies: Company[] },
  form: Form & { owner: User } & { ecoOrganisme: EcoOrganisme } & {
    temporaryStorage: TemporaryStorageDetail;
  } & { transportSegments: TransportSegment[] }
) {
  return (
    isFormOwner(user, form) ||
    isFormEmitter(user, form) ||
    isFormRecipient(user, form) ||
    isFormTrader(user, form) ||
    isFormTransporter(user, form) ||
    isFormEcoOrganisme(user, form) ||
    isFormTransporterAfterTempStorage(user, form) ||
    isFormDestinationAfterTempStorage(user, form) ||
    isFormMultiModalTransporter(user, form)
  );
}
