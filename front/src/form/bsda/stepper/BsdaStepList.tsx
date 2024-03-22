import { useMutation, useQuery } from "@apollo/client";
import React, { lazy, ReactElement, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Loader } from "../../../Apps/common/Components";
import { IStepContainerProps } from "../../common/stepper/Step";
import {
  Mutation,
  MutationCreateBsdaArgs,
  MutationUpdateBsdaArgs,
  QueryBsdaArgs,
  Query,
  Bsda,
  BsdaInput,
  BsdaType
} from "@td/codegen-ui";
import { getInitialState } from "./initial-state";
import { CREATE_BSDA, UPDATE_BSDA, GET_BSDA } from "./queries";
import omitDeep from "omit-deep-lodash";
import { toastApolloError } from "../../common/stepper/toaster";
import { bsdaValidationSchema } from "./schema";

const GenericStepList = lazy(
  () => import("../../common/stepper/GenericStepList")
);

interface Props {
  children: (bsda: Bsda | undefined) => ReactElement;
  formId?: string;
  initialStep: number;
}

export default function BsdaStepsList(props: Props) {
  const navigate = useNavigate();

  const bsdaQuery = useQuery<Pick<Query, "bsda">, QueryBsdaArgs>(GET_BSDA, {
    variables: {
      id: props.formId!
    },
    skip: !props.formId,
    fetchPolicy: "network-only"
  });

  const bsdaState = useMemo(() => {
    const existingBsda = bsdaQuery.data?.bsda;
    return getInitialState(existingBsda);
  }, [bsdaQuery.data]);

  const [createBsda, { loading: creating }] = useMutation<
    Pick<Mutation, "createBsda">,
    MutationCreateBsdaArgs
  >(CREATE_BSDA);

  const [updateBsda, { loading: updating }] = useMutation<
    Pick<Mutation, "updateBsda">,
    MutationUpdateBsdaArgs
  >(UPDATE_BSDA);

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
    const cleanInput =
      input.type === BsdaType.Collection_2710
        ? // s'assure qu'on ne crée pas un transporteur "vide"
          // dans le cadre d'un BSDA de collecte en déchetterie
          // qui n'autorise pas l'ajout de transporteur
          { ...input, transporter: null }
        : input;

    return bsdaState.id
      ? updateBsda({
          variables: { id: bsdaState.id, input: cleanupFields(cleanInput) }
        })
      : createBsda({ variables: { input: cleanInput } });
  }

  function onSubmit(values) {
    const { id, ...input } = values;
    saveForm(input)
      .then(_ => {
        navigate(-1);
      })
      .catch(err => toastApolloError(err));
  }

  // As it's a render function, the steps are nested into a `<></>` block
  // So we render then unwrap to get the steps
  const parentOfSteps = props.children(bsdaQuery.data?.bsda);
  const steps = parentOfSteps.props
    .children as ReactElement<IStepContainerProps>[];

  return (
    <>
      <GenericStepList
        children={steps}
        formId={props.formId}
        formQuery={bsdaQuery}
        onSubmit={onSubmit}
        initialValues={bsdaState}
        validationSchema={bsdaValidationSchema}
        initialStep={props.initialStep}
      />
      {(creating || updating) && <Loader />}
    </>
  );
}
