import { verify } from "jsonwebtoken";

const { JWT_SECRET } = process.env;

interface Token {
  userId: string;
}

interface Context {
  request: any;
}

export function getUserId(context: Context) {
  const Authorization = context.request.get("Authorization");
  if (Authorization) {
    const token = Authorization.replace("Bearer ", "");
    return getUserIdFromToken(token);
  }
}

export function getUserIdFromToken(token: string) {
  const verifiedToken = verify(token, JWT_SECRET) as Token;
  return verifiedToken && verifiedToken.userId;
}

export const merge = (target, source) => {
  for (let key of Object.keys(source)) {
    if (source[key] instanceof Object)
      Object.assign(source[key], merge(target[key], source[key]));
  }

  Object.assign(target || {}, source);
  return target;
};
