import DemoPageTemplate from "@/components/demo/DemoPageTemplate";
import { weddingVenueConfig } from "@/components/demo/configs/wedding-venue";

export default function DemoWedding() {
  return <DemoPageTemplate config={weddingVenueConfig} />;
}
