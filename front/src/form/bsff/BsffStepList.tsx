import { useMutation, useQuery } from "@apollo/client";
import React, { ReactElement, useMemo, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { Loader } from "../../Apps/common/Components";
import { IStepContainerProps } from "../common/stepper/Step";
import { toastApolloError } from "../../Apps/Dashboard/Creation/toaster";
import {
  Mutation,
  MutationCreateDraftBsffArgs,
  MutationUpdateBsffArgs,
  QueryBsffArgs,
  Query,
  Bsff,
  BsffInput,
  BsffType,
  MutationCreateBsffTransporterArgs,
  BsffTransporterInput,
  TransportMode,
  MutationUpdateBsffTransporterArgs
} from "@td/codegen-ui";
import {
  BsffFormikValues,
  CreateOrUpdateBsffTransporterInput,
  getInitialState
} from "./utils/initial-state";
import {
  CREATE_DRAFT_BSFF,
  UPDATE_BSFF_FORM,
  GET_BSFF_FORM
} from "../../Apps/common/queries/bsff/queries";
import { validationSchema } from "./utils/schema";
import {
  CREATE_BSFF_TRANSPORTER,
  UPDATE_BSFF_TRANSPORTER
} from "../../Apps/Forms/Components/query";
import { isForeignVat } from "@td/constants";

const GenericStepList = lazy(() => import("../common/stepper/GenericStepList"));
interface Props {
  children: (bsff: Bsff | undefined) => ReactElement;
  formId?: string;
}

export default function BsffStepsList(props: Props) {
  const navigate = useNavigate();

  const bsffQuery = useQuery<Pick<Query, "bsff">, QueryBsffArgs>(
    GET_BSFF_FORM,
    {
      variables: {
        id: props.formId!
      },
      skip: !props.formId,
      fetchPolicy: "network-only"
    }
  );

  const bsffState = useMemo(() => {
    const existingBsff = bsffQuery.data?.bsff;
    return getInitialState(existingBsff);
  }, [bsffQuery.data]);

  const [createDraftBsff, { loading: creating }] = useMutation<
    Pick<Mutation, "createDraftBsff">,
    MutationCreateDraftBsffArgs
  >(CREATE_DRAFT_BSFF);

  const [updateBsffForm, { loading: updating }] = useMutation<
    Pick<Mutation, "updateBsff">,
    MutationUpdateBsffArgs
  >(UPDATE_BSFF_FORM);

  const [createBsffTransporter, { loading: creatingBsffTransporter }] =
    useMutation<
      Pick<Mutation, "createBsffTransporter">,
      MutationCreateBsffTransporterArgs
    >(CREATE_BSFF_TRANSPORTER);

  const [updateBsffTransporter, { loading: updatingBsffTransporter }] =
    useMutation<
      Pick<Mutation, "updateBsffTransporter">,
      MutationUpdateBsffTransporterArgs
    >(UPDATE_BSFF_TRANSPORTER);

  const loading =
    creating || updating || creatingBsffTransporter || updatingBsffTransporter;

  function saveBsff(input: BsffInput): Promise<any> {
    return bsffState.id
      ? updateBsffForm({
          variables: { id: bsffState.id, input }
        })
      : createDraftBsff({ variables: { input } });
  }

  async function saveBsffTransporter(
    transporterInput: CreateOrUpdateBsffTransporterInput
  ): Promise<string> {
    const { id, takenOverAt, transport, ...input } = transporterInput;

    // S'assure que les données de récépissé transport sont nulles dans les
    // cas suivants :
    // - l'exemption est cochée
    // - le transporteur est étranger
    // - le transport ne se fait pas par la route
    const cleanInput: BsffTransporterInput = {
      ...input,
      transport: {
        mode: transport?.mode,
        plates: transport?.plates
      },
      recepisse: {
        ...input.recepisse,
        ...(input.recepisse?.isExempted ||
        isForeignVat(input?.company?.vatNumber) ||
        transport?.mode !== TransportMode.Road
          ? {
              number: null,
              validityLimit: null,
              department: null
            }
          : {})
      }
    };

    if (id) {
      // Le transporteur existe déjà en base de données, on met
      // à jour les infos (uniquement si le transporteur n'a pas encore
      // pris en charge le déchet) et on renvoie l'identifiant
      if (!takenOverAt) {
        const { errors } = await updateBsffTransporter({
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
      const { data, errors } = await createBsffTransporter({
        variables: { input: cleanInput },
        onError: err => {
          toastApolloError(err);
        }
      });
      if (errors) {
        throw new Error(errors.map(e => e.message).join("\n"));
      }
      // if `errors` is not defined then data?.createBsffTransporter?.id
      // should be defined. For type safety we return "" if it is not, but
      // it should not hapen
      return data?.createBsffTransporter?.id ?? "";
    }
  }

  async function onSubmit(values: BsffFormikValues) {
    const {
      id,
      ficheInterventions,
      previousPackagings,
      packagings,
      type,
      transporters,
      destination,
      ...input
    } = values;

    let transporterIds: string[] = [];

    try {
      transporterIds = await Promise.all(
        transporters.map(t => saveBsffTransporter(t))
      );
    } catch (_) {
      // Si une erreur survient pendant la sauvegarde des données
      // transporteur, on n'essaye même pas de sauvgarder le bordereau
      return;
    }

    const bsffInput: BsffInput = {
      ...input,
      transporters: transporterIds
    };

    const cleanDestination = {
      ...destination,
      plannedOperationCode:
        destination?.plannedOperationCode &&
        destination?.plannedOperationCode?.length > 0
          ? destination.plannedOperationCode
          : null
    };

    // packagings is computed by the backend in case of groupement or reexpedition
    const cleanPackagings =
      type && [BsffType.Groupement, BsffType.Reexpedition].includes(type)
        ? undefined
        : packagings;

    saveBsff({
      type,
      ...bsffInput,
      destination: cleanDestination,
      packagings: cleanPackagings,
      ficheInterventions: ficheInterventions.map(
        ficheIntervention => ficheIntervention.id
      ),
      forwarding:
        type === BsffType.Reexpedition ? previousPackagings.map(p => p.id) : [],
      repackaging:
        type === BsffType.Reconditionnement
          ? previousPackagings.map(p => p.id)
          : [],
      grouping:
        type === BsffType.Groupement ? previousPackagings.map(p => p.id) : []
    })
      .then(_ => {
        navigate(-1);
      })
      .catch(err => toastApolloError(err));
  }

  // As it's a render function, the steps are nested into a `<></>` block
  // So we render then unwrap to get the steps
  const parentOfSteps = props.children(bsffQuery.data?.bsff);
  const steps = parentOfSteps.props
    .children as ReactElement<IStepContainerProps>[];

  return (
    <>
      <GenericStepList
        children={steps}
        formId={props.formId}
        formQuery={bsffQuery}
        onSubmit={onSubmit}
        initialValues={bsffState}
        validationSchema={validationSchema}
      />
      {loading && <Loader />}
    </>
  );
}
