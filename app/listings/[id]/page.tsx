import { notFound } from "next/navigation";
import { fetchListingById } from "@/lib/listings";
import { getAuthenticatedUser } from "@/lib/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingDetail from "@/components/ListingDetail";

// Owner-awareness needs the request-scoped Sanctum cookie, so this page
// must render per-request. (Was 60s cache — incompatible with auth.)
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const listing = await fetchListingById(id);
    if (!listing) return { title: "إعلان غير موجود" };
    return {
      title: `${listing.title} — سوق داسم`,
      description: listing.description?.slice(0, 160) ?? listing.title,
      openGraph: {
        title: listing.title,
        description: listing.description ?? undefined,
        images:
          Array.isArray(listing.images) && listing.images.length > 0
            ? [{ url: listing.images[0] }]
            : undefined,
      },
    };
  } catch {
    return { title: "سوق داسم" };
  }
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [listing, user] = await Promise.all([
    fetchListingById(id),
    getAuthenticatedUser(),
  ]);
  if (!listing) notFound();

  // Owner = the person who posted this listing. They get the seller panel
  // (Decide destination modal wired to Core /api/cars/{id}/publish/*) and
  // don't see the "bid / contact" buttons that are meant for shoppers.
  const isOwner = user?.id != null && user.id === listing.external_user_id;

  return (
    <>
      <Header />
      <ListingDetail listing={listing} isOwner={isOwner} />
      <Footer />
    </>
  );
}
