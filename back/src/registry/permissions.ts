import net from "net";

export const REGISTRY_WHITE_LIST_IP =
  process.env.REGISTRY_WHITE_LIST_IP?.split(",").filter(
    ip => net.isIP(ip) > 0
  ) ?? [];

export function checkIsRegistreNational(user: Express.User) {
  if (
    user.isRegistreNational &&
    user.ip &&
    REGISTRY_WHITE_LIST_IP.includes(user.ip)
  ) {
    return true;
  }
  return false;
}
