import { EmitterType, Form, Prisma, Status } from "@prisma/client";
import {
  MutationResolvers,
  MutationSignEmissionFormArgs,
  Form as GraphQLForm
} from "@td/codegen-back";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  getFirstTransporterSync,
  getFormOrFormNotFound,
  getFullForm,
  getTransporters
} from "../../database";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import { checkCanSignFor } from "../../permissions";
import { getAndExpandFormFromDb } from "../../converter";
import { Transporter, validateBeforeEmission } from "../../validation";
import { getFormRepository } from "../../repository";
import { prismaJsonNoNull } from "../../../common/converter";
import { Permission } from "../../../permissions";
import { ForbiddenError, UserInputError } from "../../../common/errors";

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

    const transporters = await getTransporters(existingForm);
    const transportersForValidation: Transporter[] = transporters; // payload de validation

    const transporter = getFirstTransporterSync({ transporters });

    const formUpdateInput: Prisma.FormUpdateInput = {
      wasteDetailsPackagingInfos:
        prismaJsonNoNull(args.input.packagingInfos) ??
        prismaJsonNoNull(existingForm.wasteDetailsPackagingInfos),
      wasteDetailsQuantity:
        args.input.quantity ?? existingForm.wasteDetailsQuantity,
      wasteDetailsOnuCode:
        args.input.onuCode ?? existingForm.wasteDetailsOnuCode,
      wasteDetailsNonRoadRegulationMention:
        args.input.nonRoadRegulationMention ??
        existingForm.wasteDetailsNonRoadRegulationMention,
      emittedAt: args.input.emittedAt,
      emittedBy: args.input.emittedBy,
      emittedByEcoOrganisme: args.input.emittedByEcoOrganisme ?? false,
      // required for machine to authorize signature
      emitterIsForeignShip: existingForm.emitterIsForeignShip,
      emitterIsPrivateIndividual: existingForm.emitterIsPrivateIndividual
    };

    if (args.input.transporterNumberPlate && transporter) {
      formUpdateInput.transporters = {
        update: {
          where: { id: transporter.id },
          data: { transporterNumberPlate: args.input.transporterNumberPlate }
        }
      };
      transportersForValidation[0].transporterNumberPlate =
        args.input.transporterNumberPlate;
    }

    const futureForm = {
      ...existingForm,
      ...formUpdateInput,
      transporters: transportersForValidation
    };

    await validateBeforeEmission(futureForm as Form);

    const updatedForm = await getFormRepository(user).update(
      { id: existingForm.id, status: existingForm.status },
      {
        status: transitionForm(existingForm, {
          type: EventType.SignedByProducer,
          formUpdateInput
        }),
        ...formUpdateInput
      }
    );

    return getAndExpandFormFromDb(updatedForm.id);
  },
  [Status.RESEALED]: async (user, args, existingForm) => {
    await checkCanSignFor(
      existingForm.recipientCompanySiret!,
      user,
      Permission.BsdCanSignEmission,
      args.securityCode
    );

    const existingFullForm = await getFullForm(existingForm);

    const transporters = await getTransporters(existingFullForm.forwardedIn!);
    const transportersForValidation: Transporter[] = transporters; // payload de validation

    const transporter = getFirstTransporterSync({ transporters });

    const forwardedInUpdateInput: Prisma.FormUpdateWithoutForwardingInput = {
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
      wasteDetailsNonRoadRegulationMention:
        existingFullForm.forwardedIn?.wasteDetailsNonRoadRegulationMention ??
        existingFullForm.wasteDetailsNonRoadRegulationMention,
      emittedAt: args.input.emittedAt,
      emittedBy: args.input.emittedBy
    };

    if (args.input.transporterNumberPlate && transporter) {
      forwardedInUpdateInput.transporters = {
        update: {
          where: { id: transporter.id },
          data: { transporterNumberPlate: args.input.transporterNumberPlate }
        }
      };
      transportersForValidation[0].transporterNumberPlate =
        args.input.transporterNumberPlate;
    }

    const formUpdateInput: Prisma.FormUpdateInput = {
      forwardedIn: {
        update: forwardedInUpdateInput
      }
    };

    const futureFullForm = {
      ...existingFullForm,
      forwardedIn: {
        ...existingFullForm.forwardedIn,
        ...forwardedInUpdateInput,
        transporters: transportersForValidation
      }
    };

    await validateBeforeEmission(futureFullForm.forwardedIn as Form);

    const updatedForm = await getFormRepository(user).update(
      { id: existingForm.id, status: existingForm.status },
      {
        status: transitionForm(existingForm, {
          type: EventType.SignedByTempStorer,
          formUpdateInput
        }),
        ...formUpdateInput
      }
    );

    return getAndExpandFormFromDb(updatedForm.id);
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
