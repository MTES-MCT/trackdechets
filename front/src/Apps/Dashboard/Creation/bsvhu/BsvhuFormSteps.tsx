import { useMutation, useQuery } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BsdType,
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
} from "../../../../Apps/common/queries/bsvhu/queries";
import { cleanPayload } from "../bspaoh/utils/payload";
import {
  getErrorTabIds,
  getPublishErrorMessages,
  getPublishErrorTabIds,
  TabId
} from "../utils";
import OtherActors from "./steps/OtherActors";

const vhuToInput = (vhu: ZodBsvhu): BsvhuInput => {
  return omitDeep(vhu, [
    "isDraft",
    "ecoOrganisme.hasEcoOrganisme",
    "hasTrader",
    ...(!vhu.hasTrader ? ["trader"] : []),
    "hasBroker",
    ...(!vhu.hasBroker ? ["broker"] : []),
    "hasIntermediaries",
    ...(!vhu.hasIntermediaries ? ["intermediaries"] : [])
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

  const saveForm = (input: ZodBsvhu, draft: boolean): Promise<any> => {
    const cleanedInput = vhuToInput(input);
    if (formState.id!) {
      return updateVhuForm({
        variables: { id: formState.id, input: cleanedInput }
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

  const errorsFromPublishApi = publishErrors || publishErrorsFromRedirect;
  const publishErrorTabIds = getPublishErrorTabIds(
    BsdType.Bsvhu,
    errorsFromPublishApi
  );
  const formStateErrorsKeys = Object.keys(methods?.formState?.errors);
  const errorTabIds = getErrorTabIds(
    BsdType.Bsvhu,
    publishErrorTabIds,
    formStateErrorsKeys
  );

  const publishErrorMessages = useMemo(
    () => getPublishErrorMessages(BsdType.Bsvhu, errorsFromPublishApi),
    [errorsFromPublishApi]
  );
  const createdAt = formQuery.data?.bsvhu.createdAt
    ? new Date(formQuery.data?.bsvhu.createdAt)
    : null;

  // Date de la MAJ 2024.12.1 qui modifie les règles de validation de BsvhuInput.packaging et identification.type
  const v20241201Date =
    import.meta.env.VITE_OVERRIDE_V20241201 || "2024-12-18T00:00:00.000";

  const v20241201 = new Date(v20241201Date);

  const createdBeforeV20241201 = Boolean(
    createdAt && createdAt.getTime() < v20241201.getTime()
  );

  const tabsContent = useMemo(
    () => ({
      waste: (
        <WasteBsvhu
          errors={publishErrorMessages.filter(
            error => error.tabId === TabId.waste
          )}
          createdBeforeV20241201={createdBeforeV20241201}
        />
      ),
      emitter: (
        <EmitterBsvhu
          errors={publishErrorMessages.filter(
            error => error.tabId === TabId.emitter
          )}
        />
      ),
      transporter: (
        <TransporterBsvhu
          errors={publishErrorMessages.filter(
            error => error.tabId === TabId.transporter
          )}
        />
      ),
      destination: (
        <DestinationBsvhu
          errors={publishErrorMessages.filter(
            error => error.tabId === TabId.destination
          )}
        />
      ),
      other: <OtherActors />
    }),
    [publishErrorMessages, createdBeforeV20241201]
  );

  return (
    <>
      <FormStepsContent
        bsdType={BsdType.Bsvhu}
        draftCtaLabel={draftCtaLabel}
        isLoading={loading}
        mainCtaLabel={mainCtaLabel}
        saveForm={saveForm}
        useformMethods={methods}
        tabsContent={tabsContent}
        sealedFields={sealedFields}
        setPublishErrors={setPublishErrors}
        errorTabIds={errorTabIds}
        genericErrorMessage={publishErrorMessages.filter(
          error => error.tabId === TabId.none
        )}
      />
      {loading && <Loader />}
    </>
  );
};

export default BsvhuFormSteps;
