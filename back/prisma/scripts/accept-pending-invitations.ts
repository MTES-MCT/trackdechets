import { Updater, registerUpdater } from "./helper/helper";
import acceptPendingInvitations from "../../src/scripts/prisma/acceptPendingInvitations";

@registerUpdater(
  "Accept pending invitations",
  "Accept all pending invitations for users who have already joined by invitation link",
  true
)
export class AcceptPendingInvitations implements Updater {
  run() {
    console.info("Starting script to accept pending informations...");
    return acceptPendingInvitations();
  }
}
