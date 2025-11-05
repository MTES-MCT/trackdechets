import { useMutation, useQuery } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BsdType,
  BsvhuInput,
  BsvhuTransporterInput,
  Mutation,
  MutationCreateBsvhuArgs,
  MutationCreateBsvhuTransporterArgs,
  MutationCreateDraftBsvhuArgs,
  MutationUpdateBsvhuArgs,
  MutationUpdateBsvhuTransporterArgs,
  Query,
  QueryBsvhuArgs,
  TransportMode
} from "@td/codegen-ui";
import omitDeep from "omit-deep-lodash";
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader } from "../../../common/Components";
import FormStepsContent from "../FormStepsContent";
import { getComputedState } from "../getComputedState";
import { ZodBsvhu, rawBsvhuSchema } from "./schema";
import DestinationBsvhu from "./steps/Destination";
import EmitterBsvhu from "./steps/Emitter";
import TransporterBsvhu from "./steps/Transporter";
import WasteBsvhu from "./steps/Waste";
import initialState, {
  CreateOrUpdateBsvhuTransporterInput
} from "./utils/initial-state";
import {
  CREATE_BSVHU,
  CREATE_DRAFT_VHU,
  GET_VHU_FORM,
  UPDATE_VHU_FORM
} from "../../../../Apps/common/queries/bsvhu/queries";
import { cleanPayload } from "../bspaoh/utils/payload";
import {
  getErrorTabIds,
  getPublishErrorMessages,
  getPublishErrorTabIds,
  TabId
} from "../utils";
import OtherActors from "./steps/OtherActors";
import { isForeignVat } from "@td/constants";
import { toastApolloError } from "../toaster";
import {
  CREATE_BSVHU_TRANSPORTER,
  UPDATE_BSVHU_TRANSPORTER
} from "../../../Forms/Components/query";
import { parseDate } from "../../../../common/datetime";

