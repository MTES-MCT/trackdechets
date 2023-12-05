import { useMutation, useQuery } from "@apollo/client";
import React, { lazy, ReactElement, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Loader } from "../../../Apps/common/Components";
import { GET_BSDS } from "../../../Apps/common/queries";
import { getComputedState } from "../../common/getComputedState";

import { IStepContainerProps } from "../../common/stepper/Step";
import {
  Mutation,
  MutationCreateBsdaArgs,
  MutationUpdateBsdaArgs,
  QueryBsdaArgs,
  Query,
  Bsda,
  BsdaInput
} from "codegen-ui";
import initialState from "./initial-state";
import { CREATE_BSDA, UPDATE_BSDA, GET_BSDA } from "./queries";
import omitDeep from "omit-deep-lodash";
import { formInputToastError } from "../../common/stepper/toaster";
import { bsdaValidationSchema } from "./schema";

const GenericStepList = lazy(
  () => import("../../common/stepper/GenericStepList")
);

interface Props {
  children: (bsda: Bsda | undefined) => ReactElement;
  formId?: string;
  initialStep: number;
}
const prefillTransportMode = state => {
  if (!state?.transporter?.transport?.mode) {
    state.transporter.transport.mode = "ROAD";
  }

  return state;
};

export default function BsdaStepsList(props: Props) {
  const navigate = useNavigate();

  const formQuery = useQuery<Pick<Query, "bsda">, QueryBsdaArgs>(GET_BSDA, {
    variables: {
      id: props.formId!
    },
    skip: !props.formId,
    fetchPolicy: "network-only"
  });

  const formState = useMemo(() => {
    const existingBsda = formQuery.data?.bsda;

    const computedState = prefillTransportMode(
      getComputedState(initialState, existingBsda)
    );

    if (existingBsda?.grouping) {
      computedState.grouping = existingBsda.grouping.map(bsda => bsda.id);
    }
    if (existingBsda?.forwarding) {
      computedState.forwarding = existingBsda.forwarding.id;
    }

    if (
      computedState.emitter?.pickupSite &&
      existingBsda?.emitter?.pickupSite === null
    ) {
      computedState.emitter.pickupSite = null;
    }

    if (
      computedState.worker?.certification &&
      existingBsda?.worker?.certification === null
    ) {
      computedState.worker.certification = null;
    }

    return computedState;
  }, [formQuery.data]);

  const [createBsda, { loading: creating }] = useMutation<
    Pick<Mutation, "createBsda">,
    MutationCreateBsdaArgs
  >(CREATE_BSDA, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true
  });

  const [updateBsda, { loading: updating }] = useMutation<
    Pick<Mutation, "updateBsda">,
    MutationUpdateBsdaArgs
  >(UPDATE_BSDA, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true
  });

  const cleanupFields = (input: BsdaInput): BsdaInput => {
    // When created through api, this field might be null in db
    // We send it as false at creation time from the UI, but we dont have any
    // mean to edit it, and it is locked once signed by worker
    // This can lead to unsolvable cases.
    // While waiting a better fix (eg. an editable field or to default the field as false),
    // this function unlocks users

    return omitDeep(input, "worker.work");
  };

  function saveForm(input: BsdaInput): Promise<any> {
    return formState.id
      ? updateBsda({
          variables: { id: formState.id, input: cleanupFields(input) }
        })
      : createBsda({ variables: { input } });
  }

  function onSubmit(values) {
    const { id, ...input } = values;
    saveForm(input)
      .then(_ => {
        navigate(-1);
      })
      .catch(err => formInputToastError(err));
  }

  // As it's a render function, the steps are nested into a `<></>` block
  // So we render then unwrap to get the steps
  const parentOfSteps = props.children(formQuery.data?.bsda);
  const steps = parentOfSteps.props
    .children as ReactElement<IStepContainerProps>[];

  return (
    <>
      <GenericStepList
        children={steps}
        formId={props.formId}
        formQuery={formQuery}
        onSubmit={onSubmit}
        initialValues={formState}
        validationSchema={bsdaValidationSchema}
        initialStep={props.initialStep}
      />
      {(creating || updating) && <Loader />}
    </>
  );
}
