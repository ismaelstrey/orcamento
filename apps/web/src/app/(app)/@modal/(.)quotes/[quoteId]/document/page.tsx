import { QuoteDocumentModal } from "@/components/quotes/quoteDocumentModal";

interface QuoteDocumentModalPageProps {
  params: Promise<{
    quoteId: string;
  }>;
}

export default async function QuoteDocumentModalPage({
  params
}: QuoteDocumentModalPageProps) {
  const { quoteId } = await params;

  return <QuoteDocumentModal quoteId={quoteId} />;
}
