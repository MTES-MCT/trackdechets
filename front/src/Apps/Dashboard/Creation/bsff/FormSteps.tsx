import {
  Bsff,
  BsdType,
  BsffType,
  Query,
  QueryBsffArgs,
  Mutation,
  MutationUpdateBsffArgs,
  MutationCreateDraftBsffArgs,
  MutationPublishBsffArgs,
  BsffInput,
  MutationCreateBsffTransporterArgs,
  MutationCreateBsffArgs,
  MutationUpdateBsffTransporterArgs,
  BsffTransporterInput,
  TransportMode,
  BsffDestinationInput,
  MutationCreateFicheInterventionBsffArgs
} from "@td/codegen-ui";

import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_DRAFT_BSFF,
  GET_BSFF_FORM,
  CREATE_BSFF,
  PUBLISH_BSFF,
  UPDATE_BSFF_FORM,
  CREATE_BSFF_FICHE_INTERVENTION
} from "../../../common/queries/bsff/queries";

import {
  CREATE_BSFF_TRANSPORTER,
  UPDATE_BSFF_TRANSPORTER
} from "../../../Forms/Components/query";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useMemo, createContext, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { rawBsffSchema, ZodBsff } from "./schema";
import FormStepsContent from "../FormStepsContent";
import { Loader } from "../../../common/Components";
import initialState from "./utils/initial-state";
import { getComputedState } from "../getComputedState";
import WasteBsff from "./steps/Waste";
import EmitterBsff from "./steps/Emitter";
import DestinationBsff from "./steps/Destination";
import TransporterBsff from "./steps/Transporter";
import DetenteurBsff from "./steps/Detenteur";
import { isForeignVat } from "@td/constants";
import {
  getErrorTabIds,
  getPublishErrorMessages,
  getPublishErrorTabIds,
  handleGraphQlError,
  TabId
} from "../utils";

interface Props {
  bsdId?: string;
  publishErrorsFromRedirect?: {
    code: string;
    path: string[];
    message: string;
  }[];
}

export const BsffContext = createContext<Bsff | undefined>(undefined);

