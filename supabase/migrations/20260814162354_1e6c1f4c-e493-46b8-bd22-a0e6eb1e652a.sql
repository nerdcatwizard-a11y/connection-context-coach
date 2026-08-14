REVOKE ALL ON FUNCTION public.consume_ai_message(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_ai_usage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_message(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_ai_usage() TO authenticated, service_role;