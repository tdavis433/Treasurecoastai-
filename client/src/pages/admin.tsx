import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Calendar, Clock, MessageSquare, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Appointment {
  id: string;
  name: string;
  contact: string;
  preferredTime: string;
  notes: string | null;
  createdAt: string;
}

export default function Admin() {
  const { toast } = useToast();
  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/appointments/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment Deleted",
        description: "The appointment request has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete appointment. Please try again.",
        variant: "destructive",
      });
    },
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
                      <div className="flex items-center gap-2">
                        <Badge data-testid={`badge-status-${appointment.id}`}>New</Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-delete-${appointment.id}`}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Appointment?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove the appointment request from {appointment.name}. 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid={`button-cancel-delete-${appointment.id}`}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                data-testid={`button-confirm-delete-${appointment.id}`}
                                onClick={() => deleteMutation.mutate(appointment.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
