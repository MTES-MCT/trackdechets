import { UserNotification } from "@prisma/client";
import {
  ALL_NOTIFICATIONS as ALL_NOTIFICATIONS_SHARED,
  authorizedNotifications as authorizedNotificationsShared
} from "@td/constants";

export const ALL_NOTIFICATIONS: UserNotification[] =
  ALL_NOTIFICATIONS_SHARED.map(notifType => UserNotification[notifType]).filter(
    Boolean
  );

export const authorizedNotifications = {
  ADMIN: ALL_NOTIFICATIONS,
  MEMBER: authorizedNotificationsShared.MEMBER.map(
    notifType => UserNotification[notifType]
  ).filter(Boolean) as UserNotification[],
  READER: authorizedNotificationsShared.READER.map(
    notifType => UserNotification[notifType]
  ).filter(Boolean) as UserNotification[],
  DRIVER: authorizedNotificationsShared.DRIVER.map(
    notifType => UserNotification[notifType]
  ).filter(Boolean) as UserNotification[]
};
