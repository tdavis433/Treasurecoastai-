import { Building2, Star, Clock, Calendar, TrendingUp, MessageCircle, Sparkles, Utensils, Waves, Sun } from "lucide-react";
import { DemoPageConfig } from "../DemoPageTemplate";

export const boutiqueHotelConfig: DemoPageConfig = {
  clientId: "demo_palm_resort",
  botId: "palm_resort_demo_main",
  
  business: {
    name: "The Palm Resort & Spa",
    tagline: "Luxury Oceanfront Escape on the Treasure Coast",
    description: "Experience coastal elegance at Florida's premier boutique resort. Nestled on pristine beaches, The Palm offers world-class amenities, gourmet dining, a full-service spa, and personalized concierge service for the discerning traveler.",
    type: "boutique_hotel",
    phone: "(772) 555-PALM",
    email: "reservations@thepalmresort.com",
    website: "www.thepalmresort.com",
    address: "1 Ocean View Drive",
    city: "Hutchinson Island, FL 34949",
    hours: {
      "Front Desk": "24/7",
      "Restaurant": "7AM - 10PM",
      "Spa": "9AM - 7PM",
      "Pool & Beach": "6AM - 10PM",
      "Concierge": "24/7",
      "Room Service": "6AM - 11PM",
      "Fitness Center": "24/7"
    }
  },

  icon: <Building2 className="h-6 w-6" />,
  
  colors: {
    primary: "from-amber-500 to-orange-600",
    accent: "bg-amber-500",
    gradient: "from-amber-900/90 to-orange-900/90"
  },

  features: [
    "Private Beach Access",
    "Full-Service Spa",
    "Oceanview Suites",
    "Fine Dining Restaurant",
    "Infinity Pool",
    "24/7 Concierge",
    "Complimentary Breakfast",
    "Pet-Friendly Rooms"
  ],

  services: [
    {
      name: "Oceanfront Suite",
      description: "Luxurious 750 sq ft suite with private balcony, panoramic ocean views, king bed, marble bathroom, and Nespresso machine.",
      price: "From $450/night",
      duration: "Check-in 3PM",
      popular: true
    },
    {
      name: "Signature Spa Package",
      description: "Full day of pampering: hot stone massage, facial, body wrap, lunch at the spa cafe, and all-day pool access.",
      price: "$395/person",
      duration: "5 hours"
    },
    {
      name: "Romantic Getaway Package",
      description: "Champagne on arrival, couples massage, dinner for two at The Reef Restaurant, and late checkout.",
      price: "From $799/night",
      duration: "2+ nights"
    },
    {
      name: "Private Beach Cabana",
      description: "Reserved oceanfront cabana with attendant service, chilled towels, fruit, and beverages throughout the day.",
      price: "$200/day",
      duration: "Full day"
    },
    {
      name: "Sunset Sailing Charter",
      description: "Private 2-hour sunset cruise along the coast with champagne, hors d'oeuvres, and professional captain.",
      price: "$650/group",
      duration: "2 hours"
    },
    {
      name: "Executive Meeting Space",
      description: "Private meeting rooms with ocean views, AV equipment, catering, and dedicated event coordinator.",
      price: "From $500/day",
      duration: "Full day"
    }
  ],

  team: [
    {
      name: "Alexandra Stone",
      role: "General Manager",
      specialty: "Guest Experience",
      bio: "20 years in luxury hospitality, dedicated to exceptional guest experiences."
    },
    {
      name: "Chef Marcus Webb",
      role: "Executive Chef",
      specialty: "Coastal Cuisine",
      bio: "James Beard nominated chef specializing in fresh, local seafood."
    },
    {
      name: "Sofia Reyes",
      role: "Spa Director",
      specialty: "Wellness Programs",
      bio: "Creates personalized wellness journeys for each guest."
    },
    {
      name: "James Thompson",
      role: "Head Concierge",
      specialty: "Local Experiences",
      bio: "Your insider to the best the Treasure Coast has to offer."
    }
  ],

  testimonials: [
    {
      name: "Katherine M.",
      role: "Anniversary Trip",
      content: "Our 25th anniversary was absolutely magical. The oceanfront suite, private dinner on the beach, and spa treatments made it unforgettable. We're already planning our return!",
      rating: 5
    },
    {
      name: "David & Lisa R.",
      role: "Family Vacation",
      content: "Perfect for families! Kids loved the beach and pool while we relaxed at the spa. The concierge arranged everything from fishing to sea turtle tours. Outstanding service.",
      rating: 5
    },
    {
      name: "Jennifer T.",
      role: "Business Retreat",
      content: "Hosted our executive retreat here and it exceeded all expectations. Beautiful meeting space, incredible food, and the team building activities were a hit.",
      rating: 5
    }
  ],

  aiBenefits: [
    {
      title: "24/7 Virtual Concierge",
      description: "Guests get instant answers about amenities, dining, spa services, and local attractions anytime, in any language.",
      icon: <MessageCircle className="h-6 w-6 text-cyan-400" />,
      stat: "Respond to guests 24/7"
    },
    {
      title: "Direct Booking Engine",
      description: "Capture direct reservations through chat with real-time availability, avoiding OTA commissions entirely.",
      icon: <Calendar className="h-6 w-6 text-cyan-400" />,
      stat: "Increase direct bookings 40%"
    },
    {
      title: "Upsell & Packages",
      description: "AI recommends spa treatments, dining reservations, and experiences based on guest preferences and occasion.",
      icon: <Sparkles className="h-6 w-6 text-cyan-400" />,
      stat: "Boost ancillary revenue"
    },
    {
      title: "Pre-Arrival Preparation",
      description: "Gather guest preferences, special requests, and dietary restrictions before check-in for personalized service.",
      icon: <Star className="h-6 w-6 text-cyan-400" />,
      stat: "Personalized guest experiences"
    },
    {
      title: "Restaurant & Spa Booking",
      description: "Guests book dining reservations and spa appointments through chat, seamlessly integrated with your systems.",
      icon: <Utensils className="h-6 w-6 text-cyan-400" />,
      stat: "Increase F&B revenue"
    },
    {
      title: "Multi-Language Support",
      description: "Engage international travelers in their native language, providing a welcoming experience from first contact.",
      icon: <TrendingUp className="h-6 w-6 text-cyan-400" />,
      stat: "Serve global guests"
    }
  ],

  nicheStats: [
    {
      value: "4.8",
      label: "TripAdvisor Rating",
      description: "Top 10 in Florida"
    },
    {
      value: "82",
      label: "Luxury Suites",
      description: "All with ocean views"
    },
    {
      value: "500ft",
      label: "Private Beach",
      description: "Exclusive guest access"
    },
    {
      value: "Award",
      label: "Winning Spa",
      description: "Conde Nast recognized"
    }
  ],

  faqs: [
    {
      question: "What time is check-in and check-out?",
      answer: "Check-in is at 3:00 PM and check-out is at 11:00 AM. Early check-in and late checkout may be available upon request - just ask our concierge."
    },
    {
      question: "Is the resort pet-friendly?",
      answer: "Yes! We have designated pet-friendly rooms. We provide beds, bowls, and treats for your furry companions. There's a $75/stay pet fee."
    },
    {
      question: "Do I need reservations for the restaurant?",
      answer: "We recommend reservations for dinner at The Reef Restaurant, especially on weekends. Breakfast and lunch seating is generally available without reservations."
    },
    {
      question: "What spa treatments do you recommend?",
      answer: "Our Signature Ocean Renewal treatment is a guest favorite - a 90-minute experience combining sea salt scrub, seaweed wrap, and massage. Book early as it sells out!"
    },
    {
      question: "Can you arrange special celebrations?",
      answer: "Absolutely! Our concierge specializes in creating memorable moments - from beachfront proposals to anniversary surprises. Contact us with your vision."
    }
  ],

  bookingLabel: "Reserve Your Stay",
  ctaText: "Ready for Your Luxury Escape?"
};
