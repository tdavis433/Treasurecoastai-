import {
  BookingProfile,
  BookingAppointmentType,
  UNIVERSAL_REQUEST_CALLBACK,
  PREFERRED_DAY_OPTIONS,
  URGENCY_OPTIONS,
} from './schema';

// ============================================================================
// INDUSTRY BOOKING PROFILES
// Default booking behavior per industry with failsafe configurations
// ============================================================================

/**
 * DEFAULT EXTERNAL INDUSTRIES (redirect-only; track intent+redirect; NO internal appointment IF URL valid)
 * FAILSAFE: if externalBookingUrl missing/invalid => pivot_to_internal
 */

export const BARBERSHOP_BOOKING_PROFILE: BookingProfile = {
  defaultMode: 'external',
  ctas: [
    { id: 'book_cut', label: 'Book a Cut', kind: 'primary', appointmentTypeId: 'book_cut' },
    { id: 'request_callback', label: 'Request Callback', kind: 'secondary', appointmentTypeId: 'request_callback' },
  ],
  appointmentTypes: [
    {
      id: 'book_cut',
      label: 'Book a Cut',
      mode: 'external',
      intakeFields: [],
      confirmationMessage: 'Redirecting you to our booking page...',
      description: 'Schedule your haircut online',
      durationMinutes: 30,
    },
    UNIVERSAL_REQUEST_CALLBACK,
  ],
  failsafe: {
    externalMissingUrlBehavior: 'pivot_to_internal',
    pivotAppointmentTypeId: 'request_callback',
  },
};

export const MED_SPA_BOOKING_PROFILE: BookingProfile = {
  defaultMode: 'external',
  ctas: [
    { id: 'book_treatment', label: 'Book Treatment', kind: 'primary', appointmentTypeId: 'book_treatment' },
    { id: 'request_appointment', label: 'Request Consultation', kind: 'secondary', appointmentTypeId: 'request_appointment' },
  ],
  appointmentTypes: [
    {
      id: 'book_treatment',
      label: 'Book Treatment',
      mode: 'external',
      intakeFields: [],
      confirmationMessage: 'Redirecting you to our booking page...',
      description: 'Schedule your treatment online',
      durationMinutes: 60,
    },
    {
      ...UNIVERSAL_REQUEST_CALLBACK,
      id: 'request_appointment',
      label: 'Request Appointment',
      confirmationMessage: "Thank you! We'll contact you to schedule your consultation. Note: This is not medical advice. For emergencies, call 911.",
    },
  ],
  failsafe: {
    externalMissingUrlBehavior: 'pivot_to_internal',
    pivotAppointmentTypeId: 'request_appointment',
  },
  disclaimers: {
    enabled: true,
    text: 'Not medical advice; for emergencies call 911.',
  },
};

export const BOUTIQUE_HOTEL_BOOKING_PROFILE: BookingProfile = {
  defaultMode: 'external',
  ctas: [
    { id: 'book_stay', label: 'Book a Stay', kind: 'primary', appointmentTypeId: 'book_stay' },
    { id: 'check_availability', label: 'Check Availability', kind: 'secondary', appointmentTypeId: 'check_availability' },
    { id: 'request_callback', label: 'Request Callback', kind: 'link', appointmentTypeId: 'request_callback' },
  ],
  appointmentTypes: [
    {
      id: 'book_stay',
      label: 'Book a Stay',
      mode: 'external',
      intakeFields: [],
      confirmationMessage: 'Redirecting you to our reservation system...',
      description: 'Book your room online',
    },
    {
      id: 'check_availability',
      label: 'Check Availability',
      mode: 'external',
      intakeFields: [],
      confirmationMessage: 'Redirecting to check available dates...',
      description: 'View available rooms and dates',
    },
    UNIVERSAL_REQUEST_CALLBACK,
  ],
  failsafe: {
    externalMissingUrlBehavior: 'pivot_to_internal',
    pivotAppointmentTypeId: 'request_callback',
  },
};

