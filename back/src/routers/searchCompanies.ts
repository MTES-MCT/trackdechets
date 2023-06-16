import { Router } from "express";
import ensureLoggedIn from "../common/middlewares/ensureLoggedIn";
import { FavoriteType } from "../generated/graphql/types";
import {
  FavoriteIndexBody,
  client,
  getIndexFavoritesId,
  indexConfig
} from "../queue/jobs/indexFavorites";
import { searchCompanies } from "../companies/search";
import { isForeignVat } from "../common/constants/companySearchHelpers";

export const searchRouter = Router();

interface searchQueryBody {
  clue: string;
  favoriteType: FavoriteType;
  allowForeignCompanies: boolean;
  department: string;
}

// Provide a post query endpoint
searchRouter.post("/search", ensureLoggedIn, async (req, res) => {
  const { clue, allowForeignCompanies, department } =
    req.body as searchQueryBody;

  if (isForeignVat(clue) && !allowForeignCompanies) {
    res.send({ hits: [] });
  }

  try {
    const hits = await searchCompanies(clue, department);
    res.send({ hits });
  } catch (error) {
    res
      .status(500)
      .send({ error: "An error occurred while searching for companies" });
  }
});

// Provide a get query endpoint for favorites
searchRouter.get("/favorites", ensureLoggedIn, async (req, res) => {
  const { orgId, type } = req.query;
  if (!orgId || !type) {
    res
      .status(500)
      .send({ error: "An error occurred while searching for favorites" });
  }
  try {
    const results = await client.get<FavoriteIndexBody>({
      index: indexConfig.alias,
      id: getIndexFavoritesId({
        orgId: `${orgId}`,
        type: `${type}` as FavoriteType
      })
    });
    res.send(results.body.favorites);
  } catch (error) {
    res
      .status(500)
      .send({ error: "An error occurred while querying Elasticsearch" });
  }
});
