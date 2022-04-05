import { Form, Status } from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import {
  MutationResolvers,
  MutationSignEmissionFormArgs,
  Form as GraphQLForm
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound, getFullForm } from "../../database";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import { checkCanSignFor } from "../../permissions";
import { expandFormFromDb } from "../../form-converter";
import {
  beforeSignedByTransporterSchema,
  wasteDetailsSchema
} from "../../validation";
import { FullForm } from "../../types";

const signatures: Partial<
  Record<
    Status,
    (
      user: Express.User,
      args: MutationSignEmissionFormArgs,
      existingForm: Form
    ) => Promise<GraphQLForm>
  >
> = {
  [Status.SEALED]: async (user, args, existingForm) => {
    if (args.input.emittedByEcoOrganisme) {
      await checkCanSignFor(
        existingForm.ecoOrganismeSiret,
        user,
        args.securityCode
      );
    } else {
      await checkCanSignFor(
        existingForm.emitterCompanySiret,
        user,
        args.securityCode
      );
    }

    const formUpdateInput = {
      wasteDetailsPackagingInfos:
        args.input.packagingInfos ?? existingForm.wasteDetailsPackagingInfos,
      wasteDetailsQuantity:
        args.input.quantity ?? existingForm.wasteDetailsQuantity,
      wasteDetailsOnuCode:
        args.input.onuCode ?? existingForm.wasteDetailsOnuCode,
      transporterNumberPlate:
        args.input.transporterNumberPlate ??
        existingForm.transporterNumberPlate,

      emittedAt: args.input.emittedAt,
      emittedBy: args.input.emittedBy,
      emittedByEcoOrganisme: args.input.emittedByEcoOrganisme ?? false
    };
    const futureForm: Form = {
      ...existingForm,
      ...formUpdateInput
    };

    await wasteDetailsSchema.validate(futureForm);
    await beforeSignedByTransporterSchema.validate(futureForm);

    const updatedForm = await transitionForm(user, existingForm, {
      type: EventType.SignedByProducer,
      formUpdateInput
    });

    return expandFormFromDb(updatedForm);
  },
  [Status.RESEALED]: async (user, args, existingForm) => {
    await checkCanSignFor(
      existingForm.recipientCompanySiret,
      user,
      args.securityCode
    );

    const existingFullForm = await getFullForm(existingForm);
    const formUpdateInput = {
      temporaryStorageDetail: {
        update: {
          wasteDetailsPackagingInfos:
            args.input.packagingInfos ??
            existingFullForm.temporaryStorageDetail
              .wasteDetailsPackagingInfos ??
            existingFullForm.wasteDetailsPackagingInfos,
          wasteDetailsQuantity:
            args.input.quantity ??
            existingFullForm.temporaryStorageDetail.wasteDetailsQuantity ??
            existingFullForm.wasteDetailsQuantity,
          wasteDetailsOnuCode:
            args.input.onuCode ??
            existingFullForm.temporaryStorageDetail.wasteDetailsOnuCode ??
            existingFullForm.wasteDetailsOnuCode,
          transporterNumberPlate:
            args.input.transporterNumberPlate ??
            existingFullForm.temporaryStorageDetail.transporterNumberPlate,

          emittedAt: args.input.emittedAt,
          emittedBy: args.input.emittedBy
        }
      }
    };
    const futureFullForm: FullForm = {
      ...existingFullForm,
      temporaryStorageDetail: {
        ...existingFullForm.temporaryStorageDetail,
        ...formUpdateInput.temporaryStorageDetail.update
      }
    };

    await wasteDetailsSchema.validate(futureFullForm);
    await beforeSignedByTransporterSchema.validate(futureFullForm);

    const updatedForm = await transitionForm(user, existingForm, {
      type: EventType.SignedByTempStorer,
      formUpdateInput
    });

    return expandFormFromDb(updatedForm);
  }
};

const signEmissionForm: MutationResolvers["signEmissionForm"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);
  const form = await getFormOrFormNotFound({ id: args.id });
  const sign = signatures[form.status];

  if (sign == null) {
    throw new UserInputError(
      `Ce bordereau n'en est pas à cette étape de signature`
    );
  }

  return sign(user, args, form);
};

export default signEmissionForm;