export const PET_GROOMING_BOOKING_PROFILE: BookingProfile = {
  defaultMode: 'external',
  ctas: [
    { id: 'book_grooming', label: 'Book Grooming', kind: 'primary', appointmentTypeId: 'book_grooming' },
    { id: 'request_callback', label: 'Request Callback', kind: 'secondary', appointmentTypeId: 'request_callback' },
  ],
  appointmentTypes: [
    {
      id: 'book_grooming',
      label: 'Book Grooming',
      mode: 'external',
      intakeFields: [],
      confirmationMessage: 'Redirecting you to our booking page...',
      description: 'Schedule pet grooming online',
      durationMinutes: 60,
    },
    UNIVERSAL_REQUEST_CALLBACK,
  ],
  failsafe: {
    externalMissingUrlBehavior: 'pivot_to_internal',
    pivotAppointmentTypeId: 'request_callback',
  },
};

export const DENTAL_CLINIC_BOOKING_PROFILE: BookingProfile = {
  defaultMode: 'external',
  ctas: [
    { id: 'book_appointment', label: 'Book Appointment', kind: 'primary', appointmentTypeId: 'book_appointment' },
    { id: 'request_appointment', label: 'Request Callback', kind: 'secondary', appointmentTypeId: 'request_appointment' },
  ],
  appointmentTypes: [
    {
      id: 'book_appointment',
      label: 'Book Appointment',
      mode: 'external',
      intakeFields: [],
      confirmationMessage: 'Redirecting you to our booking page...',
      description: 'Schedule your dental appointment online',
      durationMinutes: 60,
    },
    {
      ...UNIVERSAL_REQUEST_CALLBACK,
      id: 'request_appointment',
      label: 'Request Appointment',
      confirmationMessage: "Thank you! We'll contact you to schedule your appointment. Note: This is not medical advice. For emergencies, call 911.",
    },
  ],
  failsafe: {
    externalMissingUrlBehavior: 'pivot_to_internal',
    pivotAppointmentTypeId: 'request_appointment',
  },
  disclaimers: {
    enabled: true,
    text: 'Not medical advice; for emergencies call 911.',
  },
};

export const TATTOO_STUDIO_BOOKING_PROFILE: BookingProfile = {
  defaultMode: 'external',
  ctas: [
    { id: 'book_consultation', label: 'Book Consultation', kind: 'primary', appointmentTypeId: 'book_consultation' },
    { id: 'request_callback', label: 'Request Callback', kind: 'secondary', appointmentTypeId: 'request_callback' },
  ],
  appointmentTypes: [
    {
      id: 'book_consultation',
      label: 'Book Consultation',
      mode: 'external',
      intakeFields: [],
      confirmationMessage: 'Redirecting you to our booking page...',
      description: 'Schedule your tattoo consultation online',
      durationMinutes: 30,
    },
    UNIVERSAL_REQUEST_CALLBACK,
  ],
  failsafe: {
    externalMissingUrlBehavior: 'pivot_to_internal',
    pivotAppointmentTypeId: 'request_callback',
  },
};

/**
 * DEFAULT INTERNAL INDUSTRIES (create appointment REQUEST + notifications; no payments)
 */

