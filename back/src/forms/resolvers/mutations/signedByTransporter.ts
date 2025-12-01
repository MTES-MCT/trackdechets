import {
  checkIsAuthenticated,
  checkSecurityCode
} from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import {
  getFirstTransporterSync,
  getFormOrFormNotFound,
  getFullForm
} from "../../database";
import {
  getAndExpandFormFromDb,
  flattenSignedByTransporterInput
} from "../../converter";
import { checkCanSignedByTransporter } from "../../permissions";
import { signingInfoSchema, validateBeforeTransport } from "../../validation";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import { getFormRepository } from "../../repository";
import { Prisma } from "@td/prisma";
import { getTransporterCompanyOrgId } from "@td/constants";
import { getFormReceiptField } from "./signTransportForm";
import { UserInputError } from "../../../common/errors";
import Decimal from "decimal.js";

const signedByTransporterResolver: MutationResolvers["signedByTransporter"] =
  async (parent, args, context) => {
    const user = checkIsAuthenticated(context);

    const { id, signingInfo } = args;

    const form = await getFormOrFormNotFound({ id });

    const fullForm = await getFullForm(form);

    // APPENDIX1_PRODUCER has been added long after this mutation was deprecated.
    // Instead of adding complex logic in both cases, just prevent from using this mutation.
    if (fullForm.emitterType === "APPENDIX1_PRODUCER") {
      throw new UserInputError(
        "Impossible de signer un bordereau d'annexe 1 avec cette mutation dépréciée. Merci d'utiliser la mutation `signTransportForm`."
      );
    }

    // La mutation `signedByTransporter` ne peut être appelée que par
    // le premier transporteur contrairement à `signTransportForm`
    const transporter = getFirstTransporterSync(fullForm);

    await checkCanSignedByTransporter(user, form);

    const {
      signedByProducer,
      signedByTransporter,
      securityCode,
      signatureAuthor,
      ...infos
    } = flattenSignedByTransporterInput(signingInfo);

    if (signedByTransporter === false) {
      throw new UserInputError(
        "Le transporteur doit signer pour valider l'enlèvement."
      );
    }

    if (signedByProducer === false) {
      throw new UserInputError(
        "Le producteur doit signer pour valider l'enlèvement."
      );
    }

    await signingInfoSchema.validate({
      sentAt: infos.sentAt,
      sentBy: infos.sentBy
    });

    const wasteDetails = {
      wasteDetailsPackagingInfos:
        infos.packagingInfos ?? form.wasteDetailsPackagingInfos,
      wasteDetailsQuantity: infos.quantity
        ? new Decimal(infos.quantity)
        : form.wasteDetailsQuantity,
      wasteDetailsOnuCode: infos.onuCode ?? form.wasteDetailsOnuCode,
      wasteDetailsNonRoadRegulationMention:
        form.wasteDetailsNonRoadRegulationMention
    };

    const receiptFields = await getFormReceiptField(transporter);
    const futureForm = {
      ...transporter,
      ...form,
      ...wasteDetails,
      transporters: [{ ...transporter, ...receiptFields }]
    };

    // check waste details override is valid and transporter info is filled
    await validateBeforeTransport(
      futureForm,
      getTransporterCompanyOrgId(transporter)!
    );

    const formRepository = getFormRepository(user);

    const transporterUpdate: Prisma.BsddTransporterUpdateWithoutFormInput = {
      takenOverAt: infos.sentAt, // takenOverAt is duplicated between Form and BsddTransporter
      takenOverBy: user.name, // takenOverBy is duplicated between Form and BsddTransporter
      ...receiptFields
    };

    if (form.takenOverAt && fullForm.forwardedIn) {
      // BSD has already been sent, it must be a signature for frame 18

      // check security code is temp storer's
      await checkSecurityCode(user.id, form.recipientCompanySiret!, securityCode);

      const { forwardedIn } =
        (await getFormRepository(user).findFullFormById(id)) ?? {};

      const hasWasteDetailsOverride = !!forwardedIn?.wasteDetailsQuantity;

      const forwardedInTransporter = getFirstTransporterSync(
        fullForm.forwardedIn
      );

      const formUpdateInput: Prisma.FormUpdateInput = {
        ...(!hasWasteDetailsOverride && wasteDetails),
        forwardedIn: {
          update: {
            // The following fields are deprecated but what this mutation used to fill
            // so we need to continue doing so until the mutation is completely removed
            signedBy: infos.sentBy,
            signedAt: infos.sentAt,
            signedByTransporter: true,

            // The following fields are the new ones that we need to support
            emittedAt: infos.sentAt,
            emittedBy: infos.sentBy,
            takenOverAt: infos.sentAt,
            // We don't have this information so we're doing our best:
            takenOverBy: user.name,

            ...(hasWasteDetailsOverride && wasteDetails),
            ...(forwardedInTransporter && {
              transporters: {
                update: {
                  where: { id: forwardedInTransporter.id },
                  data: transporterUpdate
                }
              }
            })
          }
        }
      };

      const resentForm = await formRepository.update(
        { id: form.id, status: form.status },
        {
          status: transitionForm(form, {
            type: EventType.SignedByTransporter,
            formUpdateInput
          }),
          ...formUpdateInput
        }
      );

      return getAndExpandFormFromDb(resentForm.id);
    }

    // check security code is producer's or eco-organisme's (if there's one)
    if (args.signingInfo.signatureAuthor === "ECO_ORGANISME") {
      if (form.ecoOrganismeSiret == null) {
        throw new UserInputError(
          "Impossible de signer au nom de l'éco-organisme : le BSD n'en mentionne aucun."
        );
      }
      await checkSecurityCode(user.id, form.ecoOrganismeSiret, signingInfo.securityCode);
    } else {
      await checkSecurityCode(
        user.id,
        form.emitterCompanySiret!,
        signingInfo.securityCode
      );
    }

    const formUpdateInput: Prisma.FormUpdateInput = {
      // The following fields are deprecated but what this mutation used to fill
      // so we need to continue doing so until the mutation is completely removed
      signedByTransporter: true,
      sentAt: infos.sentAt,
      sentBy: infos.sentBy,

      // The following fields are the new ones that we need to support
      emittedAt: infos.sentAt,
      emittedBy: infos.sentBy,
      emittedByEcoOrganisme:
        args.signingInfo.signatureAuthor === "ECO_ORGANISME",
      takenOverAt: infos.sentAt,
      // We don't have this information so we're doing our best:
      takenOverBy: user.name,

      ...wasteDetails,
      currentTransporterOrgId: getTransporterCompanyOrgId(transporter),
      ...(transporter && {
        transporters: {
          update: {
            where: { id: transporter.id },
            data: transporterUpdate
          }
        }
      })
    };

    const sentForm = await formRepository.update(
      { id: form.id, status: form.status },
      {
        status: transitionForm(form, {
          type: EventType.SignedByTransporter,
          formUpdateInput
        }),
        ...formUpdateInput
      }
    );

    return getAndExpandFormFromDb(sentForm.id);
  };

export default signedByTransporterResolver;
