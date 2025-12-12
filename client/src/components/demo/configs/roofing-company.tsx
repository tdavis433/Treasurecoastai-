import { Home, Shield, Clock, Calendar, TrendingUp, MessageCircle, AlertTriangle, Phone, CheckCircle2, Hammer } from "lucide-react";
import { DemoPageConfig } from "../DemoPageTemplate";

const RoofIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 2.84L19.5 12h-1.5v7H6v-7H4.5L12 5.84z"/>
  </svg>
);

export const roofingCompanyConfig: DemoPageConfig = {
  clientId: "demo_tc_roofing",
  botId: "bot_demo_roofing",
  
  business: {
    name: "Treasure Coast Roofing",
    tagline: "Protecting Your Home from the Top Down",
    description: "Family-owned roofing company serving the Treasure Coast for over 30 years. We specialize in storm damage repair, new roof installation, and commercial roofing. Licensed, insured, and committed to quality craftsmanship that stands up to Florida weather.",
    type: "roofing",
    phone: "(772) 555-ROOF",
    email: "estimates@tcroofing.com",
    website: "www.tcroofing.com",
    address: "456 Contractor Way",
    city: "Fort Pierce, FL 34950",
    hours: {
      "Monday": "7:00 AM - 5:00 PM",
      "Tuesday": "7:00 AM - 5:00 PM",
      "Wednesday": "7:00 AM - 5:00 PM",
      "Thursday": "7:00 AM - 5:00 PM",
      "Friday": "7:00 AM - 5:00 PM",
      "Saturday": "8:00 AM - 12:00 PM",
      "Sunday": "Emergency Only"
    }
  },

  icon: <Home className="h-6 w-6" />,
  
  colors: {
    primary: "from-red-600 to-orange-600",
    accent: "bg-red-500",
    gradient: "from-red-900/90 to-orange-900/90"
  },

  features: [
    "Licensed & Insured",
    "30+ Years Experience",
    "Free Estimates",
    "Insurance Claims Help",
    "Storm Damage Experts",
    "Financing Available",
    "Manufacturer Warranties",
    "24/7 Emergency Service"
  ],

  services: [
    {
      name: "Storm Damage Repair",
      description: "Hurricane and storm damage assessment, emergency tarping, and complete roof restoration. We work directly with your insurance company.",
      price: "Free Inspection",
      duration: "1-5 days",
      popular: true
    },
    {
      name: "Complete Roof Replacement",
      description: "Full tear-off and replacement with premium materials. Shingle, tile, or metal options with manufacturer warranties.",
      price: "From $8,500",
      duration: "2-5 days"
    },
    {
      name: "Metal Roof Installation",
      description: "Durable, energy-efficient metal roofing that can last 50+ years. Perfect for Florida's harsh weather conditions.",
      price: "From $12,000",
      duration: "3-7 days"
    },
    {
      name: "Roof Leak Repair",
      description: "Expert leak detection and repair. We find the source and fix it right the first time with a workmanship guarantee.",
      price: "From $250",
      duration: "Same day - 2 days"
    },
    {
      name: "Commercial Roofing",
      description: "Flat roofs, TPO, modified bitumen, and commercial repairs. Minimize business disruption with efficient project management.",
      price: "Custom Quote",
      duration: "Varies"
    },
    {
      name: "Preventive Maintenance",
      description: "Annual inspections and maintenance to extend roof life and catch problems before they become expensive repairs.",
      price: "$150/year",
      duration: "Annual"
    }
  ],

  team: [
    {
      name: "Tom Richardson",
      role: "Owner & Lead Estimator",
      specialty: "Insurance Claims",
      bio: "30 years roofing experience, expert in navigating insurance claims."
    },
    {
      name: "Carlos Gutierrez",
      role: "Operations Manager",
      specialty: "Project Coordination",
      bio: "Ensures every job runs smoothly and on schedule."
    },
    {
      name: "Mike Wilson",
      role: "Lead Installer",
      specialty: "Metal & Tile Roofing",
      bio: "Master craftsman with 25 years of installation expertise."
    },
    {
      name: "Amy Richardson",
      role: "Office Manager",
      specialty: "Customer Care",
      bio: "Your first point of contact for all scheduling and questions."
    }
  ],

  testimonials: [
    {
      name: "John S.",
      role: "Homeowner",
      content: "After Hurricane Ian, we were devastated. TC Roofing had us tarped within hours and worked with our insurance to get a complete new roof. Professional, honest, and fair pricing.",
      rating: 5
    },
    {
      name: "Patricia L.",
      role: "Homeowner",
      content: "Got 5 estimates for our roof replacement - TC Roofing was the most thorough and professional. The crew was respectful, cleaned up perfectly, and the new roof looks amazing.",
      rating: 5
    },
    {
      name: "Harbor Point HOA",
      role: "Commercial Client",
      content: "They've maintained our clubhouse and community buildings for 10 years. Always responsive, fair pricing, and quality work. We won't use anyone else.",
      rating: 5
    }
  ],

  aiBenefits: [
    {
      title: "Emergency Triage",
      description: "When homeowners report storm damage or leaks, AI assesses urgency and prioritizes emergency dispatch for critical situations.",
      icon: <AlertTriangle className="h-6 w-6 text-cyan-400" />,
      stat: "Faster emergency response"
    },
    {
      title: "Instant Estimate Scheduling",
      description: "Homeowners can schedule free roof inspections and estimates 24/7, even when your office is closed.",
      icon: <Calendar className="h-6 w-6 text-cyan-400" />,
      stat: "Never miss a lead"
    },
    {
      title: "Service Type Routing",
      description: "AI categorizes inquiries - emergency repair vs. new roof vs. maintenance - and routes appropriately.",
      icon: <CheckCircle2 className="h-6 w-6 text-cyan-400" />,
      stat: "Smart lead qualification"
    },
    {
      title: "Insurance Guidance",
      description: "Answer common questions about filing claims, what's covered, and how you work with insurance companies.",
      icon: <Shield className="h-6 w-6 text-cyan-400" />,
      stat: "Educate homeowners"
    },
    {
      title: "Lead Capture After Hours",
      description: "Storm damage doesn't wait for business hours. Capture leads and contact info from anxious homeowners any time.",
      icon: <Phone className="h-6 w-6 text-cyan-400" />,
      stat: "24/7 lead capture"
    },
    {
      title: "Follow-Up Automation",
      description: "After estimates, AI can follow up on pending quotes and answer questions to help close more jobs.",
      icon: <TrendingUp className="h-6 w-6 text-cyan-400" />,
      stat: "Improve close rates"
    }
  ],

  nicheStats: [
    {
      value: "30+",
      label: "Years in Business",
      description: "Family-owned since 1993"
    },
    {
      value: "5,000+",
      label: "Roofs Completed",
      description: "Residential & commercial"
    },
    {
      value: "A+",
      label: "BBB Rating",
      description: "Accredited business"
    },
    {
      value: "24/7",
      label: "Emergency Service",
      description: "Storm response available"
    }
  ],

  faqs: [
    {
      question: "Do you offer free estimates?",
      answer: "Yes! We provide free, no-obligation roof inspections and written estimates. We'll assess your roof's condition and explain all options."
    },
    {
      question: "Will you work with my insurance company?",
      answer: "Absolutely. We have 30 years of experience working with insurance adjusters. We document damage thoroughly and advocate for fair claims on your behalf."
    },
    {
      question: "How long does a roof replacement take?",
      answer: "Most residential roofs are completed in 2-5 days, depending on size and complexity. We work efficiently while maintaining quality and cleanliness."
    },
    {
      question: "What type of roofing is best for Florida?",
      answer: "Tile and metal roofs offer the best hurricane resistance and longevity. High-quality architectural shingles are also a cost-effective option. We'll recommend the best choice for your home and budget."
    },
    {
      question: "Do you have emergency services?",
      answer: "Yes! We offer 24/7 emergency response for storm damage, including emergency tarping to prevent further damage while you wait for permanent repairs."
    }
  ],

  bookingLabel: "Get Free Estimate",
  ctaText: "Need a Roof Inspection? Get Your Free Estimate Today"
};
