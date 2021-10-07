import { useMutation, useQuery } from "@apollo/client";
import cogoToast from "cogo-toast";
import routes from "common/routes";
import GenericStepList, {
  getComputedState,
} from "form/common/stepper/GenericStepList";
import { IStepContainerProps } from "form/common/stepper/Step";
import {
  Mutation,
  MutationCreateDraftBsffArgs,
  MutationUpdateBsffArgs,
  QueryBsffArgs,
  Query,
  Bsff,
  BsffInput,
  BsffType,
} from "generated/graphql/types";
import React, { ReactElement, useMemo } from "react";
import { generatePath, useHistory, useParams } from "react-router-dom";
import initialState from "./utils/initial-state";
import {
  CREATE_DRAFT_BSFF,
  UPDATE_BSFF_FORM,
  GET_BSFF_FORM,
} from "./utils/queries";

interface Props {
  children: (bsff: Bsff | undefined) => ReactElement;
  formId?: string;
}

export default function BsffStepsList(props: Props) {
  const { siret } = useParams<{ siret: string }>();
  const history = useHistory();

  const formQuery = useQuery<Pick<Query, "bsff">, QueryBsffArgs>(
    GET_BSFF_FORM,
    {
      variables: {
        id: props.formId!,
      },
      skip: !props.formId,
      fetchPolicy: "network-only",
    }
  );

  const formState = useMemo(() => {
    function getCurrentState(bsff: Bsff) {
      const { forwarding, repackaging, grouping } = bsff;
      const previousBsffs = [
        ...(forwarding ? [forwarding] : []),
        ...repackaging,
        ...grouping,
      ];
      return { ...formQuery.data?.bsff, previousBsffs };
    }
    const bsff = formQuery.data?.bsff;
    return getComputedState(initialState, bsff ? getCurrentState(bsff) : null);
  }, [formQuery.data]);

  const [createDraftBsff] = useMutation<
    Pick<Mutation, "createDraftBsff">,
    MutationCreateDraftBsffArgs
  >(CREATE_DRAFT_BSFF);

  const [updateBsffForm] = useMutation<
    Pick<Mutation, "updateBsff">,
    MutationUpdateBsffArgs
  >(UPDATE_BSFF_FORM);

  function saveForm(input: BsffInput): Promise<any> {
    return formState.id
      ? updateBsffForm({
          variables: { id: formState.id, input },
        })
      : createDraftBsff({ variables: { input } });
  }

  function onSubmit(e, values) {
    e.preventDefault();
    // As we want to be able to save draft, we skip validation on submit
    // and don't use the classic Formik mechanism

    const { id, ficheInterventions, previousBsffs, ...input } = values;

    saveForm({
      ...input,
      ficheInterventions: ficheInterventions.map(
        ficheIntervention => ficheIntervention.id
      ),
      forwarding:
        input.type === BsffType.Reexpedition ? previousBsffs[0].id : null,
      repackaging:
        input.type === BsffType.Reconditionnement
          ? previousBsffs.map(previousBsff => previousBsff.id)
          : [],
      grouping:
        input.type === BsffType.Groupement
          ? previousBsffs.map(previousBsff => previousBsff.id)
          : [],
    })
      .then(_ => {
        const redirectTo = generatePath(routes.dashboard.bsds.drafts, {
          siret,
        });
        history.push(redirectTo);
      })
      .catch(err => {
        err.graphQLErrors.map(err =>
          cogoToast.error(err.message, { hideAfter: 7 })
        );
      });
  }

  // As it's a render function, the steps are nested into a `<></>` block
  // So we render then unwrap to get the steps
  const parentOfSteps = props.children(formQuery.data?.bsff);
  const steps = parentOfSteps.props.children as ReactElement<
    IStepContainerProps
  >[];

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
