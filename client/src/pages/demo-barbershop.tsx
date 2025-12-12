import DemoPageTemplate from "@/components/demo/DemoPageTemplate";
import { barberConfig } from "@/components/demo/configs/barber";

export default function DemoBarbershop() {
  return <DemoPageTemplate config={barberConfig} />;
}
