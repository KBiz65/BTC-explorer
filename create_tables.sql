-- create_tables.sql
CREATE TABLE blocks (
  block_hash VARCHAR(64) PRIMARY KEY,
  block_height INTEGER,
  timestamp TIMESTAMPTZ,
  transaction_count INTEGER
);

CREATE TABLE transactions (
  transaction_id SERIAL PRIMARY KEY,
  block_hash VARCHAR(64),
  transaction_hash VARCHAR(64) UNIQUE, -- Add a UNIQUE constraint on transaction_hash
  inputs JSONB,
  outputs JSONB,
  fee DECIMAL(18, 8),
  timestamp TIMESTAMPTZ,
  txid VARCHAR(64) UNIQUE, -- Add a UNIQUE constraint on txid
  FOREIGN KEY (block_hash) REFERENCES blocks (block_hash)
);


CREATE TABLE addresses (
  address VARCHAR(34) PRIMARY KEY,
  balance DECIMAL(18, 8),
  transactions JSONB
);
