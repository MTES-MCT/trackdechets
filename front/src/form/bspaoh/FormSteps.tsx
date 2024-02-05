import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import React, { useState, useMemo } from "react";
import { GET_BSDS } from "../../Apps/common/queries";
import omitDeep from "omit-deep-lodash";
import { useMutation, useQuery } from "@apollo/client";

import {
  Mutation,
  MutationCreateBspaohArgs,
  MutationCreateDraftBspaohArgs,
  MutationUpdateBspaohArgs,
  QueryBspaohArgs,
  Query,
  Bspaoh,
  BspaohInput,
  BspaohStatus,
  BspaohType
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
import { DevTool } from "@hookform/devtools";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Emitter } from "./steps/Emitter";
import { Transporter } from "./steps/Transporter";
import { Destination } from "./steps/Destination";
import { Waste } from "./steps/Waste";
import initialState from "./initial-state";
import { rawBspaohSchema } from "./schema";

const tabs = [
  { tabId: "tab1", label: "Déchet", iconId: "fr-icon-arrow-right-line" },
  {
    tabId: "tab2",
    label: "Producteur",
    iconId: "fr-icon-arrow-right-line"
  },
  { tabId: "tab3", label: "Transporteur", iconId: "fr-icon-arrow-right-line" },
  { tabId: "tab4", label: "Crématorium", iconId: "fr-icon-arrow-right-line" }
];

const tabIds = tabs.map(tab => tab.tabId);

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
    "transporter.transport.signature"
  ]);
};

interface Props {
  bsdId?: string;
}
export function ControlledTabs(props: Props) {
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

  const methods = useForm({
    values: formState,
    resolver: async (data, context, options) => {
      // you can debug your validation schema here

      console.log(
        "validation result",
        await zodResolver(rawBspaohSchema)(data, context, options)
      );
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

  const mainCtaLabel = formState.id ? "Enregistrer" : "Créer";

  function saveForm(input: BspaohInput): Promise<any> {
    const cleanedInput = paohToInput(input);

    return formState.id
      ? updateBspaoh({
          variables: { id: formState.id, input: cleanedInput }
        })
      : createDraftBspaoh({ variables: { input: cleanedInput } });
  }
  const navigate = useNavigate();

  const onSubmit = data => {
    const { id, ...input } = data;
    saveForm(input)
      .then(_ => {
        navigate(-1);
      })
      .catch(err => toastApolloError(err));
  };

  const lastTabId = tabIds.findLast(Boolean);
  const firstTabId = tabIds[0];
  return (
    <>
      <Tabs
        selectedTabId={selectedTabId}
        tabs={tabs}
        onTabChange={setSelectedTabId}
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
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

                <Button
                  priority="primary"
                  disabled={selectedTabId !== lastTabId}
                >
                  {mainCtaLabel}
                </Button>
              </div>
            </div>
          </form>
        </FormProvider>
      </Tabs>
      <DevTool control={methods.control} />
    </>
  );
}