const vhuToInput = (vhu: ZodBsvhu): BsvhuInput => {
  const addressCleanup: string[] = [];
  // the emitter company object (FormCompany) doesn't support street/city/postalCode
  // so on updates, even if the address hasn't changed, those fields will be null.
  // in order to avoid erasing the street/city/postalCode fields on updates, we remove them
  // from the input.
  if (vhu.emitter.company.address) {
    if (!vhu.emitter.company.street) {
      addressCleanup.push("emitter.company.street");
    }
    if (!vhu.emitter.company.city) {
      addressCleanup.push("emitter.company.city");
    }
    if (!vhu.emitter.company.postalCode) {
      addressCleanup.push("emitter.company.postalCode");
    }
  }
  const omitted = omitDeep(vhu, [
    "isDraft",
    "ecoOrganisme.hasEcoOrganisme",
    "hasTrader",
    "hasBroker",
    "hasIntermediaries",
    ...addressCleanup
  ]);
  // clear the intermediaries array if it only contains the default value
  if (vhu.intermediaries?.length === 1 && !vhu.intermediaries[0].siret) {
    omitted.intermediaries = [];
  }
  return omitted;
};
interface Props {
  bsdId?: string;
  publishErrorsFromRedirect?: {
    code: string;
    path: string[];
    message: string;
  }[];
}
const BsvhuFormSteps = ({
  bsdId,
  publishErrorsFromRedirect
}: Readonly<Props>) => {
  const [publishErrors, setPublishErrors] = useState<
    | {
        code: string;
        path: string[];
        message: string;
      }[]
    | undefined
  >();

  const formQuery = useQuery<Pick<Query, "bsvhu">, QueryBsvhuArgs>(
    GET_VHU_FORM,
    {
      variables: {
        id: bsdId!
      },
      skip: !bsdId,
      fetchPolicy: "network-only"
    }
  );

  const sealedFields = useMemo(
    () =>
      (formQuery?.data?.bsvhu?.metadata?.fields?.sealed ?? [])
        ?.map(f => f.join("."))
        .filter(Boolean),
    [formQuery.data]
  );

  const formState = useMemo(
    () => getComputedState(initialState, formQuery.data?.bsvhu),
    [formQuery.data]
  );

  const methods = useForm<ZodBsvhu>({
    values: formState,

    resolver: async (data, context, options) => {
      return zodResolver(rawBsvhuSchema)(data, context, options);
    }
  });

  const [createDraftVhuForm, { loading: creatingDraft }] = useMutation<
    Pick<Mutation, "createDraftBsvhu">,
    MutationCreateDraftBsvhuArgs
  >(CREATE_DRAFT_VHU);

  const [createVhuForm, { loading: creating }] = useMutation<
    Pick<Mutation, "createBsvhu">,
    MutationCreateBsvhuArgs
  >(CREATE_BSVHU);

  const [updateVhuForm, { loading: updating }] = useMutation<
    Pick<Mutation, "updateBsvhu">,
    MutationUpdateBsvhuArgs
  >(UPDATE_VHU_FORM);

  const [createBsvhuTransporter, { loading: creatingBsvhuTransporter }] =
    useMutation<
      Pick<Mutation, "createBsvhuTransporter">,
      MutationCreateBsvhuTransporterArgs
    >(CREATE_BSVHU_TRANSPORTER);

  const [updateBsvhuTransporter, { loading: updatingBsvhuTransporter }] =
    useMutation<
      Pick<Mutation, "updateBsdaTransporter">,
      MutationUpdateBsvhuTransporterArgs
    >(UPDATE_BSVHU_TRANSPORTER);

  const loading =
    creatingDraft ||
    updating ||
    creating ||
    creatingBsvhuTransporter ||
    updatingBsvhuTransporter;
  const mainCtaLabel = formState.id ? "Enregistrer" : "Publier";
  const draftCtaLabel = formState.id ? "" : "Enregistrer en brouillon";

  async function saveBsvhuTransporter(
    transporterInput: CreateOrUpdateBsvhuTransporterInput
  ): Promise<string> {
    const { id, takenOverAt, transport, ...input } = transporterInput;

    // S'assure que les données de récépissé transport sont nulles dans les
    // cas suivants :
    // - l'exemption est cochée
    // - le transporteur est étranger
    // - le transport ne se fait pas par la route
    const cleanInput: BsvhuTransporterInput = {
      ...input,
      transport: {
        mode: transport?.mode,
        plates: transport?.plates
      },
      recepisse: {
        ...input.recepisse,
        validityLimit: !!input.recepisse?.validityLimit
          ? parseDate(input.recepisse.validityLimit).toISOString()
          : null,
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
        const { errors } = await updateBsvhuTransporter({
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
      const { data, errors } = await createBsvhuTransporter({
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
      return data?.createBsvhuTransporter?.id ?? "";
    }
  }

  const saveForm = async (input: ZodBsvhu, draft: boolean): Promise<any> => {
    const cleanedInput = vhuToInput(input);
    const { transporters } = cleanedInput;

    let transporterIds: string[] = [];

    try {
      transporterIds = await Promise.all(
        //@ts-ignore
        (transporters ?? []).map(t => saveBsvhuTransporter(t))
      );
      cleanedInput.transporters = transporterIds;
    } catch (_) {
      // Si une erreur survient pendant la sauvegarde des données
      // transporteur, on n'essaye même pas de sauvgarder le bordereau
      return;
    }

    if (formState.id!) {
      return updateVhuForm({
        variables: { id: formState.id, input: cleanedInput }
      });
    } else {
      const cleanedPayload = cleanPayload(cleanedInput);

      if (draft) {
        return createDraftVhuForm({ variables: { input: cleanedPayload } });
      } else {
        return createVhuForm({ variables: { input: cleanedPayload } });
      }
    }
  };

  const errorsFromPublishApi = publishErrors || publishErrorsFromRedirect;
  const publishErrorTabIds = getPublishErrorTabIds(
    BsdType.Bsvhu,
    errorsFromPublishApi
  );
  const formStateErrorsKeys = Object.keys(methods?.formState?.errors);
  const errorTabIds = getErrorTabIds(
    BsdType.Bsvhu,
    publishErrorTabIds,
    formStateErrorsKeys
  );

  const publishErrorMessages = useMemo(
    () => getPublishErrorMessages(BsdType.Bsvhu, errorsFromPublishApi),
    [errorsFromPublishApi]
  );
  const createdAt = formQuery.data?.bsvhu.createdAt
    ? new Date(formQuery.data?.bsvhu.createdAt)
    : null;

  // Date de la MAJ 2024.12.1 qui modifie les règles de validation de BsvhuInput.packaging et identification.type
  const v20241201Date =
    import.meta.env.VITE_OVERRIDE_V20241201 || "2024-12-18T00:00:00.000";

  const v20241201 = new Date(v20241201Date);

  const createdBeforeV20241201 = Boolean(
    createdAt && createdAt.getTime() < v20241201.getTime()
  );

  const tabsContent = useMemo(
    () => ({
      waste: (
        <WasteBsvhu
          errors={publishErrorMessages.filter(
            error => error.tabId === TabId.waste
          )}
          createdBeforeV20241201={createdBeforeV20241201}
        />
      ),
      emitter: (
        <EmitterBsvhu
          errors={publishErrorMessages.filter(
            error => error.tabId === TabId.emitter
          )}
        />
      ),
      transporter: <TransporterBsvhu />,
      destination: (
        <DestinationBsvhu
          errors={publishErrorMessages.filter(
            error => error.tabId === TabId.destination
          )}
        />
      ),
      other: <OtherActors />
    }),
    [publishErrorMessages, createdBeforeV20241201]
  );

  return (
    <>
      <FormStepsContent
        bsdType={BsdType.Bsvhu}
        draftCtaLabel={draftCtaLabel}
        isLoading={loading}
        mainCtaLabel={mainCtaLabel}
        saveForm={saveForm}
        useformMethods={methods}
        tabsContent={tabsContent}
        sealedFields={sealedFields}
        setPublishErrors={setPublishErrors}
        errorTabIds={errorTabIds}
        genericErrorMessage={publishErrorMessages.filter(
          error => error.tabId === TabId.none
        )}
      />
      {loading && <Loader />}
    </>
  );
};

export default BsvhuFormSteps;
