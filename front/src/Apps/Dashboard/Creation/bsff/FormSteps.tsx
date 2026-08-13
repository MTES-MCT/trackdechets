// ==========================
// BSFF FORM STEPS
// ==========================

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
  MutationCreateFicheInterventionBsffArgs,
  MutationUpdateFicheInterventionBsffArgs,
  BsffEmitterInput
} from "@td/codegen-ui";

import { useMutation, useQuery } from "@apollo/client";

import {
  CREATE_DRAFT_BSFF,
  GET_BSFF_FORM,
  CREATE_BSFF,
  PUBLISH_BSFF,
  UPDATE_BSFF_FORM,
  CREATE_BSFF_FICHE_INTERVENTION,
  UPDATE_BSFF_FICHE_INTERVENTION
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
import {
  buildBsffPickupSiteInput,
  isManualBsffPickupSite
} from "./utils/pickupSite";
import WasteBsff from "./steps/Waste";
import EmitterBsff from "./steps/Emitter";
import DestinationBsff from "./steps/Destination";
import TransporterBsff from "./steps/Transporter";
import DetenteurBsff from "./steps/Detenteur";
import BordereauBsff from "./steps/Bordereau";
import { isForeignVat } from "@td/constants";

import {
  getErrorTabIds,
  getPublishErrorMessages,
  getPublishErrorTabIds,
  handleGraphQlError,
  TabId
} from "../utils";
import { DsfrNotificationError } from "../../../common/Components/Error/Error";

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

  // ======================================================
  // QUERY
  // ======================================================

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

  // ======================================================
  // MUTATIONS
  // ======================================================

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

  const [createBsff, { loading: creatingBsff, error: createBsffError }] =
    useMutation<Pick<Mutation, "createBsff">, MutationCreateBsffArgs>(
      CREATE_BSFF
    );

  const [createFicheIntervention, { error: ficheError }] = useMutation<
    Pick<Mutation, "createFicheInterventionBsff">,
    MutationCreateFicheInterventionBsffArgs
  >(CREATE_BSFF_FICHE_INTERVENTION);

  const [updateFicheInterventionBsff] = useMutation<
    Pick<Mutation, "updateFicheInterventionBsff">,
    MutationUpdateFicheInterventionBsffArgs
  >(UPDATE_BSFF_FICHE_INTERVENTION);

  function getDetenteurFromPackagingDetenteur(detenteur: any) {
    const company = detenteur.company;
    const isPrivate = detenteur.isPrivateIndividual;

    const holderType = !isPrivate
      ? "ENTREPRISE"
      : /^OMI\d{7}$/.test(company?.name ?? "")
      ? "NAVIRE"
      : /^W\d{9}$/.test(company?.name ?? "")
      ? "ASSOCIATION"
      : "PARTICULIER";

    return {
      holderType,
      identification:
        holderType === "ASSOCIATION" || holderType === "NAVIRE"
          ? company?.name ?? ""
          : "",
      detenteur: {
        isPrivateIndividual: isPrivate,
        company
      }
    };
  }
  const bsffState = useMemo(() => {
    const state = getComputedState(initialState, bsffQuery.data?.bsff, [
      {
        path: "packagings",
        getComputedValue: (initialValue, actualValue) =>
          actualValue.length ? actualValue : initialValue
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
        getComputedValue: (initialValue, actualValue) => {
          // Les vraies fiches d'intervention restent prioritaires.
          if (actualValue?.length) {
            return actualValue.map(fiche => {
              const company = fiche.detenteur?.company;
              const isPrivate = fiche.detenteur?.isPrivateIndividual;

              const holderType = !isPrivate
                ? "ENTREPRISE"
                : /^OMI\d{7}$/.test(company?.name ?? "")
                ? "NAVIRE"
                : /^W\d{9}$/.test(company?.name ?? "")
                ? "ASSOCIATION"
                : "PARTICULIER";

              return {
                ...fiche,
                holderType,
                identification:
                  holderType === "ASSOCIATION" || holderType === "NAVIRE"
                    ? company?.name ?? ""
                    : ""
              };
            });
          }

          // Pour les collectes, le détenteur peut être enregistré
          // directement sur le packaging sans fiche d'intervention.
          if (
            bsffQuery.data?.bsff?.type === BsffType.CollectePetitesQuantites
          ) {
            const holders = new Map<string, any>();

            for (const packaging of bsffQuery.data.bsff.packagings ?? []) {
              for (const detenteur of packaging.detenteurs ?? []) {
                const company = detenteur.company;

                const key =
                  company?.siret ??
                  company?.orgId ??
                  company?.name ??
                  JSON.stringify(detenteur);

                if (!holders.has(key)) {
                  holders.set(key, {
                    ...getDetenteurFromPackagingDetenteur(detenteur),
                    numero: "",
                    postalCode: "",
                    weight: 0,
                    packagings: []
                  });
                }

                holders.get(key).packagings.push({
                  ...packaging
                });
              }
            }

            return Array.from(holders.values());
          }

          return initialValue;
        }
      }
    ]);
    const pickupSite = bsffQuery.data?.bsff?.emitter?.pickupSite;

    return {
      ...state,
      pickupSiteEnabled: Boolean(pickupSite),
      pickupSiteManualMode: isManualBsffPickupSite(pickupSite),
      equipmentHolderDifferent:
        state.type === BsffType.TracerFluide &&
        Boolean(state.ficheInterventions?.length)
    };
  }, [bsffQuery.data]);
  const methods = useForm<ZodBsff>({
    values: bsffState,
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: async (data, context, options) => {
      return zodResolver(rawBsffSchema)(data, context, options);
    }
  });

  useEffect(() => {
    if (bsffState?.id && bsffQuery.data?.bsff?.id) {
      methods.reset(bsffState, {
        keepErrors: true
      });
    }
  }, [bsffState, bsffQuery.data?.bsff?.id, methods]);

  // ======================================================
  // ERRORS
  // ======================================================

  const errorsFromPublishApi = publishErrors || publishErrorsFromRedirect;
  const type = methods.watch("type");
  const equipmentHolderDifferent = methods.watch("equipmentHolderDifferent");
  const publishErrorTabIds = getPublishErrorTabIds(
    BsdType.Bsff,
    errorsFromPublishApi,
    type as BsffType
  );

  const formStateErrorsKeys = Object.keys(methods?.formState?.errors);

  const errorTabIds = getErrorTabIds(
    BsdType.Bsff,
    publishErrorTabIds,
    formStateErrorsKeys,
    type as BsffType
  );

  const publishErrorMessages = useMemo(
    () =>
      getPublishErrorMessages(
        BsdType.Bsff,
        errorsFromPublishApi,
        type as BsffType
      ),
    [errorsFromPublishApi, type]
  );

  useEffect(() => {
    for (const error of publishErrorMessages) {
      methods.setError(error.name as keyof ZodBsff, {
        type: "custom",
        message: error.message
      });
    }
  }, [publishErrorMessages, methods]);

  // ======================================================
  // CONTEXT
  // ======================================================

  const [bsffContext, setBsffContext] = useState<Bsff | undefined>();

  useEffect(() => {
    if (bsffQuery.data?.bsff?.id) {
      setBsffContext(bsffQuery.data.bsff);
    }
  }, [bsffQuery.data?.bsff]);

  // ======================================================
  // TABS
  // ======================================================

  const tabsContent = useMemo(
    () => ({
      bordereau: type === BsffType.TracerFluide ? <BordereauBsff /> : undefined,
      waste: <WasteBsff />,
      emitter:
        type === BsffType.CollectePetitesQuantites ? (
          <EmitterBsff />
        ) : undefined,
      detenteur:
        type !== BsffType.TracerFluide || equipmentHolderDifferent ? (
          <DetenteurBsff />
        ) : undefined,
      transporter: <TransporterBsff />,
      destination: <DestinationBsff />
    }),
    [equipmentHolderDifferent, type]
  );

  // ======================================================
  // LOADING
  // ======================================================

  const loading =
    creating ||
    publishing ||
    creatingBsff ||
    updating ||
    creatingBsffTransporter ||
    updatingBsffTransporter;

  const mainCtaLabel = bsffState.id ? "Enregistrer" : "Publier";

  const draftCtaLabel = bsffState.id ? "" : "Enregistrer en brouillon";

  // ======================================================
  // HELPERS
  // ======================================================

  function cleanCompany(company: any) {
    if (!company) return undefined;

    const isEmpty = Object.values(company).every(v => !v);

    return isEmpty ? undefined : company;
  }

  function hasFicheInterventionData(ficheIntervention: any) {
    return Boolean(
      ficheIntervention.numero?.trim() ||
        ficheIntervention.postalCode?.trim() ||
        Number(ficheIntervention.weight ?? 0) > 0
    );
  }

  function toPackagingDetenteur(ficheIntervention: any) {
    const company = ficheIntervention.detenteur?.company;
    const isPrivateIndividual =
      ficheIntervention.holderType !== undefined
        ? ficheIntervention.holderType !== "ENTREPRISE"
        : ficheIntervention.detenteur?.isPrivateIndividual ?? false;

    if (!company) return undefined;

    return {
      isPrivateIndividual,
      company: {
        siret: isPrivateIndividual ? null : company.siret ?? null,
        name:
          company.name?.trim() ||
          ficheIntervention.identification?.trim() ||
          company.contact?.trim() ||
          "Détenteur d'équipement",
        address: company.address?.trim() || "Non renseignée",
        contact: company.contact ?? null,
        phone: company.phone ?? null,
        mail: company.mail ?? null
      }
    };
  }

  // ======================================================
  // SAVE
  // ======================================================

  async function saveBsff(values: ZodBsff, draft: boolean) {
    try {
      const transporterIds = await getTransporterIds(values.transporters);

      const ficheInterventionMap = await getFicheInterventionIds(values);

      const ficheInterventionIds = Object.values(ficheInterventionMap);

      const input = buildBsffInput(
        values,
        transporterIds,
        ficheInterventionIds,
        ficheInterventionMap
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

  // ======================================================
  // TRANSPORTERS
  // ======================================================

  async function getTransporterIds(transporters: any[] = []) {
    return Promise.all(
      transporters
        .filter(t => t && (t.company?.siret || t.company?.vatNumber))
        .map(async t => {
          const isSigned = !!t.transport?.signature?.date;

          if (t.id && isSigned) {
            return t.id;
          }

          return saveBsffTransporter(t);
        })
    );
  }
  function getFicheInterventionKey(fi: any, index: number) {
    return (
      fi.numero?.trim() ||
      fi.id ||
      `DETENTEUR_${fi.holderType || "ENTREPRISE"}_${index}`
    );
  }
  async function getFicheInterventionIds(values: ZodBsff) {
    const emitterCompany = values.emitter?.company;

    if (
      [
        BsffType.Groupement,
        BsffType.Reexpedition,
        BsffType.Reconditionnement
      ].includes(values.type as BsffType)
    ) {
      return {};
    }

    const ficheInterventions =
      values.type === BsffType.TracerFluide && !values.equipmentHolderDifferent
        ? []
        : values.ficheInterventions ?? [];

    if (!ficheInterventions.length) return {};

    const entries = await Promise.all(
      ficheInterventions
        .filter(fi => {
          // Pour les BSFF de collecte, la fiche est réellement facultative :
          // sélectionner un détenteur et ses contenants ne doit pas créer de
          // fiche avec des valeurs techniques.
          if (values.type === BsffType.CollectePetitesQuantites) {
            return hasFicheInterventionData(fi);
          }

          const hasDetenteur = Boolean(
            fi.detenteur?.company?.siret ||
              fi.detenteur?.company?.orgId ||
              fi.detenteur?.company?.name ||
              fi.detenteur?.isPrivateIndividual
          );

          // TRACER_FLUIDE :
          // On accepte une fiche qui contient uniquement
          // le détenteur + les contenants sélectionnés.
          if (values.type === BsffType.TracerFluide) {
            return Boolean(fi.holderType) || hasDetenteur;
          }

          // Autres types : on conserve le comportement existant.
          return (
            hasDetenteur ||
            Boolean(fi.numero && fi.postalCode && fi.weight && fi.weight > 0)
          );
        })
        .map(async (fi, index) => {
          const detenteurCompany = fi.detenteur?.company;

          const isEquipmentHolder = values.type === BsffType.TracerFluide;

          const identification = fi.identification?.trim();

          const isPrivateIndividual = isEquipmentHolder
            ? fi.holderType !== "ENTREPRISE"
            : fi.detenteur?.isPrivateIndividual ?? false;

          // ======================================================
          // CONTENANTS RATTACHÉS À CETTE FICHE / CE DÉTENTEUR
          // ======================================================

          const linkedPackagingNumbers = new Set(
            (fi.packagings ?? [])
              .map(packaging => packaging.numero)
              .filter(Boolean)
          );

          const linkedWeight = (values.packagings ?? []).reduce(
            (sum, packaging) => {
              if (linkedPackagingNumbers.has(packaging.numero)) {
                return sum + Number(packaging.weight ?? 0);
              }

              return sum;
            },
            0
          );

          const holderKey = getFicheInterventionKey(fi, index);

          // ======================================================
          // DÉTENTEUR
          // ======================================================

          const cleanedDetenteur = {
            isPrivateIndividual,
            company: detenteurCompany
              ? {
                  siret: isPrivateIndividual
                    ? null
                    : detenteurCompany.siret ?? null,

                  name:
                    detenteurCompany.name?.trim() ||
                    identification ||
                    detenteurCompany.contact?.trim() ||
                    "Détenteur d'équipement",
                  address: detenteurCompany.address?.trim() || "Non renseignée",
                  contact: detenteurCompany.contact ?? null,
                  phone: detenteurCompany.phone ?? null,
                  mail: detenteurCompany.mail ?? null
                }
              : undefined
          };

          // ======================================================
          // FICHE INTERVENTION
          // ======================================================

          const ficheInput = {
            numero: holderKey,

            // IMPORTANT :
            // Pour TRACER_FLUIDE, le poids vient des contenants
            // rattachés à cette fiche.
            //
            // Pour les autres types, on conserve fi.weight.
            weight: isEquipmentHolder ? linkedWeight : Number(fi.weight ?? 0),

            // GraphQL exige postalCode: String!
            //
            // Pour TRACER_FLUIDE, la valeur n'est pas utilisée
            // comme adresse du détenteur : on fournit simplement
            // une valeur technique obligatoire.
            postalCode: isEquipmentHolder ? "00000" : fi.postalCode ?? "00000",

            detenteur: cleanedDetenteur,

            operateur: {
              company: cleanCompany(emitterCompany)
            }
          };

          // ======================================================
          // UPDATE FICHE EXISTANTE
          // ======================================================

          if (fi.id) {
            await updateFicheInterventionBsff({
              variables: {
                id: fi.id,
                input: ficheInput
              }
            });

            return [holderKey, fi.id] as const;
          }

          // ======================================================
          // CREATE FICHE
          // ======================================================

          const { data } = await createFicheIntervention({
            variables: {
              input: ficheInput
            }
          });

          const createdId = data?.createFicheInterventionBsff?.id ?? null;

          return [holderKey, createdId] as const;
        })
    );

    return Object.fromEntries(
      entries.filter(([, id]) => Boolean(id))
    ) as Record<string, string>;
  }
  // ======================================================
  // BUILD INPUT
  // ======================================================

  function buildBsffInput(
    values: ZodBsff,
    transporterIds: string[],
    ficheInterventionIds: string[],
    ficheInterventionMap: Record<string, string>
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

    const emitterInput: BsffEmitterInput | undefined = emitter
      ? {
          company: cleanCompany(emitter.company),
          customInfo: emitter.customInfo,
          ...(type === BsffType.TracerFluide
            ? {
                pickupSite: buildBsffPickupSiteInput(values)
              }
            : {})
        }
      : undefined;

    return {
      type: type as unknown as BsffType,
      emitter: emitterInput,
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

      packagings: buildPackagings(
        type as unknown as BsffType,
        packagings,
        values.ficheInterventions,
        ficheInterventionMap
      ),

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

  // ======================================================
  // DESTINATION
  // ======================================================

  function buildDestination(
    destination: any
  ): BsffDestinationInput | undefined {
    if (!destination) {
      return undefined;
    }

    return {
      cap: destination.cap ?? undefined,

      company: cleanCompany(destination.company),

      customInfo: destination.customInfo ?? undefined,

      plannedOperationCode: destination.plannedOperationCode ?? undefined,

      reception: destination.reception?.date
        ? {
            date: destination.reception.date.toISOString()
          }
        : undefined
    };
  }

  // ======================================================
  // PACKAGINGS
  // ======================================================

  // function buildPackagings(
  //   type: BsffType,
  //   packagings: any[] | null | undefined,
  //   ficheInterventions: any[] | null | undefined,
  //   ficheInterventionMap: Record<string, string>
  // ) {
  //   if ([BsffType.Groupement, BsffType.Reexpedition].includes(type)) {
  //     return undefined;
  //   }

  //   return packagings?.map(p => ({
  //     type: p.type,

  //     numero: p.numero,

  //     other: p.other ?? null,

  //     volume: p.volume ?? null,

  //     weight: Number(p.weight ?? 0),

  //     ficheInterventions:
  //       ficheInterventions
  //         ?.filter(fi =>
  //           fi.packagings?.some(
  //             (linkedPackaging: any) => linkedPackaging.numero === p.numero
  //           )
  //         )
  //         .map(fi => ficheInterventionMap[fi.numero])
  //         .filter(Boolean) ?? []
  //   }));
  // }
  function buildPackagings(
    type: BsffType,
    packagings: any[] | null | undefined,
    ficheInterventions: any[] | null | undefined,
    ficheInterventionMap: Record<string, string>
  ) {
    if ([BsffType.Groupement, BsffType.Reexpedition].includes(type)) {
      return undefined;
    }

    return packagings?.map(p => {
      const linkedFicheInterventions = (ficheInterventions ?? [])
        .map((ficheIntervention, index) => ({ ficheIntervention, index }))
        .filter(({ ficheIntervention }) =>
          ficheIntervention.packagings?.some(
            (linkedPackaging: any) => linkedPackaging.numero === p.numero
          )
        );

      const detenteurs = linkedFicheInterventions
        .map(({ ficheIntervention }) => toPackagingDetenteur(ficheIntervention))
        .filter(
          (
            detenteur
          ): detenteur is NonNullable<
            ReturnType<typeof toPackagingDetenteur>
          > => Boolean(detenteur)
        )
        .filter(
          (detenteur, index, allDetenteurs) =>
            allDetenteurs.findIndex(
              candidate =>
                candidate!.company.siret === detenteur!.company.siret &&
                candidate!.company.name === detenteur!.company.name
            ) === index
        );

      return {
        type: p.type,
        numero: p.numero,
        other: p.other ?? null,
        volume: p.volume ?? null,
        weight: Number(p.weight ?? 0),
        detenteurs,
        ficheInterventions: linkedFicheInterventions
          .map(({ ficheIntervention, index }) => {
            const ficheKey = getFicheInterventionKey(ficheIntervention, index);
            return ficheInterventionMap[ficheKey] ?? null;
          })
          .filter((id): id is string => Boolean(id))
      };
    });
  }
  // ======================================================
  // UPDATE FLOW
  // ======================================================

  async function handleUpdateFlow(input: BsffInput, draft: boolean) {
    await updateBsff({
      variables: {
        id: bsffState.id!,
        input
      }
    });

    if (draft) return;

    try {
      const result = await publishBsff({ variables: { id: bsffState.id! } });
      const currentCompany = methods.getValues("emitter.company");
      if (currentCompany && input.emitter?.company) {
        methods.setValue("emitter.company", {
          ...currentCompany,
          contact: input.emitter.company.contact ?? currentCompany.contact,
          phone: input.emitter.company.phone ?? currentCompany.phone,
          mail: input.emitter.company.mail ?? currentCompany.mail
        });
      }
      return result;
    } catch (err: any) {
      setPublishErrors(handleGraphQlError(err));

      throw err;
    }
  }

  // ======================================================
  // CREATE FLOW
  // ======================================================

  async function handleCreateFlow(input: BsffInput, draft: boolean) {
    if (draft) {
      return createDraftBsff({
        variables: { input }
      });
    }

    try {
      const result = await createBsff({ variables: { input } });

      return result;
    } catch (err: any) {
      setPublishErrors(handleGraphQlError(err));

      throw err;
    }
  }
  useEffect(() => {
    if (createBsffError) {
      setPublishErrors(handleGraphQlError(createBsffError));
    }
  }, [createBsffError]);

  useEffect(() => {
    if (ficheError) {
      setPublishErrors(handleGraphQlError(ficheError));
    }
  }, [ficheError]);
  async function saveBsffTransporter(t: any): Promise<string> {
    const { id, transport, ...input } = t;

    const isSigned = !!t.transport?.signature?.date;

    const isExempted =
      input.recepisse?.isExempted ||
      isForeignVat(input?.company?.vatNumber) ||
      transport?.mode !== TransportMode.Road;

    const cleanInput: BsffTransporterInput = {
      ...input,

      transport: {
        mode: transport?.mode,
        plates: transport?.plates
      },

      recepisse: {
        ...input.recepisse,

        validityLimit: !!input.recepisse?.validityLimit
          ? new Date(input.recepisse.validityLimit).toISOString()
          : null,

        ...(isExempted
          ? {
              number: null,
              validityLimit: null,
              department: null
            }
          : {})
      }
    };

    if (id) {
      if (!isSigned) {
        await updateBsffTransporter({
          variables: {
            id,
            input: cleanInput
          }
        });
      }

      return id;
    }

    const { data } = await createBsffTransporter({
      variables: {
        input: cleanInput
      }
    });

    return data?.createBsffTransporter?.id ?? "";
  }

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <BsffContext.Provider value={bsffContext}>
      <FormStepsContent
        key={type}
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
        initialTabId={
          type === BsffType.TracerFluide ? TabId.bordereau : TabId.waste
        }
      />
      {(createBsffError || ficheError) && (
        <div className="fr-mb-8w">
          {createBsffError && (
            <DsfrNotificationError apolloError={createBsffError} />
          )}
          {ficheError && <DsfrNotificationError apolloError={ficheError} />}
        </div>
      )}
      {loading && <Loader />}
    </BsffContext.Provider>
  );
};

export default BsffFormSteps;
