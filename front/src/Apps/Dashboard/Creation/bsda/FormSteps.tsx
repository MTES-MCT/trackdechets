import { useQuery } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bsda, BsdType, Query, QueryBsdaArgs } from "@td/codegen-ui";
import React, { useMemo, useState, createContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader } from "../../../common/Components";
import FormStepsContent from "../FormStepsContent";

import EmitterBsda from "./steps/Emitter";

import { GET_BSDA } from "../../../common/queries/bsda/queries";
import { getComputedState } from "../getComputedState";
import {
  getErrorTabIds,
  getPublishErrorMessages,
  getPublishErrorTabIds,
  TabId
} from "../utils";
import { rawBsdaSchema, ZodBsda } from "./schema";
import initialState from "./utils/initial-state";
import Worker from "./steps/Worker";
import TransporterBsda from "./steps/Transporter";
import DestinationBsda from "./steps/Destination";

interface Props {
  bsdId?: string;
  publishErrorsFromRedirect?: {
    code: string;
    path: string[];
    message: string;
  }[];
}
export const BsdaContext = createContext<Bsda | undefined>(undefined);

const BsdaFormSteps = ({
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

  const bsdaQuery = useQuery<Pick<Query, "bsda">, QueryBsdaArgs>(GET_BSDA, {
    variables: {
      id: bsdId!
    },
    skip: !bsdId,
    fetchPolicy: "network-only"
  });

  const formState = useMemo(
    () => getComputedState(initialState, bsdaQuery.data?.bsda),
    [bsdaQuery.data]
  );

  const methods = useForm<ZodBsda>({
    values: formState,

    resolver: async (data, context, options) => {
      return zodResolver(rawBsdaSchema)(data, context, options);
    }
  });
  const errorsFromPublishApi = publishErrors || publishErrorsFromRedirect;
  const publishErrorTabIds = getPublishErrorTabIds(
    BsdType.Bsda,
    errorsFromPublishApi
  );

  const formStateErrorsKeys = Object.keys(methods?.formState?.errors);
  const errorTabIds = getErrorTabIds(
    BsdType.Bsda,
    publishErrorTabIds,
    formStateErrorsKeys
  );
  const publishErrorMessages = useMemo(
    () => getPublishErrorMessages(BsdType.Bsda, errorsFromPublishApi),
    [errorsFromPublishApi]
  );
  const [bsdaContext, setBsdaContext] = useState<Bsda | undefined>();

  useEffect(() => {
    if (bsdaQuery.data?.bsda?.id) {
      setBsdaContext(bsdaQuery.data.bsda);
    }
  }, [bsdaQuery.data?.bsda]);

  const tabsContent = useMemo(
    () => ({
      waste: <p>TODO</p>,
      emitter: (
        <EmitterBsda
          errors={publishErrorMessages.filter(
            error => error.tabId === TabId.emitter
          )}
        />
      ),
      worker: (
        <Worker
          errors={publishErrorMessages.filter(
            error => error.tabId === TabId.worker
          )}
        />
      ),
      transporter: <TransporterBsda />,
      destination: (
        <DestinationBsda
          errors={publishErrorMessages.filter(
            error => error.tabId === TabId.destination
          )}
        />
      ),
      other: <p>TODO</p>
    }),
    [publishErrorMessages]
  );

  const loading = false; //creatingDraft || updating || creating; // FIXME
  const mainCtaLabel = formState.id ? "Enregistrer" : "Publier";
  const draftCtaLabel = formState.id ? "" : "Enregistrer en brouillon";

  return (
    <BsdaContext.Provider value={bsdaContext}>
      <FormStepsContent
        bsdType={BsdType.Bsda}
        draftCtaLabel={draftCtaLabel}
        isLoading={loading}
        mainCtaLabel={mainCtaLabel}
        saveForm={() => {}} //FIXME
        useformMethods={methods}
        tabsContent={tabsContent}
        sealedFields={[]} //FIXME
        setPublishErrors={setPublishErrors}
        errorTabIds={errorTabIds}
        genericErrorMessage={publishErrorMessages.filter(
          error => error.tabId === TabId.none
        )}
      />
      {loading && <Loader />}
    </BsdaContext.Provider>
  );
};

export default BsdaFormSteps;
