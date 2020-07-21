const CSVToJSON = require('csvtojson');
const ObjectsToCsv = require('objects-to-csv')
const fs = require("fs");
const util = require('util');
const path = require('path');
const { exec } = require("child_process");


// const DataToCSVFile = async (path, data, header) => {
//     const createCsvWriter = require('csv-writer').createObjectCsvWriter;
//     const csvWriter = createCsvWriter({
//         path: path,
//         header: header
//     });
//     return new Promise((resolve, reject) => {
//         csvWriter
//             .writeRecords(data)
//             .then(() => {
//                 resolve();
//             }).catch(() => reject());
//     })
// }
const writeToCsv = async (data, path) => {
    if (data && data.length) {
        const csv = new ObjectsToCsv(data);
        // Save to file:
        await csv.toDisk(path);
    }
}

const copyFileToClinicServer = async (file_path, file_name) => {
    const pathToFile = path.join(__dirname, file_path)
    const pathToNewDestination = path.join(__dirname, '..', file_name.split('-')[0], "received", file_name)
    fs.copyFileSync(pathToFile, pathToNewDestination);
}

const copyFileToChainServer = async (file_path, file_name) => {
    // const pathToFile = path.join(__dirname, file_path)
    const pathToFile = file_path;
    const pathToNewDestination = path.join(__dirname, '..', `chain`, "received", file_name)
    fs.copyFileSync(pathToFile, pathToNewDestination);
}

const transferFileFromLocalHostToRemoteHost = async (user, host, port, files_path, remote_path) => {
    const password = path.resolve(__dirname, 'remotepass');
    let shell = `sshpass -f "${password}" scp -r ${port ? `-P ${port}`: ''} -o StrictHostKeyChecking=no ${files_path.join(' ')} ${user}@${host}:${remote_path ? remote_path : '/'}`;
    // let shell = `scp -r ${port ? `-P ${port}`: ''} ${files_path.join(' ')} ${user}@${host}:${remote_path ? remote_path : '/'}`;
    console.log(shell);
    await execShellCommand(shell);
}
const execShellCommand = (cmd)  => {
    const exec = require('child_process').exec;
    return new Promise((resolve, reject) => {
     exec(cmd, (error, stdout, stderr) => {
      if (error) {
       console.warn(error);
       reject('could not scp file')
      }
      resolve(stdout? stdout : stderr);
     });
    });
}

const readFilesFromDirectory = async(directory_path) => {
    const exists_files = fs.readdirSync(directory_path, function(err, files){
        return files.map(function (fileName) {
          return {
            name: fileName,
            time: fs.statSync(dir + '/' + fileName).mtime.getTime()
          };
        })
        .sort((a, b) => a.time - b.time)
        .map(v => v.name);
    });
    return exists_files.map(file => path.resolve(__dirname, directory_path, file));
  }

const groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
};

const deleteFiles = async (files_path) => {
    const unlink = util.promisify(fs.unlink);
    try {
        const unlinkPromises = files_path.map(file_path => unlink(file_path));
        return Promise.all(unlinkPromises);
    } catch(err) {
        console.log(err);
    }
}

const readCSVFile = async (file_path) => {
    return CSVToJSON().fromFile(file_path);
}

const convertEmptyStringToNull = (object) => {
    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        const value = object[key];
        if (value === '') {
          object[key] = null
        }
      }
    }
    return object;
  }

module.exports = {
    copyFileToChainServer,
    copyFileToClinicServer,
    groupBy,
    writeToCsv,
    transferFileFromLocalHostToRemoteHost,
    readFilesFromDirectory,
    deleteFiles,
    readCSVFile,
    convertEmptyStringToNull
}