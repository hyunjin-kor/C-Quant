CREATE TABLE IF NOT EXISTS market_daily_features (
  market_id TEXT NOT NULL,
  trading_date DATE NOT NULL,
  close NUMERIC NOT NULL,
  volume NUMERIC,
  feature_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (market_id, trading_date)
);

CREATE TABLE IF NOT EXISTS policy_events (
  id BIGSERIAL PRIMARY KEY,
  market_id TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity SMALLINT NOT NULL DEFAULT 1,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_runs (
  id BIGSERIAL PRIMARY KEY,
  market_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  train_window INTEGER NOT NULL,
  horizon INTEGER NOT NULL,
  metrics JSONB NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  trained_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_importance_snapshots (
  id BIGSERIAL PRIMARY KEY,
  model_run_id BIGINT NOT NULL REFERENCES model_runs(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  importance NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS backtest_runs (
  id BIGSERIAL PRIMARY KEY,
  market_id TEXT NOT NULL,
  strategy_name TEXT NOT NULL,
  metrics JSONB NOT NULL,
  assumptions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
