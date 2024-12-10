import { Bsda, Form } from "@td/codegen-ui";
import { formatBsd } from "../../../Dashboard/bsdMapper";

export const getActorName = (bsd: Form | Bsda, orgId: string): string => {
  const bsdFormatted = formatBsd(bsd);

  const actors = [
    {
      company: bsdFormatted?.emitter?.company
    },
    { company: bsdFormatted?.destination?.company },
    { company: bsdFormatted?.transporter?.company },
    {
      company: {
        orgId: bsdFormatted?.ecoOrganisme?.siret,
        name: bsdFormatted?.ecoOrganisme?.name
      }
    }
  ];

  const actor = actors.find(actor => actor?.company?.orgId === orgId);

  return [actor?.company?.name, orgId].filter(Boolean).join(" - ");
};
