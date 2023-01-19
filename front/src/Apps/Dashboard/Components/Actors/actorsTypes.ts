import {
  BsdaDestination,
  BsdaEmitter,
  BsdasriDestination,
  BsdasriEmitter,
  BsdasriTransporter,
  BsdaTransporter,
  BsffDestination,
  BsffEmitter,
  BsffTransporter,
  BsvhuDestination,
  BsvhuEmitter,
  BsvhuTransporter,
  Emitter,
  Maybe,
  Recipient,
  Transporter,
} from "generated/graphql/types";

export interface ActorsProps {
  emitter?:
    | Maybe<Emitter>
    | Maybe<BsdaEmitter>
    | Maybe<BsdasriEmitter>
    | Maybe<BsvhuEmitter>
    | Maybe<BsffEmitter>;
  destination?:
    | Maybe<Recipient>
    | Maybe<BsdasriDestination>
    | Maybe<BsdaDestination>
    | Maybe<BsvhuDestination>
    | Maybe<BsffDestination>;
  transporter?:
    | Maybe<Transporter>
    | Maybe<BsdaTransporter>
    | Maybe<BsdasriTransporter>
    | Maybe<BsvhuTransporter>
    | Maybe<BsffTransporter>;
}
