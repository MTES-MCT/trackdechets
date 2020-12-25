import { useMutation, useQuery } from "@apollo/client";
import cogoToast from "cogo-toast";
import routes from "common/routes";
import GenericStepList, {
  getComputedState,
} from "form/stepper/GenericStepList";
import { IStepContainerProps } from "form/stepper/Step";
import {
  Mutation,
  MutationCreateVhuFormArgs,
  MutationEditVhuFormArgs,
  Query,
  QueryVhuFormArgs,
  VhuFormInput,
} from "generated/graphql/types";
import React, { ReactElement, useMemo } from "react";
import { generatePath, useHistory, useParams } from "react-router-dom";
import initialState from "./initial-state";
import { CREATE_VHU_FORM, EDIT_VHU_FORM, GET_VHU_FORM } from "./queries";

interface Props {
  children: ReactElement<IStepContainerProps>[];
  formId?: string;
}

export default function VhuStepsList(props: Props) {
  const { siret } = useParams<{ siret: string }>();
  const history = useHistory();

  const formQuery = useQuery<Pick<Query, "vhuForm">, QueryVhuFormArgs>(
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
    () => getComputedState(initialState, formQuery.data?.vhuForm),
    [formQuery.data]
  );

  const [createVhuForm] = useMutation<
    Pick<Mutation, "createVhuForm">,
    MutationCreateVhuFormArgs
  >(CREATE_VHU_FORM);

  const [editVhuForm] = useMutation<
    Pick<Mutation, "editVhuForm">,
    MutationEditVhuFormArgs
  >(EDIT_VHU_FORM);

  function saveForm(vhuFormInput: VhuFormInput): Promise<any> {
    return formState.id
      ? editVhuForm({
          variables: { id: formState.id, vhuFormInput },
        })
      : createVhuForm({ variables: { vhuFormInput } });
  }

  function onSubmit(e, values) {
    e.preventDefault();
    // As we want to be able to save draft, we skip validation on submit
    // and don't use the classic Formik mechanism

    saveForm(values)
      .then(_ => {
        // TODO VHU redirect to the correct dashboard
        const redirectTo = generatePath(routes.dashboard.slips.drafts, {
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

  return (
    <GenericStepList
      children={props.children}
      formId={props.formId}
      formQuery={formQuery}
      onSubmit={onSubmit}
      initialValues={formState}
      validationSchema={null}
    />
  );
}
