import { UserRole } from "@prisma/client";
import { getDefaultNotifications } from "../notifications";

describe("getDefaultNotifications", () => {
  it.each([UserRole.ADMIN, UserRole.MEMBER, UserRole.DRIVER, UserRole.READER])(
    "should return default notifications for role %p",
    role => {
      const notifications = getDefaultNotifications(role);
      if (role === UserRole.ADMIN) {
        expect(notifications).toEqual({
          notificationIsActiveMembershipRequest: true,
          notificationIsActiveSignatureCodeRenewal: true,
          notificationIsActiveBsdRefusal: true,
          notificationIsActiveRevisionRequest: true,
          notificationIsActiveBsdaFinalDestinationUpdate: true
        });
      } else {
        expect(notifications).toEqual({
          notificationIsActiveMembershipRequest: false,
          notificationIsActiveSignatureCodeRenewal: false,
          notificationIsActiveBsdRefusal: false,
          notificationIsActiveRevisionRequest: false,
          notificationIsActiveBsdaFinalDestinationUpdate: false
        });
      }
    }
  );
});
