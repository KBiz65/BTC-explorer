const pool = require('../database');

const batchInsertTransactions = async (transactions) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        for (const transaction of transactions) {
            await insertTransaction(client, transaction);
            await insertInputs(client, transaction.inputs);
            await insertOutputs(client, transaction.outputs);
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
        INSERT INTO transactions (txid, block_hash, size, virtual_size, weight, lock_time, version, fees)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (txid) DO NOTHING;
    `;

    const transactionValues = [
        transaction.transactionHash,
        transaction.blockHash,
        transaction.size,
        transaction.vsize,
        transaction.weight,
        transaction.lockTime,
        transaction.version,
        transaction.fee,
    ];
    await client.query(transactionQuery, transactionValues);
};

const insertInputs = async (client, inputs) => {
    for (const input of inputs) {
        // Insert input and get the generated input_id
        const inputQuery = `
            INSERT INTO inputs (txid, prev_txid, prev_vout, input_sequence, scripttype)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT DO NOTHING
            RETURNING input_id;
        `;

        const inputValues = [
            input.txid,
            input.previousTxHash,
            input.outputIndex,
            input.sequence,
            input.inputType
        ];

        const res = await client.query(inputQuery, inputValues);
        const inputId = res.rows[0].input_id;

        if (input.witnesses) {
            const witnessQuery = `
                INSERT INTO witnesses (input_id, witness_data)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING;
            `;
    
            const witnessValues = [
                inputId,
                input.witnesses,
            ];
    
            await client.query(witnessQuery, witnessValues);
        }
    }
};

const insertOutputs = async (client, outputs) => {
    for (const output of outputs) {
        const outputQuery = `
            INSERT INTO outputs (txid, amount, address, output_index, scripttype)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT DO NOTHING;
        `;
        const outputValues = [
            output.txid,
            output.value,
            output.address,
            output.outputIndex,
            output.outputType
        ];

        await client.query(outputQuery, outputValues);
    }
};


module.exports = batchInsertTransactions;
