CREATE OR REPLACE FUNCTION public.consume_usage(_metric text, _limit integer)
 RETURNS TABLE(allowed boolean, used integer, "limit" integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() AT TIME ZONE 'utc')::date;
  _count integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _metric NOT IN ('ai_message', 'pickup_line') THEN
    RAISE EXCEPTION 'Unknown metric';
  END IF;

  INSERT INTO public.usage_limits (user_id, metric, period, period_start, count)
  VALUES (_uid, _metric, 'day', _today, 1)
  ON CONFLICT (user_id, metric, period, period_start)
  DO UPDATE SET count = public.usage_limits.count + 1
    WHERE public.usage_limits.count < _limit
  RETURNING public.usage_limits.count INTO _count;

  IF _count IS NULL THEN
    SELECT u.count INTO _count
    FROM public.usage_limits u
    WHERE u.user_id = _uid AND u.metric = _metric
      AND u.period = 'day' AND u.period_start = _today;
    RETURN QUERY SELECT false, COALESCE(_count, 0), _limit;
  ELSE
    RETURN QUERY SELECT true, _count, _limit;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_usage_counts()
 RETURNS TABLE(chat_used integer, pickup_used integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE((SELECT u.count FROM public.usage_limits u
      WHERE u.user_id = auth.uid() AND u.metric = 'ai_message'
        AND u.period = 'day' AND u.period_start = (now() AT TIME ZONE 'utc')::date), 0)::integer,
    COALESCE((SELECT u.count FROM public.usage_limits u
      WHERE u.user_id = auth.uid() AND u.metric = 'pickup_line'
        AND u.period = 'day' AND u.period_start = (now() AT TIME ZONE 'utc')::date), 0)::integer;
$function$;

GRANT EXECUTE ON FUNCTION public.consume_usage(text, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_usage_counts() TO authenticated, service_role;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_store_transaction_id_key
  ON public.subscriptions (store_transaction_id)
  WHERE store_transaction_id IS NOT NULL;