export const RECOVERY_HOUSING_BOOKING_PROFILE: BookingProfile = {
  defaultMode: 'internal',
  ctas: [
    { id: 'schedule_tour', label: 'Schedule a Tour', kind: 'primary', appointmentTypeId: 'schedule_tour' },
    { id: 'schedule_call', label: 'Schedule Phone Call', kind: 'secondary', appointmentTypeId: 'schedule_call' },
  ],
  appointmentTypes: [
    {
      id: 'schedule_tour',
      label: 'Schedule a Tour',
      mode: 'internal',
      intakeFields: [
        { key: 'name', label: 'Your Name', required: true, type: 'text', placeholder: 'Full name' },
        { key: 'phone', label: 'Phone Number', required: true, type: 'phone', placeholder: '(555) 123-4567' },
        { key: 'email', label: 'Email', required: false, type: 'email', placeholder: 'you@example.com' },
        { key: 'lookingFor', label: 'Who is this for?', required: true, type: 'select', options: [{ value: 'self', label: 'Myself' }, { value: 'loved_one', label: 'A loved one' }] },
        { key: 'preferredDay', label: 'Preferred Day', required: false, type: 'select', options: PREFERRED_DAY_OPTIONS },
        { key: 'preferredTime', label: 'Preferred Time', required: false, type: 'text', placeholder: 'e.g., Morning, Afternoon, Evening' },
        { key: 'isUrgent', label: 'Is this urgent?', required: false, type: 'select', options: URGENCY_OPTIONS },
      ],
      confirmationMessage: "Thank you! We've received your tour request and will reach out shortly to confirm.",
      description: 'Visit our facility in person',
      durationMinutes: 30,
    },
    {
      id: 'schedule_call',
      label: 'Schedule Phone Call',
      mode: 'internal',
      intakeFields: [
        { key: 'name', label: 'Your Name', required: true, type: 'text', placeholder: 'Full name' },
        { key: 'phone', label: 'Phone Number', required: true, type: 'phone', placeholder: '(555) 123-4567' },
        { key: 'email', label: 'Email', required: false, type: 'email', placeholder: 'you@example.com' },
        { key: 'lookingFor', label: 'Who is this for?', required: true, type: 'select', options: [{ value: 'self', label: 'Myself' }, { value: 'loved_one', label: 'A loved one' }] },
        { key: 'preferredDay', label: 'Preferred Day', required: false, type: 'select', options: PREFERRED_DAY_OPTIONS },
        { key: 'preferredTime', label: 'Best Time to Call', required: false, type: 'text', placeholder: 'e.g., Morning, Afternoon, Evening' },
        { key: 'isUrgent', label: 'Is this urgent?', required: false, type: 'select', options: URGENCY_OPTIONS },
      ],
      confirmationMessage: "Thank you! We'll call you within 2 hours during business hours.",
      description: 'Speak with our team by phone',
      durationMinutes: 15,
    },
    UNIVERSAL_REQUEST_CALLBACK,
  ],
  failsafe: {
    externalMissingUrlBehavior: 'pivot_to_internal',
    pivotAppointmentTypeId: 'request_callback',
  },
};

export const WEDDING_VENUE_BOOKING_PROFILE: BookingProfile = {
  defaultMode: 'internal',
  ctas: [
    { id: 'schedule_tour', label: 'Schedule a Tour', kind: 'primary', appointmentTypeId: 'schedule_tour' },
    { id: 'check_date', label: 'Check Date', kind: 'secondary', appointmentTypeId: 'check_date' },
  ],
  appointmentTypes: [
    {
      id: 'schedule_tour',
      label: 'Schedule a Tour',
      mode: 'internal',
      intakeFields: [
        { key: 'name', label: 'Your Name', required: true, type: 'text', placeholder: 'Full name' },
        { key: 'phone', label: 'Phone Number', required: true, type: 'phone', placeholder: '(555) 123-4567' },
        { key: 'email', label: 'Email', required: true, type: 'email', placeholder: 'you@example.com' },
        { key: 'eventDate', label: 'Tentative Event Date', required: false, type: 'date' },
        { key: 'guestCount', label: 'Estimated Guest Count', required: false, type: 'number', placeholder: 'e.g., 150' },
        { key: 'preferredTime', label: 'Preferred Tour Time', required: false, type: 'text', placeholder: 'e.g., Saturday afternoon' },
      ],
      confirmationMessage: "Thank you! We've received your tour request and will contact you to confirm.",
      description: 'Visit our venue in person',
      durationMinutes: 60,
    },
    {
      id: 'check_date',
      label: 'Check Date Availability',
      mode: 'internal',
      intakeFields: [
        { key: 'name', label: 'Your Name', required: true, type: 'text', placeholder: 'Full name' },
        { key: 'phone', label: 'Phone Number', required: true, type: 'phone', placeholder: '(555) 123-4567' },
        { key: 'email', label: 'Email', required: true, type: 'email', placeholder: 'you@example.com' },
        { key: 'eventDate', label: 'Event Date', required: true, type: 'date' },
        { key: 'eventType', label: 'Event Type', required: false, type: 'text', placeholder: 'e.g., Wedding reception' },
      ],
      confirmationMessage: "Thank you! We'll check availability and get back to you shortly.",
      description: 'Check if your date is available',
      durationMinutes: 15,
    },
    UNIVERSAL_REQUEST_CALLBACK,
  ],
  failsafe: {
    externalMissingUrlBehavior: 'pivot_to_internal',
    pivotAppointmentTypeId: 'request_callback',
  },
};

