import DemoPageTemplate from "@/components/demo/DemoPageTemplate";
import { salonConfig } from "@/components/demo/configs/salon";

export default function DemoSalon() {
  return <DemoPageTemplate config={salonConfig} />;
}
