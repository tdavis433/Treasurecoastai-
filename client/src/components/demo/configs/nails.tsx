import { Sparkles, Star, Clock, Calendar, TrendingUp, MessageCircle, Heart, Palette } from "lucide-react";
import { DemoPageConfig } from "../DemoPageTemplate";

export const nailsConfig: DemoPageConfig = {
  clientId: "demo_polished_nails",
  botId: "bot_demo_polished_nails",
  
  business: {
    name: "Polished Nail Studio",
    tagline: "Nails That Speak Style",
    description: "Premium nail salon offering manicures, pedicures, gel nails, acrylics, and stunning nail art. We use only the highest quality products in a clean, relaxing environment. Walk-ins welcome!",
    type: "nails",
    phone: "(772) 555-NAIL",
    email: "hello@polishednails.com",
    website: "www.polishednails.com",
    address: "500 Palm Beach Road",
    city: "Stuart, FL 34994",
    hours: {
      "Monday": "10:00 AM - 7:00 PM",
      "Tuesday": "10:00 AM - 7:00 PM",
      "Wednesday": "10:00 AM - 7:00 PM",
      "Thursday": "10:00 AM - 8:00 PM",
      "Friday": "10:00 AM - 8:00 PM",
      "Saturday": "9:00 AM - 6:00 PM",
      "Sunday": "11:00 AM - 5:00 PM"
    }
  },

  icon: <Sparkles className="h-6 w-6" />,
  
  colors: {
    primary: "from-pink-400 to-fuchsia-500",
    accent: "bg-fuchsia-500",
    gradient: "from-fuchsia-900/90 to-pink-900/90"
  },

  features: [
    "Gel Specialists",
    "Acrylic Experts",
    "Custom Nail Art",
    "Dip Powder",
    "Spa Pedicures",
    "Walk-Ins Welcome",
    "Strict Sanitation",
    "Online Booking"
  ],

  services: [
    {
      name: "Classic Manicure",
      description: "Nail shaping, cuticle care, hand massage, and polish of your choice.",
      price: "$25",
      duration: "30 minutes"
    },
    {
      name: "Gel Manicure",
      description: "Long-lasting gel polish that stays chip-free for 2-3 weeks.",
      price: "$45",
      duration: "45 minutes",
      popular: true
    },
    {
      name: "Classic Pedicure",
      description: "Relaxing foot soak, exfoliation, nail care, and polish.",
      price: "$40",
      duration: "45 minutes",
      popular: true
    },
    {
      name: "Gel Pedicure",
      description: "Full spa pedicure with long-lasting gel polish finish.",
      price: "$60",
      duration: "60 minutes"
    },
    {
      name: "Acrylic Full Set",
      description: "Full acrylic nail extensions with your choice of shape and length.",
      price: "From $70",
      duration: "90 minutes",
      popular: true
    },
    {
      name: "Nail Art Add-On",
      description: "Custom designs, gems, French tips, or ombre effects.",
      price: "From $10",
      duration: "15+ minutes"
    }
  ],

  team: [
    {
      name: "Lisa Nguyen",
      role: "Owner & Lead Nail Artist",
      specialty: "Custom Nail Art",
      bio: "12 years creating wearable nail art. Known for intricate designs."
    },
    {
      name: "Kim Tran",
      role: "Senior Nail Tech",
      specialty: "Acrylics & Extensions",
      bio: "The acrylic queen - perfect shape and strength every time."
    },
    {
      name: "Jenny Park",
      role: "Nail Technician",
      specialty: "Gel & Dip Powder",
      bio: "Specializes in long-lasting, natural-looking nails."
    },
    {
      name: "Amy Chen",
      role: "Nail Technician",
      specialty: "Spa Pedicures",
      bio: "Creates the most relaxing pedicure experience."
    }
  ],

  testimonials: [
    {
      name: "Brittany M.",
      role: "Regular Client",
      content: "Lisa does the most amazing nail art! I always get compliments. The salon is spotless and everyone is so friendly. My go-to for over 3 years!",
      rating: 5
    },
    {
      name: "Stephanie R.",
      role: "New Client",
      content: "Booked online after seeing their work on Instagram. Kim did my acrylics and they're perfect - strong and the shape is exactly what I wanted!",
      rating: 5
    },
    {
      name: "Maria G.",
      role: "Spa Day Client",
      content: "The gel pedicure with Amy was so relaxing. The massage chairs are amazing and my feet look beautiful. Already booked my next visit!",
      rating: 5
    }
  ],

  aiBenefits: [
    {
      title: "Easy Online Booking",
      description: "Clients book their preferred service and nail tech 24/7. Reduce phone interruptions.",
      icon: <Calendar className="h-6 w-6 text-cyan-400" />,
      stat: "35% more bookings"
    },
    {
      title: "Service Selection",
      description: "AI explains the difference between gel, dip, and acrylic so clients choose the right option.",
      icon: <Palette className="h-6 w-6 text-cyan-400" />,
      stat: "Better expectations"
    },
    {
      title: "Nail Art Inquiries",
      description: "Answer questions about custom designs, pricing, and availability instantly.",
      icon: <Sparkles className="h-6 w-6 text-cyan-400" />,
      stat: "Upsell nail art"
    },
    {
      title: "Wait Time Updates",
      description: "For walk-ins, share current wait times and suggest booking for faster service.",
      icon: <Clock className="h-6 w-6 text-cyan-400" />,
      stat: "Manage walk-ins"
    },
    {
      title: "FAQ Handling",
      description: "Answer questions about sanitation, products, and policies without staff interruption.",
      icon: <MessageCircle className="h-6 w-6 text-cyan-400" />,
      stat: "Build trust"
    },
    {
      title: "Fill Reminders",
      description: "Automated reminders prompt clients to book their fill appointment on time.",
      icon: <TrendingUp className="h-6 w-6 text-cyan-400" />,
      stat: "Increase retention"
    }
  ],

  nicheStats: [
    {
      value: "12+",
      label: "Years Experience",
      description: "Serving Stuart & beyond"
    },
    {
      value: "15,000+",
      label: "Happy Clients",
      description: "Beautiful nails"
    },
    {
      value: "4.8",
      label: "Star Rating",
      description: "400+ reviews"
    },
    {
      value: "Walk-Ins",
      label: "Welcome",
      description: "Book for no wait"
    }
  ],

  faqs: [
    {
      question: "Do you accept walk-ins?",
      answer: "Yes! Walk-ins are welcome based on availability. For guaranteed service, we recommend booking online - you can even book same-day!"
    },
    {
      question: "What's the difference between gel and acrylic?",
      answer: "Gel nails are cured under UV light and give a natural, glossy look. Acrylics are sculpted extensions that are stronger and better for length. Both last 2-3 weeks."
    },
    {
      question: "How long do gel nails last?",
      answer: "Gel manicures typically last 2-3 weeks without chipping. We recommend getting fills every 2-3 weeks to maintain nail health."
    },
    {
      question: "How do you sanitize your tools?",
      answer: "We follow strict sanitation protocols. All metal tools are sterilized in an autoclave between clients, and we use disposable files and buffers."
    },
    {
      question: "Do you do custom nail art?",
      answer: "Absolutely! Lisa specializes in custom designs. Pricing starts at $10 and varies based on complexity. Show us a photo and we'll quote you!"
    }
  ],

  bookingLabel: "Book Appointment",
  ctaText: "Ready for Beautiful Nails? Book Your Appointment Now"
};
