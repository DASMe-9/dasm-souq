-- ═══════════════════════════════════════════════════════════════
-- RPC: atomic increment of marketplace_listings.views_count
-- Avoids read-modify-write race under concurrent views.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.increment_listing_views(p_listing_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.marketplace_listings
    set views_count = views_count + 1
    where id = p_listing_id
    returning views_count into v_count;
  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.increment_listing_views(uuid) from public, anon;
grant execute on function public.increment_listing_views(uuid) to service_role;
