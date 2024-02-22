import { isEmail, isGenericEmail } from "../emailHelpers";
import { GENERIC_EMAIL_DOMAINS } from "../GENERIC_EMAIL_DOMAINS";

describe("emailHelpers", () => {
  describe("isEmail", () => {
    test.each`
      input                         | expected
      ${"abc..def@mail.com"}        | ${false}
      ${"abc.def@mail.c"}           | ${false}
      ${"abc.def@mail#archive.com"} | ${false}
      ${"abc.def@mail"}             | ${false}
      ${"abc.def@mail..com"}        | ${false}
      ${"abc-d@mail.com"}           | ${true}
      ${"abc.def@mail.com"}         | ${true}
      ${"abc@mail.com"}             | ${true}
      ${"abc_def@mail.com"}         | ${true}
      ${"abc.def@mail.cc"}          | ${true}
      ${"abc.def@mail-archive.com"} | ${true}
      ${"abc.def@mail.org"}         | ${true}
      ${"abc.def@mail.com"}         | ${true}
    `('"$input" should return $expected', ({ input, expected }) => {
      expect(isEmail(input)).toEqual(expected);
    });
  });

  describe("isGenericEmail", () => {
    test.each([
      ...GENERIC_EMAIL_DOMAINS.map(domain => `giovanni.giorgio@${domain}.fr`),
      ...GENERIC_EMAIL_DOMAINS.map(domain => `giovanni.giorgio@${domain}.com`),
      ...GENERIC_EMAIL_DOMAINS.map(domain =>
        `giovanni.giorgio@${domain}.de`.toUpperCase()
      )
    ])(`%p is generic because domain belongs to the generic list`, email => {
      expect(isGenericEmail(email)).toEqual(true);
    });

    test.each([
      "giovanni.giorgio@veolia.fr",
      "jeff@dechets.com",
      "jack.sparrow@entreprise-btp.be"
    ])(`%p is NOT generic because domain is not in the generic list`, email => {
      expect(isGenericEmail(email)).toEqual(false);
    });

    test.each([
      "giovanni.giorgio@orange.orange.fr",
      "giovanni.giorgio@orange.laposte.fr",
      "giovanni.giorgio@orangelaposte.fr",
      "giovanni.giorgio@orangeraie.fr"
    ])(`%p is NOT generic - edge cases`, email => {
      expect(isGenericEmail(email)).toEqual(false);
    });

    test.each([
      ["giovanni.giorgio@orange.fr", "L'orange niçoise"],
      ["jeff@gmail.com", "Gmail déchetterie"],
      ["jack.sparrow@yahoo.be", "Yahoo on kiffe les déchets SAS"]
    ])(
      `%p is NOT generic because email domain, even though generic, refers to company name %p`,
      (email, companyName) => {
        expect(isGenericEmail(email, companyName)).toEqual(false);
      }
    );

    test.each([
      // Hyphens
      ["giovanni.giorgio@orange-nicoise.fr"],
      ["jeff@gmail-dechetterie.com"],
      ["jack.sparrow@kiff-yahoo-dechets.be"],
      // Dots
      ["giovanni.giorgio@orange.nicoise.fr"],
      ["jeff@gmail.dechetterie.com"],
      ["jack.sparrow@kiff.yahoo.dechets.be"]
    ])(`%p is NOT generic because of complex domain`, email => {
      expect(isGenericEmail(email)).toEqual(false);
    });
  });
});
