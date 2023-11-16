import { useMutation, useQuery } from "@apollo/client";
import {
  Form,
  FormInput,
  Mutation,
  MutationCreateFormArgs,
  MutationCreateFormTransporterArgs,
  MutationUpdateFormArgs,
  MutationUpdateFormTransporterArgs,
  Query,
  QueryFormArgs
} from "codegen-ui";
import React, { ReactElement, useMemo, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { FormFormikValues, getInitialState } from "./utils/initial-state";
import { formSchema } from "./utils/schema";
import { CREATE_FORM, GET_FORM, UPDATE_FORM } from "./utils/queries";
import { GET_BSDS } from "../../Apps/common/queries";
import { Loader } from "../../Apps/common/Components";
import { formInputToastError } from "../common/stepper/toaster";
import { IStepContainerProps } from "../common/stepper/Step";
import {
  CREATE_FORM_TRANSPORTER,
  UPDATE_FORM_TRANSPORTER
} from "../../Apps/Forms/Components/query";
import { NotificationError } from "../../Apps/common/Components/Error/Error";
const GenericStepList = lazy(() => import("../common/stepper/GenericStepList"));
interface Props {
  children: (form: Form | undefined) => ReactElement;
  formId?: string;
}

export default function StepsList(props: Props) {
  const navigate = useNavigate();

  const formQuery = useQuery<Pick<Query, "form">, QueryFormArgs>(GET_FORM, {
    variables: {
      id: props.formId!,
      readableId: null
    },
    skip: !props.formId,
    fetchPolicy: "network-only"
  });

  const formState = useMemo(
    () => getInitialState(formQuery.data?.form),
    [formQuery.data]
  );

  const [createForm, { loading: creating, error: createFormError }] =
    useMutation<Pick<Mutation, "createForm">, MutationCreateFormArgs>(
      CREATE_FORM,
      { refetchQueries: [GET_BSDS], awaitRefetchQueries: true }
    );

  const [updateForm, { loading: updating, error: updateFormError }] =
    useMutation<Pick<Mutation, "updateForm">, MutationUpdateFormArgs>(
      UPDATE_FORM,
      { refetchQueries: [GET_BSDS], awaitRefetchQueries: true }
    );

  const [
    createFormTransporter,
    { loading: creatingFormTransporter, error: createFormTransporterError }
  ] = useMutation<
    Pick<Mutation, "createFormTransporter">,
    MutationCreateFormTransporterArgs
  >(CREATE_FORM_TRANSPORTER);

  const [
    updateFormTransporter,
    { loading: updatingFormTransporter, error: updateFormTransporterError }
  ] = useMutation<
    Pick<Mutation, "updateFormTransporter">,
    MutationUpdateFormTransporterArgs
  >(UPDATE_FORM_TRANSPORTER);

  const loading =
    creating || updating || creatingFormTransporter || updatingFormTransporter;

  const error =
    createFormError ||
    updateFormError ||
    createFormTransporterError ||
    updateFormTransporterError;

  function saveForm(formInput: FormInput): Promise<any> {
    const { id, ...input } = formInput;
    return id
      ? updateForm({
          variables: { updateFormInput: { ...input, id } }
        })
      : createForm({ variables: { createFormInput: input } });
  }

  async function onSubmit(values: FormFormikValues) {
    const {
      temporaryStorageDetail,
      ecoOrganisme,
      grouping,
      transporters,
      ...rest
    } = values;

    const formTransportersIds = await Promise.all(
      transporters.map(async t => {
        if (t.id) {
          const { id, ...input } = t;
          await updateFormTransporter({
            variables: { id: t.id, input }
          });
          return id;
        } else {
          const { data } = await createFormTransporter({
            variables: { input: t }
          });
          return data?.createFormTransporter?.id;
        }
      })
    );

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
              quantity
            }))
          }
        : {}),
      transporters: formTransportersIds.filter(Boolean)
    };

    saveForm(formInput)
      .then(_ => navigate(-1))
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
      {loading && <Loader />}
      {error && <NotificationError apolloError={error} />}
    </>
  );
}
