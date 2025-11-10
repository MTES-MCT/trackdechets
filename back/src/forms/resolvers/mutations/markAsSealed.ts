import { EmitterType, Form, Status } from "@td/prisma";
import { yourCompanyIsIdentifiedOnABsd, renderMail } from "@td/mail";
import { prisma } from "@td/prisma";
import { UserInputError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { runInTransaction } from "../../../common/repository/helper";
import type { MutationResolvers } from "@td/codegen-back";
import { sendMail } from "../../../mailer/mailing";
import { getAndExpandFormFromDb } from "../../converter";
import {
  getFirstTransporter,
  getFirstTransporterSync,
  getFormOrFormNotFound
} from "../../database";
import { checkCanMarkAsSealed } from "../../permissions";
import { FormRepository, getFormRepository } from "../../repository";
import {
  checkCanBeSealed,
  validateBeforeEmission,
  validateForwardedInCompanies
} from "../../validation";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import { enqueueUpdateAppendix2Job } from "../../../queue/producers/updateAppendix2";
import { FormWithForwardedInWithTransportersInclude } from "../../types";

const markAsSealedResolver: MutationResolvers["markAsSealed"] = async (
  parent,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);
  const form = await getFormOrFormNotFound(
    { id },
    FormWithForwardedInWithTransportersInclude
  );
  await checkCanMarkAsSealed(user, form);

  const transporter = await getFirstTransporter(form);
  // validate form data
  await checkCanBeSealed({
    ...form,
    transporters: transporter ? [transporter] : []
  } as any);

  const transporterAfterTempStorage = form.forwardedIn
    ? getFirstTransporterSync(form.forwardedIn)
    : null;
  await validateForwardedInCompanies({
    destinationCompanySiret: form?.forwardedIn?.recipientCompanySiret,
    transporterCompanySiret:
      transporterAfterTempStorage?.transporterCompanySiret,
    transporterCompanyVatNumber:
      transporterAfterTempStorage?.transporterCompanyVatNumber
  });

  let formUpdateInput;

  if (
    form.emitterIsForeignShip === true ||
    form.emitterIsPrivateIndividual === true
  ) {
    // pre-validate when signature by producer will be by-passed at the end of this mutation
    formUpdateInput = {
      emittedAt: new Date(),
      emittedBy: form.emitterIsPrivateIndividual
        ? "Signature auto (particulier)"
        : "Signature auto (navire étranger)",
      emittedByEcoOrganisme: false,
      // required for machine to authorize signature
      emitterIsForeignShip: form.emitterIsForeignShip,
      emitterIsPrivateIndividual: form.emitterIsPrivateIndividual
    };
    const futureForm: Form = {
      ...form,
      ...formUpdateInput
    };
    await validateBeforeEmission(futureForm);
  }

  const emitterCompanyExists = form.emitterCompanySiret
    ? (await prisma.company.count({
        where: { siret: form.emitterCompanySiret }
      })) > 0
    : false;

  const resultingForm = await runInTransaction(async transaction => {
    const formRepository = getFormRepository(user, transaction);
    const sealedForm = await formRepository.update(
      { id: form.id, status: form.status },
      {
        status: transitionForm(form, {
          type: EventType.MarkAsSealed
        })
      }
    );

    if (sealedForm.emitterType === EmitterType.APPENDIX2) {
      const groupedForms = await formRepository.findGroupedFormsById(form.id);
      if (groupedForms.length === 0) {
        throw new UserInputError(
          "Veuillez sélectionner des bordereaux à regrouper afin de pouvoir publier ce bordereau de regroupement (Annexe 2)."
        );
      }

      for (const formId of groupedForms.map(f => f.id)) {
        transaction.addAfterCommitCallback(async () => {
          // permet de faire passer le statut d'un bordereau annexé à "GROUPED"
          // si tous les bordereaux dans lesquelle ils est regroupé sont au statut
          // "SEALED" et qu'il a été regroupé en totalité
          await enqueueUpdateAppendix2Job({
            formId,
            userId: user.id,
            auth: user.auth
          });
        });
      }
    }

    // send welcome email to emitter if it is not registered in TD
    if (form.emitterCompanySiret && !emitterCompanyExists) {
      await mailToNonExistentEmitter(sealedForm, formRepository);
    }

    // by-pass producer signature
    if (
      formUpdateInput &&
      (sealedForm.emitterIsForeignShip === true ||
        sealedForm.emitterIsPrivateIndividual === true)
    ) {
      return formRepository.update(
        { id: sealedForm.id, status: sealedForm.status },
        {
          status: transitionForm(sealedForm, {
            type: EventType.SignedByProducer,
            formUpdateInput
          }),
          ...formUpdateInput
        }
      );
    }

    return sealedForm;
  });

  return getAndExpandFormFromDb(resultingForm.id);
};

async function mailToNonExistentEmitter(
  form: Form,
  formRepository: FormRepository
) {
  // check contact email has not been mentionned already
  const contactAlreadyMentionned = await formRepository.findFirst(
    {
      id: { not: form.id },
      emitterCompanyMail: form.emitterCompanyMail,
      status: { not: Status.DRAFT }
    },
    { select: { id: true } }
  );
  if (
    form.emitterCompanyMail &&
    form.emitterCompanySiret &&
    form.emitterCompanyName &&
    form.recipientCompanyName &&
    form.recipientCompanySiret &&
    !contactAlreadyMentionned
  ) {
    const mail = renderMail(yourCompanyIsIdentifiedOnABsd, {
      to: [
        {
          email: form.emitterCompanyMail,
          name: form.emitterCompanyContact ?? ""
        }
      ],
      variables: {
        emitter: {
          siret: form.emitterCompanySiret,
          name: form.emitterCompanyName
        },
        destination: {
          siret: form.recipientCompanySiret,
          name: form.recipientCompanyName
        }
      }
    });

    await sendMail(mail);
  }
}

export default markAsSealedResolver;
