import { useMutation, useQuery } from "@apollo/client";
import cogoToast from "cogo-toast";
import { updateApolloCache } from "common/helper";
import routes from "common/routes";
import { DRAFT_TAB_FORMS } from "dashboard/bsds/queries";
import {
  Form,
  FormInput,
  Mutation,
  MutationCreateFormArgs,
  MutationUpdateFormArgs,
  Query,
  QueryFormArgs,
} from "generated/graphql/types";
import React, { ReactElement, useMemo } from "react";
import { generatePath, useHistory, useParams } from "react-router-dom";
import { getInitialState } from "./utils/initial-state";
import { formSchema } from "./utils/schema";
import GenericStepList from "../common/stepper/GenericStepList";
import { CREATE_FORM, GET_FORM, UPDATE_FORM } from "./utils/queries";
import { IStepContainerProps } from "../common/stepper/Step";

interface Props {
  children: ReactElement<IStepContainerProps>[];
  formId?: string;
}
export default function StepsList(props: Props) {
  const { siret } = useParams<{ siret: string }>();
  const history = useHistory();

  const formQuery = useQuery<Pick<Query, "form">, QueryFormArgs>(GET_FORM, {
    variables: {
      id: props.formId!,
      readableId: null,
    },
    skip: !props.formId,
    fetchPolicy: "network-only",
  });

  const formState = useMemo(() => getInitialState(formQuery.data?.form), [
    formQuery.data,
  ]);

  const [createForm] = useMutation<
    Pick<Mutation, "createForm">,
    MutationCreateFormArgs
  >(CREATE_FORM, {
    update: (store, { data }) => {
      if (!data?.createForm) {
        return;
      }
      const createdForm = data.createForm;
      updateApolloCache<{ forms: Form[] }>(store, {
        query: DRAFT_TAB_FORMS,
        variables: { siret },
        getNewData: data => ({
          forms: [
            createdForm,
            ...data.forms.filter(f => f.id !== createdForm.id),
          ],
        }),
      });
    },
  });

  const [updateForm] = useMutation<
    Pick<Mutation, "updateForm">,
    MutationUpdateFormArgs
  >(UPDATE_FORM);

  function saveForm(formInput: FormInput): Promise<any> {
    const { id, ...input } = formInput;
    return id
      ? updateForm({
          variables: { updateFormInput: { ...input, id } },
        })
      : createForm({ variables: { createFormInput: input } });
  }

  const redirectTo =
    formQuery.data?.form?.status === "SEALED"
      ? generatePath(routes.dashboard.bsds.follow, { siret })
      : generatePath(routes.dashboard.bsds.drafts, { siret });

  function onSubmit(e, values) {
    const { temporaryStorageDetail, ecoOrganisme, ...rest } = values;

    const formInput = {
      ...rest,
      // discard temporaryStorageDetail if recipient.isTempStorage === false
      ...(values.recipient?.isTempStorage === true
        ? { temporaryStorageDetail }
        : { temporaryStorageDetail: null }),
      // discard ecoOrganisme if not selected
      ...(ecoOrganisme?.siret ? { ecoOrganisme } : { ecoOrganisme: null }),
    };

    e.preventDefault();
    // As we want to be able to save draft, we skip validation on submit
    // and don't use the classic Formik mechanism

    saveForm(formInput)
      .then(_ => history.push(redirectTo))
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
      validationSchema={formSchema}
    />
  );
}
