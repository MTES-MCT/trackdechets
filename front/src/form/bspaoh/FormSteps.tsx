import React, { useState, useMemo } from "react";
import omitDeep from "omit-deep-lodash";
import { useMutation, useQuery } from "@apollo/client";
import { cleanPayload } from "./utils/payload";
import {
  Mutation,
  MutationCreateBspaohArgs,
  MutationCreateDraftBspaohArgs,
  MutationUpdateBspaohArgs,
  QueryBspaohArgs,
  Query,
  BspaohInput
} from "@td/codegen-ui";
import { useForm, FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { getComputedState } from "../common/getComputedState";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CREATE_DRAFT_BSPAOH,
  CREATE_BSPAOH,
  GET_BSPAOH,
  UPDATE_BSPAOH
} from "./utils/queries";
import { SealedFieldsContext } from "./context";
import { Emitter } from "./steps/Emitter";
import { Transporter } from "./steps/Transporter";
import { Destination } from "./steps/Destination";
import { Waste } from "./steps/Waste";
import initialState from "./initial-state";
import { rawBspaohSchema, ZodBspaoh } from "./schema";
import { Loader } from "../../Apps/common/Components";
import FormStepsTabs from "../../Apps/Forms/Components/FormStepsTabs/FormStepsTabs";
import { getTabClassName } from "../../Apps/Forms/Components/FormStepsTabs/utils";

const tabIds = ["waste", "emitter", "transporter", "destination"];

const getNextTab = currentTabId => {
  const idx = tabIds.indexOf(currentTabId);
  if (idx === -1 || idx === tabIds.length) {
    return currentTabId;
  }
  return tabIds[idx + 1];
};

const getPrevTab = currentTabId => {
  const idx = tabIds.indexOf(currentTabId);
  if (idx === -1 || idx === 0) {
    return currentTabId;
  }
  return tabIds[idx - 1];
};

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
  publishErrors?: {
    code: string;
    path: string[];
    message: string;
  }[];
}
export function ControlledTabs(props: Readonly<Props>) {
  const [selectedTabId, setSelectedTabId] = useState("waste");
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
        ?.map(f => f?.name!)
        .filter(Boolean),
    [formQuery.data]
  );

  const methods = useForm<ZodBspaoh>({
    values: formState,

    resolver: async (data, context, options) => {
      return zodResolver(rawBspaohSchema)(data, context, options);
    }
  });

  const errorsFromPublishApi = publishErrors || props?.publishErrors;
  const publishErrorTabIds = [
    ...new Set(
      errorsFromPublishApi?.map(publishError => {
        return tabIds.find(key => publishError.path[0].includes(key));
      })
    )
  ];

  const publishErrorMessages = errorsFromPublishApi?.map(publishError => {
    const formattedError = publishError.path[0]
      .split(/(?=[A-Z])/)
      .map(s => s.toLowerCase()); //camel case split : en attendant la normalistation coté back
    const tabId = formattedError?.[0];
    const name = formattedError.join(".");
    const message = publishError.message;
    return { tabId, name, message };
  });

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

  const formStateErrorsKeys = Object.keys(methods?.formState?.errors);
  const errors = publishErrorTabIds.length
    ? publishErrorTabIds
    : formStateErrorsKeys?.length > 0
    ? formStateErrorsKeys
    : [];

  const errorTabIds = errors?.length > 0 ? errors : [];

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
  const navigate = useNavigate();

  const onSubmit = (data, e) => {
    const draft = e.nativeEvent.submitter.id === "id_save_draft";
    const { id, ...input } = data;

    saveForm(input, draft)
      .then(_ => {
        navigate(-1);
      })
      .catch(err => {
        if (err.graphQLErrors?.length) {
          const issues = err.graphQLErrors[0]?.extensions?.issues as {
            code: string;
            path: string[];
            message: string;
          }[];
          const errorDetailList = issues?.map(error => {
            return error;
          });
          setPublishErrors(
            errorDetailList as {
              code: string;
              path: string[];
              message: string;
            }[]
          );
        }
      });
  };

  const lastTabId = tabIds[tabIds.length - 1];

  const firstTabId = tabIds[0];

  const onTabChange = tabId => {
    setSelectedTabId(tabId);
  };

  return (
    <>
      <SealedFieldsContext.Provider value={sealedFields}>
        <FormProvider {...methods}>
          {!loading && (
            <FormStepsTabs
              tabList={[
                {
                  tabId: "waste",
                  label: "Déchet",
                  iconId: getTabClassName(errorTabIds, "waste")
                },
                {
                  tabId: "emitter",
                  label: "Producteur",
                  iconId: getTabClassName(errorTabIds, "emitter")
                },
                {
                  tabId: "transporter",
                  label: "Transporteur",
                  iconId: getTabClassName(errorTabIds, "transporter")
                },
                {
                  tabId: "destination",
                  label: "Crématorium",
                  iconId: getTabClassName(errorTabIds, "destination")
                }
              ]}
              draftCtaLabel={draftCtaLabel}
              mainCtaLabel={mainCtaLabel}
              selectedTabId={selectedTabId}
              isPrevStepDisabled={selectedTabId === firstTabId}
              isNextStepDisabled={selectedTabId === lastTabId}
              isSaveDisabled={
                mainCtaLabel !== "Publier" && selectedTabId !== lastTabId
              }
              onSubmit={methods.handleSubmit((data, e) => onSubmit(data, e))}
              onCancel={() => navigate(-1)}
              onPrevTab={() => setSelectedTabId(getPrevTab(selectedTabId))}
              onNextTab={() => setSelectedTabId(getNextTab(selectedTabId))}
              onTabChange={onTabChange}
            >
              {tabsContent[selectedTabId] ?? <p></p>}
            </FormStepsTabs>
          )}
        </FormProvider>
      </SealedFieldsContext.Provider>
      {loading && <Loader />}
    </>
  );
}
