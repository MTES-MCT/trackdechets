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
  BsdaType,
  TransportMode,
  MutationCreateBsdaTransporterArgs,
  MutationUpdateBsdaTransporterArgs,
  BsdaTransporterInput
} from "@td/codegen-ui";
import {
  BsdaFormikValues,
  CreateOrUpdateBsdaTransporterInput,
  getInitialState
} from "./initial-state";
import { CREATE_BSDA, UPDATE_BSDA, GET_BSDA } from "./queries";
import omitDeep from "omit-deep-lodash";
import { toastApolloError } from "../../common/stepper/toaster";
import { bsdaValidationSchema } from "./schema";
import {
  CREATE_BSDA_TRANSPORTER,
  UPDATE_BSDA_TRANSPORTER
} from "../../../Apps/Forms/Components/query";
import { isForeignVat } from "@td/constants";

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

  const [createBsdaTransporter, { loading: creatingBsdaTransporter }] =
    useMutation<
      Pick<Mutation, "createBsdaTransporter">,
      MutationCreateBsdaTransporterArgs
    >(CREATE_BSDA_TRANSPORTER);

  const [updateBsdaTransporter, { loading: updatingBsdaTransporter }] =
    useMutation<
      Pick<Mutation, "updateBsdaTransporter">,
      MutationUpdateBsdaTransporterArgs
    >(UPDATE_BSDA_TRANSPORTER);

  const loading =
    creating || updating || creatingBsdaTransporter || updatingBsdaTransporter;

  const cleanupFields = (input: BsdaInput): BsdaInput => {
    // When created through api, this field might be null in db
    // We send it as false at creation time from the UI, but we dont have any
    // mean to edit it, and it is locked once signed by worker
    // This can lead to unsolvable cases.
    // While waiting a better fix (eg. an editable field or to default the field as false),
    // this function unlocks users

    return omitDeep(input, "worker.work");
  };

  function saveBsda(input: BsdaInput): Promise<any> {
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

  async function saveBsdaTransporter(
    transporterInput: CreateOrUpdateBsdaTransporterInput
  ): Promise<string> {
    const { id, takenOverAt, transport, ...input } = transporterInput;

    // S'assure que les données de récépissé transport sont nulles dans les
    // cas suivants :
    // - l'exemption est cochée
    // - le transporteur est étranger
    // - le transport ne se fait pas par la route
    const cleanInput: BsdaTransporterInput = {
      ...input,
      transport: {
        mode: transport?.mode,
        plates: transport?.plates
      },
      ...(input.recepisse?.isExempted ||
      isForeignVat(input?.company?.vatNumber) ||
      transport?.mode !== TransportMode.Road
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
        const { errors } = await updateBsdaTransporter({
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
      const { data, errors } = await createBsdaTransporter({
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
      return data?.createBsdaTransporter?.id ?? "";
    }
  }

  async function onSubmit(values: BsdaFormikValues) {
    const { id, transporters, ...input } = values;

    let transporterIds: string[] = [];

    try {
      transporterIds = await Promise.all(
        transporters.map(t => saveBsdaTransporter(t))
      );
    } catch (_) {
      // Si une erreur survient pendant la sauvegarde des données
      // transporteur, on n'essaye même pas de sauvgarder le bordereau
      return;
    }

    const bsdaInput: BsdaInput = {
      ...input,
      transporters: transporterIds
    };

    saveBsda(bsdaInput)
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
      {loading && <Loader />}
    </>
  );
}
