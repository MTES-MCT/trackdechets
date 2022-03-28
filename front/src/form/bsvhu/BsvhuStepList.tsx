import { useMutation, useQuery } from "@apollo/client";
import cogoToast from "cogo-toast";
import routes from "common/routes";
import GenericStepList, {
  getComputedState,
} from "form/common/stepper/GenericStepList";
import { IStepContainerProps } from "form/common/stepper/Step";
import {
  Mutation,
  MutationCreateBsvhuArgs,
  MutationUpdateBsvhuArgs,
  QueryBsvhuArgs,
  Query,
  Bsvhu,
  BsvhuInput,
} from "generated/graphql/types";
import React, { ReactElement, useMemo } from "react";
import { generatePath, useHistory, useParams } from "react-router-dom";
import initialState from "./utils/initial-state";
import {
  CREATE_VHU_FORM,
  UPDATE_VHU_FORM,
  GET_VHU_FORM,
} from "./utils/queries";

interface Props {
  children: (vhuForm: Bsvhu | undefined) => ReactElement;
  formId?: string;
}

export default function BsvhuStepsList(props: Props) {
  const { siret } = useParams<{ siret: string }>();
  const history = useHistory();

  const formQuery = useQuery<Pick<Query, "bsvhu">, QueryBsvhuArgs>(
    GET_VHU_FORM,
    {
      variables: {
        id: props.formId!,
      },
      skip: !props.formId,
      fetchPolicy: "network-only",
    }
  );

  const formState = useMemo(
    () => getComputedState(initialState, formQuery.data?.bsvhu),
    [formQuery.data]
  );

  const [createVhuForm] = useMutation<
    Pick<Mutation, "createBsvhu">,
    MutationCreateBsvhuArgs
  >(CREATE_VHU_FORM);

  const [updateVhuForm] = useMutation<
    Pick<Mutation, "updateBsvhu">,
    MutationUpdateBsvhuArgs
  >(UPDATE_VHU_FORM);

  function saveForm(input: BsvhuInput): Promise<any> {
    return formState.id
      ? updateVhuForm({
          variables: { id: formState.id, input },
        })
      : createVhuForm({ variables: { input } });
  }

  function onSubmit(values) {
    const { id, ...input } = values;
    saveForm(input)
      .then(_ => {
        // TODO VHU redirect to the correct dashboard
        const redirectTo = generatePath(routes.dashboard.bsds.drafts, {
          siret,
        });
        history.push(redirectTo);
      })
      .catch(err => {
        err.graphQLErrors.length &&
          err.graphQLErrors.map(err =>
            cogoToast.error(err.message, { hideAfter: 7 })
          );
        err.message && cogoToast.error(err.message, { hideAfter: 7 });
      });
  }

  // As it's a render function, the steps are nested into a `<></>` block
  // So we render then unwrap to get the steps
  const parentOfSteps = props.children(formQuery.data?.bsvhu);
  const steps = parentOfSteps.props.children as ReactElement<
    IStepContainerProps
  >[];

  return (
    <GenericStepList
      children={steps}
      formId={props.formId}
      formQuery={formQuery}
      onSubmit={onSubmit}
      initialValues={formState}
      validationSchema={null}
    />
  );
}
