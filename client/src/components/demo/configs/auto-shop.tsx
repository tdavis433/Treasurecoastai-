import { Car, Shield, Clock, Calendar, TrendingUp, MessageCircle, Wrench, CheckCircle2 } from "lucide-react";
import { DemoPageConfig } from "../DemoPageTemplate";

export const autoShopConfig: DemoPageConfig = {
  clientId: "demo_sunrise_auto",
  botId: "sunrise_auto_demo_main",
  
  business: {
    name: "Sunrise Auto Care",
    tagline: "Expert Auto Care You Can Trust",
    description: "Full-service auto repair shop serving the Treasure Coast since 1998. ASE-certified technicians, state-of-the-art equipment, and honest service. From oil changes to engine rebuilds, we keep your vehicle running smoothly.",
    type: "auto_shop",
    phone: "(772) 555-AUTO",
    email: "service@sunriseautocare.com",
    website: "www.sunriseautocare.com",
    address: "2500 Mechanic Way",
    city: "Port St. Lucie, FL 34953",
    hours: {
      "Monday": "7:30 AM - 6:00 PM",
      "Tuesday": "7:30 AM - 6:00 PM",
      "Wednesday": "7:30 AM - 6:00 PM",
      "Thursday": "7:30 AM - 6:00 PM",
      "Friday": "7:30 AM - 6:00 PM",
      "Saturday": "8:00 AM - 3:00 PM",
      "Sunday": "Closed"
    }
  },

  icon: <Car className="h-6 w-6" />,
  
  colors: {
    primary: "from-red-600 to-orange-600",
    accent: "bg-red-500",
    gradient: "from-red-900/90 to-orange-900/90"
  },

  features: [
    "ASE Certified Technicians",
    "All Makes & Models",
    "Free Estimates",
    "Warranty on Repairs",
    "Same-Day Service",
    "Loaner Vehicles",
    "Digital Inspections",
    "Financing Available"
  ],

  services: [
    {
      name: "Full Synthetic Oil Change",
      description: "Premium full synthetic oil, new filter, 21-point inspection, tire pressure check, and fluid top-off.",
      price: "$79.99",
      duration: "30 minutes",
      popular: true
    },
    {
      name: "Brake Service",
      description: "Complete brake inspection, pad replacement, rotor resurface or replacement, and brake fluid flush.",
      price: "From $199",
      duration: "1-2 hours"
    },
    {
      name: "A/C Service & Repair",
      description: "Diagnose A/C issues, recharge refrigerant, check for leaks, and restore cool air for Florida summers.",
      price: "From $149",
      duration: "1-3 hours"
    },
    {
      name: "Check Engine Diagnostics",
      description: "Advanced computer diagnostics to identify warning light causes with detailed repair recommendations.",
      price: "$99",
      duration: "1 hour"
    },
    {
      name: "Tire Services",
      description: "New tire installation, rotation, balancing, wheel alignment, and TPMS service.",
      price: "From $25",
      duration: "30-90 minutes"
    },
    {
      name: "Major Repairs",
      description: "Engine, transmission, suspension, and electrical repairs by master technicians.",
      price: "Free estimate",
      duration: "Varies"
    }
  ],

  team: [
    {
      name: "Tony Morales",
      role: "Owner & Master Tech",
      specialty: "Engine Diagnostics",
      bio: "ASE Master Technician with 25+ years of experience."
    },
    {
      name: "Mike Johnson",
      role: "Lead Technician",
      specialty: "European Vehicles",
      bio: "Factory-trained on BMW, Mercedes, and Audi."
    },
    {
      name: "Chris Rodriguez",
      role: "Service Advisor",
      specialty: "Customer Relations",
      bio: "Explains repairs clearly without the jargon."
    },
    {
      name: "Lisa Chen",
      role: "Office Manager",
      specialty: "Scheduling & Estimates",
      bio: "Keeps the shop running smoothly and on schedule."
    }
  ],

  testimonials: [
    {
      name: "Robert K.",
      role: "Ford F-150 Owner",
      content: "Finally found an honest mechanic! They showed me exactly what was wrong with my truck via video inspection. Fair prices and quality work every time.",
      rating: 5
    },
    {
      name: "Maria S.",
      role: "Honda Accord Owner",
      content: "My car was overheating and the dealer quoted me $2,500. Sunrise fixed it for $600 and explained why. They've earned a customer for life!",
      rating: 5
    },
    {
      name: "James T.",
      role: "BMW 3 Series Owner",
      content: "Hesitant to take my BMW anywhere but the dealer. Sunrise's European specialist did an amazing job at half the cost. Highly recommend!",
      rating: 5
    }
  ],

  aiBenefits: [
    {
      title: "Easy Appointment Booking",
      description: "Customers schedule service appointments 24/7. AI collects vehicle info, mileage, and concerns upfront.",
      icon: <Calendar className="h-6 w-6 text-cyan-400" />,
      stat: "Streamline scheduling"
    },
    {
      title: "Service Recommendations",
      description: "Based on vehicle make/model and mileage, AI suggests appropriate maintenance services.",
      icon: <Wrench className="h-6 w-6 text-cyan-400" />,
      stat: "Upsell opportunities"
    },
    {
      title: "Price Estimates",
      description: "Provide ballpark pricing for common services so customers know what to expect.",
      icon: <CheckCircle2 className="h-6 w-6 text-cyan-400" />,
      stat: "Transparent pricing"
    },
    {
      title: "Symptom Collection",
      description: "AI gathers detailed descriptions of vehicle issues so techs are prepared when the car arrives.",
      icon: <MessageCircle className="h-6 w-6 text-cyan-400" />,
      stat: "Better preparation"
    },
    {
      title: "After-Hours Leads",
      description: "Capture inquiries when the shop is closed. Many car problems happen outside business hours.",
      icon: <Clock className="h-6 w-6 text-cyan-400" />,
      stat: "Never miss a customer"
    },
    {
      title: "Recall & Reminder Info",
      description: "Answer questions about manufacturer recalls and maintenance schedules.",
      icon: <Shield className="h-6 w-6 text-cyan-400" />,
      stat: "Build trust with expertise"
    }
  ],

  nicheStats: [
    {
      value: "25+",
      label: "Years Experience",
      description: "Since 1998"
    },
    {
      value: "10,000+",
      label: "Vehicles Serviced",
      description: "All makes & models"
    },
    {
      value: "4.9",
      label: "Google Rating",
      description: "600+ reviews"
    },
    {
      value: "2 Year",
      label: "Warranty",
      description: "On all repairs"
    }
  ],

  faqs: [
    {
      question: "Do you work on all vehicle makes and models?",
      answer: "Yes! We service all domestic and import vehicles - cars, trucks, and SUVs. We also have specialists for European luxury brands."
    },
    {
      question: "How long will my repair take?",
      answer: "Most routine services take 1-2 hours. Major repairs vary - we'll give you an accurate estimate before starting work."
    },
    {
      question: "Do you offer loaner vehicles?",
      answer: "Yes, we have complimentary loaner vehicles available for repairs that take more than 4 hours. Please reserve in advance."
    },
    {
      question: "What warranty do you provide?",
      answer: "We stand behind our work with a 2-year/24,000-mile warranty on all repairs. Parts are covered by manufacturer warranties."
    },
    {
      question: "Do you offer financing?",
      answer: "Yes! We partner with several financing options for repairs over $500. Ask about 0% APR for qualified buyers."
    }
  ],

  bookingLabel: "Schedule Service",
  ctaText: "Need Auto Service? Schedule Your Appointment Today"
};
