import DemoPageTemplate from "@/components/demo/DemoPageTemplate";
import { dentalClinicConfig } from "@/components/demo/configs/dental-clinic";

export default function DemoDental() {
  return <DemoPageTemplate config={dentalClinicConfig} />;
}
