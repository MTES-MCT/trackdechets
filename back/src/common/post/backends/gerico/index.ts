import axios from "axios";

const { GERICO_API_KEY, GERICO_API_URL } = process.env;

const config = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Token ${GERICO_API_KEY}`
  }
};

const gericoBackend = {
  create: async function (orgId, year) {
    const resp = await axios.post(
      `${GERICO_API_URL}/create/`,
      { orgId, year },
      config
    );

    return resp.data;
  }
};

export default gericoBackend;
