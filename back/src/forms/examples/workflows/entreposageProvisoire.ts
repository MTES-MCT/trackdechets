import { createFormTempStorage } from "../steps/createForm";
import { markAsSealed } from "../steps/markAsSealed";
import { markAsTempStored } from "../steps/markAsTempStored";
import { markAsResealed } from "../steps/markAsResealed";
import { markAsReceived } from "../steps/markAsReceived";
import { markAsProcessed } from "../steps/markAsProcessed";
import { Workflow } from "../../../common/workflow";
import {
  signEmissionForm,
  signEmissionFormAfterTempStorage
} from "../steps/signEmissionForm";
import {
  signTransportForm,
  signTransportFormAfterTempStorage
} from "../steps/signTransportForm";
import { WasteProcessorType } from "@td/prisma";

const workflow: Workflow = {
  title: "Entreposage provisoire",
  description: `Les informations principales du BSDD sont remplies par l'émetteur du bordereau
en précisant isTempStorage=true dans les informations de destination. Le destinataire correspond à
l'installation d'entreposage provisoire. L'émetteur signe l'envoi, suivit du transporteur.
L'installation d'entreposage provisoire accepte les déchets et complète les informations du
second transporteur et de la destination finale (si ce n'est pas déjà fait par l'émetteur).
L'installation d'entreposage provisoire signe l'envoi, suivit du transporteur n°2. L'installation
de destination finale accepte le déchet et valide le traitement.`,
  companies: [
    { name: "producteur", companyTypes: ["PRODUCER"] },
    { name: "transporteur1", companyTypes: ["TRANSPORTER"] },
    {
      name: "ttr",
      companyTypes: ["COLLECTOR"],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    },
    { name: "transporteur2", companyTypes: ["TRANSPORTER"] },
    {
      name: "traiteur",
      companyTypes: ["WASTEPROCESSOR"],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    }
  ],
  steps: [
    createFormTempStorage("producteur"),
    markAsSealed("producteur"),
    signEmissionForm("producteur"),
    signTransportForm("transporteur1"),
    markAsTempStored("ttr"),
    markAsResealed("ttr"),
    signEmissionFormAfterTempStorage("ttr"),
    signTransportFormAfterTempStorage("transporteur2"),
    markAsReceived("traiteur"),
    markAsProcessed("traiteur")
  ],
  docContext: {
    producteur: { siret: "SIRET_PRODUCTEUR" },
    transporteur1: { siret: "SIRET_TRANSPORTEUR_1" },
    ttr: { siret: "SIRET_TTR", securityCode: "XXXX" },
    traiteur: { siret: "SIRET_TRAITEUR" },
    transporteur2: { siret: "SIRET_TRANSPORTEUR_2" },
    bsd: { id: "ID_BSD" }
  },
  chart: `
graph LR
NO_STATE(NO STATE) --> |createForm| DRAFT
DRAFT --> |markAsSealed| SEALED
SEALED --> |signEmissionForm| SIGNED_BY_PRODUCER
SIGNED_BY_PRODUCER --> |signTransportForm| SENT
SENT --> |markAsTempStored| TEMP_STORER_ACCEPTED
TEMP_STORER_ACCEPTED2(TEMP_STORER_ACCEPTED) --> |markAsResealed| RESEALED
RESEALED --> |signEmissionForm| SIGNED_BY_TEMP_STORER
SIGNED_BY_TEMP_STORER --> |signTransportForm| RESENT
RESENT --> |markAsReceived| RECEIVED
RECEIVED --> |markAsProcessed| PROCESSED`
};

export default workflow;
