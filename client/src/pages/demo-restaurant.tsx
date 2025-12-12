import DemoPageTemplate from "@/components/demo/DemoPageTemplate";
import { restaurantConfig } from "@/components/demo/configs/restaurant";

export default function DemoRestaurant() {
  return <DemoPageTemplate config={restaurantConfig} />;
}
