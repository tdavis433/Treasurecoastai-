import { Heart, Star, Clock, Calendar, TrendingUp, MessageCircle, Palette, Shield, Sparkles } from "lucide-react";
import { DemoPageConfig } from "../DemoPageTemplate";

const TattooIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

export const tattooConfig: DemoPageConfig = {
  clientId: "demo_inkwell_tattoo",
  botId: "inkwell_tattoo_demo_main",
  
  business: {
    name: "Inkwell Tattoo Studio",
    tagline: "Your Vision, Our Artistry",
    description: "Premier tattoo studio featuring award-winning artists specializing in custom designs, cover-ups, and fine line work. Clean, professional environment with a welcoming atmosphere. Let us help you wear your story.",
    type: "tattoo",
    phone: "(772) 555-TATT",
    email: "book@inkwellstudio.com",
    website: "www.inkwellstudio.com",
    address: "420 Art District Lane",
    city: "Fort Pierce, FL 34950",
    hours: {
      "Monday": "Closed",
      "Tuesday": "12:00 PM - 9:00 PM",
      "Wednesday": "12:00 PM - 9:00 PM",
      "Thursday": "12:00 PM - 9:00 PM",
      "Friday": "12:00 PM - 10:00 PM",
      "Saturday": "11:00 AM - 10:00 PM",
      "Sunday": "12:00 PM - 6:00 PM"
    }
  },

  icon: <Heart className="h-6 w-6" />,
  
  colors: {
    primary: "from-purple-700 to-pink-700",
    accent: "bg-purple-500",
    gradient: "from-purple-900/90 to-pink-900/90"
  },

  features: [
    "Custom Designs",
    "Award-Winning Artists",
    "Sterile Environment",
    "Cover-Up Specialists",
    "Fine Line & Micro",
    "Color Realism",
    "Walk-Ins Welcome",
    "Aftercare Included"
  ],

  services: [
    {
      name: "Custom Tattoo Design",
      description: "Work one-on-one with our artists to create your unique piece. Consultation, design, and revisions included.",
      price: "From $150/hour",
      duration: "Varies",
      popular: true
    },
    {
      name: "Fine Line & Micro Tattoos",
      description: "Delicate, detailed work perfect for minimalist designs, script, and small pieces.",
      price: "From $100",
      duration: "30 min - 2 hours"
    },
    {
      name: "Color Realism",
      description: "Photo-realistic portraits and nature scenes in vibrant, lasting color.",
      price: "From $200/hour",
      duration: "Multiple sessions",
      popular: true
    },
    {
      name: "Cover-Up & Rework",
      description: "Transform old or unwanted tattoos into beautiful new art. Free consultation to discuss options.",
      price: "From $175/hour",
      duration: "Varies"
    },
    {
      name: "Flash Friday",
      description: "Pre-designed pieces at discounted rates. Great for walk-ins and first-timers.",
      price: "$80-150",
      duration: "1-2 hours"
    },
    {
      name: "Piercing Services",
      description: "Professional body piercings using high-quality jewelry. Aftercare guidance included.",
      price: "From $40",
      duration: "15-30 minutes"
    }
  ],

  team: [
    {
      name: "Jake Rivera",
      role: "Owner & Artist",
      specialty: "Black & Grey Realism",
      bio: "20 years experience, featured in Inked Magazine. Master of photorealistic portraits."
    },
    {
      name: "Luna Chen",
      role: "Senior Artist",
      specialty: "Fine Line & Botanical",
      bio: "Delicate, detailed work with an artistic eye. Known for feminine and nature-inspired pieces."
    },
    {
      name: "Marcus Thompson",
      role: "Artist",
      specialty: "Traditional & Neo-Trad",
      bio: "Bold lines, bright colors, and timeless American traditional style."
    },
    {
      name: "Alex Kim",
      role: "Apprentice & Piercer",
      specialty: "Piercings & Flash",
      bio: "Rising talent handling piercings and developing their tattoo craft."
    }
  ],

  testimonials: [
    {
      name: "Sarah M.",
      role: "First Tattoo",
      content: "Luna made my first tattoo experience amazing! She listened to my ideas and created something even more beautiful than I imagined. The studio is clean and welcoming.",
      rating: 5
    },
    {
      name: "Mike D.",
      role: "Full Sleeve",
      content: "Jake did my entire sleeve over 6 sessions. His black and grey work is unreal - everyone asks if it's real or fake. Worth every penny and hour in the chair.",
      rating: 5
    },
    {
      name: "Jennifer L.",
      role: "Cover-Up",
      content: "Had a terrible tattoo from my 20s that I hated for years. Marcus transformed it into something I'm actually proud to show off. True artist!",
      rating: 5
    }
  ],

  aiBenefits: [
    {
      title: "Consultation Booking",
      description: "Potential clients can book free consultations 24/7 to discuss their ideas and get quotes.",
      icon: <Calendar className="h-6 w-6 text-cyan-400" />,
      stat: "More consultations booked"
    },
    {
      title: "Artist Matching",
      description: "AI learns about the client's style preference and recommends the best artist for their vision.",
      icon: <Palette className="h-6 w-6 text-cyan-400" />,
      stat: "Better artist-client fit"
    },
    {
      title: "Price Estimates",
      description: "Provide ballpark pricing based on size, complexity, and placement to set expectations.",
      icon: <Star className="h-6 w-6 text-cyan-400" />,
      stat: "Transparent pricing"
    },
    {
      title: "Aftercare Information",
      description: "AI provides detailed aftercare instructions so clients know how to care for their new tattoo.",
      icon: <Shield className="h-6 w-6 text-cyan-400" />,
      stat: "Better healing outcomes"
    },
    {
      title: "FAQ Handling",
      description: "Answer common questions about pain, placement, healing time, and what to expect.",
      icon: <MessageCircle className="h-6 w-6 text-cyan-400" />,
      stat: "Educated clients"
    },
    {
      title: "Deposit & Booking",
      description: "Explain deposit policies and booking procedures so clients come prepared.",
      icon: <TrendingUp className="h-6 w-6 text-cyan-400" />,
      stat: "Reduce no-shows"
    }
  ],

  nicheStats: [
    {
      value: "15+",
      label: "Years Experience",
      description: "Combined team experience"
    },
    {
      value: "10,000+",
      label: "Tattoos Done",
      description: "And counting"
    },
    {
      value: "4.9",
      label: "Star Rating",
      description: "200+ reviews"
    },
    {
      value: "Award",
      label: "Winning Artists",
      description: "Multiple convention wins"
    }
  ],

  faqs: [
    {
      question: "How much will my tattoo cost?",
      answer: "Pricing depends on size, detail, and placement. Small pieces start around $100. Our shop minimum is $80. Book a free consultation for an accurate quote!"
    },
    {
      question: "Does it hurt?",
      answer: "Pain varies by placement and person. Most describe it as uncomfortable but manageable. We create a relaxed environment and can take breaks as needed."
    },
    {
      question: "Do you do walk-ins?",
      answer: "Yes! We accept walk-ins when artists are available. Flash Fridays are great for spontaneous pieces. For custom work, we recommend booking a consultation."
    },
    {
      question: "How do I prepare for my appointment?",
      answer: "Eat a good meal, stay hydrated, get rest the night before, and avoid alcohol. Wear comfortable clothing that allows access to the tattoo area."
    },
    {
      question: "What's your deposit and cancellation policy?",
      answer: "We require a $50-100 deposit (applied to your tattoo) to book. Cancellations need 48 hours notice or the deposit is forfeited."
    }
  ],

  bookingLabel: "Book Consultation",
  ctaText: "Ready to Get Inked? Book Your Free Consultation"
};