export const AUTO_SHOP_BOOKING_PROFILE: BookingProfile = {
  defaultMode: 'internal',
  ctas: [
    { id: 'schedule_service', label: 'Schedule Service', kind: 'primary', appointmentTypeId: 'schedule_service' },
    { id: 'request_estimate', label: 'Request Estimate', kind: 'secondary', appointmentTypeId: 'request_estimate' },
  ],
  appointmentTypes: [
    {
      id: 'schedule_service',
      label: 'Schedule Service',
      mode: 'internal',
      intakeFields: [
        { key: 'name', label: 'Your Name', required: true, type: 'text', placeholder: 'Full name' },
        { key: 'phone', label: 'Phone Number', required: true, type: 'phone', placeholder: '(555) 123-4567' },
        { key: 'vehicleInfo', label: 'Vehicle Year/Make/Model', required: true, type: 'text', placeholder: 'e.g., 2020 Honda Accord' },
        { key: 'serviceNeeded', label: 'Service Needed', required: true, type: 'textarea', placeholder: 'Describe the issue or service needed' },
        { key: 'preferredTime', label: 'Preferred Date/Time', required: false, type: 'text', placeholder: 'e.g., Monday morning' },
      ],
      confirmationMessage: "Thank you! We've received your service request and will contact you to confirm.",
      description: 'Schedule vehicle service',
      durationMinutes: 60,
    },
    {
      id: 'request_estimate',
      label: 'Request Estimate',
      mode: 'internal',
      intakeFields: [
        { key: 'name', label: 'Your Name', required: true, type: 'text', placeholder: 'Full name' },
        { key: 'phone', label: 'Phone Number', required: true, type: 'phone', placeholder: '(555) 123-4567' },
        { key: 'vehicleInfo', label: 'Vehicle Year/Make/Model', required: true, type: 'text', placeholder: 'e.g., 2020 Honda Accord' },
        { key: 'serviceNeeded', label: 'Service/Repair Needed', required: true, type: 'textarea', placeholder: 'Describe the issue' },
      ],
      confirmationMessage: "Thank you! We'll prepare an estimate and get back to you.",
      description: 'Get a free estimate',
      durationMinutes: 15,
    },
    UNIVERSAL_REQUEST_CALLBACK,
  ],
  failsafe: {
    externalMissingUrlBehavior: 'pivot_to_internal',
    pivotAppointmentTypeId: 'request_callback',
  },
};

