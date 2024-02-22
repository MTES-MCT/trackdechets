import { GENERIC_EMAIL_DOMAINS } from "./GENERIC_EMAIL_DOMAINS";

export const isEmail = (email: string): boolean => {
  return new RegExp(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
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
