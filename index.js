const cron = require("node-cron");
const express = require("express");
const fs = require("fs");
const path = require('path');
const { Sequelize } = require("sequelize");
const CSVToJSON = require('csvtojson');
require('dotenv').config()
app = express();

const center_name = process.env.NAME_OF_CENTER || 'chain';
const sent_directory = process.env.SENT_DIRECTORY || 'sent/';
const received_directory = process.env.RECEIVED_DIRECTORY || 'received/';
const isClinic = process.env.IS_CLINIC === 'true' ? true : false;
const PORT = process.env.PORT || '3500';
const DB_CONFIG = {
  DB_NAME: process.env.DB_NAME,
  USER: process.env.DB_USER,
  HOST: process.env.DB_HOST,
  PASSWORD: process.env.DB_PASS,
}
const sequelize = new Sequelize(DB_CONFIG.DB_NAME, DB_CONFIG.USER, DB_CONFIG.PASSWORD, {
    host: DB_CONFIG.HOST,
    dialect: 'postgres'
});

// initialize connection and model
const StockTransaction = sequelize.define('stock_transaction', {
    id: {
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    },
    entity_ext_id: {
      type: Sequelize.UUID,
      allowNull: true,
    },
    product_package_id: {
      type: Sequelize.UUID,
      allowNull: true,
    },
    date_time: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    amount: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    is_verified: {
      type: Sequelize.BOOLEAN,
      defaultValue: null
    },
    is_synced: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    is_sent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    product_instance_id: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    origin_id: {
        type: Sequelize.UUID,
        allowNull: false,
    },
    dest_id: {
        type: Sequelize.UUID,
        allowNull: false,
    }
  }, {
    tableName: 'stock_transaction',
    timestamps: true,
    underscored: true
});
(async () => {
  await sequelize.sync({ force: false, logging: false});
})();

/**
 * @CHAIN
 * chain functions
 */
