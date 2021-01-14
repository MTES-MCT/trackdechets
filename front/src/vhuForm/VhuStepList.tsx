import { useMutation, useQuery } from "@apollo/client";
import cogoToast from "cogo-toast";
import routes from "common/routes";
import GenericStepList, {
  getComputedState,
} from "form/stepper/GenericStepList";
import { IStepContainerProps } from "form/stepper/Step";
import {
  BordereauVhuMutation,
  BordereauVhuMutationCreateArgs,
  BordereauVhuMutationUpdateArgs,
  BordereauVhuQueryFindUniqueArgs,
  Query,
  VhuForm,
  VhuFormInput,
} from "generated/graphql/types";
import React, { ReactElement, useMemo } from "react";
import { generatePath, useHistory, useParams } from "react-router-dom";
import initialState from "./initial-state";
import { CREATE_VHU_FORM, UPDATE_VHU_FORM, GET_VHU_FORM } from "./queries";

interface Props {
  children: (vhuForm: VhuForm | undefined) => ReactElement;
  formId?: string;
}

export default function VhuStepsList(props: Props) {
  const { siret } = useParams<{ siret: string }>();
  const history = useHistory();

  const formQuery = useQuery<
    Pick<Query, "bordereauVhu">,
    BordereauVhuQueryFindUniqueArgs
  >(GET_VHU_FORM, {
    variables: {
      id: props.formId!,
    },
    skip: !props.formId,
    fetchPolicy: "network-only",
  });

  const formState = useMemo(
    () =>
      getComputedState(initialState, formQuery.data?.bordereauVhu?.findUnique),
    [formQuery.data]
  );

  const [createVhuForm] = useMutation<
    Pick<BordereauVhuMutation, "create">,
    BordereauVhuMutationCreateArgs
  >(CREATE_VHU_FORM);

  const [updateVhuForm] = useMutation<
    Pick<BordereauVhuMutation, "update">,
    BordereauVhuMutationUpdateArgs
  >(UPDATE_VHU_FORM);

  function saveForm(input: VhuFormInput): Promise<any> {
    return formState.id
      ? updateVhuForm({
          variables: { id: formState.id, input },
        })
      : createVhuForm({ variables: { input } });
  }

  function onSubmit(e, values) {
    e.preventDefault();
    // As we want to be able to save draft, we skip validation on submit
    // and don't use the classic Formik mechanism

    const { id, ...input } = values;
    saveForm(input)
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

  // As it's a render function, the steps are nested into a `<></>` block
  // So we render then unwrap to get the steps
  const parentOfSteps = props.children(
    formQuery.data?.bordereauVhu?.findUnique
  );
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
