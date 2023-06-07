import { ForbiddenError, UserInputError } from "apollo-server-express";
import * as yup from "yup";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  MutationMarkSegmentAsReadyToTakeOverArgs,
  MutationTakeOverSegmentArgs,
  NextSegmentInfoInput,
  TransportSegment
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import {
  expandTransportSegmentFromDb,
  flattenTransportSegmentInput
} from "../../converter";
import { Prisma } from "@prisma/client";
import { getFormRepository } from "../../repository";
import prisma from "../../../prisma";
import { sirenifyTransportSegmentInput } from "../../sirenify";
import { checkUserPermissions, Permission } from "../../../permissions";
import {
  PartialTransporterCompany,
  getTransporterCompanyOrgId,
  isForeignVat
} from "../../../common/constants/companySearchHelpers";
import {
  MISSING_COMPANY_ADDRESS,
  MISSING_COMPANY_CONTACT,
  MISSING_COMPANY_EMAIL,
  MISSING_COMPANY_PHONE,
  MISSING_COMPANY_SIRET_OR_VAT
} from "../../errors";
import {
  foreignVatNumber,
  siret,
  siretConditions,
  siretTests,
  vatNumberTests
} from "../../../common/validation";

const SEGMENT_NOT_FOUND = "Le segment de transport n'a pas été trouvé";
const FORM_NOT_FOUND_OR_NOT_ALLOWED =
  "Le bordereau n'a pas été trouvé ou vous ne disposez pas des permissions nécessaires";
const FORM_MUST_BE_SENT = "Le bordereau doit être envoyé";
const FORM_MUST_BE_DRAFT = "Le bordereau doit être en brouillon";
const SEGMENT_ALREADY_SEALED = "Ce segment de transport est déjà scellé";
const SEGMENTS_ALREADY_PREPARED =
  "Il y a d'autres segments après le vôtre, vous ne pouvez pas ajouter de segment";

const segmentSchema = yup.object<any>().shape({
  mode: yup.string().label("Mode de transport").required(),
  transporterCompanySiret: siret
    .label("Transporteur")
    .test(siretTests.isRegistered("TRANSPORTER"))
    .when(
      "transporterCompanyVatNumber",
      // set siret not required when vatNumber is defined and valid
      siretConditions.companyVatNumber
    ),
  transporterCompanyVatNumber: foreignVatNumber
    .label("Transporteur")
    .test(vatNumberTests.isRegisteredTransporter),
  transporterCompanyAddress: yup
    .string()
    .required(`Transporteur: ${MISSING_COMPANY_ADDRESS}`),
  transporterCompanyContact: yup
    .string()
    .required(`Transporteur: ${MISSING_COMPANY_CONTACT}`),
  transporterCompanyPhone: yup
    .string()
    .required(`Transporteur: ${MISSING_COMPANY_PHONE}`),
  transporterCompanyMail: yup
    .string()
    .email("Le format d'adresse email est incorrect")
    .required(`Transporteur: ${MISSING_COMPANY_EMAIL}`),
  transporterIsExemptedOfReceipt: yup.boolean().notRequired().nullable(),
  transporterReceipt: yup
    .string()
    .when(["transporterIsExemptedOfReceipt", "transporterCompanyVatNumber"], {
      is: (isExempted, vat) => isForeignVat(vat) || isExempted,
      then: schema => schema.notRequired().nullable(),
      otherwise: schema =>
        schema.required(
          "Vous n'avez pas précisé bénéficier de l'exemption de récépissé, il est donc est obligatoire"
        )
    }),
  transporterDepartment: yup
    .string()
    .when(["transporterIsExemptedOfReceipt", "transporterCompanyVatNumber"], {
      is: (isExempted, vat) => isForeignVat(vat) || isExempted,
      then: schema => schema.notRequired().nullable(),
      otherwise: schema =>
        schema.required("Le département du transporteur est obligatoire")
    }),

  transporterValidityLimit: yup.date().nullable(),
  transporterNumberPlate: yup.string().nullable(true)
});

const takeOverInfoSchema = yup.object<any>().shape({
  takenOverAt: yup.date().required(),
  takenOverBy: yup.string().required("Le nom du responsable est obligatoire")
});

