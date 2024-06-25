import {
  Bsff,
  BsffFicheIntervention,
  BsffInput,
  BsffOperationCode,
  BsffPackaging,
  BsffPackagingInput,
  BsffTransporterInput,
  BsffType
} from "@td/codegen-ui";
import {
  getInitialCompany,
  initialTransporter
} from "../../../Apps/common/data/initialState";

export interface BsffFormInput extends BsffInput {
  transporter: BsffTransporterInput;
  previousPackagings: BsffPackagingInput[];
}

// Les données transporteurs du formulaire représente soit un transporteur BSDA
// déjà crée en base de données qui dispose d'un identifiant, soit un transporteur
// non encore crée en base ne disposant pas encore d'identifiant. Par ailleurs on a
// besoin de connaitre la valeur de `takenOverAt` pour l'affichage des infos transporteur
// en mode formulaire ou statique dans la liste.
export type CreateOrUpdateBsffTransporterInput = BsffTransporterInput & {
  id?: string | null;
  takenOverAt?: string | null;
};

export type BsffFormikValues = Omit<
  BsffInput,
  "transporters" | "ficheInterventions"
> & {
  transporters: CreateOrUpdateBsffTransporterInput[];
} & { id?: string | null } & { previousPackagings: BsffPackaging[] } & {
  ficheInterventions: BsffFicheIntervention[];
};

export function getInitialState(bsff?: Bsff | null): BsffFormikValues {
  const initialTransporters: CreateOrUpdateBsffTransporterInput[] =
    bsff?.transporters && bsff?.transporters.length > 0
      ? bsff.transporters.map(t => ({
          ...t,
          takenOverAt: t.transport?.signature?.date
        }))
      : [initialTransporter];

  const initialPreviousPackagings = bsff
    ? [
        ...(bsff.grouping ?? []),
        ...(bsff.repackaging ?? []),
        ...(bsff.forwarding ?? [])
      ]
    : null;

  return {
    id: bsff?.id ?? null,
    type: bsff?.type ?? BsffType.CollectePetitesQuantites,
    emitter: {
      company: getInitialCompany(bsff?.emitter?.company)
    },
    transporters: initialTransporters,
    destination: {
      company: getInitialCompany(bsff?.destination?.company),
      cap: bsff?.destination?.cap ?? "",
      plannedOperationCode:
        bsff?.destination?.plannedOperationCode ?? ("" as BsffOperationCode)
    },
    packagings: (bsff?.packagings ?? []).map(p => ({
      // permet d'exclure les informations d'acceptation
      // et d'opération
      type: p.type,
      other: p.other,
      numero: p.numero,
      volume: p.volume,
      weight: p.weight
    })),
    waste: {
      code: bsff?.waste?.code ?? "14 06 01*",
      description: bsff?.waste?.description ?? "",
      adr: bsff?.waste?.adr ?? ""
    },
    weight: {
      value: bsff?.weight?.value ?? 0,
      isEstimate: bsff?.weight?.isEstimate ?? true
    },
    ficheInterventions: bsff?.ficheInterventions ?? [],
    previousPackagings: initialPreviousPackagings ?? []
  };
}