export const FITNESS_CENTER_BOOKING_PROFILE: BookingProfile = {
  defaultMode: 'internal',
  ctas: [
    { id: 'schedule_consultation', label: 'Schedule Consultation', kind: 'primary', appointmentTypeId: 'schedule_consultation' },
    { id: 'book_free_trial', label: 'Book Free Trial', kind: 'secondary', appointmentTypeId: 'book_free_trial' },
  ],
  appointmentTypes: [
    {
      id: 'schedule_consultation',
      label: 'Schedule Consultation',
      mode: 'internal',
      intakeFields: [
        { key: 'name', label: 'Your Name', required: true, type: 'text', placeholder: 'Full name' },
        { key: 'phone', label: 'Phone Number', required: true, type: 'phone', placeholder: '(555) 123-4567' },
        { key: 'email', label: 'Email', required: false, type: 'email', placeholder: 'you@example.com' },
        { key: 'goals', label: 'Fitness Goals', required: false, type: 'textarea', placeholder: 'What are you hoping to achieve?' },
        { key: 'preferredTime', label: 'Preferred Time', required: false, type: 'text', placeholder: 'e.g., Weekday evenings' },
      ],
      confirmationMessage: "Thank you! We'll contact you to schedule your consultation.",
      description: 'Meet with a fitness advisor',
      durationMinutes: 30,
    },
    {
      id: 'book_free_trial',
      label: 'Book Free Trial',
      mode: 'internal',
      intakeFields: [
        { key: 'name', label: 'Your Name', required: true, type: 'text', placeholder: 'Full name' },
        { key: 'phone', label: 'Phone Number', required: true, type: 'phone', placeholder: '(555) 123-4567' },
        { key: 'email', label: 'Email', required: true, type: 'email', placeholder: 'you@example.com' },
        { key: 'preferredTime', label: 'Preferred Time', required: true, type: 'text', placeholder: 'e.g., Tomorrow at 10am' },
      ],
      confirmationMessage: "Thank you! Your free trial is being scheduled. We'll confirm shortly.",
      description: 'Try our gym free',
      durationMinutes: 60,
    },
    UNIVERSAL_REQUEST_CALLBACK,
  ],
  failsafe: {
    externalMissingUrlBehavior: 'pivot_to_internal',
    pivotAppointmentTypeId: 'request_callback',
  },
};

export const HOME_SERVICES_BOOKING_PROFILE: BookingProfile = {
  defaultMode: 'internal',
  ctas: [
    { id: 'request_estimate', label: 'Request Estimate', kind: 'primary', appointmentTypeId: 'request_estimate' },
    { id: 'schedule_service', label: 'Schedule Service', kind: 'secondary', appointmentTypeId: 'schedule_service' },
  ],
  appointmentTypes: [
    {
      id: 'request_estimate',
      label: 'Request Estimate',
      mode: 'internal',
      intakeFields: [
        { key: 'name', label: 'Your Name', required: true, type: 'text', placeholder: 'Full name' },
        { key: 'phone', label: 'Phone Number', required: true, type: 'phone', placeholder: '(555) 123-4567' },
        { key: 'address', label: 'Address/Zip Code', required: true, type: 'text', placeholder: 'Service address or zip' },
        { key: 'serviceType', label: 'Service Type', required: true, type: 'text', placeholder: 'e.g., Roof repair, plumbing' },
        { key: 'urgency', label: 'Urgency', required: false, type: 'select', options: [{ value: 'urgent', label: 'Urgent (ASAP)' }, { value: 'this_week', label: 'This Week' }, { value: 'flexible', label: 'Flexible' }] },
        { key: 'notes', label: 'Details', required: false, type: 'textarea', placeholder: 'Describe the job' },
      ],
      confirmationMessage: "Thank you! We'll prepare an estimate and contact you shortly.",
      description: 'Get a free estimate',
      durationMinutes: 30,
    },
    {
      id: 'schedule_service',
      label: 'Schedule Service',
      mode: 'internal',
      intakeFields: [
        { key: 'name', label: 'Your Name', required: true, type: 'text', placeholder: 'Full name' },
        { key: 'phone', label: 'Phone Number', required: true, type: 'phone', placeholder: '(555) 123-4567' },
        { key: 'address', label: 'Service Address', required: true, type: 'text', placeholder: 'Full address' },
        { key: 'serviceType', label: 'Service Type', required: true, type: 'text', placeholder: 'e.g., AC maintenance' },
        { key: 'preferredWindow', label: 'Preferred Time Window', required: true, type: 'text', placeholder: 'e.g., Tuesday morning' },
      ],
      confirmationMessage: "Thank you! We'll contact you to confirm your service appointment.",
      description: 'Schedule a service call',
      durationMinutes: 60,
    },
    UNIVERSAL_REQUEST_CALLBACK,
  ],
  failsafe: {
    externalMissingUrlBehavior: 'pivot_to_internal',
    pivotAppointmentTypeId: 'request_callback',
  },
};

