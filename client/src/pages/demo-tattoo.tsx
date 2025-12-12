import DemoPageTemplate from "@/components/demo/DemoPageTemplate";
import { tattooConfig } from "@/components/demo/configs/tattoo";

export default function DemoTattoo() {
  return <DemoPageTemplate config={tattooConfig} />;
}
