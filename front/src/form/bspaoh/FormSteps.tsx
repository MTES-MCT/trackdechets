import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import React, { useState, useMemo } from "react";
import { GET_BSDS } from "../../Apps/common/queries";
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
import { toastApolloError } from "../common/stepper/toaster";
import styles from "./PaohForm.module.scss";
import {
  CREATE_DRAFT_BSPAOH,
  CREATE_BSPAOH,
  GET_BSPAOH,
  UPDATE_BSPAOH
} from "./utils/queries";
import { SealedFieldsContext } from "./context";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Emitter } from "./steps/Emitter";
import { Transporter } from "./steps/Transporter";
import { Destination } from "./steps/Destination";
import { Waste } from "./steps/Waste";
import initialState from "./initial-state";
import { rawBspaohSchema } from "./schema";
import { Loader } from "../../Apps/common/Components";

const tabIds = ["tab1", "tab2", "tab3", "tab4"];

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

const tabsContent = {
  tab1: <Waste />,
  tab2: <Emitter />,
  tab3: <Transporter />,
  tab4: <Destination />
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
}
export function ControlledTabs(props: Readonly<Props>) {
  const [selectedTabId, setSelectedTabId] = useState("tab1");

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

  const methods = useForm({
    values: formState,
    resolver: async (data, context, options) => {
      return zodResolver(rawBspaohSchema)(data, context, options);
    }
  });

  const [createDraftBspaoh, { loading: creatingDraft }] = useMutation<
    Pick<Mutation, "createDraftBspaoh">,
    MutationCreateDraftBspaohArgs
  >(CREATE_DRAFT_BSPAOH, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true
  });

  const [createBspaoh, { loading: creating }] = useMutation<
    Pick<Mutation, "createBspaoh">,
    MutationCreateBspaohArgs
  >(CREATE_BSPAOH, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true
  });

  const [updateBspaoh, { loading: updating }] = useMutation<
    Pick<Mutation, "updateBspaoh">,
    MutationUpdateBspaohArgs
  >(UPDATE_BSPAOH, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true
  });
  const loading = creatingDraft || updating || creating;
  const mainCtaLabel = formState.id ? "Enregistrer" : "Publier";
  const draftCtaLabel = formState.id ? "" : "Enregistrer en brouillon";

  function saveForm(input: BspaohInput, draft: boolean): Promise<any> {
    const cleanedInput = paohToInput(input);
    if (formState.id!) {
      // remove sealed fields then cleanup empty objects from payload
      const theInput = cleanPayload(omitDeep(cleanedInput, sealedFields));

      return updateBspaoh({
        variables: { id: formState.id, input: theInput }
      });
    } else {
      if (draft) {
        return createDraftBspaoh({ variables: { input: cleanedInput } });
      } else {
        return createBspaoh({ variables: { input: cleanedInput } });
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
      .catch(err => toastApolloError(err));
  };

  const lastTabId = tabIds[tabIds.length - 1];

  const firstTabId = tabIds[0];
  return (
    <>
      <Tabs
        selectedTabId={selectedTabId}
        tabs={[
          {
            tabId: "tab1",
            label: "Déchet",
            iconId: "fr-icon-arrow-right-line"
          },
          {
            tabId: "tab2",
            label: "Producteur",
            iconId: "fr-icon-arrow-right-line"
          },
          {
            tabId: "tab3",
            label: "Transporteur",
            iconId: "fr-icon-arrow-right-line"
          },
          {
            tabId: "tab4",
            label: "Crématorium",
            iconId: "fr-icon-arrow-right-line"
          }
        ]}
        onTabChange={setSelectedTabId}
      >
        <SealedFieldsContext.Provider value={sealedFields}>
          <FormProvider {...methods}>
            <form
              onSubmit={methods.handleSubmit((data, e) => onSubmit(data, e))}
            >
              {tabsContent[selectedTabId] ?? <p></p>}

              <div className={styles.form__actions}>
                <Button
                  onClick={() => setSelectedTabId(getPrevTab(selectedTabId))}
                  priority="tertiary"
                  disabled={selectedTabId === firstTabId}
                  type="button"
                >
                  Précédent
                </Button>

                <Button
                  onClick={() => setSelectedTabId(getNextTab(selectedTabId))}
                  priority="tertiary"
                  disabled={selectedTabId === lastTabId}
                  type="button"
                >
                  Suivant
                </Button>

                <div className={styles.form__actions__right}>
                  <Button
                    priority="secondary"
                    type="button"
                    onClick={() => navigate(-1)}
                  >
                    Annuler
                  </Button>

                  {!!draftCtaLabel && (
                    <Button
                      priority="secondary"
                      id="id_save_draft"
                      disabled={selectedTabId !== lastTabId}
                    >
                      {draftCtaLabel}
                    </Button>
                  )}
                  <Button
                    id="id_save"
                    priority="primary"
                    disabled={selectedTabId !== lastTabId}
                  >
                    {mainCtaLabel}
                  </Button>
                </div>
              </div>
            </form>
          </FormProvider>
        </SealedFieldsContext.Provider>
      </Tabs>
      {loading && <Loader />}
    </>
  );
}
