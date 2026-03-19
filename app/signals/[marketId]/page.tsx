import { SignalDetailPage } from "@/components/lunascope/signal-detail-page";

export default async function SignalPage({
  params,
}: {
  params: Promise<{ marketId: string }>;
}) {
  const { marketId } = await params;
  return <SignalDetailPage marketId={marketId} />;
}
