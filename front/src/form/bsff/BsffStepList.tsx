import { useMutation, useQuery } from "@apollo/client";
import React, { ReactElement, useMemo, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { Loader } from "../../Apps/common/Components";
import { getComputedState } from "../common/getComputedState";
import { IStepContainerProps } from "../common/stepper/Step";
import { toastApolloError } from "../common/stepper/toaster";
import {
  Mutation,
  MutationCreateDraftBsffArgs,
  MutationUpdateBsffArgs,
  QueryBsffArgs,
  Query,
  Bsff,
  BsffInput,
  BsffType
} from "@td/codegen-ui";
import initialState from "./utils/initial-state";
import {
  CREATE_DRAFT_BSFF,
  UPDATE_BSFF_FORM,
  GET_BSFF_FORM
} from "../../Apps/common/queries/bsff/queries";
import { validationSchema } from "./utils/schema";

const GenericStepList = lazy(() => import("../common/stepper/GenericStepList"));
interface Props {
  children: (bsff: Bsff | undefined) => ReactElement;
  formId?: string;
}

export default function BsffStepsList(props: Props) {
  const navigate = useNavigate();

  const formQuery = useQuery<Pick<Query, "bsff">, QueryBsffArgs>(
    GET_BSFF_FORM,
    {
      variables: {
        id: props.formId!
      },
      skip: !props.formId,
      fetchPolicy: "network-only"
    }
  );

  const formState = useMemo(() => {
    function getCurrentState(bsff: Bsff) {
      const { forwarding, repackaging, grouping, transporter } = bsff;
      const previousPackagings = [...forwarding, ...repackaging, ...grouping];
      return {
        ...formQuery.data?.bsff,
        previousPackagings,
        transporter
      };
    }
    const bsff = formQuery.data?.bsff;

    return getComputedState(initialState, bsff ? getCurrentState(bsff) : null);
  }, [formQuery.data]);

  const [createDraftBsff, { loading: creating }] = useMutation<
    Pick<Mutation, "createDraftBsff">,
    MutationCreateDraftBsffArgs
  >(CREATE_DRAFT_BSFF);

  const [updateBsffForm, { loading: updating }] = useMutation<
    Pick<Mutation, "updateBsff">,
    MutationUpdateBsffArgs
  >(UPDATE_BSFF_FORM);

  function saveForm(input: BsffInput): Promise<any> {
    return formState.id
      ? updateBsffForm({
          variables: { id: formState.id, input }
        })
      : createDraftBsff({ variables: { input } });
  }

  function onSubmit(values) {
    const {
      id,
      ficheInterventions,
      previousPackagings,
      packagings,
      type,
      transporter,
      destination: { plannedOperationCode, ...destination },
      ...input
    } = values;
    saveForm({
      type,
      ...input,
      transporter,
      destination: {
        ...destination,
        plannedOperationCode:
          plannedOperationCode?.length > 0 ? plannedOperationCode : null
      },
      // packagings is computed by the backend in case of groupement or reexpedition
      ...([BsffType.Groupement, BsffType.Reexpedition].includes(type)
        ? {}
        : {
            packagings: packagings.map(p => ({
              type: p.type,
              other: p.other,
              numero: p.numero,
              volume: p.volume,
              weight: p.weight
            }))
          }),
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
  const parentOfSteps = props.children(formQuery.data?.bsff);
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
        validationSchema={validationSchema}
      />
      {(creating || updating) && <Loader />}
    </>
  );
}
