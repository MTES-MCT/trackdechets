import { useMutation, useQuery } from "@apollo/client";
import cogoToast from "cogo-toast";
import routes from "common/routes";
import {
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
import { GET_BSDS } from "common/queries";
import { Loader } from "common/components";

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

  const redirectTo =
    formQuery.data?.form?.status === "SEALED"
      ? generatePath(routes.dashboard.bsds.follow, { siret })
      : generatePath(routes.dashboard.bsds.drafts, { siret });

  function onSubmit(values) {
    const {
      temporaryStorageDetail,
      ecoOrganisme,
      appendix2Forms,
      ...rest
    } = values;

    const formInput = {
      ...rest,
      // discard temporaryStorageDetail if recipient.isTempStorage === false
      ...(values.recipient?.isTempStorage === true
        ? { temporaryStorageDetail }
        : { temporaryStorageDetail: null }),
      // discard ecoOrganisme if not selected
      ...(ecoOrganisme?.siret ? { ecoOrganisme } : { ecoOrganisme: null }),
      ...(appendix2Forms?.length
        ? { appendix2Forms: appendix2Forms.map(f => ({ id: f.id })) }
        : {}),
    };

    saveForm(formInput)
      .then(_ => history.push(redirectTo))
      .catch(err => {
        err.graphQLErrors.length &&
          err.graphQLErrors.map(err =>
            cogoToast.error(err.message, { hideAfter: 7 })
          );
        err.message && cogoToast.error(err.message, { hideAfter: 7 });
      });
  }

  return (
    <>
      <GenericStepList
        children={props.children}
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
