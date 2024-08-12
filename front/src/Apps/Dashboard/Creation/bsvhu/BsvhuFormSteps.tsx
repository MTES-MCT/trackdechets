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
import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import FormStepsContent from "../FormStepsContent";
import { Loader } from "../../../common/Components";
import { getComputedState } from "../getComputedState";
import initialState from "./utils/initial-state";

import { ZodBsvhu, rawBsvhuSchema } from "./schema";
import {
  CREATE_VHU_FORM,
  GET_VHU_FORM,
  UPDATE_VHU_FORM
} from "./utils/queries";
import WasteBsvhu from "./steps/Waste";
import EmitterBsvhu from "./steps/Emitter";
import TransporterBsvhu from "./steps/Transporter";
import { isStepDisabled } from "./steps/isStepDisabled";
import { useParams } from "react-router-dom";
import DestinationBsvhu from "./steps/Destination";

interface Props {
  bsdId?: string;
}
const BsvhuFormSteps = ({ bsdId }: Readonly<Props>) => {
  const { siret, id } = useParams<{ id?: string; siret: string }>();

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
  >(CREATE_VHU_FORM); // FIXME draft

  const [createVhuForm, { loading: creating }] = useMutation<
    Pick<Mutation, "createBsvhu">,
    MutationCreateBsvhuArgs
  >(CREATE_VHU_FORM);

  const [updateVhuForm, { loading: updating }] = useMutation<
    Pick<Mutation, "updateBsvhu">,
    MutationUpdateBsvhuArgs
  >(UPDATE_VHU_FORM);

  const loading = creatingDraft || updating || creating;
  const mainCtaLabel = formState.id ? "Enregistrer" : "Publier";
  const draftCtaLabel = formState.id ? "" : "Enregistrer en brouillon";

  const saveForm = (input: BsvhuInput, draft: boolean): Promise<any> => {
    if (formState.id!) {
      return updateVhuForm({
        variables: { id: formState.id, input }
      });
    } else {
      if (draft) {
        return createDraftVhuForm({ variables: { input } });
      } else {
        return createVhuForm({ variables: { input } });
      }
    }
  };

  const emitter = formState?.emitter;
  const transporter = formState?.transporter;
  const isDisabled = isStepDisabled(emitter, transporter, siret, id);

  const tabsContent = {
    waste: <WasteBsvhu isDisabled={isDisabled} />,
    emitter: <EmitterBsvhu isDisabled={isDisabled} />,
    transporter: <TransporterBsvhu isDisabled={isDisabled} />,
    destination: <DestinationBsvhu isDisabled={isDisabled} />
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
      />
      {loading && <Loader />}
    </>
  );
};

export default BsvhuFormSteps;