const formWithOwnerIdAndTransportSegments = Prisma.validator<Prisma.FormArgs>()(
  {
    include: {
      owner: { select: { id: true } },
      transportSegments: { select: { mode: true } }
    }
  }
);
type MultiModalForm = Prisma.FormGetPayload<
  typeof formWithOwnerIdAndTransportSegments
>;

/**
 *
 * Prepare a new transport segment
 */
export async function prepareSegment(
  {
    id,
    orgId,
    nextSegmentInfo
  }: { id: string; orgId: string; nextSegmentInfo: NextSegmentInfoInput },
  context: GraphQLContext
): Promise<TransportSegment> {
  const user = checkIsAuthenticated(context);

  await checkUserPermissions(
    user,
    [orgId].filter(Boolean),
    Permission.BsdCanUpdate,
    FORM_NOT_FOUND_OR_NOT_ALLOWED
  );

  const sirenified = await sirenifyTransportSegmentInput(nextSegmentInfo, user);
  const nextSegmentPayload = flattenTransportSegmentInput(sirenified);
  const nextSegmentPayloadOrgId = getTransporterCompanyOrgId(
    nextSegmentPayload as PartialTransporterCompany
  );

  if (!nextSegmentPayloadOrgId) {
    throw new ForbiddenError(MISSING_COMPANY_SIRET_OR_VAT);
  }

  const formRepository = getFormRepository(user);
  // get form and segments
  const form = (await formRepository.findUnique(
    { id },
    formWithOwnerIdAndTransportSegments
  )) as MultiModalForm;
  if (!form) {
    throw new ForbiddenError(FORM_NOT_FOUND_OR_NOT_ALLOWED);
  }
  const transportSegments = await prisma.transportSegment.findMany({
    where: {
      form: { id: id }
    },
    orderBy: {
      segmentNumber: "asc"
    }
  });

  // user must be the currentTransporter or form owner
  const userIsOwner = user.id === form.owner.id;
  const userIsCurrentTransporter =
    !!form.currentTransporterOrgId && orgId === form.currentTransporterOrgId;

  if (!userIsOwner && !userIsCurrentTransporter) {
    throw new ForbiddenError(
      "Vous ne disposez pas des permissions nécessaires"
    );
  }

  // segments can be created by transporters if form is SENT and they're currently in charge of the form
  const userIsForbiddenToPrepareSentForm =
    userIsCurrentTransporter && form.status !== "SENT";

  // segments can be created by form owners when form is draft
  const userIsForbiddenToPrepareDraftForm =
    userIsOwner && form.status !== "DRAFT";

  // as user can be transporter and form owner, we dont want to forbid at first failing condition
  if (userIsForbiddenToPrepareSentForm && userIsForbiddenToPrepareDraftForm) {
    if (userIsForbiddenToPrepareDraftForm) {
      throw new ForbiddenError(FORM_MUST_BE_DRAFT);
    }
    if (userIsForbiddenToPrepareDraftForm) {
      throw new ForbiddenError(FORM_MUST_BE_DRAFT);
    }
  }

  const lastSegment = !!transportSegments.length
    ? transportSegments.slice(-1)[0]
    : null;
  if (
    !!lastSegment &&
    (!lastSegment.takenOverAt ||
      getTransporterCompanyOrgId(
        lastSegment as unknown as PartialTransporterCompany
      ) !== orgId)
  ) {
    throw new ForbiddenError(SEGMENTS_ALREADY_PREPARED);
  }

  const segmentInput = {
    ...nextSegmentPayload,
    previousTransporterCompanyOrgId: orgId,
    segmentNumber: transportSegments.length + 1 // additional segments begin at index 1
  };
  await formRepository.update(
    { id },
    {
      nextTransporterOrgId: nextSegmentPayloadOrgId,
      transportSegments: {
        create: {
          ...segmentInput
        }
      }
    },
    { prepareSegment: true }
  );

  const segment = await prisma.transportSegment.findFirstOrThrow({
    where: { segmentNumber: transportSegments.length + 1, form: { id: id } }
  });
  return expandTransportSegmentFromDb(segment);
}