export const REAL_ESTATE_BOOKING_PROFILE: BookingProfile = {
  defaultMode: 'internal',
  ctas: [
    { id: 'schedule_showing', label: 'Schedule Showing', kind: 'primary', appointmentTypeId: 'schedule_showing' },
    { id: 'request_call', label: 'Request a Call', kind: 'secondary', appointmentTypeId: 'request_call' },
  ],
  appointmentTypes: [
    {
      id: 'schedule_showing',
      label: 'Schedule Showing',
      mode: 'internal',
      intakeFields: [
        { key: 'name', label: 'Your Name', required: true, type: 'text', placeholder: 'Full name' },
        { key: 'phone', label: 'Phone Number', required: true, type: 'phone', placeholder: '(555) 123-4567' },
        { key: 'email', label: 'Email', required: true, type: 'email', placeholder: 'you@example.com' },
        { key: 'propertyAddress', label: 'Property Address', required: true, type: 'text', placeholder: 'Address of property to view' },
        { key: 'preferredTime', label: 'Preferred Time', required: true, type: 'text', placeholder: 'e.g., Saturday at 2pm' },
      ],
      confirmationMessage: "Thank you! We'll confirm your showing and contact you shortly.",
      description: 'View a property in person',
      durationMinutes: 30,
    },
    {
      id: 'request_call',
      label: 'Request a Call',
      mode: 'internal',
      intakeFields: [
        { key: 'name', label: 'Your Name', required: true, type: 'text', placeholder: 'Full name' },
        { key: 'phone', label: 'Phone Number', required: true, type: 'phone', placeholder: '(555) 123-4567' },
        { key: 'email', label: 'Email', required: false, type: 'email', placeholder: 'you@example.com' },
        { key: 'interest', label: 'What are you looking for?', required: false, type: 'textarea', placeholder: 'e.g., 3-bed house in downtown area' },
        { key: 'preferredTime', label: 'Best Time to Call', required: false, type: 'text', placeholder: 'e.g., Afternoons' },
      ],
      confirmationMessage: "Thank you! An agent will call you at the time you indicated.",
      description: 'Speak with an agent',
      durationMinutes: 15,
    },
    UNIVERSAL_REQUEST_CALLBACK,
  ],
  failsafe: {
    externalMissingUrlBehavior: 'pivot_to_internal',
    pivotAppointmentTypeId: 'request_callback',
  },
};

