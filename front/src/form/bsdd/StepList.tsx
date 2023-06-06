import { useMutation, useQuery } from "@apollo/client";
import {
  Form,
  FormInput,
  Mutation,
  MutationCreateFormArgs,
  MutationUpdateFormArgs,
  Query,
  QueryFormArgs,
} from "generated/graphql/types";
import React, { ReactElement, useMemo, lazy } from "react";
import { useHistory } from "react-router-dom";
import { getInitialState } from "./utils/initial-state";
import { formSchema } from "./utils/schema";
import { CREATE_FORM, GET_FORM, UPDATE_FORM } from "./utils/queries";
import { GET_BSDS } from "common/queries";
import { Loader } from "common/components";
import { formInputToastError } from "form/common/stepper/toaster";
import { IStepContainerProps } from "form/common/stepper/Step";
const GenericStepList = lazy(
  () => import("form/common/stepper/GenericStepList")
);
interface Props {
  children: (form: Form | undefined) => ReactElement;
  formId?: string;
}

export default function StepsList(props: Props) {
  const history = useHistory();

  const formQuery = useQuery<Pick<Query, "form">, QueryFormArgs>(GET_FORM, {
    variables: {
      id: props.formId!,
      readableId: null,
    },
    skip: !props.formId,
    fetchPolicy: "network-only",
  });

  const formState = useMemo(
    () => getInitialState(formQuery.data?.form),
    [formQuery.data]
  );

  const [createForm, { loading: creating }] = useMutation<
    Pick<Mutation, "createForm">,
    MutationCreateFormArgs
  >(CREATE_FORM, { refetchQueries: [GET_BSDS], awaitRefetchQueries: true });

  const [updateForm, { loading: updating }] = useMutation<
    Pick<Mutation, "updateForm">,
    MutationUpdateFormArgs
  >(UPDATE_FORM, { refetchQueries: [GET_BSDS], awaitRefetchQueries: true });

  function saveForm(formInput: FormInput): Promise<any> {
    const { id, ...input } = formInput;
    return id
      ? updateForm({
          variables: { updateFormInput: { ...input, id } },
        })
      : createForm({ variables: { createFormInput: input } });
  }

  function onSubmit(values) {
    const { temporaryStorageDetail, ecoOrganisme, grouping, ...rest } = values;

    const formInput = {
      ...rest,
      // discard temporaryStorageDetail if recipient.isTempStorage === false
      ...(values.recipient?.isTempStorage === true
        ? { temporaryStorageDetail }
        : { temporaryStorageDetail: null }),
      // discard ecoOrganisme if not selected
      ...(ecoOrganisme?.siret ? { ecoOrganisme } : { ecoOrganisme: null }),
      ...(grouping?.length
        ? {
            grouping: grouping.map(({ form, quantity }) => ({
              form: { id: form.id },
              quantity,
            })),
          }
        : {}),
    };

    saveForm(formInput)
      .then(_ => history.goBack())
      .catch(err => formInputToastError(err));
  }

  // As it's a render function, the steps are nested into a `<></>` block
  // So we render then unwrap to get the steps
  const parentOfSteps = props.children(formQuery.data?.form);
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
        validationSchema={formSchema}
      />
      {(creating || updating) && <Loader />}
    </>
  );
}
