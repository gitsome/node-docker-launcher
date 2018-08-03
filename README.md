# NodeJS Docker Launcher

## Installation and Usage

### Install

```
# npm
npm install node-docker-launcher --save

# yarn
yarn add node-docker-launcher
```

### Usage

Here is an example of setting up a few Docker images, and then when they are all running, starting up a NodeJS server that talks to them.

```js
/*============ DEPENDENCIES ============*/

const dotenv = require('dotenv');
const shell = require("shelljs");
const _ = require('lodash');

const NodeDockerLauncher = require('node-docker-launcher');


/*============ PRIVATE VARIABLES AND METHODS ============*/

// load env configs within the first script which expsoes the .env_configs props on the process.env object
dotenv.config({ path: ".env_configs" });

// pull out relevant env configs
const NEO4J_PORT = process.env.NEO4J_PORT;
const NEO4J_BOLT_PORT = process.env.NEO4J_BOLT_PORT;
const NEO4J_DATA_DIRECTORY = process.env.NEO4J_DATA_DIRECTORY; // can be custom for linux, do not change on Mac
const NEO4J_LOGS_DIRECTORY = process.env.NEO4J_LOGS_DIRECTORY; // can be custom for linux, do not change on Mac
const MONGODB_PORT = process.env.MONGODB_PORT;

const ensureDockerRunning = (dockerImageName, dockerId, params) => {
  const nodeDockerLauncher = new NodeDockerLauncher(dockerImageName, dockerId, params);
  return nodeDockerLauncher.run();
};


/*============ STARTUP ============*/

const dockerPromises = [];

// Startup Neo4J
dockerPromises.push(
  ensureDockerRunning('neo4j:3.3', 'grasp-theory-analytics-neo4j', {
    '--publish': `127.0.0.1:${NEO4J_PORT}:7474`,
    '--publish': `127.0.0.1:${NEO4J_BOLT_PORT}:7687`,
    '--volume': NEO4J_DATA_DIRECTORY,
    '--volume': NEO4J_LOGS_DIRECTORY
  })
);

// Startup MongoDB
dockerPromises.push(
  ensureDockerRunning('mongo:3.6.2', 'grasp-theory-analytics-mongodb', {
    '--publish': `127.0.0.1:${MONGODB_PORT}:27017`
  })
);

// When all Docker containers are up, start up the Webapp
Promise.all(dockerPromises).then(() => {
  // now time to start up the server which re-uses the .env_configs to setup communication with the docker containers
  const child = shell.exec(`cd build/server && node app.js`, {async: true});
}).catch((e) => {
  console.log("Error Starting Docker Containers:", e);
});
```

## Development Setup

Install Dependencies

```
npm install
```
