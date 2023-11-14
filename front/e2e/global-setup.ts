import { execSync } from 'child_process';

const setup = async () => {
    // Start the docker containers
    const DOCKER_CONTAINERS_CMD = "cd ../back/integration-tests; chmod +x ./run.sh; ./run.sh -u";
    await execSync(DOCKER_CONTAINERS_CMD, { encoding: 'utf-8', stdio: 'inherit' });
   
    // Start the app (front + back)
    const APPS_CMD = "cd ..; npx nx run front:serve &";
    await execSync(APPS_CMD, { encoding: 'utf-8', stdio: 'inherit' });
};

export default setup;