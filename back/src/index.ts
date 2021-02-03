import { initSubscriptions } from "./events";
import { app } from "./server";

const port = process.env.API_PORT || 80;

app.listen(port, () => console.info(`Server is running on port ${port}`));

initSubscriptions();