const getReceivedFilesSortAsc = async(directory_path) => {
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
const transactionsToCSVFile = async (path, data) => {
  const createCsvWriter = require('csv-writer').createObjectCsvWriter;
  const csvWriter = createCsvWriter({
    path: path,
    header: [
      {id: 'id', title: 'id'},
      {id: 'entity_ext_id', title: 'entity_ext_id'},
      {id: 'product_package_id', title: 'product_package_id'},
      {id: 'product_instance_id', title: 'product_instance_id'},
      {id: 'date_time', title: 'date_time'},
      {id: 'amount', title: 'amount'},
      {id: 'is_verified', title: 'is_verified'},
      {id: 'is_synced', title: 'is_synced'},
      {id: 'is_sent', title: 'is_sent'},
      {id: 'origin_id', title: 'origin_id'},
      {id: 'dest_id', title: 'dest_id'},
      {id: 'createdAt', title: 'createdAt'},
      {id: 'updatedAt', title: 'updatedAt'},
    ]
  });
  
  
  return new Promise((resolve, reject) => {
    csvWriter
      .writeRecords(data)
      .then(()=> {
        console.log('The CSV file was written successfully')
        resolve();
      }).catch(() => reject());
  })
}
const transactionsIdsToCSVFile = async (path, data) => {
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: path,
  header: [
    {id: 'id', title: 'id'},
  ]
});
return new Promise((resolve, reject) => {
  csvWriter
    .writeRecords(data)
    .then(()=> {
      resolve();
    }).catch(() => reject());
})
}
const copyFileToClinicServer = async (file_path, file_name) => {
  const pathToFile = path.join(__dirname, file_path)
  const pathToNewDestination = path.join(__dirname, '..', file_name.split('-')[0] ,"received", file_name)
  fs.copyFileSync(pathToFile, pathToNewDestination);
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
const readFilesAndSetTransactionAndResendTransactionsForSyncToClinic = async () => {
   /**
     * 1-read files in directory /received
     * 2-read transactions inside of each file
     * 3-change warehouse (central and bench stock to related warehouse)
     * 4-insert or update transactions in stock_transactions (is_synced = true)
     * 5-get all ids and are insert or update of transactions
     * 6-create csv file for ids
     * 7-send file into clinic
     * 8-if (successfully sent) set is_sent = true of transactions 
     */
    // 1
    const receivedFiles = await getReceivedFilesSortAsc(received_directory);
    for (let index = 0; index < receivedFiles.length; index++) {
      const received_file_path = receivedFiles[index];
      // 2
      const transactions = await CSVToJSON().fromFile(received_file_path);
      if (transactions && transactions.length) {
        // 3 skip (all transactions change warehouses in clinic)
        // 4
        await sequelize.transaction(async () => {
          for (let index = 0; index < transactions.length; index++) {
            const transaction = transactions[index];
            const foundTransaction = await StockTransaction.findOne({where: {id: transaction.id}})
            if (foundTransaction) {
              transaction.is_sent = Boolean(transaction.is_sent );
              transaction.is_synced = Boolean(transaction.is_synced);
              const id = transaction.id;
              delete transaction.id;
              await StockTransaction.update(convertEmptyStringToNull(transaction), {where: {id}})
            } else {
              transaction.is_sent = Boolean(transaction.is_sent );
              transaction.is_synced = Boolean(transaction.is_synced);
              await StockTransaction.create(convertEmptyStringToNull(transaction));
            }
          }
        });
        // 5
        const clinic_name = path.basename(received_file_path).split('-')[0]
        const file_name = `${clinic_name}-${Date.now()}.csv`
        const sent_file_path = sent_directory+file_name;
        // 6
        await transactionsIdsToCSVFile(sent_file_path, transactions.map(t => ({id: t.id})));
        // 7
        await copyFileToClinicServer(sent_file_path, file_name);
        fs.unlinkSync(sent_file_path);
        // 8
        await sequelize.transaction(async () => {
          await Promise.all(transactions.map(t => StockTransaction.update({is_sent: true, is_synced: true}, {where: {id: t.id}})))
        });
        fs.unlinkSync(received_file_path);
      }
    }
}
/**
 * @CLINIC
 * clinic functions
 */
const readFilesAndSetTransactions = async () => {
  /**
   * 7-read files in directory /received
   * 8-update transactions and set is_synced = true
   */
    const received_path = received_directory;
    // 7
    const receivedFiles = await getReceivedFilesSortAsc(received_path);
    for (let index = 0; index < receivedFiles.length; index++) {
      const file_path = receivedFiles[index];
      const transactions = await CSVToJSON().fromFile(file_path);
      if (transactions && transactions.length) {
        // 8
        await Promise.all(transactions.map(t => StockTransaction.update({is_synced: true}, {where: {id: t.id}})))
      }
      fs.unlinkSync(file_path);
    }
}
const getTransactionsAndWriteIntoCSVFileAndSendToChain = async () => {
  /**
   * 1-select all transaction have is_sent = false
   * 1-1 check if we have transactions is_sent = false
   * 2-write file with name (center_name+timestamp.csv)
   * 3-read files in directory /sent
   * 4-scp file into chain
   * 5-check file successfully sent
   * 6-update is_sent = true transaction in file
   * 
   */
  // 1
  let transactions = await StockTransaction.findAll({where: {is_sent: false}});
  // 1-1
  if(transactions && transactions.length) {
    transactions = transactions.map(t => t.get({plain: true}));
      // 2
      const file_name = `${center_name}-${Date.now()}.csv`
      const file_path = sent_directory+file_name;
      await transactionsToCSVFile(file_path, transactions)
      // 4
      try {
          // 5
          await copyFileToChainServer(file_path, file_name);
          console.log('source was copied to destination');
          // 6
          await Promise.all(transactions.map(t => StockTransaction.update({is_sent: true}, {where: {id: t.id}})))
          console.log('transactions successfully changed is_sent = true');
      } catch (err) {
          console.log('an error occurred during source was copied to destination');
      } finally {
          fs.unlinkSync(file_path);
      }
  }
}
const copyFileToChainServer = async (file_path, file_name) => {
  const pathToFile = path.join(__dirname, file_path)
  const pathToNewDestination = path.join(__dirname, '..', `chain` ,"received", file_name)
  fs.copyFileSync(pathToFile, pathToNewDestination);
}
// schedule tasks to be run on the server
(async () => {
// cron.schedule("*/10 * * * * *", async function() {
    try {
      if (isClinic) {
        await readFilesAndSetTransactions();
        await getTransactionsAndWriteIntoCSVFileAndSendToChain();
      } 
      if (!isClinic) {
        await readFilesAndSetTransactionAndResendTransactionsForSyncToClinic();
      }
    } catch (err) {
      console.log(`an error occurred on ${center_name}`);
    } finally {
      console.log(`cron job on "${center_name}" was running successfully`)
    }
// });
})()
app.listen(PORT, () => console.log(`${center_name} listen to port ${PORT}`));
