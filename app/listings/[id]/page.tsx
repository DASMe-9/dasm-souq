import { notFound } from "next/navigation";
import { fetchListingById } from "@/lib/listings";
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

  return (
    <>
      <Header />
      <ListingDetail listing={listing} />
      <Footer />
    </>
  );
}
