import { useMutation, useQuery } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BsvhuInput,
  Mutation,
  MutationCreateBsvhuArgs,
  MutationCreateDraftBsvhuArgs,
  MutationUpdateBsvhuArgs,
  Query,
  QueryBsvhuArgs
} from "@td/codegen-ui";
import omitDeep from "omit-deep-lodash";
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader } from "../../../common/Components";
import FormStepsContent from "../FormStepsContent";
import { getComputedState } from "../getComputedState";
import { ZodBsvhu, rawBsvhuSchema } from "./schema";
import DestinationBsvhu from "./steps/Destination";
import EmitterBsvhu from "./steps/Emitter";
import TransporterBsvhu from "./steps/Transporter";
import WasteBsvhu from "./steps/Waste";
import initialState from "./utils/initial-state";
import {
  CREATE_BSVHU,
  CREATE_DRAFT_VHU,
  GET_VHU_FORM,
  UPDATE_VHU_FORM
} from "./utils/queries";
import { cleanPayload } from "../bspaoh/utils/payload";
import {
  getErrorTabIds,
  getPublishErrorMessages,
  getPublishErrorTabIds,
  getTabs
} from "../utils";

const vhuToInput = (paoh: BsvhuInput): BsvhuInput => {
  return omitDeep(paoh, [
    "isDraft",
    "emitter.emission.signature",
    "transporter.transport.signature",
    "destination.reception.signature",
    "destination.operation.signature"
  ]);
};
interface Props {
  bsdId?: string;
  publishErrorsFromRedirect?: {
    code: string;
    path: string[];
    message: string;
  }[];
}
const BsvhuFormSteps = ({
  bsdId,
  publishErrorsFromRedirect
}: Readonly<Props>) => {
  const [publishErrors, setPublishErrors] = useState<
    | {
        code: string;
        path: string[];
        message: string;
      }[]
    | undefined
  >();

  const formQuery = useQuery<Pick<Query, "bsvhu">, QueryBsvhuArgs>(
    GET_VHU_FORM,
    {
      variables: {
        id: bsdId!
      },
      skip: !bsdId,
      fetchPolicy: "network-only"
    }
  );

  const sealedFields = useMemo(
    () =>
      (formQuery?.data?.bsvhu?.metadata?.fields?.sealed ?? [])
        ?.map(f => f.join("."))
        .filter(Boolean),
    [formQuery.data]
  );

  const formState = useMemo(
    () => getComputedState(initialState, formQuery.data?.bsvhu),
    [formQuery.data]
  );

  const methods = useForm<ZodBsvhu>({
    values: formState,

    resolver: async (data, context, options) => {
      return zodResolver(rawBsvhuSchema)(data, context, options);
    }
  });

  const [createDraftVhuForm, { loading: creatingDraft }] = useMutation<
    Pick<Mutation, "createDraftBsvhu">,
    MutationCreateDraftBsvhuArgs
  >(CREATE_DRAFT_VHU);

  const [createVhuForm, { loading: creating }] = useMutation<
    Pick<Mutation, "createBsvhu">,
    MutationCreateBsvhuArgs
  >(CREATE_BSVHU);

  const [updateVhuForm, { loading: updating }] = useMutation<
    Pick<Mutation, "updateBsvhu">,
    MutationUpdateBsvhuArgs
  >(UPDATE_VHU_FORM);

  const loading = creatingDraft || updating || creating;
  const mainCtaLabel = formState.id ? "Enregistrer" : "Publier";
  const draftCtaLabel = formState.id ? "" : "Enregistrer en brouillon";

  const saveForm = (input: BsvhuInput, draft: boolean): Promise<any> => {
    const cleanedInput = vhuToInput(input);
    if (formState.id!) {
      const cleanedPayload = cleanPayload(omitDeep(cleanedInput));
      return updateVhuForm({
        variables: { id: formState.id, input: cleanedPayload }
      });
    } else {
      const cleanedPayload = cleanPayload(cleanedInput);

      if (draft) {
        return createDraftVhuForm({ variables: { input: cleanedPayload } });
      } else {
        return createVhuForm({ variables: { input: cleanedPayload } });
      }
    }
  };

  const tabIds = getTabs().map(tab => tab.tabId);
  const errorsFromPublishApi = publishErrors || publishErrorsFromRedirect;
  const publishErrorTabIds = getPublishErrorTabIds(
    errorsFromPublishApi,
    tabIds
  );
  const formStateErrorsKeys = Object.keys(methods?.formState?.errors);
  const errorTabIds = getErrorTabIds(publishErrorTabIds, formStateErrorsKeys);

  const publishErrorMessages = getPublishErrorMessages(errorsFromPublishApi);

  const tabsContent = {
    waste: (
      <WasteBsvhu
        errors={publishErrorMessages?.filter(error => error.tabId === "waste")}
      />
    ),
    emitter: (
      <EmitterBsvhu
        errors={publishErrorMessages?.filter(
          error => error.tabId === "emitter"
        )}
      />
    ),
    transporter: (
      <TransporterBsvhu
        errors={publishErrorMessages?.filter(
          error => error.tabId === "transporter"
        )}
      />
    ),
    destination: (
      <DestinationBsvhu
        errors={publishErrorMessages?.filter(
          error => error.tabId === "destination"
        )}
      />
    )
  };

  return (
    <>
      <FormStepsContent
        draftCtaLabel={draftCtaLabel}
        isLoading={loading}
        mainCtaLabel={mainCtaLabel}
        saveForm={saveForm}
        useformMethods={methods}
        tabsContent={tabsContent}
        sealedFields={sealedFields}
        setPublishErrors={setPublishErrors}
        errorTabIds={errorTabIds}
      />
      {loading && <Loader />}
    </>
  );
};

export default BsvhuFormSteps;
