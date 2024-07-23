import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import transitionForm from "../../workflow/transitionForm";
import { getFirstTransporter, getFormOrFormNotFound } from "../../database";
import { checkCanMarkAsTempStored } from "../../permissions";
import { receivedInfoSchema } from "../../validation";
import { EventType } from "../../workflow/types";
import { getAndExpandFormFromDb } from "../../converter";
import { DestinationCannotTempStore } from "../../errors";
import { Prisma, WasteAcceptationStatus } from "@prisma/client";
import { getFormRepository } from "../../repository";
import { renderFormRefusedEmail } from "../../mail/renderFormRefusedEmail";
import { sendMail } from "../../../mailer/mailing";
import { runInTransaction } from "../../../common/repository/helper";
import { prismaJsonNoNull } from "../../../common/converter";
import { bsddWasteQuantities } from "../../helpers/bsddWasteQuantities";

const markAsTempStoredResolver: MutationResolvers["markAsTempStored"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);
  const { id, tempStoredInfos } = args;
  const form = await getFormOrFormNotFound({ id });

  await checkCanMarkAsTempStored(user, form);

  if (form.recipientIsTempStorage !== true) {
    throw new DestinationCannotTempStore();
  }

  const transporter = await getFirstTransporter(form);

  await receivedInfoSchema.validate({
    ...tempStoredInfos,
    transporterTransportMode: transporter?.transporterTransportMode
  });

  const { quantityType, ...tmpStoredInfos } = tempStoredInfos;

  const wasteQuantities = bsddWasteQuantities({
    quantityReceived: tmpStoredInfos.quantityReceived,
    quantityRefused: tmpStoredInfos.quantityRefused,
    wasteAcceptationStatus: tmpStoredInfos.wasteAcceptationStatus
  });

  const formUpdateInput: Prisma.FormUpdateInput = {
    ...tmpStoredInfos,
    // quantity type can be estimated in case of temporary storage
    quantityReceivedType: quantityType,
    currentTransporterOrgId: "",
    ...(tmpStoredInfos.wasteAcceptationStatus &&
    ["ACCEPTED", "PARTIALLY_REFUSED"].includes(
      tmpStoredInfos.wasteAcceptationStatus
    )
      ? {
          forwardedIn: {
            // pre-complete waste details repackaging info on BSD suite
            update: {
              wasteDetailsQuantity:
                wasteQuantities?.quantityAccepted ??
                tmpStoredInfos.quantityReceived,
              wasteDetailsQuantityType: quantityType,
              wasteDetailsOnuCode: form.wasteDetailsOnuCode,
              wasteDetailsPackagingInfos: prismaJsonNoNull(
                form.wasteDetailsPackagingInfos
              )
            }
          }
        }
      : {})
  };

  const tempStoredForm = await runInTransaction(async transaction => {
    const formRepository = getFormRepository(user, transaction);
    const tempStoredForm = await formRepository.update(
      { id: form.id, status: form.status },
      {
        status: transitionForm(form, {
          type: EventType.MarkAsTempStored,
          formUpdateInput
        }),
        ...formUpdateInput
      }
    );

    // check for stale transport segments and delete them
    // quick fix https://trackdechets.zammad.com/#ticket/zoom/1696
    await formRepository.deleteStaleSegments({ id: form.id });

    if (
      tempStoredInfos.wasteAcceptationStatus === WasteAcceptationStatus.REFUSED
    ) {
      await formRepository.removeAppendix2(id);
    }

    return tempStoredForm;
  });

  if (
    tempStoredForm.wasteAcceptationStatus === WasteAcceptationStatus.REFUSED ||
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

export default markAsTempStoredResolver;