export const LAW_FIRM_BOOKING_PROFILE: BookingProfile = {
  defaultMode: 'internal',
  ctas: [
    { id: 'schedule_consultation', label: 'Schedule Consultation', kind: 'primary', appointmentTypeId: 'schedule_consultation' },
    { id: 'case_review_call', label: 'Case Review Call', kind: 'secondary', appointmentTypeId: 'case_review_call' },
  ],
  appointmentTypes: [
    {
      id: 'schedule_consultation',
      label: 'Schedule Consultation',
      mode: 'internal',
      intakeFields: [
        { key: 'name', label: 'Your Name', required: true, type: 'text', placeholder: 'Full name' },
        { key: 'phone', label: 'Phone Number', required: true, type: 'phone', placeholder: '(555) 123-4567' },
        { key: 'email', label: 'Email', required: true, type: 'email', placeholder: 'you@example.com' },
        { key: 'caseType', label: 'Type of Case', required: true, type: 'select', options: [{ value: 'personal_injury', label: 'Personal Injury' }, { value: 'family_law', label: 'Family Law' }, { value: 'criminal_defense', label: 'Criminal Defense' }, { value: 'estate_planning', label: 'Estate Planning' }, { value: 'business', label: 'Business Law' }, { value: 'other', label: 'Other' }] },
        { key: 'briefSummary', label: 'Brief Summary', required: false, type: 'textarea', placeholder: 'Brief description of your situation' },
        { key: 'preferredTime', label: 'Preferred Time', required: false, type: 'text', placeholder: 'e.g., Weekday mornings' },
      ],
      confirmationMessage: "Thank you! We'll contact you to schedule your consultation. Note: This is general information only, not legal advice.",
      description: 'Meet with an attorney',
      durationMinutes: 30,
    },
    {
      id: 'case_review_call',
      label: 'Case Review Call',
      mode: 'internal',
      intakeFields: [
        { key: 'name', label: 'Your Name', required: true, type: 'text', placeholder: 'Full name' },
        { key: 'phone', label: 'Phone Number', required: true, type: 'phone', placeholder: '(555) 123-4567' },
        { key: 'caseType', label: 'Type of Case', required: true, type: 'text', placeholder: 'e.g., Personal Injury' },
        { key: 'briefSummary', label: 'Brief Summary', required: true, type: 'textarea', placeholder: 'Describe your situation' },
      ],
      confirmationMessage: "Thank you! An attorney will call you for a case review. Note: This is general information only, not legal advice.",
      description: 'Quick phone review of your case',
      durationMinutes: 15,
    },
    UNIVERSAL_REQUEST_CALLBACK,
  ],
  failsafe: {
    externalMissingUrlBehavior: 'pivot_to_internal',
    pivotAppointmentTypeId: 'request_callback',
  },
  disclaimers: {
    enabled: true,
    text: 'General information only; not legal advice.',
  },
};

export const RESTAURANT_BOOKING_PROFILE: BookingProfile = {
  defaultMode: 'internal',
  ctas: [
    { id: 'reserve_table', label: 'Reserve a Table', kind: 'primary', appointmentTypeId: 'reserve_table' },
    { id: 'request_callback', label: 'Call Us', kind: 'secondary', appointmentTypeId: 'request_callback' },
  ],
  appointmentTypes: [
    {
      id: 'reserve_table',
      label: 'Reserve a Table',
      mode: 'internal',
      intakeFields: [
        { key: 'name', label: 'Name for Reservation', required: true, type: 'text', placeholder: 'Full name' },
        { key: 'phone', label: 'Phone Number', required: true, type: 'phone', placeholder: '(555) 123-4567' },
        { key: 'date', label: 'Date', required: true, type: 'date' },
        { key: 'time', label: 'Time', required: true, type: 'time' },
        { key: 'partySize', label: 'Party Size', required: true, type: 'number', placeholder: 'Number of guests' },
        { key: 'notes', label: 'Special Requests', required: false, type: 'textarea', placeholder: 'e.g., Birthday celebration, dietary restrictions' },
      ],
      confirmationMessage: "Thank you! Your reservation request has been received. We'll confirm shortly.",
      description: 'Make a dinner reservation',
      durationMinutes: 90,
    },
    UNIVERSAL_REQUEST_CALLBACK,
  ],
  failsafe: {
    externalMissingUrlBehavior: 'pivot_to_internal',
    pivotAppointmentTypeId: 'request_callback',
  },
};

export const ROOFING_COMPANY_BOOKING_PROFILE: BookingProfile = {
  ...HOME_SERVICES_BOOKING_PROFILE,
  ctas: [
    { id: 'request_estimate', label: 'Free Roof Inspection', kind: 'primary', appointmentTypeId: 'request_estimate' },
    { id: 'schedule_service', label: 'Schedule Repair', kind: 'secondary', appointmentTypeId: 'schedule_service' },
  ],
};

// ============================================================================
// INDUSTRY PROFILE MAP
// Maps bot types to their booking profiles
// ============================================================================

