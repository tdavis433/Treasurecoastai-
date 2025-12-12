import { Scissors, Star, Clock, Calendar, TrendingUp, MessageCircle, User, Award } from "lucide-react";
import { DemoPageConfig } from "../DemoPageTemplate";

export const barberConfig: DemoPageConfig = {
  clientId: "demo_fade_factory",
  botId: "bot_demo_barbershop",
  
  business: {
    name: "Classic Cuts Barbershop",
    tagline: "Where Style Meets Precision",
    description: "Traditional barbershop experience with modern techniques. Our master barbers deliver precision cuts, hot towel shaves, and premium grooming services in a relaxed, welcoming atmosphere. No appointment necessary, but online booking available.",
    type: "barber",
    phone: "(772) 555-CUTS",
    email: "info@classiccuts.com",
    website: "www.classiccuts.com",
    address: "100 Main Street",
    city: "Stuart, FL 34994",
    hours: {
      "Monday": "Closed",
      "Tuesday": "9:00 AM - 7:00 PM",
      "Wednesday": "9:00 AM - 7:00 PM",
      "Thursday": "9:00 AM - 7:00 PM",
      "Friday": "9:00 AM - 8:00 PM",
      "Saturday": "8:00 AM - 5:00 PM",
      "Sunday": "10:00 AM - 3:00 PM"
    }
  },

  icon: <Scissors className="h-6 w-6" />,
  
  colors: {
    primary: "from-slate-700 to-zinc-800",
    accent: "bg-amber-500",
    gradient: "from-slate-900/90 to-zinc-900/90"
  },

  features: [
    "Master Barbers",
    "Walk-Ins Welcome",
    "Online Booking",
    "Hot Towel Shaves",
    "Premium Products",
    "Beard Grooming",
    "Kids' Cuts",
    "Senior Discounts"
  ],

  services: [
    {
      name: "Signature Haircut",
      description: "Precision cut tailored to your style, includes hot towel, shampoo, scalp massage, and styling.",
      price: "$35",
      duration: "45 minutes",
      popular: true
    },
    {
      name: "Hot Towel Straight Razor Shave",
      description: "Traditional straight razor shave with hot towels, pre-shave oil, and aftershave balm. The classic experience.",
      price: "$40",
      duration: "45 minutes"
    },
    {
      name: "Haircut & Beard Trim Combo",
      description: "Full haircut plus beard shaping and trim. The complete grooming package for the modern gentleman.",
      price: "$50",
      duration: "1 hour",
      popular: true
    },
    {
      name: "Beard Trim & Shape",
      description: "Expert beard trimming, edge-up, and shaping to keep your facial hair looking sharp.",
      price: "$20",
      duration: "20 minutes"
    },
    {
      name: "Kids' Cut (12 & Under)",
      description: "Patient, kid-friendly haircuts that make young gents look their best.",
      price: "$22",
      duration: "30 minutes"
    },
    {
      name: "Grey Blending Service",
      description: "Natural-looking color service that blends grey hair seamlessly. Subtle and masculine.",
      price: "$30",
      duration: "30 minutes"
    }
  ],

  team: [
    {
      name: "Marcus Williams",
      role: "Owner & Master Barber",
      specialty: "Classic Fades",
      bio: "20 years perfecting the craft. Trained at the finest barbering schools."
    },
    {
      name: "Danny Cruz",
      role: "Senior Barber",
      specialty: "Modern Styles",
      bio: "Instagram-famous for creative cuts and designs."
    },
    {
      name: "James Robinson",
      role: "Master Barber",
      specialty: "Straight Razor Shaves",
      bio: "The go-to for the traditional barbershop experience."
    },
    {
      name: "Tyler Bennett",
      role: "Barber",
      specialty: "Kids & Teens",
      bio: "Patient with young clients and expert at trendy youth styles."
    }
  ],

  testimonials: [
    {
      name: "David M.",
      role: "Regular Client",
      content: "Been coming to Classic Cuts for 5 years. Marcus gives the best fade in the Treasure Coast. The atmosphere is great and the hot towel finish is always on point.",
      rating: 5
    },
    {
      name: "Steve R.",
      role: "First-Time Client",
      content: "Found them through their AI booking - so easy! Danny understood exactly what I wanted and nailed the cut. Already booked my next appointment.",
      rating: 5
    },
    {
      name: "Tom H.",
      role: "Senior Discount Recipient",
      content: "Finally a barbershop that respects the traditional craft. James gives an incredible straight razor shave. It's my weekly treat to myself.",
      rating: 5
    }
  ],

  aiBenefits: [
    {
      title: "Quick Online Booking",
      description: "Clients book their preferred barber and time slot 24/7. Reduce phone calls and walk-in wait times.",
      icon: <Calendar className="h-6 w-6 text-cyan-400" />,
      stat: "30% more appointments"
    },
    {
      title: "Service Selection",
      description: "AI helps clients choose the right service - haircut, shave, combo - with accurate pricing and timing.",
      icon: <Scissors className="h-6 w-6 text-cyan-400" />,
      stat: "Clear expectations"
    },
    {
      title: "Wait Time Updates",
      description: "For walk-ins, AI can share current wait times and suggest booking for a later time if busy.",
      icon: <Clock className="h-6 w-6 text-cyan-400" />,
      stat: "Improve walk-in experience"
    },
    {
      title: "Barber Preference Matching",
      description: "New clients describe their style preferences and AI suggests the best barber for their needs.",
      icon: <User className="h-6 w-6 text-cyan-400" />,
      stat: "Better barber matching"
    },
    {
      title: "FAQ Handling",
      description: "Answer questions about services, pricing, parking, and policies without staff interruption.",
      icon: <MessageCircle className="h-6 w-6 text-cyan-400" />,
      stat: "Reduce front desk questions"
    },
    {
      title: "No-Show Reduction",
      description: "Automated reminders and easy rescheduling through chat keeps your chairs full.",
      icon: <TrendingUp className="h-6 w-6 text-cyan-400" />,
      stat: "Reduce no-shows 40%"
    }
  ],

  nicheStats: [
    {
      value: "20+",
      label: "Years Experience",
      description: "Serving the community"
    },
    {
      value: "50,000+",
      label: "Cuts Given",
      description: "And counting"
    },
    {
      value: "4.9",
      label: "Star Rating",
      description: "300+ reviews"
    },
    {
      value: "Walk-Ins",
      label: "Welcome",
      description: "No wait with booking"
    }
  ],

  faqs: [
    {
      question: "Do I need an appointment?",
      answer: "Walk-ins are always welcome! However, booking online guarantees your spot and reduces wait time. Our AI can help you book anytime."
    },
    {
      question: "How much is a haircut?",
      answer: "Our signature haircut is $35 and includes hot towel, shampoo, and styling. Kids cuts are $22. Beard trim add-on is $15."
    },
    {
      question: "Can I request a specific barber?",
      answer: "Absolutely! You can select your preferred barber when booking online. Each barber has their specialty listed."
    },
    {
      question: "Do you offer senior discounts?",
      answer: "Yes! Seniors 65+ receive 15% off all services. Just mention it when you check in."
    },
    {
      question: "What products do you use and sell?",
      answer: "We use and sell premium products including American Crew, Layrite, and Reuzel. Our barbers can recommend the best products for your hair type."
    }
  ],

  bookingLabel: "Book Appointment",
  ctaText: "Ready for a Fresh Cut? Book Your Appointment Now"
};
