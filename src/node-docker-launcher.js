/*============ DEPENDENCIES ============*/

const shell = require('shelljs');
const _ = require('lodash');

/*============ CLASS DEFINITION ============*/

class NodeDockerLauncher {

  /*============ PROPERTIES ============*/

  dockerImageName = null;
  dockerId = null;

  paramsString = null;
  statusCommand = null;
  createCommand = null;
  startCommand = null;


  /*============ CONSTRUCTOR ============*/

  constuctor (dockerImageName, dockerId, params) {
    this.dockerImageName = dockerImageName;
    this.dockerId = dockerId;

    this.paramsString = _.map(params, function (value, key) {
      return `${key}=${value}`;
    }).join(' ');

    this.statusCommand = `docker inspect ${this.dockerId}`;
    this.createCommand = `docker create --name=${this.dockerId} ${this.paramsString} ${this.dockerImageName}`;
    this.startCommand = `docker start ${this.dockerId}`;
  }


  /*============ METHODS ============*/

  getStatus = () => {
    return new Promise(function (resolve, reject) {

      const status_childProcess = shell.exec(this.statusCommand, {silent: true}, function(code, stdout, stderr) {

        if (code === 0) {

          const statusObject = JSON.parse(stdout);
          resolve(statusObject[0].State.Status);

        } else if (code === 1) {
          resolve('notcreated');
        } else {
          reject(stderr);
        }
      });
    });
  };

  getStatusUntil = (status, attempts, interval, onSuccess, onFailure) => {

    let currentAttempt = 0;
    let firstTry = true;

    const doAttempt = () => {

      currentAttempt++;

      if (currentAttempt >= attempts) {
        onFailure();
      } else {
        getStatus().then((statusCheck) => {

          if (statusCheck === status) {
            onSuccess();
          } else {
            if (firstTry) {
              firstTry = false;
              doAttempt();
            } else {
              setTimeout(doAttempt, interval);
            }
          }

        }, onFailure);
      }
    };

    doAttempt();
  };

  create = () => {
    return new Promise((resolve, reject) => {

      const status_childProcess = shell.exec(this.createCommand, {silent: true}, function(code, stdout, stderr) {

        if (code === 0) {

          console.log('Docker ' + this.dockerId + ' ...created');
          resolve();

        } else {
          reject(stderr);
        }
      });
    });
  };

  start = () => {
    return new Promise((resolve, reject) => {

      const start_childProcess = shell.exec(this.startCommand, {silent: true}, (code, stdout, stderr) => {

        if (code === 0) {

          console.log('Docker' + this.dockerId + ' ...starting');

          getStatusUntil('running', 10, 1000, function () {
            console.log('Docker ' + this.dockerId + ' ...start complete');
            resolve();
          }, reject);

        } else {
          reject(stderr);
        }

      });

    });
  };

  run = () => {

    return new Promise((resolve, reject) => {

      getStatus().then((status) => {

        if (status === 'running') {

          console.log('Docker ' + this.dockerId + ' ...running');
          resolve();

        } else if (status === 'stopped' || status === 'exited' || status === 'created') {

          return start().then(resolve, reject);

          // never created
        } else if (status === 'notcreated') {
          return create()
            .then(start)
            .then(resolve, reject);
        }
      });

    });
  };

};

/*============ MODULE EXPORTS ============*/

module.exports = NodeDockerLauncher;