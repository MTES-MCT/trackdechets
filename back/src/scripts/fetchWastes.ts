import axios from "axios";
import cheerio from "cheerio";

interface WasteNode {
  code: string;
  description: string;
  children: WasteNode[];
}

(async () => {
  const { data: html } = await axios.get(
    "https://aida.ineris.fr/consultation_document/10327"
  );
  const $ = cheerio.load(html);
  const table = $("table").last();
  const map: Record<string, WasteNode> = table
    .find("tr")
    .toArray()
    .map(tr => ({
      code: $(tr).find("td:first-child").text().trim().replace(/\s/g, " "),
      description: $(tr)
        .find("td:last-child")
        .text()
        .trim()
        .replace(/\s/g, " "),
      children: []
    }))
    .reduce(
      (acc: Record<string, WasteNode>, waste) => ({
        ...acc,
        [waste.code]: waste
      }),
      {}
    );

  Object.keys(map).forEach(code => {
    const parentCode = code.split(/\s/g).slice(0, -1).join(" ");
    const parent = map[parentCode];

    if (parent) {
      parent.children.push(map[code]);
    }
  });

  Object.keys(map).forEach(code => {
    map[code].children.sort((a, b) => {
      if (a.code < b.code) {
        return -1;
      }

      if (a.code > b.code) {
        return 1;
      }

      return 0;
    });
  });

  console.log(
    JSON.stringify(
      Object.keys(map)
        .filter(code => code.length === 2)
        .sort()
        .map(code => map[code]),
      null,
      2
    )
  );
})();
