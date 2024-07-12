import { Country, extractPostalCode, splitAddress } from "../addresses";

describe("extractPostalCode", () => {
  test("when there is a match", () => {
    const address = "3 route du déchet, 07100 Annonay";
    expect(extractPostalCode(address)).toEqual("07100");
  });

  test("when there are multiple matches, should return the last one", () => {
    const address = "134 AV DU GENERAL EISENHOWER CS 42326 31100 TOULOUSE";
    expect(extractPostalCode(address)).toEqual("31100");
  });

  test("when there is not match", () => {
    expect(extractPostalCode("Somewhere")).toEqual("");
  });

  test("when address is empty", () => {
    expect(extractPostalCode("")).toEqual("");
  });

  test("when address is null", () => {
    expect(extractPostalCode(null)).toEqual("");
  });

  test.each([
    // German
    ["Frankfurter Straße 60-68 DE-65760 Eschborn", "DE", "DE-65760"],
    ["Christian-Lassen-Str. 2, D-53117 Bonn", "DE", "D-53117"],
    ["Mainzer Landstraße 129, 60486 Frankfurt am Main", "DE", "60486"],
    ["Fangdieckstraße 20, 22547 Hamburg", "DE", "22547"],
    ["Königin-Elisabeth-Straße 46, 14059 Berlin", "DE", "14059"],
    ["Angela-Molitoris-Platz 25, 81245 München", "DE", "81245"],
    // Spanish
    [
      "Mas Palou de la Vola, Sant Pere de Torello 08572 BARCELONA",
      "ES",
      "08572"
    ],
    // Bulgarian
    ["ул. Страхил Войвода  №5 обл.РУСЕ, гр.РУСЕ 7000", "BG", "7000"],
    // Italian
    ["VIA TRATTATO DI SCHENGEN 5 15067 NOVI LIGURE AL", "IT", "15067"],
    // British
    ["114 VALLANCE ROAD, LONDON, E1 5BL", "GB", "E1 5BL"],
    ["1 TYSSEN ROAD, LONDON, N16 7NA", "GB", "N16 7NA"],
    ["35 sclater st. london e1 6lb", "GB", "E1 6LB"], // Postal code is uppercased
    // Belgian
    ["Avenue Léopold III(PER) 33 7134 Binche", "BE", "7134"],
    ["Rue du Marché aux Herbes 116, 1000 Bruxelles", "BE", "1000"],
    ["Paalsteenstraat 36, 3500 Hasselt", "BE", "3500"],
    // French
    ["1 RUE DE L'HOTEL DE VILLE 17000 LA ROCHELLE", "FR", "17000"],
    ["2 RUE PIERRE BROSSOLETTE 64000 PAU", "FR", "64000"],
    ["34 ROUTE DE BRESSUIRE 79200 CHATILLON-SUR-THOUET", "FR", "79200"],
    ["15 Rue Jacques Prévert, Le Port 97420, Réunion", "FR", "97420"],
    [
      "Lot Bas-Palmiste Acajou, 100m après le château d'eau, D13, Le Lamentin 97232, Martinique",
      "FR",
      "97232"
    ],
    [
      "QF8H+PP7, Rue Jacques Iékawé, Nouméa 98800, New Caledonia",
      "FR",
      "98800"
    ],
    ["Site du Stilettu, 1180 Route A Madunuccia, 20090 Ajaccio", "FR", "20090"],
    // Wrong postalCodes
    ["Avenue Léopold III(PER) 337134 Binche", "BE", ""] // Belgian postCodes only have 4 digits
  ])("[%p, %p] should return %p", (address, country, expected) => {
    expect(extractPostalCode(address, country as Country)).toEqual(expected);
  });
});

