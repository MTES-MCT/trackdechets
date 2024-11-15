import { useMutation, useQuery } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BsdType,
  BspaohInput,
  Mutation,
  MutationCreateBspaohArgs,
  MutationCreateDraftBspaohArgs,
  MutationUpdateBspaohArgs,
  Query,
  QueryBspaohArgs
} from "@td/codegen-ui";
import omitDeep from "omit-deep-lodash";
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import FormStepsContent from "../../../Dashboard/Creation/FormStepsContent";
import { Loader } from "../../../common/Components";
import { getComputedState } from "../getComputedState";
import initialState from "./initial-state";
import {
  ZodBspaoh,
  rawBspaohSchema
} from "../../../Dashboard/Creation/bspaoh/schema";
import { cleanPayload } from "./utils/payload";
import {
  CREATE_BSPAOH,
  CREATE_DRAFT_BSPAOH,
  GET_BSPAOH,
  UPDATE_BSPAOH
} from "../../../../Apps/common/queries/bspaoh/queries";
import { Waste } from "./steps/Waste";
import { Emitter } from "./steps/Emitter";
import { Transporter } from "./steps/Transporter";
import { Destination } from "./steps/Destination";
import {
  getErrorTabIds,
  getPublishErrorMessages,
  getPublishErrorTabIds,
  TabId
} from "../utils";

const paohToInput = (paoh: BspaohInput): BspaohInput => {
  return omitDeep(paoh, [
    "isDraft",
    "emitter.emission.signature",
    "transporter.transport.signature",
    "destination.handedOverToDestination.signature",
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
export function ControlledTabs(props: Readonly<Props>) {
  const [publishErrors, setPublishErrors] = useState<
    | {
        code: string;
        path: string[];
        message: string;
      }[]
    | undefined
  >();
  const formQuery = useQuery<Pick<Query, "bspaoh">, QueryBspaohArgs>(
    GET_BSPAOH,
    {
      variables: {
        id: props.bsdId!
      },
      skip: !props.bsdId,
      fetchPolicy: "network-only"
    }
  );

  const formState = useMemo(
    () => getComputedState(initialState, formQuery.data?.bspaoh),
    [formQuery.data]
  );

  const sealedFields = useMemo(
    () =>
      (formQuery?.data?.bspaoh?.metadata?.fields?.sealed ?? [])
        ?.filter(Boolean)
        .map(sealedField => sealedField.join(".")),
    [formQuery.data]
  );

  const methods = useForm<ZodBspaoh>({
    values: formState,

    resolver: async (data, context, options) => {
      return zodResolver(rawBspaohSchema)(data, context, options);
    }
  });

  const [createDraftBspaoh, { loading: creatingDraft }] = useMutation<
    Pick<Mutation, "createDraftBspaoh">,
    MutationCreateDraftBspaohArgs
  >(CREATE_DRAFT_BSPAOH);

  const [createBspaoh, { loading: creating }] = useMutation<
    Pick<Mutation, "createBspaoh">,
    MutationCreateBspaohArgs
  >(CREATE_BSPAOH);

  const [updateBspaoh, { loading: updating }] = useMutation<
    Pick<Mutation, "updateBspaoh">,
    MutationUpdateBspaohArgs
  >(UPDATE_BSPAOH);

  const loading = creatingDraft || updating || creating;
  const mainCtaLabel = formState.id ? "Enregistrer" : "Publier";
  const draftCtaLabel = formState.id ? "" : "Enregistrer en brouillon";

  function saveForm(input: BspaohInput, draft: boolean): Promise<any> {
    const cleanedInput = paohToInput(input);
    if (formState.id!) {
      // remove sealed fields then cleanup empty objects from payload
      const cleanedPayload = cleanPayload(omitDeep(cleanedInput, sealedFields));

      return updateBspaoh({
        variables: { id: formState.id, input: cleanedPayload }
      });
    } else {
      const cleanedPayload = cleanPayload(cleanedInput);
      if (draft) {
        return createDraftBspaoh({
          variables: { input: cleanedPayload }
        });
      } else {
        return createBspaoh({
          variables: { input: cleanedPayload }
        });
      }
    }
  }

  const errorsFromPublishApi =
    publishErrors || props?.publishErrorsFromRedirect;
  const publishErrorTabIds = getPublishErrorTabIds(
    BsdType.Bspaoh,
    errorsFromPublishApi
  );
  const formStateErrorsKeys = Object.keys(methods?.formState?.errors);
  const errorTabIds = getErrorTabIds(
    BsdType.Bspaoh,
    publishErrorTabIds,
    formStateErrorsKeys
  );

  const publishErrorMessages = getPublishErrorMessages(
    BsdType.Bspaoh,
    errorsFromPublishApi
  );

  const tabsContent = {
    waste: <Waste />,
    emitter: (
      <Emitter
        errors={publishErrorMessages?.filter(
          error => error.tabId === "emitter"
        )}
      />
    ),
    transporter: (
      <Transporter
        errors={publishErrorMessages?.filter(
          error => error.tabId === "transporter"
        )}
      />
    ),
    destination: (
      <Destination
        errors={publishErrorMessages?.filter(
          error => error.tabId === "destination"
        )}
      />
    )
  };

  return (
    <>
      <FormStepsContent
        bsdType={BsdType.Bspaoh}
        draftCtaLabel={draftCtaLabel}
        isLoading={loading}
        mainCtaLabel={mainCtaLabel}
        saveForm={saveForm}
        sealedFields={sealedFields}
        useformMethods={methods}
        tabsContent={tabsContent}
        setPublishErrors={setPublishErrors}
        errorTabIds={errorTabIds}
        genericErrorMessage={publishErrorMessages.filter(
          error => error.tabId === TabId.none
        )}
      />
      {loading && <Loader />}
    </>
  );
}
