import { Heart, Scissors, Shield, Clock, Calendar, TrendingUp, Bot, MessageCircle, Sparkles, Star } from "lucide-react";
import { DemoPageConfig } from "../DemoPageTemplate";

// Custom paw icon component
const PawIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM6 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM9 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-3 10c-2.76 0-5 2.24-5 5 0 .55.45 1 1 1h8c.55 0 1-.45 1-1 0-2.76-2.24-5-5-5z"/>
  </svg>
);

export const pawsSudsConfig: DemoPageConfig = {
  clientId: "demo_paws_suds_grooming",
  botId: "paws_suds_demo_main",
  
  business: {
    name: "Paws & Suds Pet Grooming",
    tagline: "Where Every Pet Gets the Royal Treatment",
    description: "Treasure Coast's premier pet grooming salon. We specialize in breed-specific styling, spa treatments, and tender loving care for dogs and cats of all sizes. Our certified groomers treat every pet like family.",
    type: "pet_grooming",
    phone: "(772) 555-PAWS",
    email: "hello@pawsandsuds.com",
    website: "www.pawsandsuds.com",
    address: "789 Furry Friends Blvd",
    city: "Stuart, FL 34994",
    hours: {
      "Monday": "8:00 AM - 6:00 PM",
      "Tuesday": "8:00 AM - 6:00 PM",
      "Wednesday": "8:00 AM - 6:00 PM",
      "Thursday": "8:00 AM - 6:00 PM",
      "Friday": "8:00 AM - 6:00 PM",
      "Saturday": "9:00 AM - 5:00 PM",
      "Sunday": "Closed"
    }
  },

  icon: <PawIcon className="h-6 w-6" />,
  
  colors: {
    primary: "from-pink-500 to-purple-600",
    accent: "bg-pink-500",
    gradient: "from-pink-900/90 to-purple-900/90"
  },

  features: [
    "Certified Pet Stylists",
    "All-Natural Products",
    "Breed-Specific Cuts",
    "Stress-Free Environment",
    "Cat Grooming Available",
    "Same-Day Appointments",
    "Puppy First Groom",
    "Senior Pet Care"
  ],

  services: [
    {
      name: "Full Groom Package",
      description: "Complete grooming including bath, blow dry, haircut, nail trim, ear cleaning, and finishing spray. Perfect for regular maintenance.",
      price: "From $55",
      duration: "2-3 hours",
      popular: true
    },
    {
      name: "Bath & Brush",
      description: "Thorough bath with premium shampoo, conditioner, blow dry, brush out, nail trim, and ear cleaning.",
      price: "From $35",
      duration: "1-2 hours"
    },
    {
      name: "Spa Day Package",
      description: "The ultimate pampering experience: aromatherapy bath, deep conditioning, paw massage, blueberry facial, and bandana.",
      price: "$85+",
      duration: "3-4 hours"
    },
    {
      name: "Puppy First Groom",
      description: "Gentle introduction to grooming for puppies under 6 months. Builds positive associations for a lifetime of easy grooming.",
      price: "$40",
      duration: "1 hour"
    },
    {
      name: "Cat Grooming",
      description: "Expert cat grooming with patience and care. Lion cuts, baths, de-matting, and nail trims for our feline friends.",
      price: "From $65",
      duration: "2-3 hours"
    },
    {
      name: "De-Shedding Treatment",
      description: "Specialized treatment to reduce shedding up to 80% for 4-6 weeks. Great for double-coated breeds.",
      price: "$45+",
      duration: "Add-on service"
    }
  ],

  team: [
    {
      name: "Amanda Roberts",
      role: "Owner & Head Groomer",
      specialty: "Show Dog Styling",
      bio: "20 years experience and certified by the National Dog Groomers Association."
    },
    {
      name: "Carlos Mendez",
      role: "Senior Stylist",
      specialty: "Large Breeds",
      bio: "Specializes in gentle handling of anxious and senior dogs."
    },
    {
      name: "Emily Chen",
      role: "Cat Specialist",
      specialty: "Feline Grooming",
      bio: "Certified feline groomer with a calm, patient approach to cat care."
    },
    {
      name: "Jake Thompson",
      role: "Grooming Assistant",
      specialty: "Puppy Care",
      bio: "Animal behavior graduate who loves making first grooms fun for puppies."
    }
  ],

  testimonials: [
    {
      name: "Lisa M.",
      role: "Golden Retriever Owner",
      content: "My dog Max used to hate grooming, but he literally pulls me to the door at Paws & Suds now! The staff is amazing and he always looks gorgeous.",
      rating: 5
    },
    {
      name: "Robert K.",
      role: "Persian Cat Owner",
      content: "Finally found a groomer who actually knows how to handle cats! My Persian Snowball has never looked better. They're so patient with her.",
      rating: 5
    },
    {
      name: "Jennifer D.",
      role: "Poodle Mom",
      content: "The breed-specific cuts here are top-notch. My standard poodle always gets compliments after her appointments. Highly recommend!",
      rating: 5
    }
  ],

  aiBenefits: [
    {
      title: "24/7 Appointment Booking",
      description: "Pet parents can book grooming appointments anytime, even when you're closed. Never miss a booking again.",
      icon: <Calendar className="h-6 w-6 text-cyan-400" />,
      stat: "Book appointments 24/7"
    },
    {
      title: "Service Recommendations",
      description: "AI suggests appropriate services based on pet breed, size, and grooming needs discussed in conversation.",
      icon: <Sparkles className="h-6 w-6 text-cyan-400" />,
      stat: "Personalized service matching"
    },
    {
      title: "Price & Duration Estimates",
      description: "Instantly provide accurate pricing and time estimates based on pet size and selected services.",
      icon: <Clock className="h-6 w-6 text-cyan-400" />,
      stat: "Clear pricing upfront"
    },
    {
      title: "New Client Intake",
      description: "Gather pet information, vaccination records, and special needs before the first appointment.",
      icon: <MessageCircle className="h-6 w-6 text-cyan-400" />,
      stat: "Streamline intake process"
    },
    {
      title: "Grooming Tips & Education",
      description: "Provide at-home care tips between appointments and educate pet parents about coat maintenance.",
      icon: <Heart className="h-6 w-6 text-cyan-400" />,
      stat: "Build customer loyalty"
    },
    {
      title: "Reduce No-Shows",
      description: "Automated reminders and easy rescheduling through chat reduces missed appointments significantly.",
      icon: <TrendingUp className="h-6 w-6 text-cyan-400" />,
      stat: "Reduce no-shows by 50%"
    }
  ],

  nicheStats: [
    {
      value: "5,000+",
      label: "Happy Pets",
      description: "Groomed since 2018"
    },
    {
      value: "4.9",
      label: "Star Rating",
      description: "From 400+ reviews"
    },
    {
      value: "100%",
      label: "Natural Products",
      description: "Safe for sensitive skin"
    },
    {
      value: "Same Day",
      label: "Appointments",
      description: "Often available"
    }
  ],

  faqs: [
    {
      question: "How often should I groom my dog?",
      answer: "It depends on the breed! Long-haired breeds typically need grooming every 4-6 weeks, while short-haired breeds can go 8-12 weeks. We can create a custom schedule for your pet."
    },
    {
      question: "Do you groom cats?",
      answer: "Yes! We have a certified feline groomer on staff. We offer baths, lion cuts, de-matting, and nail trims for cats of all temperaments."
    },
    {
      question: "What if my dog is anxious about grooming?",
      answer: "We specialize in gentle, patient handling. Our groomers are trained in fear-free techniques. For very anxious dogs, we can schedule extra time and use calming products."
    },
    {
      question: "Do you require vaccinations?",
      answer: "Yes, for the safety of all pets we require proof of current rabies, distemper, and bordetella vaccinations. These can be emailed or shown at check-in."
    },
    {
      question: "How long does a full groom take?",
      answer: "A full groom typically takes 2-3 hours depending on your pet's size, coat condition, and the services requested. We'll give you a time estimate when you drop off."
    }
  ],

  bookingLabel: "Book Appointment",
  ctaText: "Ready to Pamper Your Furry Friend?"
};
