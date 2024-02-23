const pool = require('../database');

const batchInsertTransactions = async (transactions) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await insertTransactions(client, transactions);
    await insertOutputs(client, transactions);
    await insertInputs(client, transactions);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in batch transaction: ', error);
    throw error;
  } finally {
    client.release();
  }
};

const insertTransactions = async (client, transactions) => {
  for (const transaction of transactions) {
    const transactionQuery = `
    INSERT INTO transactions (txid, txhash, block_hash, size, virtual_size, weight, lock_time, version, fees)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (txid) DO NOTHING;
    `;
  
    const transactionValues = [
      transaction.txid,
      transaction.txhash,
      transaction.block_hash,
      transaction.size,
      transaction.virtual_size,
      transaction.weight,
      transaction.lock_time,
      transaction.version,
      transaction.fees,
    ];
  
    await client.query(transactionQuery, transactionValues);
    // use this to debug when transactions not getting entered correctly
    // const result = await client.query(transactionQuery, transactionValues);

    // if (result.rowCount > 0) {
    //   console.log(`Transaction ${transaction.txid} inserted successfully.`);
    // } else {
    //   console.log(`Transaction ${transaction.txid} already exists or conflict occurred.`);
    // }
  }
};

const insertOutputs = async (client, transactions) => {
  for (const transaction of transactions) {
    for (const output of transaction.outputs) {
      const outputQuery = `
          INSERT INTO outputs (txid, amount, address, output_index, spent)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT DO NOTHING;
        `;
      const outputValues = [
        output.txid,
        output.amount,
        output.address,
        output.output_index,
        false, // Initially set spent to false for new outputs
      ];
      await client.query(outputQuery, outputValues);
      // use this to debug when outputs aren't getting entered correctly
      // const result = await client.query(outputQuery, outputValues);

      // if (result.rowCount > 0) {
      //   console.log(`Output for transaction ${output.txid} inserted successfully.`);
      // } else {
      //   console.log(`Output for transaction ${output.txid} already exists or conflict occurred.`);
      // }
    }
  }
};

const insertInputs = async (client, transactions) => {
  for (const transaction of transactions) {
    for (const input of transaction.inputs) {
      try {
        // Insert input and get the generated input_id
        const inputQuery = `
            INSERT INTO inputs (txid, referenced_txid, referenced_output_index, input_sequence)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING
            RETURNING input_id;
          `;
  
        const inputValues = [
          input.txid,
          input.referenced_txid,
          input.referenced_output_index,
          input.input_sequence,
        ];
        const res = await client.query(inputQuery, inputValues);
  
        let inputId;
        if (res.rows.length > 0) {
          // have console.log here when debugging inputs when not entered correctly into the db
          // console.log(`Input for transaction ${input.txid} processed successfully.`);
          inputId = res.rows[0].input_id;
        } else {
          // Fetch the existing input_id for the input if not inserted due to conflict
          const fetchInputIdQuery = `
              SELECT input_id FROM inputs
              WHERE txid = $1 AND referenced_txid = $2 AND referenced_output_index = $3;
            `;
          const existingInputIdRes = await client.query(fetchInputIdQuery, inputValues.slice(0, 3));
          inputId = existingInputIdRes.rows.length > 0 ? existingInputIdRes.rows[0].input_id : null;
        }
  
        // Handle witnesses for the input if applicable and inputId was retrieved or inserted
        if (inputId && input.witnesses) {
          const witnessQuery = `
              INSERT INTO witnesses (input_id, witness_data)
              VALUES ($1, $2)
              ON CONFLICT DO NOTHING;
            `;
          const witnessValues = [inputId, input.witnesses];
          await client.query(witnessQuery, witnessValues);
          // use this to debug when witnesses aren't being entered into db correctly
          // const result = await client.query(witnessQuery, witnessValues);

          // if (result.rowCount > 0) {
          //   console.log(`Witness for input ${inputId} inserted successfully.`);
          // }
        }
      } catch (error) {
        console.log('blockHash with error: ', transaction.block_hash);
        console.log('txid with error: ', transaction.txid);
        console.log('error: ', error);
      }
    }
    const referencedOutputs = transaction.inputs.map((input) => ({
      txid: input.referenced_txid,
      outputIndex: input.referenced_output_index,
    }));
    await markOutputsAsSpent(client, referencedOutputs);
  }
};

const markOutputsAsSpent = async (client, outputs) => {
  const validOutputs = outputs.filter((output) => !(output.txid === 'coinbase' || output.txid === 'unknown') && output.outputIndex !== -1);

  const valuesList = validOutputs
    .map((output, index) => `($${index * 2 + 1}::text, $${index * 2 + 2}::integer)`)
    .join(', ');

  const updateValues = validOutputs.flatMap((output) => [output.txid, output.outputIndex]);

  // Only proceed if there are valid outputs to process
  if (validOutputs.length > 0) {
    const updateQuery = `
    UPDATE outputs
    SET spent = TRUE
    FROM (VALUES ${valuesList}) AS v(txid, output_index)
    WHERE outputs.txid = v.txid AND outputs.output_index = v.output_index AND outputs.spent = FALSE;
    `;

    await client.query(updateQuery, updateValues);
  }
};

module.exports = batchInsertTransactions;