export const INDUSTRY_BOOKING_PROFILES: Record<string, BookingProfile> = {
  // External default industries
  barber: BARBERSHOP_BOOKING_PROFILE,
  barbershop: BARBERSHOP_BOOKING_PROFILE,
  med_spa: MED_SPA_BOOKING_PROFILE,
  medspa: MED_SPA_BOOKING_PROFILE,
  boutique_hotel: BOUTIQUE_HOTEL_BOOKING_PROFILE,
  hotel: BOUTIQUE_HOTEL_BOOKING_PROFILE,
  pet_grooming: PET_GROOMING_BOOKING_PROFILE,
  grooming: PET_GROOMING_BOOKING_PROFILE,
  dental_clinic: DENTAL_CLINIC_BOOKING_PROFILE,
  dental: DENTAL_CLINIC_BOOKING_PROFILE,
  tattoo_studio: TATTOO_STUDIO_BOOKING_PROFILE,
  tattoo: TATTOO_STUDIO_BOOKING_PROFILE,
  
  // Internal default industries
  sober_living: RECOVERY_HOUSING_BOOKING_PROFILE,
  recovery_housing: RECOVERY_HOUSING_BOOKING_PROFILE,
  recovery: RECOVERY_HOUSING_BOOKING_PROFILE,
  wedding_venue: WEDDING_VENUE_BOOKING_PROFILE,
  wedding: WEDDING_VENUE_BOOKING_PROFILE,
  auto_shop: AUTO_SHOP_BOOKING_PROFILE,
  auto: AUTO_SHOP_BOOKING_PROFILE,
  gym: FITNESS_CENTER_BOOKING_PROFILE,
  fitness: FITNESS_CENTER_BOOKING_PROFILE,
  fitness_center: FITNESS_CENTER_BOOKING_PROFILE,
  home_services: HOME_SERVICES_BOOKING_PROFILE,
  handyman: HOME_SERVICES_BOOKING_PROFILE,
  roofing: ROOFING_COMPANY_BOOKING_PROFILE,
  real_estate: REAL_ESTATE_BOOKING_PROFILE,
  realty: REAL_ESTATE_BOOKING_PROFILE,
  law_firm: LAW_FIRM_BOOKING_PROFILE,
  legal: LAW_FIRM_BOOKING_PROFILE,
  restaurant: RESTAURANT_BOOKING_PROFILE,
  
  // Generic fallback
  generic: RECOVERY_HOUSING_BOOKING_PROFILE, // Safe internal default
};

/**
 * Get booking profile for a bot type
 * Falls back to generic internal profile if not found
 */
export function getBookingProfileForBotType(botType: string): BookingProfile {
  const normalized = botType.toLowerCase().replace(/[\s-]/g, '_');
  return INDUSTRY_BOOKING_PROFILES[normalized] || INDUSTRY_BOOKING_PROFILES.generic;
}

/**
 * Validate that a booking profile has the required failsafe configuration
 */
export function validateBookingProfile(profile: BookingProfile): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!profile.failsafe) {
    errors.push('Missing required failsafe configuration');
  } else {
    if (profile.failsafe.externalMissingUrlBehavior !== 'pivot_to_internal') {
      errors.push('failsafe.externalMissingUrlBehavior must be "pivot_to_internal"');
    }
    if (!profile.failsafe.pivotAppointmentTypeId) {
      errors.push('failsafe.pivotAppointmentTypeId is required');
    } else {
      const pivotType = profile.appointmentTypes.find(t => t.id === profile.failsafe.pivotAppointmentTypeId);
      if (!pivotType) {
        errors.push(`failsafe.pivotAppointmentTypeId "${profile.failsafe.pivotAppointmentTypeId}" not found in appointmentTypes`);
      } else if (pivotType.mode !== 'internal') {
        errors.push(`Pivot appointment type "${profile.failsafe.pivotAppointmentTypeId}" must be internal mode`);
      }
    }
  }
  
  if (!profile.appointmentTypes || profile.appointmentTypes.length === 0) {
    errors.push('At least one appointmentType is required');
  }
  
  if (!profile.ctas || profile.ctas.length === 0) {
    errors.push('At least one CTA is required');
  }
  
  return { valid: errors.length === 0, errors };
}
