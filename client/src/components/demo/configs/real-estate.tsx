import { Building2, Home, Clock, Calendar, TrendingUp, MessageCircle, MapPin, Key, Search } from "lucide-react";
import { DemoPageConfig } from "../DemoPageTemplate";

export const realEstateConfig: DemoPageConfig = {
  clientId: "demo_coastal_realty",
  botId: "coastal_realty_demo_main",
  
  business: {
    name: "Coastal Realty Group",
    tagline: "Find Your Dream Home on the Treasure Coast",
    description: "Premier real estate agency specializing in Treasure Coast properties. From beachfront condos to luxury estates, our experienced agents guide you through every step of buying or selling your home. Local expertise, exceptional service.",
    type: "real_estate",
    phone: "(772) 555-HOME",
    email: "info@coastalrealtygroup.com",
    website: "www.coastalrealtygroup.com",
    address: "1500 Ocean Drive, Suite 100",
    city: "Stuart, FL 34996",
    hours: {
      "Monday": "9:00 AM - 6:00 PM",
      "Tuesday": "9:00 AM - 6:00 PM",
      "Wednesday": "9:00 AM - 6:00 PM",
      "Thursday": "9:00 AM - 6:00 PM",
      "Friday": "9:00 AM - 5:00 PM",
      "Saturday": "10:00 AM - 4:00 PM",
      "Sunday": "By Appointment"
    }
  },

  icon: <Building2 className="h-6 w-6" />,
  
  colors: {
    primary: "from-sky-600 to-blue-700",
    accent: "bg-sky-500",
    gradient: "from-sky-900/90 to-blue-900/90"
  },

  features: [
    "Local Market Experts",
    "Free Home Valuations",
    "Virtual Tours",
    "Negotiation Experts",
    "First-Time Buyer Programs",
    "Luxury Specialists",
    "Investment Properties",
    "Relocation Services"
  ],

  services: [
    {
      name: "Home Buying Services",
      description: "Full-service buyer representation from property search to closing. We guide first-timers and seasoned investors alike.",
      price: "Commission-based",
      duration: "30-90 days typical",
      popular: true
    },
    {
      name: "Home Selling Services",
      description: "Strategic marketing, professional photography, open houses, and expert negotiation to maximize your sale price.",
      price: "Commission-based",
      duration: "30-60 days average",
      popular: true
    },
    {
      name: "Free Home Valuation",
      description: "Comprehensive market analysis to determine your home's current value. No obligation, no cost.",
      price: "Free",
      duration: "24-48 hours"
    },
    {
      name: "Investment Property Analysis",
      description: "ROI analysis, rental market data, and property management referrals for real estate investors.",
      price: "Consultation-based",
      duration: "Varies"
    },
    {
      name: "Luxury Home Division",
      description: "Specialized marketing and discretion for high-end properties. White-glove service for discerning clients.",
      price: "Commission-based",
      duration: "Custom timeline"
    },
    {
      name: "Relocation Assistance",
      description: "Moving to the Treasure Coast? We help you find the perfect neighborhood and navigate the local market.",
      price: "Free consultation",
      duration: "Ongoing support"
    }
  ],

  team: [
    {
      name: "Christine Adams",
      role: "Broker/Owner",
      specialty: "Luxury Waterfront",
      bio: "Top 1% producer with $200M+ in career sales. 20 years local expertise."
    },
    {
      name: "Michael Chen",
      role: "Buyer Specialist",
      specialty: "First-Time Buyers",
      bio: "Patient guide who makes the process stress-free for new homebuyers."
    },
    {
      name: "Sarah Rodriguez",
      role: "Listing Agent",
      specialty: "Marketing Expert",
      bio: "Known for stunning property presentations that sell homes fast."
    },
    {
      name: "James Thompson",
      role: "Investment Specialist",
      specialty: "Rental Properties",
      bio: "Investor himself with deep knowledge of ROI and property management."
    }
  ],

  testimonials: [
    {
      name: "Mark & Linda S.",
      role: "Home Buyers",
      content: "Moving from New York, we were nervous about buying remotely. Christine made it seamless with virtual tours and constant communication. We found our dream waterfront home!",
      rating: 5
    },
    {
      name: "David K.",
      role: "Home Seller",
      content: "Sarah sold our home in 10 days for $40K over asking. Her marketing was incredible - professional photos, drone video, and social media exposure. Exceeded all expectations.",
      rating: 5
    },
    {
      name: "Jennifer & Tom R.",
      role: "First-Time Buyers",
      content: "Michael was so patient with all our questions. As first-time buyers, we had no idea what to expect. He walked us through everything and found us a home we love.",
      rating: 5
    }
  ],

  aiBenefits: [
    {
      title: "24/7 Property Inquiries",
      description: "Buyers browsing listings at night can get instant information and schedule viewings before competing buyers.",
      icon: <Search className="h-6 w-6 text-cyan-400" />,
      stat: "Faster lead response"
    },
    {
      title: "Showing Scheduler",
      description: "Potential buyers can book property tours directly through chat, synced with agent availability.",
      icon: <Calendar className="h-6 w-6 text-cyan-400" />,
      stat: "More showings booked"
    },
    {
      title: "Home Valuation Requests",
      description: "Sellers can request free CMAs by sharing property details through AI chat.",
      icon: <Home className="h-6 w-6 text-cyan-400" />,
      stat: "Capture seller leads"
    },
    {
      title: "Buyer Qualification",
      description: "AI gathers buyer timeline, budget, must-haves, and pre-approval status to qualify leads.",
      icon: <Key className="h-6 w-6 text-cyan-400" />,
      stat: "Qualified lead handoff"
    },
    {
      title: "Neighborhood Information",
      description: "Answer questions about schools, amenities, HOAs, and neighborhoods while agents focus on showings.",
      icon: <MapPin className="h-6 w-6 text-cyan-400" />,
      stat: "Informed buyers"
    },
    {
      title: "Follow-Up Automation",
      description: "Nurture leads who aren't ready to buy yet with ongoing engagement through chat.",
      icon: <TrendingUp className="h-6 w-6 text-cyan-400" />,
      stat: "Convert long-term leads"
    }
  ],

  nicheStats: [
    {
      value: "$500M+",
      label: "In Sales",
      description: "Last 5 years"
    },
    {
      value: "1,200+",
      label: "Homes Sold",
      description: "Since 2008"
    },
    {
      value: "15",
      label: "Days Average",
      description: "Days on market"
    },
    {
      value: "98%",
      label: "List to Sale",
      description: "Price ratio"
    }
  ],

  faqs: [
    {
      question: "How much is my home worth?",
      answer: "We offer free, no-obligation home valuations! Share your address and we'll provide a comprehensive market analysis within 24-48 hours."
    },
    {
      question: "Do I need to be pre-approved to view homes?",
      answer: "Not for casual viewings, but we highly recommend getting pre-approved before seriously shopping. It strengthens your offer when you find the right home."
    },
    {
      question: "What areas do you cover?",
      answer: "We specialize in the Treasure Coast: Martin County, St. Lucie County, and Indian River County. Stuart, Port St. Lucie, Vero Beach, and surrounding areas."
    },
    {
      question: "How much are your fees?",
      answer: "For buyers, our services are typically free - sellers pay the commission. For sellers, we discuss our competitive rates during listing consultations."
    },
    {
      question: "How long does it take to buy a home?",
      answer: "From accepted offer to closing is typically 30-45 days. The search process varies - some buyers find their home in a day, others take months. We work at your pace!"
    }
  ],

  bookingLabel: "Schedule Consultation",
  ctaText: "Ready to Find Your Dream Home?"
};