const BsffFormSteps = ({
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

  // ================= QUERY =================
  const bsffQuery = useQuery<Pick<Query, "bsff">, QueryBsffArgs>(
    GET_BSFF_FORM,
    {
      variables: { id: bsdId! },
      skip: !bsdId,
      fetchPolicy: "network-only"
    }
  );

  const sealedFields = useMemo(
    () =>
      (bsffQuery?.data?.bsff?.metadata?.fields?.sealed ?? [])
        ?.map(f => f.join("."))
        .filter(Boolean),
    [bsffQuery.data]
  );
  // ================= MUTATIONS =================
  const [createDraftBsff, { loading: creating }] = useMutation<
    Pick<Mutation, "createDraftBsff">,
    MutationCreateDraftBsffArgs
  >(CREATE_DRAFT_BSFF);

  const [updateBsff, { loading: updating }] = useMutation<
    Pick<Mutation, "updateBsff">,
    MutationUpdateBsffArgs
  >(UPDATE_BSFF_FORM);

  const [publishBsff, { loading: publishing }] = useMutation<
    Pick<Mutation, "publishBsff">,
    MutationPublishBsffArgs
  >(PUBLISH_BSFF);

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

  const [createBsff, { loading: creatingBsff }] = useMutation<
    Pick<Mutation, "createBsff">,
    MutationCreateBsffArgs // ← vérifier que ce type existe dans @td/codegen-ui
  >(CREATE_BSFF);

  const [createFicheIntervention] = useMutation<
    Pick<Mutation, "createFicheInterventionBsff">,
    MutationCreateFicheInterventionBsffArgs
  >(CREATE_BSFF_FICHE_INTERVENTION);

  const bsffState = useMemo(
    () =>
      getComputedState(initialState, bsffQuery.data?.bsff, [
        {
          path: "packagings",
          getComputedValue: (intialValue, actualValue) =>
            actualValue.length ? actualValue : intialValue
        },
        {
          path: "grouping",
          getComputedValue: (initialValue, actualValue) =>
            actualValue?.length ? actualValue : initialValue
        },
        {
          path: "forwarding",
          getComputedValue: (initialValue, actualValue) => {
            if (Array.isArray(actualValue)) {
              return actualValue[0] ?? initialValue;
            }
            return actualValue ?? initialValue;
          }
        },
        {
          path: "repackaging",
          getComputedValue: (initialValue, actualValue) =>
            Array.isArray(actualValue) && actualValue.length
              ? actualValue
              : initialValue
        },
        {
          path: "transporters",
          getComputedValue: (initialValue, actualValue) =>
            actualValue?.length ? actualValue : initialValue
        },
        {
          path: "ficheInterventions",
          getComputedValue: (initialValue, actualValue) =>
            actualValue?.length ? actualValue : initialValue
        }
      ]),
    [bsffQuery.data]
  );
  const methods = useForm<ZodBsff>({
    values: bsffState,
    resolver: async (data, context, options) => {
      return zodResolver(rawBsffSchema)(data, context, options);
    }
  });

  useEffect(() => {
    if (bsffState?.id && bsffQuery.data?.bsff?.id) {
      methods.reset(bsffState);
    }
  }, [bsffState, bsffQuery.data?.bsff?.id, methods]);

  const errorsFromPublishApi = publishErrors || publishErrorsFromRedirect;
  const publishErrorTabIds = getPublishErrorTabIds(
    BsdType.Bsff,
    errorsFromPublishApi
  );

  const formStateErrorsKeys = Object.keys(methods?.formState?.errors);
  const errorTabIds = getErrorTabIds(
    BsdType.Bsff,
    publishErrorTabIds,
    formStateErrorsKeys
  );
  const publishErrorMessages = useMemo(
    () => getPublishErrorMessages(BsdType.Bsff, errorsFromPublishApi),
    [errorsFromPublishApi]
  );

  useEffect(() => {
    for (const error of publishErrorMessages) {
      methods.setError(error.name as keyof ZodBsff, {
        type: "custom",
        message: error.message
      });
    }
  }, [publishErrorMessages, methods]);

  const [bsffContext, setBsffContext] = useState<Bsff | undefined>();

  useEffect(() => {
    if (bsffQuery.data?.bsff?.id) {
      setBsffContext(bsffQuery.data.bsff);
    }
  }, [bsffQuery.data?.bsff]);

  const type = methods.watch("type");

  const tabsContent = useMemo(
    () => ({
      waste: <WasteBsff />,
      emitter:
        type === BsffType.CollectePetitesQuantites ? (
          <EmitterBsff />
        ) : undefined,
      detenteur: <DetenteurBsff />,
      transporter: <TransporterBsff />,
      destination: <DestinationBsff />
    }),
    [type]
  );

  const loading =
    creating ||
    publishing ||
    creatingBsff ||
    updating ||
    creatingBsffTransporter ||
    updatingBsffTransporter;
  const mainCtaLabel = bsffState.id ? "Enregistrer" : "Publier";
  const draftCtaLabel = bsffState.id ? "" : "Enregistrer en brouillon";

  function cleanCompany(company: any) {
    if (!company) return undefined;
    const isEmpty = Object.values(company).every(v => !v);
    return isEmpty ? undefined : company;
  }

  async function saveBsff(values: ZodBsff, draft: boolean) {
    try {
      const transporterIds = await getTransporterIds(values.transporters);
      const ficheInterventionIds = await getFicheInterventionIds(values);

      const input = buildBsffInput(
        values,
        transporterIds,
        ficheInterventionIds
      );

      if (bsffState.id) {
        return handleUpdateFlow(input, draft);
      }

      return handleCreateFlow(input, draft);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
  async function getTransporterIds(transporters: any[] = []) {
    return Promise.all(
      transporters
        .filter(t => t && (t.company?.siret || t.company?.vatNumber))
        .map(saveBsffTransporter)
    );
  }
  async function getFicheInterventionIds(values: ZodBsff) {
    const ficheInterventions = values.ficheInterventions ?? [];
    const { emitter } = values;

    if (!ficheInterventions.length) return [];

    const ids = await Promise.all(
      ficheInterventions
        // Ne jamais envoyer une fiche sans les champs obligatoires
        .filter(fi => fi.numero && fi.postalCode && fi.weight && fi.weight > 0)
        .map(async fi => {
          if ((fi as any)?.id) return fi.id;

          const { data } = await createFicheIntervention({
            variables: {
              input: {
                numero: fi.numero!,
                weight: Number(fi.weight!),
                postalCode: fi.postalCode!,
                detenteur: fi.detenteur,
                operateur: {
                  company: cleanCompany(emitter?.company)
                }
              }
            }
          });

          return data?.createFicheInterventionBsff?.id ?? null;
        })
    );

    return ids.filter((id): id is string => !!id);
  }
  function buildBsffInput(
    values: ZodBsff,
    transporterIds: string[],
    ficheInterventionIds: string[]
  ): BsffInput {
    const {
      destination,
      packagings,
      type,
      grouping,
      forwarding,
      repackaging,
      waste,
      emitter,
      weight
    } = values;

    return {
      type: type as unknown as BsffType,
      emitter: emitter
        ? { ...emitter, company: cleanCompany(emitter.company) }
        : undefined,
      waste: waste?.code
        ? {
            code: waste.code,
            adr: waste.adr?.trim() || null,
            description: waste.description?.trim() || null
          }
        : undefined,
      weight: {
        value: Number(weight?.value ?? 0),
        isEstimate: weight?.isEstimate ?? false
      },
      destination: buildDestination(destination),
      transporters: transporterIds,
      ficheInterventions: ficheInterventionIds,
      packagings: buildPackagings(type as unknown as BsffType, packagings),
      forwarding:
        type === BsffType.Reexpedition && forwarding?.id ? [forwarding.id] : [],
      repackaging:
        type === BsffType.Reconditionnement
          ? (repackaging ?? []).map(r => r.id)
          : [],
      grouping:
        type === BsffType.Groupement ? (grouping ?? []).map(g => g.id) : []
    };
  }

  function buildDestination(
    destination: any
  ): BsffDestinationInput | undefined {
    if (!destination) return undefined;

    return {
      cap: destination.cap ?? undefined,
      company: cleanCompany(destination.company),
      customInfo: destination.customInfo ?? undefined,
      plannedOperationCode: destination.plannedOperationCode ?? undefined,
      reception: destination.reception?.date
        ? { date: destination.reception.date.toISOString() }
        : undefined
    };
  }

  function buildPackagings(
    type: BsffType,
    packagings: any[] | null | undefined
  ) {
    if ([BsffType.Groupement, BsffType.Reexpedition].includes(type)) {
      return undefined;
    }

    return packagings?.map(p => ({
      type: p.type,
      numero: p.numero,
      other: p.other ?? null,
      volume: p.volume ?? null,
      weight: Number(p.weight ?? 0)
    }));
  }
  async function handleUpdateFlow(input: BsffInput, draft: boolean) {
    await updateBsff({ variables: { id: bsffState.id!, input } });

    if (draft) return;

    try {
      return await publishBsff({ variables: { id: bsffState.id! } });
    } catch (err: any) {
      setPublishErrors(handleGraphQlError(err));
      throw err;
    }
  }

  async function handleCreateFlow(input: BsffInput, draft: boolean) {
    if (draft) {
      return createDraftBsff({ variables: { input } });
    }

    try {
      return await createBsff({ variables: { input } });
    } catch (err: any) {
      setPublishErrors(handleGraphQlError(err));
      throw err;
    }
  }
  async function saveBsffTransporter(t: any): Promise<string> {
    const { id, takenOverAt, transport, ...input } = t;

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
      if (!takenOverAt) {
        await updateBsffTransporter({
          variables: { id, input: cleanInput }
        });
      }
      return id;
    }

    const { data } = await createBsffTransporter({
      variables: { input: cleanInput }
    });

    return data?.createBsffTransporter?.id ?? "";
  }

  return (
    <BsffContext.Provider value={bsffContext}>
      <FormStepsContent
        bsdType={BsdType.Bsff}
        draftCtaLabel={draftCtaLabel}
        isLoading={loading}
        mainCtaLabel={mainCtaLabel}
        saveForm={saveBsff}
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
    </BsffContext.Provider>
  );
};

export default BsffFormSteps;
