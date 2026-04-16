/**
 * DASM-services DB types (hand-written, kept in sync with
 * supabase/migrations/*.sql). For auto-generated types later,
 * run: npx supabase gen types typescript --project-id bmfqfmsxtotdksvcqfrh
 */

export type ListingStatus =
  | "pending"
  | "active"
  | "paused"
  | "sold"
  | "deleted"
  | "expired";

export type ListableType = "Car" | "RealEstate" | "FarmAsset";

export interface MarketplaceListing {
  id: string;
  external_user_id: number;
  external_listable_type: ListableType | null;
  external_listable_id: number | null;

  section_id: number;
  section_slug: string;
  tag_slug: string | null;

  title: string;
  description: string | null;
  images: string[];

  price: number | null;
  is_negotiable: boolean;
  currency: string;

  area_code: string | null;
  city: string | null;

  status: ListingStatus;
  is_auctionable: boolean;
  requires_settlement: boolean;

  views_count: number;
  favorites_count: number;

  featured_until: string | null;
  published_at: string | null;
  expires_at: string | null;
  sold_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingFilters {
  section?: string;
  tag?: string;
  area?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  perPage?: number;
  sort?: "latest" | "price_asc" | "price_desc" | "popular";
}

export interface ListingsPage {
  items: MarketplaceListing[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}
