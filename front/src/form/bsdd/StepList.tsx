import { useMutation, useQuery } from "@apollo/client";
import {
  EmitterType,
  Form,
  FormInput,
  Mutation,
  MutationCreateFormArgs,
  MutationCreateFormTransporterArgs,
  MutationUpdateFormArgs,
  MutationUpdateFormTransporterArgs,
  Query,
  QueryFormArgs,
  TransportMode
} from "@td/codegen-ui";
import React, { ReactElement, useMemo, lazy } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreateOrUpdateTransporterInput,
  FormFormikValues,
  getInitialState
} from "./utils/initial-state";
import { formSchema } from "./utils/schema";
import { Loader } from "../../Apps/common/Components";
import { toastApolloError } from "../../Apps/Dashboard/Creation/toaster";
import { IStepContainerProps } from "../common/stepper/Step";
import {
  CREATE_FORM_TRANSPORTER,
  UPDATE_FORM_TRANSPORTER
} from "../../Apps/Forms/Components/query";
import { isForeignVat } from "@td/constants";
import {
  CREATE_FORM,
  GET_FORM,
  UPDATE_FORM
} from "../../Apps/common/queries/bsdd/queries";
import { cleanPackagings } from "../../Apps/Forms/Components/PackagingList/helpers";
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
  >(CREATE_FORM);

  const [updateForm, { loading: updating }] = useMutation<
    Pick<Mutation, "updateForm">,
    MutationUpdateFormArgs
  >(UPDATE_FORM);

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
    const { id, takenOverAt, ...input } = transporterInput;

    // S'assure que les données de récépissé transport sont nulles dans les
    // cas suivants :
    // - l'exemption est cochée
    // - le transporteur est étranger
    // - le transport ne se fait pas par la route
    const cleanInput = {
      ...input,
      ...(input.isExemptedOfReceipt ||
      isForeignVat(input?.company?.vatNumber) ||
      input.mode !== TransportMode.Road
        ? {
            receipt: null,
            validityLimit: null,
            department: null
          }
        : {})
    };

    if (id) {
      // Le transporteur existe déjà en base de données, on met
      // à jour les infos (uniquement si le transporteur n'a pas encore
      // pris en charge le déchet) et on renvoie l'identifiant
      if (!takenOverAt) {
        const { errors } = await updateFormTransporter({
          variables: { id, input: cleanInput },
          onError: err => {
            toastApolloError(err);
          }
        });
        if (errors) {
          throw new Error(errors.map(e => e.message).join("\n"));
        }
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
    const initialForm = formQuery?.data?.form;

    // Hotfix Zammad #43735
    // COMPAT suite à TRA-14522 https://github.com/MTES-MCT/trackdechets/pull/3717
    // La valeur de `isSubjectToADR` sur les bordereaux historiques est `null`.
    // Or dans ce cas, le switch "Le déchet est soumis à l'ADR" est initialisé
    // à `false`. Lors d'une modififcation d'un BSDD, `false` était envoyé
    // et une erreur de verrouillage de champ était levée.
    if (
      !!initialForm?.emittedAt &&
      values.wasteDetails?.isSubjectToADR === false &&
      initialForm?.wasteDetails?.isSubjectToADR === null
    ) {
      values.wasteDetails.isSubjectToADR = null;
    }

    const {
      temporaryStorageDetail,
      ecoOrganisme,
      grouping,
      transporters,
      isDuplicateOf,
      wasteDetails,
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

    const packagingInfos = cleanPackagings(wasteDetails?.packagingInfos ?? []);

    const formInput: FormInput = {
      ...rest,
      wasteDetails: {
        ...wasteDetails,
        packagingInfos
      },
      // discard temporaryStorageDetail if recipient.isTempStorage === false
      ...(values.recipient?.isTempStorage === true
        ? { temporaryStorageDetail }
        : { temporaryStorageDetail: null }),
      // discard ecoOrganisme if not selected
      ...(ecoOrganisme?.siret ? { ecoOrganisme } : { ecoOrganisme: null }),
      ...(grouping
        ? {
            grouping: grouping
              .map(({ form, quantity }) => ({
                form: { id: form.id },
                // quantity peut être égal à "" dans le
                // cas où l'input est laissé vide dans le sélecteur
                // d'annexes 2
                quantity: Number(quantity)
              }))
              .filter(g =>
                rest?.emitter?.type === EmitterType.Appendix2
                  ? // Ne permet pas d'ajouter une annexe 2 avec une quantité égale à 0
                    g.quantity > 0
                  : true
              )
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
