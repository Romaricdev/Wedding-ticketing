import { WeddingHomepage } from "@/components/landing/wedding-homepage";
import { getPublicLandingContent } from "@/server/landing";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const content = await getPublicLandingContent();
  return <WeddingHomepage content={content} />;
}
