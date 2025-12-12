import { Home, Wrench, Clock, Calendar, TrendingUp, MessageCircle, Shield, CheckCircle2, Hammer } from "lucide-react";
import { DemoPageConfig } from "../DemoPageTemplate";

export const handymanConfig: DemoPageConfig = {
  clientId: "demo_tc_handyman",
  botId: "bot_demo_handyman",
  
  business: {
    name: "Handy Helpers",
    tagline: "Professional Home Solutions You Can Trust",
    description: "Your reliable neighborhood handyman service. From small repairs to home improvement projects, our licensed professionals handle it all. No job too small - we're here to keep your home in top shape.",
    type: "home_services",
    phone: "(772) 555-HELP",
    email: "service@handyhelpers.com",
    website: "www.handyhelpers.com",
    address: "150 Service Center Blvd",
    city: "Port St. Lucie, FL 34953",
    hours: {
      "Monday": "7:00 AM - 6:00 PM",
      "Tuesday": "7:00 AM - 6:00 PM",
      "Wednesday": "7:00 AM - 6:00 PM",
      "Thursday": "7:00 AM - 6:00 PM",
      "Friday": "7:00 AM - 6:00 PM",
      "Saturday": "8:00 AM - 4:00 PM",
      "Sunday": "Closed (Emergency Available)"
    }
  },

  icon: <Wrench className="h-6 w-6" />,
  
  colors: {
    primary: "from-blue-600 to-indigo-600",
    accent: "bg-blue-500",
    gradient: "from-blue-900/90 to-indigo-900/90"
  },

  features: [
    "Licensed & Insured",
    "Free Estimates",
    "No Job Too Small",
    "Same-Day Service",
    "Flat Rate Pricing",
    "Senior Discounts",
    "Quality Guaranteed",
    "Clean Work Areas"
  ],

  services: [
    {
      name: "General Repairs",
      description: "Drywall patching, door fixes, cabinet adjustments, squeaky floors, and all those little things on your to-do list.",
      price: "$85/hour",
      duration: "1-2 hours typical",
      popular: true
    },
    {
      name: "Furniture Assembly",
      description: "IKEA, Wayfair, Amazon - we assemble it all quickly and correctly. No frustrating instructions for you!",
      price: "From $50",
      duration: "1-3 hours"
    },
    {
      name: "TV & Smart Home Installation",
      description: "Mount TVs, install smart thermostats, doorbells, and home automation devices professionally.",
      price: "From $75",
      duration: "1-2 hours",
      popular: true
    },
    {
      name: "Plumbing & Electrical",
      description: "Minor plumbing (faucets, toilets) and electrical (outlets, fixtures, fans). Licensed for your safety.",
      price: "$95/hour",
      duration: "Varies"
    },
    {
      name: "Painting & Drywall",
      description: "Interior painting, drywall repair, texture matching, and trim work. Transform any room.",
      price: "From $150/room",
      duration: "1-3 days"
    },
    {
      name: "Home Maintenance Package",
      description: "Quarterly visits to handle your to-do list. Discounted rates for ongoing members.",
      price: "$199/quarter",
      duration: "3-4 hours per visit"
    }
  ],

  team: [
    {
      name: "Tom Rodriguez",
      role: "Owner & Master Handyman",
      specialty: "General Repairs",
      bio: "30 years fixing homes. There's no problem Tom hasn't solved."
    },
    {
      name: "Mike Johnson",
      role: "Senior Technician",
      specialty: "Electrical & Plumbing",
      bio: "Licensed electrician and plumber for larger projects."
    },
    {
      name: "Chris Williams",
      role: "Technician",
      specialty: "Painting & Drywall",
      bio: "The artist of our team - makes walls look brand new."
    },
    {
      name: "Amy Chen",
      role: "Office Manager",
      specialty: "Scheduling",
      bio: "Keeps the team organized and customers happy."
    }
  ],

  testimonials: [
    {
      name: "Karen T.",
      role: "Homeowner",
      content: "Finally found a handyman I can trust! Tom's team has handled everything from mounting my TV to fixing plumbing. Always on time, fair pricing, and quality work.",
      rating: 5
    },
    {
      name: "David M.",
      role: "Property Manager",
      content: "I manage 15 rental properties and Handy Helpers is my go-to for everything. Fast response, reasonable rates, and they make my tenants happy.",
      rating: 5
    },
    {
      name: "Linda S.",
      role: "Senior Homeowner",
      content: "As a widow, I was nervous about finding reliable help. These guys are honest, respectful, and the senior discount helps a lot. Highly recommend!",
      rating: 5
    }
  ],

  aiBenefits: [
    {
      title: "Easy Service Booking",
      description: "Homeowners describe their needs and book appointments 24/7. AI captures project details for accurate quotes.",
      icon: <Calendar className="h-6 w-6 text-cyan-400" />,
      stat: "Book anytime"
    },
    {
      title: "Instant Price Estimates",
      description: "AI provides ballpark pricing for common services so customers know what to expect.",
      icon: <CheckCircle2 className="h-6 w-6 text-cyan-400" />,
      stat: "Transparent pricing"
    },
    {
      title: "Service Categorization",
      description: "Automatically route inquiries to the right technician based on service type needed.",
      icon: <Wrench className="h-6 w-6 text-cyan-400" />,
      stat: "Efficient dispatching"
    },
    {
      title: "Collect Job Details",
      description: "Gather photos, measurements, and specific requirements before the visit for better preparation.",
      icon: <MessageCircle className="h-6 w-6 text-cyan-400" />,
      stat: "First visit accuracy"
    },
    {
      title: "Emergency Requests",
      description: "AI identifies urgent issues and fast-tracks emergency service requests to on-call staff.",
      icon: <Shield className="h-6 w-6 text-cyan-400" />,
      stat: "Quick emergency response"
    },
    {
      title: "Follow-Up & Rebooking",
      description: "Remind customers about maintenance schedules and make rebooking easy through chat.",
      icon: <TrendingUp className="h-6 w-6 text-cyan-400" />,
      stat: "Increase repeat business"
    }
  ],

  nicheStats: [
    {
      value: "10,000+",
      label: "Jobs Completed",
      description: "Since 2010"
    },
    {
      value: "4.9",
      label: "Star Rating",
      description: "500+ reviews"
    },
    {
      value: "Same Day",
      label: "Service Available",
      description: "When you need it"
    },
    {
      value: "100%",
      label: "Satisfaction",
      description: "Guaranteed"
    }
  ],

  faqs: [
    {
      question: "Do you offer free estimates?",
      answer: "Yes! For most jobs, we provide free estimates. For complex projects, we charge a $49 service call that's credited toward the work if you proceed."
    },
    {
      question: "What's your hourly rate?",
      answer: "General handyman work is $85/hour. Licensed plumbing and electrical work is $95/hour. Many jobs have flat-rate pricing - just ask!"
    },
    {
      question: "Are you licensed and insured?",
      answer: "Absolutely! We're fully licensed and carry $1M in liability insurance. Your home and our work are protected."
    },
    {
      question: "Do you offer senior discounts?",
      answer: "Yes! Seniors 65+ receive 10% off all services. Thank you for letting us help you maintain your home."
    },
    {
      question: "What if I'm not satisfied with the work?",
      answer: "We stand behind our work 100%. If you're not happy, we'll come back and make it right at no extra charge."
    }
  ],

  bookingLabel: "Book Service",
  ctaText: "Need Help Around the House? Schedule Your Service Today"
};
