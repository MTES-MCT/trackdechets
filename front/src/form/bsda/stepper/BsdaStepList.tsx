import { useMutation, useQuery } from "@apollo/client";
import cogoToast from "cogo-toast";
import { Loader } from "common/components";
import { GET_BSDS } from "common/queries";
import routes from "common/routes";
import GenericStepList, {
  getComputedState,
} from "form/common/stepper/GenericStepList";
import { IStepContainerProps } from "form/common/stepper/Step";
import {
  Mutation,
  MutationCreateBsdaArgs,
  MutationUpdateBsdaArgs,
  QueryBsdaArgs,
  Query,
  Bsda,
  BsdaInput,
} from "generated/graphql/types";
import React, { ReactElement, useMemo } from "react";
import { generatePath, useHistory, useParams } from "react-router-dom";
import initialState from "./initial-state";
import { CREATE_BSDA, UPDATE_BSDA, GET_BSDA } from "./queries";

interface Props {
  children: (bsda: Bsda | undefined) => ReactElement;
  formId?: string;
  initialStep: number;
}

export default function BsdaStepsList(props: Props) {
  const { siret } = useParams<{ siret: string }>();
  const history = useHistory();

  const formQuery = useQuery<Pick<Query, "bsda">, QueryBsdaArgs>(GET_BSDA, {
    variables: {
      id: props.formId!,
    },
    skip: !props.formId,
    fetchPolicy: "network-only",
  });

  const formState = useMemo(
    () => getComputedState(initialState, formQuery.data?.bsda),
    [formQuery.data]
  );

  const [createBsda, { loading: creating }] = useMutation<
    Pick<Mutation, "createBsda">,
    MutationCreateBsdaArgs
  >(CREATE_BSDA, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
  });

  const [updateBsda, { loading: updating }] = useMutation<
    Pick<Mutation, "updateBsda">,
    MutationUpdateBsdaArgs
  >(UPDATE_BSDA, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
  });

  function saveForm(input: BsdaInput): Promise<any> {
    return formState.id
      ? updateBsda({
          variables: { id: formState.id, input },
        })
      : createBsda({ variables: { input } });
  }

  function onSubmit(values) {
    const { id, ...input } = values;
    saveForm(input)
      .then(_ => {
        const redirectTo = generatePath(routes.dashboard.bsds.drafts, {
          siret,
        });
        history.push(redirectTo);
      })
      .catch(err => {
        err.graphQLErrors.map(err =>
          cogoToast.error(err.message, { hideAfter: 7 })
        );
      });
  }

  // As it's a render function, the steps are nested into a `<></>` block
  // So we render then unwrap to get the steps
  const parentOfSteps = props.children(formQuery.data?.bsda);
  const steps = parentOfSteps.props.children as ReactElement<
    IStepContainerProps
  >[];

  return (
    <>
      <GenericStepList
        children={steps}
        formId={props.formId}
        formQuery={formQuery}
        onSubmit={onSubmit}
        initialValues={formState}
        validationSchema={null}
        initialStep={props.initialStep}
      />
      {(creating || updating) && <Loader />}
    </>
  );
}
