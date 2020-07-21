const cron = require("node-cron");
const express = require("express");
const path = require("path");
const {chain, PORT, center_name, clinics, sent_directory, received_directory, isClinic} = require('./consts');;
const {
  writeToCsv,
  readFilesFromDirectory,
  transferFileFromLocalHostToRemoteHost,
  deleteFiles,
  readCSVFile,
  copyFileToClinicServer,
  copyFileToChainServer,
  convertEmptyStringToNull
} = require('./helpers');;
const db = require('./models/index');
const app = express();

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
    const receivedFiles = await readFilesFromDirectory(received_directory);
    for (let index = 0; index < receivedFiles.length; index++) {
      const received_file_path = receivedFiles[index];
      // 2
      const transactions = await readCSVFile(received_file_path);
      if (transactions && transactions.length) {
        // 3 skip (all transactions change warehouses in clinic)
        // 4
        await db.sequelize.transaction(async () => {
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
        await writeToCsv(transactions.map(t => ({id: t.id})), sent_file_path);
        // 7
        await copyFileToClinicServer(sent_file_path, file_name);
        deleteFiles([sent_file_path])
        // 8
        await db.sequelize.transaction(async () => {
          await Promise.all(transactions.map(t => db['stock_transaction'].update({is_sent: true, is_synced: true}, {where: {id: t.id}})))
        });
        deleteFiles([received_file_path])
      }
    }
}
const readFilesAndSetTransactions = async () => {
  /**
   * 7-read files in directory /received
   * 8-update transactions and set is_synced = true
   */
    const received_path = received_directory;
    // 7
    const receivedFiles = await readFilesFromDirectory(received_path);
    for (let index = 0; index < receivedFiles.length; index++) {
      const file_path = receivedFiles[index];
      const transactions = await CSVToJSON().fromFile(file_path);
      if (transactions && transactions.length) {
        // 8
        await Promise.all(transactions.map(t => StockTransaction.update({is_synced: true}, {where: {id: t.id}})))
      }
      deleteFiles([file_path])
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
  let transactions = await db['stock_transaction'].findAll({where: {is_sent: false}});
  // 1-1
  if(transactions && transactions.length) {
    transactions = transactions.map(t => t.get({plain: true}));
      // 2
      const file_name = `${center_name}-${Date.now()}.csv`
      const file_path = sent_directory+file_name;
      await writeToCsv(transactions, file_path)
      // 4
      try {
          // 5
          await copyFileToChainServer(file_path, file_name);
          console.log('source was copied to destination');
          // 6
          await Promise.all(transactions.map(t => db['stock_transaction'].update({is_sent: true}, {where: {id: t.id}})))
          console.log('transactions successfully changed is_sent = true');
      } catch (err) {
          console.log('an error occurred during source was copied to destination');
      } finally {
          deleteFiles([file_path])
      }
  }
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
    }
    console.log(`cron job on "${center_name}" was running successfully`)
// });
})()
app.listen(PORT, () => console.log(`${center_name} listen to port ${PORT}`));
