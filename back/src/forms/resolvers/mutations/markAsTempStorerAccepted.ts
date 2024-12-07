import { MutationResolvers } from "@td/codegen-back";
import { checkIsAuthenticated } from "../../../common/permissions";
import transitionForm from "../../workflow/transitionForm";
import { getFormOrFormNotFound } from "../../database";
import { checkCanMarkAsTempStored } from "../../permissions";
import { EventType } from "../../workflow/types";
import { getAndExpandFormFromDb } from "../../converter";
import { Prisma, WasteAcceptationStatus } from "@prisma/client";
import { getFormRepository } from "../../repository";
import { acceptedInfoSchema } from "../../validation";
import { renderFormRefusedEmail } from "../../mail/renderFormRefusedEmail";
import { sendMail } from "../../../mailer/mailing";
import { runInTransaction } from "../../../common/repository/helper";
import { prismaJsonNoNull } from "../../../common/converter";
import { bsddWasteQuantities } from "../../helpers/bsddWasteQuantities";

const markAsTempStorerAcceptedResolver: MutationResolvers["markAsTempStorerAccepted"] =
  async (_, args, context) => {
    const user = checkIsAuthenticated(context);
    const { id, tempStorerAcceptedInfo } = args;
    const form = await getFormOrFormNotFound({ id });

    await checkCanMarkAsTempStored(user, form);

    await acceptedInfoSchema.validate(tempStorerAcceptedInfo);

    const { quantityType, ...tmpStorerAcceptedInfo } = tempStorerAcceptedInfo;

    const wasteQuantities = bsddWasteQuantities({
      quantityReceived: tmpStorerAcceptedInfo.quantityReceived,
      quantityRefused: tmpStorerAcceptedInfo.quantityRefused,
      wasteAcceptationStatus: tmpStorerAcceptedInfo.wasteAcceptationStatus
    });

    const formUpdateInput: Prisma.FormUpdateInput = {
      ...tmpStorerAcceptedInfo,
      signedAt: new Date(tempStorerAcceptedInfo.signedAt),
      forwardedIn: {
        // pre-complete waste details repackaging info on BSD suite
        update: {
          wasteDetailsQuantity:
            wasteQuantities?.quantityAccepted ??
            tmpStorerAcceptedInfo.quantityReceived,
          wasteDetailsQuantityType: quantityType,
          wasteDetailsOnuCode: form.wasteDetailsOnuCode,
          wasteDetailsNonRoadRegulationMention:
            form.wasteDetailsNonRoadRegulationMention,
          wasteDetailsPackagingInfos: prismaJsonNoNull(
            form.wasteDetailsPackagingInfos
          )
        }
      }
    };

    const tempStoredForm = await runInTransaction(async transaction => {
      const formRepository = getFormRepository(user, transaction);
      const tempStoredForm = await formRepository.update(
        { id: form.id, status: form.status },
        {
          status: transitionForm(form, {
            type: EventType.MarkAsTempStorerAccepted,
            formUpdateInput
          }),
          ...formUpdateInput
        }
      );

      if (
        tempStorerAcceptedInfo.wasteAcceptationStatus ===
        WasteAcceptationStatus.REFUSED
      ) {
        await formRepository.removeAppendix2(id);
      }

      return tempStoredForm;
    });

    if (
      tempStoredForm.wasteAcceptationStatus ===
        WasteAcceptationStatus.REFUSED ||
      tempStoredForm.wasteAcceptationStatus ===
        WasteAcceptationStatus.PARTIALLY_REFUSED
    ) {
      const refusedEmail = await renderFormRefusedEmail(tempStoredForm);
      if (refusedEmail) {
        sendMail(refusedEmail);
      }
    }

    return getAndExpandFormFromDb(tempStoredForm.id);
  };

export default markAsTempStorerAcceptedResolver;
