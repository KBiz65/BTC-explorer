const pool = require('../database');

const batchInsertTransactions = async (transactions) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const transaction of transactions) {
      await insertTransaction(client, transaction);
      await insertInputs(client, transaction.inputs);
      await insertOutputs(client, transaction.outputs);

      // Mark referenced outputs as spent
      if (transaction.inputs) {
        const referencedOutputs = transaction.inputs.map((input) => ({
          txid: input.previousTxHash,
          outputIndex: input.outputIndex,
        }));
        await markOutputsAsSpent(client, referencedOutputs);
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in batch transaction:', error);
    throw error;
  } finally {
    client.release();
  }
};

const insertTransaction = async (client, transaction) => {
  const transactionQuery = `
  INSERT INTO transactions (txid, txhash, block_hash, size, virtual_size, weight, lock_time, version, fees)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  ON CONFLICT (txid) DO NOTHING;
  `;

  const transactionValues = [
    transaction.data.txid,
    transaction.data.txhash,
    transaction.data.block_hash,
    transaction.data.size,
    transaction.data.virtual_size,
    transaction.data.weight,
    transaction.data.lock_time,
    transaction.data.version,
    transaction.data.fees,
  ];

  await client.query(transactionQuery, transactionValues);
};

const insertInputs = async (client, inputs) => {
  console.log('inputs: ', inputs);
  if (inputs) {
    for (const input of inputs) {
      // Insert input and get the generated input_id
      const inputQuery = `
            INSERT INTO inputs (txid, referenced_txid, referenced_output_index, input_sequence)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING
            RETURNING input_id;
        `;

      const inputValues = [input.txid, input.referenced_txid, input.referenced_output_index, input.sequence];

      const res = await client.query(inputQuery, inputValues);

      let inputId;
      if (res.rows.length > 0) {
        inputId = res.rows[0].input_id;
      } else {
        // Fetch the existing input_id for the input
        const fetchInputIdQuery = `
                SELECT input_id FROM inputs
                WHERE txid = $1 AND referenced_txid = $2 AND referenced_output_index = $3;
            `;
        const existingInputIdRes = await client.query(fetchInputIdQuery, [
          input.txid,
          input.referenced_txid,
          input.referenced_output_index,
        ]);
        inputId = existingInputIdRes.rows.length > 0 ? existingInputIdRes.rows[0].input_id : null;
      }

      if (inputId && input.witnesses) {
        const witnessQuery = `
                INSERT INTO witnesses (input_id, witness_data)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING;
            `;

        const witnessValues = [inputId, input.witnesses];

        await client.query(witnessQuery, witnessValues);
      }
    }
  }
};

const insertOutputs = async (client, outputs) => {
  console.log('outputs: ', outputs);
  if (outputs) {
    for (const output of outputs) {
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
    }
  }
};

const markOutputsAsSpent = async (client, outputs) => {
  const valuesList = outputs
    .map(
      (output, index) => `($${index * 2 + 1}::text, $${index * 2 + 2}::integer)` // Cast txid to text if needed, and output_index to integer
    )
    .join(', ');

  const updateValues = outputs.flatMap((output) => [output.txid, output.output_index]);

  const updateQuery = `
        UPDATE outputs
        SET spent = TRUE
        FROM (VALUES ${valuesList}) AS v(txid, output_index)
        WHERE outputs.txid = v.txid AND outputs.output_index = v.output_index AND outputs.spent = FALSE;
    `;

  await client.query(updateQuery, updateValues);
};

module.exports = batchInsertTransactions;