describe("splitAddress", () => {
  test.each<
    [
      { address?: string | null; vatNumber?: string },
      { street: string; postalCode: string; city: string; country: string }
    ]
  >([
    // Edge-cases
    [
      { address: "" },
      {
        street: "",
        postalCode: "",
        city: "",
        country: ""
      }
    ],
    [
      { address: null },
      {
        street: "",
        postalCode: "",
        city: "",
        country: ""
      }
    ],
    [
      { address: undefined },
      {
        street: "",
        postalCode: "",
        city: "",
        country: ""
      }
    ],
    // Foreign addresses
    [
      {
        address: "Christian-Lassen-Str. 2, D-53117 Bonn",
        vatNumber: "DE122118294"
      },
      {
        street: "Christian-Lassen-Str. 2",
        postalCode: "D-53117",
        city: "Bonn",
        country: "DE"
      }
    ],
    [
      {
        address: "Mas Palou de la Vola, Sant Pere de Torello 08572 BARCELONA",
        vatNumber: "ES77311719W"
      },
      {
        street: "Mas Palou de la Vola, Sant Pere de Torello",
        postalCode: "08572",
        city: "BARCELONA",
        country: "ES"
      }
    ],
    [
      {
        address: "ул. Страхил Войвода  №5 обл.РУСЕ, гр.РУСЕ 7000",
        vatNumber: "BG203923692"
      },
      {
        street: "ул. Страхил Войвода №5 обл.РУСЕ, гр.РУСЕ",
        postalCode: "7000",
        city: "",
        country: "BG"
      }
    ],
    [
      {
        address: "VIA TRATTATO DI SCHENGEN 5 15067 NOVI LIGURE AL",
        vatNumber: "IT01144600069"
      },
      {
        street: "VIA TRATTATO DI SCHENGEN 5",
        postalCode: "15067",
        city: "NOVI LIGURE AL",
        country: "IT"
      }
    ],
    [
      {
        address: "Avenue Léopold III(PER) 33 7134 Binche",
        vatNumber: "BE0401203084"
      },
      {
        street: "Avenue Léopold III(PER) 33",
        postalCode: "7134",
        city: "Binche",
        country: "BE"
      }
    ],
    // Invalid postalCode. Fallback to full address in 'street' field + country
    [
      {
        address: "Avenue Léopold III(PER)   337134 Binche",
        vatNumber: "BE0401203084"
      },
      {
        street: "Avenue Léopold III(PER) 337134 Binche",
        postalCode: "",
        city: "",
        country: "BE"
      }
    ],
    // Weirdly formatted foreign address
    [
      {
        address: "   Avenue Léopold     III(PER) 33 7134 Binche    ",
        vatNumber: "BE0401203084"
      },
      {
        street: "Avenue Léopold III(PER) 33",
        postalCode: "7134",
        city: "Binche",
        country: "BE"
      }
    ],
    // French addresses
    [
      { address: "1 RUE DE L'HOTEL DE VILLE 17000 LA ROCHELLE" },
      {
        street: "1 RUE DE L'HOTEL DE VILLE",
        postalCode: "17000",
        city: "LA ROCHELLE",
        country: "FR"
      }
    ],
    [
      { address: "2 RUE PIERRE BROSSOLETTE 64000 PAU" },
      {
        street: "2 RUE PIERRE BROSSOLETTE",
        postalCode: "64000",
        city: "PAU",
        country: "FR"
      }
    ],
    [
      { address: "34 ROUTE DE BRESSUIRE 79200 CHATILLON-SUR-THOUET" },
      {
        street: "34 ROUTE DE BRESSUIRE",
        postalCode: "79200",
        city: "CHATILLON-SUR-THOUET",
        country: "FR"
      }
    ],
    [
      { address: "2 RUE ROUGEMONT 14/16 BD POISSONNIERE 75009 PARIS 9" },
      {
        street: "2 RUE ROUGEMONT 14/16 BD POISSONNIERE",
        postalCode: "75009",
        city: "PARIS 9",
        country: "FR"
      }
    ],
    [
      { address: "ZI DES AJONCS 85000 LA ROCHE-SUR-YON" },
      {
        street: "ZI DES AJONCS",
        postalCode: "85000",
        city: "LA ROCHE-SUR-YON",
        country: "FR"
      }
    ],
    [
      { address: "15 Rue Jacques Prévert, Le Port 97420, Réunion" },
      {
        street: "15 Rue Jacques Prévert, Le Port",
        postalCode: "97420",
        city: "Réunion",
        country: "FR"
      }
    ],
    // Weirdly formatted frech address
    [
      {
        address: "   ZI DES       AJONCS 85000        LA ROCHE-SUR-YON       "
      },
      {
        street: "ZI DES AJONCS",
        postalCode: "85000",
        city: "LA ROCHE-SUR-YON",
        country: "FR"
      }
    ],
    // Misleading example with postalCode-like number in it
    [
      { address: "109 AV DU GENERAL EISENHOWER CS 42326 31100 TOULOUSE" },
      {
        street: "109 AV DU GENERAL EISENHOWER CS 42326",
        postalCode: "31100",
        city: "TOULOUSE",
        country: "FR"
      }
    ]
  ])("%p should return %p", (params, expected) => {
    // When
    const { address, vatNumber } = params;
    const splitted = splitAddress(address, vatNumber);

    // Then
    expect(splitted).toMatchObject(expected);
  });
});
