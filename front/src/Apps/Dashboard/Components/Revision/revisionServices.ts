import { Bsda, Form } from "@td/codegen-ui";
import { formatBsd } from "../../../Dashboard/bsdMapper";

export const getActorName = (bsd: Form | Bsda, siret: string): string => {
  const bsdFormatted = formatBsd(bsd);

  const actors = [
    {
      company: bsdFormatted?.emitter?.company
    },
    { company: bsdFormatted?.destination?.company },
    { company: bsdFormatted?.transporter?.company }
  ];

  const actor = actors.find(actor => actor?.company?.siret === siret);

  return actor?.company?.name
    ? `${actor?.company?.name} - ${actor?.company?.siret}`
    : "";
};
