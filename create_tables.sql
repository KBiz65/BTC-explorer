CREATE TABLE blocks (
  block_hash VARCHAR(64) PRIMARY KEY,
  block_height INTEGER,
  timestamp TIMESTAMPTZ,
  merkle_root VARCHAR(64),
  previous_block_hash VARCHAR(64),
  nonce BIGINT,
  difficulty NUMERIC,
  size INTEGER,
  version INTEGER,
  confirmations INTEGER,
  transaction_count INTEGER
);

CREATE TABLE transactions (
  transaction_id SERIAL PRIMARY KEY,
  block_hash VARCHAR(64) REFERENCES blocks (block_hash),
  transaction_hash VARCHAR(64) UNIQUE,
  version INTEGER,
  size INTEGER,
  vsize INTEGER,
  weight INTEGER,
  lock_time INTEGER,
  timestamp TIMESTAMPTZ,
  confirmations INTEGER,
  fee DECIMAL(18, 8)
);

CREATE TABLE inputs (
  input_id SERIAL PRIMARY KEY,
  transaction_hash VARCHAR(64) REFERENCES transactions (transaction_hash),
  previous_transaction_hash VARCHAR(64),
  output_index INTEGER,
  script_sig TEXT,
  sequence BIGINT,
  witness TEXT,
  sender_address VARCHAR(34)
);

CREATE TABLE outputs (
  output_id SERIAL PRIMARY KEY,
  transaction_hash VARCHAR(64) REFERENCES transactions (transaction_hash),
  value DECIMAL(18, 8),
  script_pub_key TEXT,
  receiver_address VARCHAR(34),
  output_index INTEGER
);

CREATE TABLE addresses (
  address VARCHAR(34) PRIMARY KEY,
  type VARCHAR(50)
);

CREATE TABLE scripts (
  script_id SERIAL PRIMARY KEY,
  script_asm TEXT,
  script_hex TEXT
);

CREATE TABLE error_logs (
  id SERIAL PRIMARY KEY,
  block_height INT,
  error_message TEXT,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
