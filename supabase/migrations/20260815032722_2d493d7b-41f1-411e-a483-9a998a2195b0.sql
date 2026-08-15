ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS store text,
  ADD COLUMN IF NOT EXISTS store_transaction_id text,
  ADD COLUMN IF NOT EXISTS store_product_id text;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_store_transaction_id_key
  ON public.subscriptions (store_transaction_id)
  WHERE store_transaction_id IS NOT NULL;