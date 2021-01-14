import acceptPendingInvitations from "src/scripts/prisma/acceptPendingInvitations";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Accept pending invitations",
  "Accept all pending invitations for users who have already joined by invitation link",
  false
)
export class AcceptPendingInvitations implements Updater {
  run() {
    console.info("Starting script to accept pending informations...");
    return acceptPendingInvitations();
  }
}
