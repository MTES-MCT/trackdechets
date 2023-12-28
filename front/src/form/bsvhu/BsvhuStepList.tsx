import { useMutation, useQuery } from "@apollo/client";
import React, { ReactElement, useMemo, lazy } from "react";
import { generatePath, useNavigate, useParams } from "react-router-dom";
import routes from "../../Apps/routes";
import { getComputedState } from "../common/getComputedState";
import { IStepContainerProps } from "../common/stepper/Step";
import { toastApolloError } from "../common/stepper/toaster";
import {
  Mutation,
  MutationCreateBsvhuArgs,
  MutationUpdateBsvhuArgs,
  QueryBsvhuArgs,
  Query,
  Bsvhu,
  BsvhuInput
} from "@td/codegen-ui";
import initialState from "./utils/initial-state";
import {
  CREATE_VHU_FORM,
  UPDATE_VHU_FORM,
  GET_VHU_FORM
} from "./utils/queries";
const GenericStepList = lazy(() => import("../common/stepper/GenericStepList"));
interface Props {
  children: (vhuForm: Bsvhu | undefined) => ReactElement;
  formId?: string;
}

export default function BsvhuStepsList(props: Props) {
  const { siret } = useParams<{ siret: string }>();
  const navigate = useNavigate();

  const formQuery = useQuery<Pick<Query, "bsvhu">, QueryBsvhuArgs>(
    GET_VHU_FORM,
    {
      variables: {
        id: props.formId!
      },
      skip: !props.formId,
      fetchPolicy: "network-only"
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
          variables: { id: formState.id, input }
        })
      : createVhuForm({ variables: { input } });
  }

  function onSubmit(values) {
    const { id, ...input } = values;
    saveForm(input)
      .then(_ => {
        // TODO VHU redirect to the correct dashboard
        const redirectTo = generatePath(routes.dashboardv2.bsds.drafts, {
          siret
        });
        navigate(redirectTo);
      })
      .catch(err => toastApolloError(err));
  }

  // As it's a render function, the steps are nested into a `<></>` block
  // So we render then unwrap to get the steps
  const parentOfSteps = props.children(formQuery.data?.bsvhu);
  const steps = parentOfSteps.props
    .children as ReactElement<IStepContainerProps>[];

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
