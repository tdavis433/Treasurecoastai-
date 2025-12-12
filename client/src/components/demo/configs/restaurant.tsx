import { Utensils, Star, Clock, Calendar, TrendingUp, MessageCircle, Wine, ChefHat, Users } from "lucide-react";
import { DemoPageConfig } from "../DemoPageTemplate";

export const restaurantConfig: DemoPageConfig = {
  clientId: "demo_sunset_bistro",
  botId: "sunset_bistro_demo_main",
  
  business: {
    name: "Sunset Bistro",
    tagline: "Delicious Food, Unforgettable Experience",
    description: "Upscale casual dining featuring fresh, locally-sourced ingredients and creative coastal cuisine. Enjoy stunning waterfront views, craft cocktails, and impeccable service. Perfect for date nights, celebrations, or a memorable meal with friends and family.",
    type: "restaurant",
    phone: "(772) 555-DINE",
    email: "reservations@sunsetbistro.com",
    website: "www.sunsetbistro.com",
    address: "50 Harbor View Lane",
    city: "Jensen Beach, FL 34957",
    hours: {
      "Monday": "Closed",
      "Tuesday": "5:00 PM - 10:00 PM",
      "Wednesday": "5:00 PM - 10:00 PM",
      "Thursday": "5:00 PM - 10:00 PM",
      "Friday": "5:00 PM - 11:00 PM",
      "Saturday": "4:00 PM - 11:00 PM",
      "Sunday": "4:00 PM - 9:00 PM (Brunch 10AM-2PM)"
    }
  },

  icon: <Utensils className="h-6 w-6" />,
  
  colors: {
    primary: "from-orange-600 to-red-600",
    accent: "bg-orange-500",
    gradient: "from-orange-900/90 to-red-900/90"
  },

  features: [
    "Waterfront Dining",
    "Farm-to-Table",
    "Craft Cocktails",
    "Private Events",
    "Sunday Brunch",
    "Happy Hour Daily",
    "Live Music Fridays",
    "Online Reservations"
  ],

  services: [
    {
      name: "Dinner Reservations",
      description: "Reserve your waterfront table for an unforgettable dining experience. Indoor and patio seating available.",
      price: "$$$",
      duration: "2 hours typical",
      popular: true
    },
    {
      name: "Sunday Brunch",
      description: "Coastal brunch with bottomless mimosas, eggs Benedict, and live jazz. A local favorite!",
      price: "$35-45/person",
      duration: "10AM-2PM",
      popular: true
    },
    {
      name: "Private Dining",
      description: "Host your special event in our private room. Customized menus for groups of 12-40 guests.",
      price: "Custom pricing",
      duration: "3-4 hours"
    },
    {
      name: "Happy Hour",
      description: "Half-price appetizers and $8 signature cocktails at the bar. The best sunset views in town!",
      price: "$8 cocktails",
      duration: "4PM-6PM Tue-Sun"
    },
    {
      name: "Chef's Tasting Menu",
      description: "7-course culinary journey showcasing Chef Marco's finest creations with wine pairings.",
      price: "$125/person",
      duration: "3 hours"
    },
    {
      name: "Catering & Events",
      description: "Bring Sunset Bistro to your venue. Full-service catering for weddings, corporate events, and more.",
      price: "Custom quotes",
      duration: "Varies"
    }
  ],

  team: [
    {
      name: "Chef Marco DiNapoli",
      role: "Executive Chef",
      specialty: "Coastal Italian",
      bio: "James Beard nominated chef bringing Florida-Italian fusion to every plate."
    },
    {
      name: "Sarah Mitchell",
      role: "General Manager",
      specialty: "Guest Experience",
      bio: "20 years in fine dining, dedicated to making every visit special."
    },
    {
      name: "Carlos Vega",
      role: "Bar Manager",
      specialty: "Craft Cocktails",
      bio: "Award-winning mixologist crafting innovative drinks with local ingredients."
    },
    {
      name: "Emily Chen",
      role: "Events Coordinator",
      specialty: "Private Events",
      bio: "Creates unforgettable celebrations from intimate dinners to large parties."
    }
  ],

  testimonials: [
    {
      name: "Michael & Rebecca T.",
      role: "Anniversary Dinner",
      content: "We celebrated our 25th anniversary here and it was perfection. The sunset, the service, Chef Marco's tasting menu - everything exceeded expectations. Truly magical.",
      rating: 5
    },
    {
      name: "Jason K.",
      role: "Foodie",
      content: "Finally, a restaurant in the area that takes food seriously! Fresh ingredients, creative dishes, and the cocktails are incredible. The happy hour is the best deal on the coast.",
      rating: 5
    },
    {
      name: "Linda S.",
      role: "Event Host",
      content: "Had my daughter's rehearsal dinner in the private room. Emily handled everything beautifully - custom menu, decorations, seamless service. Our guests still talk about it!",
      rating: 5
    }
  ],

  aiBenefits: [
    {
      title: "Instant Reservations",
      description: "Guests book tables 24/7 with real-time availability. No more phone tag or waiting for callbacks.",
      icon: <Calendar className="h-6 w-6 text-cyan-400" />,
      stat: "30% more reservations"
    },
    {
      title: "Special Occasion Planning",
      description: "AI captures birthdays, anniversaries, and special requests so staff can prepare surprises.",
      icon: <Star className="h-6 w-6 text-cyan-400" />,
      stat: "Personalized experiences"
    },
    {
      title: "Menu & Dietary Questions",
      description: "Answer questions about allergens, vegetarian options, and menu details before guests arrive.",
      icon: <Utensils className="h-6 w-6 text-cyan-400" />,
      stat: "Better prepared guests"
    },
    {
      title: "Private Event Inquiries",
      description: "Capture event details - date, guest count, occasion, budget - for your events team to follow up.",
      icon: <Users className="h-6 w-6 text-cyan-400" />,
      stat: "Streamline event leads"
    },
    {
      title: "Wait Time & Hours",
      description: "Guests can check current wait times for walk-ins and confirm hours before driving over.",
      icon: <Clock className="h-6 w-6 text-cyan-400" />,
      stat: "Reduce no-shows"
    },
    {
      title: "Reservation Modifications",
      description: "Guests can easily change party size, time, or cancel through chat without calling.",
      icon: <MessageCircle className="h-6 w-6 text-cyan-400" />,
      stat: "Easy rebooking"
    }
  ],

  nicheStats: [
    {
      value: "4.8",
      label: "Yelp Rating",
      description: "Top 10 in region"
    },
    {
      value: "15",
      label: "Years Open",
      description: "Local institution"
    },
    {
      value: "200+",
      label: "Events Hosted",
      description: "Annually"
    },
    {
      value: "Best",
      label: "Sunset Views",
      description: "On the coast"
    }
  ],

  faqs: [
    {
      question: "Do you take reservations?",
      answer: "Yes! We highly recommend reservations, especially for Friday and Saturday dinners. You can book online 24/7 through our AI assistant or call us."
    },
    {
      question: "Do you accommodate dietary restrictions?",
      answer: "Absolutely! We offer vegetarian, vegan, gluten-free, and allergen-friendly options. Please mention restrictions when booking so our chef can prepare."
    },
    {
      question: "Is there a dress code?",
      answer: "Smart casual. We ask guests to refrain from athletic wear and flip flops for dinner service. Come as you are for happy hour and brunch."
    },
    {
      question: "Can I host a private event?",
      answer: "Yes! Our private dining room accommodates 12-40 guests. Contact our events team to discuss custom menus and packages."
    },
    {
      question: "Do you have outdoor seating?",
      answer: "Yes! Our waterfront patio is spectacular for sunset dining. Please request outdoor seating when making your reservation - it's popular!"
    }
  ],

  bookingLabel: "Make Reservation",
  ctaText: "Ready for an Unforgettable Dining Experience?"
};
