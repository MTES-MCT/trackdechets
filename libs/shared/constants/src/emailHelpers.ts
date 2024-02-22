import { GENERIC_EMAIL_DOMAINS } from "./GENERIC_EMAIL_DOMAINS";

export const isEmail = (email: string): boolean => {
  return new RegExp(
    // Taken from HTML spec: https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  ).test(email);
};

export const isGenericEmail = (email: string, companyName = ""): boolean => {
  if (!isEmail(email)) return false;

  // Extract domain name & split on dots and hyphens and remove domain extension
  const suffixes = email.split("@")[1].split(/[.-]/).slice(0, -1);

  // Weird domain, don't bother
  if (suffixes.length !== 1) {
    return false;
  }

  const suffix = suffixes[0];

  // Email domain seems to match the company name
  if (companyName.toLowerCase().includes(suffix)) {
    return false;
  }

  // Else, check if domain is generic
  return GENERIC_EMAIL_DOMAINS.includes(suffix.toLowerCase());
};
