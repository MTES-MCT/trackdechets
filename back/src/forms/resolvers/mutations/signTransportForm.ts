import { Form, Prisma, Status } from "@prisma/client";
import { ForbiddenError, UserInputError } from "apollo-server-express";
import {
  MutationResolvers,
  Form as GraphQLForm,
  MutationSignTransportFormArgs
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound, getFullForm } from "../../database";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import { checkCanSignFor } from "../../permissions";
import { expandFormFromDb } from "../../converter";
import { getFormRepository } from "../../repository";

/**
 * Common function for signing
 */
const signedByTransporterFn = async (user, args, existingForm) => {
  await checkCanSignFor(
    existingForm.transporterCompanySiret,
    user,
    args.securityCode
  );
  const formUpdateInput = {
    takenOverAt: args.input.takenOverAt,
    takenOverBy: args.input.takenOverBy,
    transporterNumberPlate:
      args.input.transporterNumberPlate ?? existingForm.transporterNumberPlate,

    currentTransporterSiret: existingForm.transporterCompanySiret,

    // The following fields are deprecated
    // but we need to fill them until we remove them completely
    signedByTransporter: true,
    sentAt: args.input.takenOverAt,
    sentBy: existingForm.emittedBy
  };

  const updatedForm = await getFormRepository(user).update(
    { id: existingForm.id },
    {
      status: transitionForm(existingForm, {
        type: EventType.SignedByTransporter,
        formUpdateInput
      }),
      ...formUpdateInput
    }
  );

  return expandFormFromDb(updatedForm);
};

const signatures: Partial<
  Record<
    Status,
    (
      user: Express.User,
      args: MutationSignTransportFormArgs,
      existingForm: Form
    ) => Promise<GraphQLForm>
  >
> = {
  [Status.SEALED]: async (user, args, existingForm) => {
    // no signature needed
    if (
      existingForm.emitterIsPrivateIndividual === true ||
      (existingForm.emitterIsForeignShip === true &&
        existingForm.emitterCompanyOmiNumber)
    ) {
      return signedByTransporterFn(user, args, existingForm);
    } else {
      throw new ForbiddenError(
        "Vous n'êtes pas autorisé à signer ce bordereau"
      );
    }
  },
  [Status.SIGNED_BY_PRODUCER]: async (user, args, existingForm) =>
    signedByTransporterFn(user, args, existingForm),
  [Status.SIGNED_BY_TEMP_STORER]: async (user, args, existingForm) => {
    const existingFullForm = await getFullForm(existingForm);

    await checkCanSignFor(
      existingFullForm.forwardedIn.transporterCompanySiret,
      user,
      args.securityCode
    );

    const formUpdateInput: Prisma.FormUpdateInput = {
      forwardedIn: {
        update: {
          status: Status.SENT,
          takenOverAt: args.input.takenOverAt,
          takenOverBy: args.input.takenOverBy,
          transporterNumberPlate:
            args.input.transporterNumberPlate ??
            existingFullForm.forwardedIn.transporterNumberPlate,

          // The following fields are deprecated
          // but we need to fill them until we remove them completely
          signedByTransporter: true,
          sentAt: args.input.takenOverAt,
          sentBy: existingForm.emittedBy
        }
      }
    };

    const updatedForm = await getFormRepository(user).update(
      { id: existingFullForm.id },
      {
        status: transitionForm(existingFullForm, {
          type: EventType.MarkAsResent,
          formUpdateInput
        }),
        ...formUpdateInput
      }
    );

    return expandFormFromDb(updatedForm);
  }
};

const signTransportForm: MutationResolvers["signTransportForm"] = async (
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

export default signTransportForm;
