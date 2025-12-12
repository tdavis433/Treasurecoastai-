import { Sparkles, Heart, Clock, Calendar, TrendingUp, MessageCircle, Shield, Star } from "lucide-react";
import { DemoPageConfig } from "../DemoPageTemplate";

export const medSpaConfig: DemoPageConfig = {
  clientId: "demo_blue_harbor_spa",
  botId: "blue_harbor_spa_demo_main",
  
  business: {
    name: "Blue Harbor Med Spa",
    tagline: "Rejuvenate Your Body and Mind",
    description: "Premier medical aesthetics center offering the latest in non-surgical cosmetic treatments. Our board-certified team specializes in facial rejuvenation, body contouring, and wellness services in a luxurious, relaxing environment.",
    type: "med_spa",
    phone: "(772) 555-GLOW",
    email: "book@blueharbormedspa.com",
    website: "www.blueharbormedspa.com",
    address: "222 Aesthetic Lane",
    city: "Vero Beach, FL 32963",
    hours: {
      "Monday": "9:00 AM - 6:00 PM",
      "Tuesday": "9:00 AM - 6:00 PM",
      "Wednesday": "9:00 AM - 7:00 PM",
      "Thursday": "9:00 AM - 7:00 PM",
      "Friday": "9:00 AM - 5:00 PM",
      "Saturday": "10:00 AM - 4:00 PM",
      "Sunday": "Closed"
    }
  },

  icon: <Sparkles className="h-6 w-6" />,
  
  colors: {
    primary: "from-pink-500 to-purple-600",
    accent: "bg-pink-500",
    gradient: "from-pink-900/90 to-purple-900/90"
  },

  features: [
    "Board Certified Staff",
    "Latest Technology",
    "Free Consultations",
    "Custom Treatment Plans",
    "Relaxing Environment",
    "Financing Available",
    "VIP Membership",
    "Natural Results"
  ],

  services: [
    {
      name: "Botox & Dysport",
      description: "Smooth fine lines and wrinkles with expert injections. Natural-looking results that refresh your appearance.",
      price: "From $12/unit",
      duration: "15-30 minutes",
      popular: true
    },
    {
      name: "Dermal Fillers",
      description: "Restore volume to lips, cheeks, and jawline. Premium fillers for plump, youthful contours.",
      price: "From $650/syringe",
      duration: "30-60 minutes"
    },
    {
      name: "Laser Skin Resurfacing",
      description: "Advanced laser treatments for sun damage, acne scars, and uneven texture. Reveal smoother, clearer skin.",
      price: "From $500",
      duration: "45-60 minutes"
    },
    {
      name: "CoolSculpting Body Contouring",
      description: "FDA-cleared fat reduction without surgery. Freeze away stubborn fat from abdomen, thighs, arms, and more.",
      price: "From $750/area",
      duration: "35-60 minutes",
      popular: true
    },
    {
      name: "Hydrafacial",
      description: "Deep cleansing, exfoliation, and hydration in one treatment. The celebrity favorite for glowing skin.",
      price: "$199",
      duration: "45 minutes"
    },
    {
      name: "IV Vitamin Therapy",
      description: "Boost energy, immunity, and hydration with customized IV infusions. The ultimate wellness pick-me-up.",
      price: "From $149",
      duration: "45-60 minutes"
    }
  ],

  team: [
    {
      name: "Dr. Victoria Lane",
      role: "Medical Director",
      specialty: "Facial Aesthetics",
      bio: "Board-certified with 15+ years in cosmetic medicine and a gentle touch."
    },
    {
      name: "Nurse Sarah Mitchell",
      role: "Nurse Injector",
      specialty: "Lip Augmentation",
      bio: "Known for natural-looking lip enhancements and facial balancing."
    },
    {
      name: "Jessica Kim",
      role: "Aesthetician",
      specialty: "Laser & Skin Care",
      bio: "Expert in laser treatments and customized skincare protocols."
    },
    {
      name: "Amanda Roberts",
      role: "Patient Coordinator",
      specialty: "Treatment Planning",
      bio: "Helps you navigate options and financing with care and discretion."
    }
  ],

  testimonials: [
    {
      name: "Jennifer L.",
      role: "Botox Client",
      content: "I was nervous about my first Botox, but Dr. Lane made me feel so comfortable. The results are subtle but I look refreshed - not frozen! I'm hooked.",
      rating: 5
    },
    {
      name: "Michelle T.",
      role: "CoolSculpting Client",
      content: "After 2 sessions, my stubborn belly pouch is finally gone! I should have done this years ago. The staff is professional and the results speak for themselves.",
      rating: 5
    },
    {
      name: "Karen M.",
      role: "VIP Member",
      content: "The VIP membership is amazing value. Monthly Hydrafacials have transformed my skin, and I get discounts on everything else. My skin has never looked better at 55!",
      rating: 5
    }
  ],

  aiBenefits: [
    {
      title: "Private Consultation Booking",
      description: "Clients can discreetly inquire about treatments and book consultations 24/7 without speaking to staff.",
      icon: <Calendar className="h-6 w-6 text-cyan-400" />,
      stat: "Private, convenient booking"
    },
    {
      title: "Treatment Education",
      description: "AI explains procedures, expected results, recovery time, and contraindications so clients arrive informed.",
      icon: <MessageCircle className="h-6 w-6 text-cyan-400" />,
      stat: "Better consultation conversion"
    },
    {
      title: "Pricing Transparency",
      description: "Answer pricing questions upfront, explain packages, and discuss financing options.",
      icon: <Star className="h-6 w-6 text-cyan-400" />,
      stat: "Build trust with transparency"
    },
    {
      title: "Pre-Consultation Questionnaire",
      description: "Gather medical history and concerns before appointments so providers can prepare personalized plans.",
      icon: <Shield className="h-6 w-6 text-cyan-400" />,
      stat: "Efficient consultations"
    },
    {
      title: "Follow-Up Scheduling",
      description: "AI reminds clients to schedule follow-up treatments and makes rebooking easy.",
      icon: <Clock className="h-6 w-6 text-cyan-400" />,
      stat: "Improve retention"
    },
    {
      title: "Lead Qualification",
      description: "Identify serious prospects vs. information-seekers so your team focuses on ready-to-treat clients.",
      icon: <TrendingUp className="h-6 w-6 text-cyan-400" />,
      stat: "Higher quality leads"
    }
  ],

  nicheStats: [
    {
      value: "5,000+",
      label: "Happy Clients",
      description: "Since 2015"
    },
    {
      value: "15+",
      label: "Treatments Offered",
      description: "Latest technology"
    },
    {
      value: "4.9",
      label: "Star Rating",
      description: "400+ reviews"
    },
    {
      value: "0%",
      label: "Financing Available",
      description: "For qualified clients"
    }
  ],

  faqs: [
    {
      question: "Is Botox safe?",
      answer: "Yes! Botox has been FDA-approved for cosmetic use for over 20 years. When performed by trained professionals like our team, it's very safe with minimal side effects."
    },
    {
      question: "How long do results last?",
      answer: "It depends on the treatment. Botox lasts 3-4 months, fillers 6-18 months, and CoolSculpting results are permanent once fat cells are eliminated."
    },
    {
      question: "Is there downtime?",
      answer: "Most treatments have minimal to no downtime. Injectables may cause slight bruising. Laser treatments may have 3-7 days of redness. We'll explain everything before treatment."
    },
    {
      question: "Do you offer financing?",
      answer: "Yes! We partner with CareCredit and Cherry for 0% financing options. We also offer VIP memberships with monthly payment options."
    },
    {
      question: "How much does Botox cost?",
      answer: "Botox is $12-14 per unit. Most clients use 20-40 units for the forehead and crow's feet area. We provide exact pricing during your free consultation."
    }
  ],

  bookingLabel: "Book Consultation",
  ctaText: "Ready to Look and Feel Your Best?"
};
