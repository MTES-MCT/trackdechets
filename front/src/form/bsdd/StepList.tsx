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
import {
  CreateOrUpdateTransporterInput,
  FormFormikValues,
  getInitialState
} from "./utils/initial-state";
import { formSchema } from "./utils/schema";
import { CREATE_FORM, GET_FORM, UPDATE_FORM } from "./utils/queries";
import { GET_BSDS } from "../../Apps/common/queries";
import { Loader } from "../../Apps/common/Components";
import { toastApolloError } from "../common/stepper/toaster";
import { IStepContainerProps } from "../common/stepper/Step";
import {
  CREATE_FORM_TRANSPORTER,
  UPDATE_FORM_TRANSPORTER
} from "../../Apps/Forms/Components/query";
import { isForeignVat } from "shared/constants";
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

  const [createForm, { loading: creating }] = useMutation<
    Pick<Mutation, "createForm">,
    MutationCreateFormArgs
  >(CREATE_FORM, { refetchQueries: [GET_BSDS], awaitRefetchQueries: true });

  const [updateForm, { loading: updating }] = useMutation<
    Pick<Mutation, "updateForm">,
    MutationUpdateFormArgs
  >(UPDATE_FORM, { refetchQueries: [GET_BSDS], awaitRefetchQueries: true });

  const [createFormTransporter, { loading: creatingFormTransporter }] =
    useMutation<
      Pick<Mutation, "createFormTransporter">,
      MutationCreateFormTransporterArgs
    >(CREATE_FORM_TRANSPORTER);

  const [updateFormTransporter, { loading: updatingFormTransporter }] =
    useMutation<
      Pick<Mutation, "updateFormTransporter">,
      MutationUpdateFormTransporterArgs
    >(UPDATE_FORM_TRANSPORTER);

  const loading =
    creating || updating || creatingFormTransporter || updatingFormTransporter;

  function saveForm(formInput: FormInput): Promise<any> {
    const { id, ...input } = formInput;
    return id
      ? updateForm({
          variables: { updateFormInput: { ...input, id } }
        })
      : createForm({ variables: { createFormInput: input } });
  }

  async function saveFormTransporter(
    transporterInput: CreateOrUpdateTransporterInput
  ): Promise<string> {
    const { id, ...input } = transporterInput;

    // S'assure que les données de récépissé transport sont nulles
    // lorsque l'exemption est cochée ou que le transporteur est étranger
    const cleanInput = {
      ...input,
      ...(input.isExemptedOfReceipt || isForeignVat(input?.company?.vatNumber)
        ? {
            receipt: null,
            validityLimit: null,
            department: null
          }
        : {})
    };

    if (id) {
      // Le transporteur existe déjà en base de données, on met
      // juste à jour les infos et on renvoie l'identifiant
      const { errors } = await updateFormTransporter({
        variables: { id, input: cleanInput },
        onError: err => {
          toastApolloError(err);
        }
      });
      if (errors) {
        throw new Error(errors.map(e => e.message).join("\n"));
      }
      return id;
    } else {
      // Le transporteur n'existe pas encore en base, on le crée
      // et on renvoie l'identifiant retourné
      const { data, errors } = await createFormTransporter({
        variables: { input: cleanInput },
        onError: err => {
          toastApolloError(err);
        }
      });
      if (errors) {
        throw new Error(errors.map(e => e.message).join("\n"));
      }
      // if `errors` is not defined then data?.createFormTransporter?.id
      // should be defined. For type safety we return "" if it is not, but
      // it should not hapen
      return data?.createFormTransporter?.id ?? "";
    }
  }

  async function onSubmit(values: FormFormikValues) {
    const {
      temporaryStorageDetail,
      ecoOrganisme,
      grouping,
      transporters,
      ...rest
    } = values;

    let transporterIds: string[] = [];

    try {
      transporterIds = await Promise.all(
        transporters.map(t => saveFormTransporter(t))
      );
    } catch (_) {
      // Si une erreur survient pendant la sauvegarde des données
      // transporteur, on n'essaye même pas de sauvgarder le bordereau
      return;
    }

    const formInput: FormInput = {
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
      transporters: transporterIds
    };

    saveForm(formInput)
      .then(_ => navigate(-1))
      .catch(err => toastApolloError(err));
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
    </>
  );
}
