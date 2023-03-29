import axios from "axios";

const MY_SENDING_BOX_URL = "https://api.MySendingBox.fr";

const { MY_SENDING_BOX_API_KEY } = process.env;

const config = {
  auth: { username: MY_SENDING_BOX_API_KEY!, password: "" }
};

const mysendingboxBackend = {
  sendLetter: async function (letter) {
    const resp = await axios.post(
      `${MY_SENDING_BOX_URL}/letters`,
      letter,
      config
    );
    return resp.data;
  }
};

export default mysendingboxBackend;