export async function markSegmentAsReadyToTakeOver(
  { id }: MutationMarkSegmentAsReadyToTakeOverArgs,
  context: GraphQLContext
): Promise<TransportSegment> {
  const user = checkIsAuthenticated(context);

  const currentSegment = await prisma.transportSegment.findUnique({
    where: { id },
    include: {
      form: {
        select: {
          id: true
        }
      }
    }
  });

  if (!currentSegment) {
    throw new ForbiddenError(SEGMENT_NOT_FOUND);
  }
  const formRepository = getFormRepository(user);
  const form = await formRepository.findUnique(
    { id: currentSegment.form.id },
    formWithOwnerIdAndTransportSegments
  );

  if (form.status !== "SENT") {
    throw new ForbiddenError(FORM_MUST_BE_SENT);
  }

  const authorizedOrgIds = [form.currentTransporterOrgId].filter(Boolean);
  await checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanUpdate,
    FORM_NOT_FOUND_OR_NOT_ALLOWED
  );

  if (currentSegment.readyToTakeOver) {
    throw new ForbiddenError(SEGMENT_ALREADY_SEALED);
  }

  const segmentErrors: string[] = await segmentSchema
    .validate(currentSegment, { abortEarly: false })
    .catch(err => err.errors);

  if (!!segmentErrors.length) {
    throw new UserInputError(
      `Erreur, impossible de finaliser la préparation du transfert multi-modal car des champs sont manquants ou mal renseignés. \nErreur(s): ${segmentErrors.join(
        "\n"
      )}`
    );
  }

  await formRepository.update(
    { id: currentSegment.form.id },
    {
      transportSegments: {
        update: { where: { id }, data: { readyToTakeOver: true } }
      }
    }
  );

  return expandTransportSegmentFromDb({
    ...currentSegment,
    readyToTakeOver: true
  });
}

// when a waste is taken over
export async function takeOverSegment(
  { id, takeOverInfo }: MutationTakeOverSegmentArgs,
  context: GraphQLContext
): Promise<TransportSegment> {
  const user = checkIsAuthenticated(context);

  const inputErrors: string[] = await takeOverInfoSchema
    .validate(takeOverInfo, { abortEarly: false })
    .catch(err => err.errors);

  if (!!inputErrors.length) {
    throw new UserInputError(
      `Erreur, impossible de prendre en charge le bordereau car ces champs ne sont pas renseignés.\nErreur(s): ${inputErrors.join(
        "\n"
      )}`
    );
  }

  const currentSegment = await prisma.transportSegment.findUnique({
    where: { id },
    include: {
      form: {
        select: {
          id: true
        }
      }
    }
  });

  if (!currentSegment) {
    throw new ForbiddenError(SEGMENT_NOT_FOUND);
  }

  const formRepository = getFormRepository(user);
  const form = await formRepository.findUnique(
    { id: currentSegment.form.id },
    formWithOwnerIdAndTransportSegments
  );
  if (form.status !== "SENT") {
    throw new ForbiddenError(FORM_MUST_BE_SENT);
  }

  //   user must be the nextTransporter
  const nexTransporterIsFilled = !!form.nextTransporterOrgId;

  const authorizedOrgIds = nexTransporterIsFilled
    ? [form.nextTransporterOrgId, getTransporterCompanyOrgId(currentSegment)]
    : [];

  await checkUserPermissions(
    user,
    authorizedOrgIds.filter(Boolean),
    Permission.BsdCanSignTransport,
    FORM_NOT_FOUND_OR_NOT_ALLOWED
  );

  const segmentErrors: string[] = await segmentSchema
    .validate(currentSegment, { abortEarly: false })
    .catch(err => err.errors);

  if (!!segmentErrors.length) {
    throw new UserInputError(
      `Erreur, impossible de prendre en charge le bordereau car ces champs ne sont pas renseignés, veuillez editer le segment pour le prendre en charge.\nErreur(s): ${segmentErrors.join(
        "\n"
      )}`
    );
  }

  await formRepository.update(
    { id: currentSegment.form.id },
    {
      currentTransporterOrgId: getTransporterCompanyOrgId(currentSegment),
      nextTransporterOrgId: "",
      transportSegments: {
        update: {
          where: { id },
          data: takeOverInfo
        }
      }
    },
    { takeOverSegment: true }
  );

  return expandTransportSegmentFromDb({ ...currentSegment, ...takeOverInfo });
}

