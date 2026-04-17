import { notFound } from "next/navigation";
import { fetchInspectionForListing, fetchListingById } from "@/lib/listings";
import { buildListingJsonLd } from "@/lib/jsonld";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingDetail from "@/components/ListingDetail";

export const revalidate = 60;

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
  const listing = await fetchListingById(id);
  if (!listing) notFound();

  // Verified inspection is a best-effort sidecar — never block the page.
  let inspection = null;
  try {
    inspection = await fetchInspectionForListing(id);
  } catch {
    inspection = null;
  }

  const jsonLd = buildListingJsonLd(listing);

  return (
    <>
      {/* Schema.org Product / Vehicle structured data — Google rich
          results for price, image, condition, and vehicle specs.
          Haraj emits none; this is a cheap SEO differentiator. */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <ListingDetail listing={listing} inspection={inspection} />
      <Footer />
    </>
  );
}
