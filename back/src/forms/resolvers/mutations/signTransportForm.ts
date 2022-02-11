import { Form, Status } from "@prisma/client";
import { UserInputError } from "apollo-server-express";
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
import { expandFormFromDb } from "../../form-converter";

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
  [Status.SIGNED_BY_PRODUCER]: async (user, args, existingForm) => {
    await checkCanSignFor(
      existingForm.transporterCompanySiret,
      user,
      args.securityCode
    );

    const formUpdateInput = {
      takenOverAt: args.input.takenOverAt,
      takenOverBy: args.input.takenOverBy,

      currentTransporterSiret: existingForm.transporterCompanySiret,

      // The following fields are deprecated
      // but we need to fill them until we remove them completely
      signedByTransporter: true,
      sentAt: args.input.takenOverAt,
      sentBy: existingForm.emittedBy
    };

    const updatedForm = await transitionForm(user, existingForm, {
      type: EventType.SignedByTransporter,
      formUpdateInput
    });

    return expandFormFromDb(updatedForm);
  },
  [Status.SIGNED_BY_TEMP_STORER]: async (user, args, existingForm) => {
    const existingFullForm = await getFullForm(existingForm);

    await checkCanSignFor(
      existingFullForm.temporaryStorageDetail.transporterCompanySiret,
      user,
      args.securityCode
    );

    const formUpdateInput = {
      temporaryStorageDetail: {
        update: {
          takenOverAt: args.input.takenOverAt,
          takenOverBy: args.input.takenOverBy,

          // The following fields are deprecated
          // but we need to fill them until we remove them completely
          signedByTransporter: true,
          signedAt: args.input.takenOverAt,
          signedBy: existingFullForm.temporaryStorageDetail.emittedBy
        }
      }
    };

    const updatedForm = await transitionForm(user, existingFullForm, {
      type: EventType.MarkAsResent,
      formUpdateInput
    });

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
