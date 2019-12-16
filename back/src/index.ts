import { initSubscriptions } from "./subscriptions";
import { app } from "./server";

const port = process.env.BACK_PORT || 80;

app.listen(port, () => console.info(`Server is running on port ${port}`));

initSubscriptions();
