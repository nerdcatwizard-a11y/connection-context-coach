REVOKE EXECUTE ON FUNCTION public.consume_usage(text, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_usage_counts() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.consume_ai_message(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_ai_usage() FROM PUBLIC, anon, authenticated;
DROP FUNCTION IF EXISTS public.consume_ai_message(integer);
DROP FUNCTION IF EXISTS public.get_ai_usage();