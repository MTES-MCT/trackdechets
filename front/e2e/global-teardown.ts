import { execSync } from 'child_process';

const teardown = async () => {
    // Stop the docker containers
    const DOCKER_CONTAINERS_CMD = "cd ../back/integration-tests; chmod +x ./run.sh; ./run.sh -d";
    await execSync(DOCKER_CONTAINERS_CMD, { encoding: 'utf-8', stdio: 'inherit' });
};

export default teardown;