/**
 *
 * Edit an existing segment by a SIRET or a VAT number
 * Can be performed by form owner when in DRAFT state, everything is editable,
 * By current transporter if segment is not readyToTakeOver yet, everything is editable
 * By next transporter if segment is readyToTakeOver and not taken over, nor the SIRET nor the VAT is not editable

 */
export async function editSegment(
  {
    id,
    orgId,
    nextSegmentInfo
  }: { id: string; orgId: string; nextSegmentInfo: NextSegmentInfoInput },
  context: GraphQLContext
): Promise<TransportSegment> {
  const user = checkIsAuthenticated(context);

  const currentSegment = await prisma.transportSegment.findUnique({
    where: { id },
    include: {
      form: {
        select: {
          id: true
        }
      }
    }
  });

  if (!currentSegment) {
    throw new ForbiddenError(SEGMENT_NOT_FOUND);
  }

  const nextSegmentPayload = flattenTransportSegmentInput(nextSegmentInfo);
  const nextSegmentPayloadOrgId = getTransporterCompanyOrgId(
    nextSegmentPayload as PartialTransporterCompany
  );

  const authorizedOrgIds = [orgId].filter(Boolean);

  // check user has update permission on SIRET
  await checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanUpdate,
    FORM_NOT_FOUND_OR_NOT_ALLOWED
  );

  const formRepository = getFormRepository(user);
  const form = (await formRepository.findUnique(
    { id: currentSegment.form.id },
    formWithOwnerIdAndTransportSegments
  )) as MultiModalForm;

  const userIsOwner = user.id === form.owner.id;
  const userIsCurrentTransporter = orgId === form.currentTransporterOrgId;
  const userIsNextTransporter = orgId === form.nextTransporterOrgId;

  // segments can be edited by form transporter when form is sent
  const transporterIsForbiddenToEditSentForm =
    userIsCurrentTransporter && form.status !== "SENT";

  // segments can be edited by form owners when form is draft
  const ownerIsForbiddenToEditDraftForm =
    userIsOwner && form.status !== "DRAFT";

  // current transporter can edit until segment is readyToTakeOver
  const currentTransporterIsForbiddenToEditReadyToTakeOverSegment =
    userIsCurrentTransporter && currentSegment.readyToTakeOver;

  // the first statement (!userIsCurrentTransporter) allows a transporter to edit segment if it is assigned to him
  const nextTransporterIsForbiddenToEditDraftSegment =
    !userIsCurrentTransporter &&
    userIsNextTransporter &&
    !currentSegment.readyToTakeOver;

  // as user can be transporter and form owner, we dont want to forbid at first failing condition
  if (
    transporterIsForbiddenToEditSentForm &&
    ownerIsForbiddenToEditDraftForm &&
    currentTransporterIsForbiddenToEditReadyToTakeOverSegment
  ) {
    if (transporterIsForbiddenToEditSentForm) {
      throw new ForbiddenError(FORM_MUST_BE_SENT);
    }
    if (ownerIsForbiddenToEditDraftForm) {
      throw new ForbiddenError(FORM_MUST_BE_DRAFT);
    }
    if (currentTransporterIsForbiddenToEditReadyToTakeOverSegment) {
      throw new ForbiddenError("Ce segment ne peut plus être modifié");
    }
    if (nextTransporterIsForbiddenToEditDraftSegment) {
      throw new ForbiddenError(
        "Ce segment ne peut pas être modifié tant qu'il n'est pas scellé par le tranporteur précédent"
      );
    }
  }

  // VAT or SIRET can't be edited once segment is marked as ready
  if (
    currentSegment.readyToTakeOver &&
    !!nextSegmentPayloadOrgId &&
    nextSegmentPayloadOrgId !==
      getTransporterCompanyOrgId(currentSegment as PartialTransporterCompany)
  ) {
    throw new ForbiddenError(
      "L'entreprise de transport ne peut pas être modifiée une fois le segment scellé."
    );
  }

  await formRepository.update(
    { id: currentSegment.form.id },
    {
      nextTransporterOrgId: nextSegmentPayloadOrgId,
      transportSegments: {
        update: {
          where: { id },
          data: nextSegmentPayload
        }
      }
    },
    { editSegment: true }
  );
  return expandTransportSegmentFromDb({
    ...currentSegment,
    ...nextSegmentPayload
  });
}
