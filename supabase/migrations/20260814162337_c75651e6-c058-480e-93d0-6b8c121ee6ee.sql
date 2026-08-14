CREATE UNIQUE INDEX IF NOT EXISTS usage_limits_unique_period
  ON public.usage_limits (user_id, metric, period, period_start);

CREATE OR REPLACE FUNCTION public.consume_ai_message(_limit integer)
RETURNS TABLE (allowed boolean, used integer, "limit" integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() AT TIME ZONE 'utc')::date;
  _count integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.usage_limits (user_id, metric, period, period_start, count)
  VALUES (_uid, 'ai_message', 'day', _today, 1)
  ON CONFLICT (user_id, metric, period, period_start)
  DO UPDATE SET count = public.usage_limits.count + 1
    WHERE public.usage_limits.count < _limit
  RETURNING public.usage_limits.count INTO _count;

  IF _count IS NULL THEN
    SELECT u.count INTO _count
    FROM public.usage_limits u
    WHERE u.user_id = _uid AND u.metric = 'ai_message'
      AND u.period = 'day' AND u.period_start = _today;
    RETURN QUERY SELECT false, COALESCE(_count, 0), _limit;
  ELSE
    RETURN QUERY SELECT true, _count, _limit;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ai_usage()
RETURNS TABLE (used integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT u.count FROM public.usage_limits u
    WHERE u.user_id = auth.uid() AND u.metric = 'ai_message'
      AND u.period = 'day' AND u.period_start = (now() AT TIME ZONE 'utc')::date
  ), 0)::integer;
$$;

GRANT EXECUTE ON FUNCTION public.consume_ai_message(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_message(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_ai_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_usage() TO service_role;