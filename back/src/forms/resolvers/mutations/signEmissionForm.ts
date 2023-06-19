import { EmitterType, Form, Status } from "@prisma/client";
import { ForbiddenError, UserInputError } from "apollo-server-express";
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
import { expandFormFromDb } from "../../converter";
import { wasteDetailsSchema } from "../../validation";
import { getFormRepository } from "../../repository";
import { prismaJsonNoNull } from "../../../common/converter";
import { Permission } from "../../../permissions";

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
  [Status.CANCELED]: () => {
    throw new ForbiddenError(
      "Vous ne pouvez pas faire cette action, ce bordereau a été annulé"
    );
  },
  [Status.SEALED]: async (user, args, existingForm) => {
    if (existingForm.emitterType === EmitterType.APPENDIX1) {
      throw new UserInputError(
        "Impossible de signer le transport d'un bordereau chapeau. C'est en signant les bordereaux d'annexe 1 que le statut de ce bordereau évoluera."
      );
    }

    if (args.input.emittedByEcoOrganisme) {
      await checkCanSignFor(
        existingForm.ecoOrganismeSiret!,
        user,
        Permission.BsdCanSignEmission,
        args.securityCode
      );
    } else if (
      !existingForm.emitterIsForeignShip &&
      !existingForm.emitterIsPrivateIndividual
    ) {
      await checkCanSignFor(
        existingForm.emitterCompanySiret!,
        user,
        Permission.BsdCanSignEmission,
        args.securityCode
      );
    }

    const formUpdateInput = {
      wasteDetailsPackagingInfos:
        prismaJsonNoNull(args.input.packagingInfos) ??
        prismaJsonNoNull(existingForm.wasteDetailsPackagingInfos),
      wasteDetailsQuantity:
        args.input.quantity ?? existingForm.wasteDetailsQuantity,
      wasteDetailsOnuCode:
        args.input.onuCode ?? existingForm.wasteDetailsOnuCode,
      transporterNumberPlate:
        args.input.transporterNumberPlate ??
        existingForm.transporterNumberPlate,

      emittedAt: args.input.emittedAt,
      emittedBy: args.input.emittedBy,
      emittedByEcoOrganisme: args.input.emittedByEcoOrganisme ?? false,
      // required for machine to authorize signature
      emitterIsForeignShip: existingForm.emitterIsForeignShip,
      emitterIsPrivateIndividual: existingForm.emitterIsPrivateIndividual
    };
    const futureForm = {
      ...existingForm,
      ...formUpdateInput
    };

    await wasteDetailsSchema.validate(futureForm);

    const updatedForm = await getFormRepository(user).update(
      { id: existingForm.id },
      {
        status: transitionForm(existingForm, {
          type: EventType.SignedByProducer,
          formUpdateInput
        }),
        ...formUpdateInput
      }
    );

    return expandFormFromDb(updatedForm);
  },
  [Status.RESEALED]: async (user, args, existingForm) => {
    await checkCanSignFor(
      existingForm.recipientCompanySiret!,
      user,
      Permission.BsdCanSignEmission,
      args.securityCode
    );

    const existingFullForm = await getFullForm(existingForm);
    const formUpdateInput = {
      forwardedIn: {
        update: {
          status: Status.SIGNED_BY_PRODUCER,
          wasteDetailsPackagingInfos:
            prismaJsonNoNull(args.input.packagingInfos) ??
            prismaJsonNoNull(
              existingFullForm.forwardedIn?.wasteDetailsPackagingInfos
            ) ??
            prismaJsonNoNull(existingFullForm.wasteDetailsPackagingInfos),
          wasteDetailsQuantity:
            args.input.quantity ??
            existingFullForm.forwardedIn?.wasteDetailsQuantity ??
            existingFullForm.wasteDetailsQuantity,
          wasteDetailsOnuCode:
            args.input.onuCode ??
            existingFullForm.forwardedIn?.wasteDetailsOnuCode ??
            existingFullForm.wasteDetailsOnuCode,
          transporterNumberPlate:
            args.input.transporterNumberPlate ??
            existingFullForm.forwardedIn?.transporterNumberPlate,

          emittedAt: args.input.emittedAt,
          emittedBy: args.input.emittedBy
        }
      }
    };
    const futureFullForm = {
      ...existingFullForm,
      forwardedIn: {
        ...existingFullForm.forwardedIn,
        ...formUpdateInput.forwardedIn.update
      }
    };

    await wasteDetailsSchema.validate(futureFullForm.forwardedIn);

    const updatedForm = await getFormRepository(user).update(
      { id: existingForm.id },
      {
        status: transitionForm(existingForm, {
          type: EventType.SignedByTempStorer,
          formUpdateInput
        }),
        ...formUpdateInput
      }
    );

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
