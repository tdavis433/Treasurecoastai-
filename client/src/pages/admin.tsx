import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Calendar, Clock, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface Appointment {
  id: string;
  name: string;
  contact: string;
  preferredTime: string;
  notes: string | null;
  createdAt: string;
}

export default function Admin() {
  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold text-foreground mb-8">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-admin-title">
            Appointment Requests
          </h1>
          <p className="text-muted-foreground">
            Tour and call requests from the HopeLine Assistant chatbot
          </p>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <Badge variant="secondary" data-testid="badge-total-count">
            {appointments?.length || 0} Total Requests
          </Badge>
        </div>

        {!appointments || appointments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No appointment requests yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((appointment) => (
                <Card key={appointment.id} data-testid={`card-appointment-${appointment.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl" data-testid={`text-name-${appointment.id}`}>
                          {appointment.name}
                        </CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          Submitted {format(new Date(appointment.createdAt), "PPp")}
                        </CardDescription>
                      </div>
                      <Badge data-testid={`badge-status-${appointment.id}`}>New</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {appointment.contact.includes('@') ? (
                            <Mail className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Phone className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">Contact</p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-contact-${appointment.id}`}>
                            {appointment.contact}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">Preferred Time</p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-time-${appointment.id}`}>
                            {appointment.preferredTime}
                          </p>
                        </div>
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="flex items-start gap-3 pt-2 border-t border-border">
                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground mb-1">Additional Notes</p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-notes-${appointment.id}`}>
                            {appointment.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
