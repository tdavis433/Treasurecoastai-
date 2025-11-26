import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/neon-badge";
import { DrawerPanel, DrawerSection, DrawerField } from "@/components/ui/drawer-panel";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Search, 
  Phone, 
  Mail, 
  ChevronLeft,
  ChevronRight,
  Download,
  Sparkles,
  Eye
} from "lucide-react";
import { format } from "date-fns";

function exportToCSV(appointments: Appointment[]) {
  const headers = [
    'Name',
    'Phone',
    'Email',
    'Appointment Type',
    'Status',
    'Preferred Time',
    'Contact Preference',
    'Looking For',
    'Sobriety Status',
    'Financial Support',
    'Timeline',
    'Created Date'
  ];
  
  const rows = appointments.map(apt => [
    apt.name,
    apt.contact,
    apt.email || '',
    apt.appointmentType.replace(/_/g, ' '),
    apt.status,
    apt.preferredTime,
    apt.contactPreference,
    apt.lookingFor || '',
    apt.sobrietyStatus || '',
    apt.hasSupport || '',
    apt.timeline || '',
    format(new Date(apt.createdAt), 'yyyy-MM-dd HH:mm:ss')
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `appointments-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

interface Appointment {
  id: string;
  name: string;
  contact: string;
  email: string | null;
  appointmentType: string;
  contactPreference: string;
  preferredTime: string;
  status: string;
  notes: string | null;
  conversationSummary: string | null;
  lookingFor: string | null;
  sobrietyStatus: string | null;
  hasSupport: string | null;
  timeline: string | null;
  createdAt: string;
}

export default function AdminAppointments() {
  const { toast} = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editedNotes, setEditedNotes] = useState("");
  const [editedStatus, setEditedStatus] = useState("");

  const pageSize = 25;
  
  const getDateRangeDates = () => {
    if (dateRange === "all") return { startDate: undefined, endDate: undefined };
    
    const end = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case "today":
        start.setHours(0, 0, 0, 0);
        break;
      case "week":
        start.setDate(start.getDate() - 7);
        break;
      case "month":
        start.setDate(start.getDate() - 30);
        break;
    }
    
    return { startDate: start, endDate: end };
  };
  
  const { startDate, endDate } = getDateRangeDates();

  const { data, isLoading } = useQuery<{ appointments: Appointment[]; total: number }>({
    queryKey: ["/api/appointments", { 
      status: statusFilter === "all" ? undefined : statusFilter,
      search: searchQuery || undefined,
      dateRange,
      limit: pageSize,
      offset: currentPage * pageSize
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("limit", pageSize.toString());
      params.append("offset", (currentPage * pageSize).toString());
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());
      
      const response = await fetch(`/api/appointments?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch appointments");
      return response.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: { id: string; notes?: string; status?: string }) => {
      const response = await apiRequest("PATCH", `/api/appointments/${updates.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment updated",
        description: "Changes saved successfully.",
      });
      setSelectedAppointment(null);
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update appointment.",
        variant: "destructive",
      });
    },
  });

  const handleSaveChanges = () => {
    if (!selectedAppointment) return;

    updateMutation.mutate({
      id: selectedAppointment.id,
      notes: editedNotes,
      status: editedStatus,
    });
  };

  const handleOpenDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditedNotes(appointment.notes || "");
    setEditedStatus(appointment.status);
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white" data-testid="text-appointments-title">
              Appointments
            </h2>
            <p className="text-white/55 mt-1">
              Manage and track all appointment requests
            </p>
          </div>
          <button
            onClick={() => data?.appointments && exportToCSV(data.appointments)}
            disabled={!data?.appointments?.length}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/85 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-export-csv"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Filters Panel */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Filters</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="flex flex-wrap gap-4">
              {/* Search Input */}
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-white/55 mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(0);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input"
                    data-testid="input-search"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="w-48">
                <label className="text-sm text-white/55 mb-2 block">Status</label>
                <Select 
                  value={statusFilter} 
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(0);
                  }}
                >
                  <SelectTrigger 
                    className="bg-white/5 border-white/10 text-white/85 hover:bg-white/10"
                    data-testid="select-status-filter"
                  >
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d24] border-white/10">
                    <SelectItem value="all" className="text-white/85 focus:bg-white/10 focus:text-white">All Statuses</SelectItem>
                    <SelectItem value="new" className="text-white/85 focus:bg-white/10 focus:text-white">New</SelectItem>
                    <SelectItem value="contacted" className="text-white/85 focus:bg-white/10 focus:text-white">Contacted</SelectItem>
                    <SelectItem value="scheduled" className="text-white/85 focus:bg-white/10 focus:text-white">Scheduled</SelectItem>
                    <SelectItem value="completed" className="text-white/85 focus:bg-white/10 focus:text-white">Completed</SelectItem>
                    <SelectItem value="cancelled" className="text-white/85 focus:bg-white/10 focus:text-white">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="w-48">
                <label className="text-sm text-white/55 mb-2 block">Date Range</label>
                <Select 
                  value={dateRange} 
                  onValueChange={(value) => {
                    setDateRange(value);
                    setCurrentPage(0);
                  }}
                >
                  <SelectTrigger 
                    className="bg-white/5 border-white/10 text-white/85 hover:bg-white/10"
                    data-testid="select-date-range"
                  >
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d24] border-white/10">
                    <SelectItem value="all" className="text-white/85 focus:bg-white/10 focus:text-white">All Time</SelectItem>
                    <SelectItem value="today" className="text-white/85 focus:bg-white/10 focus:text-white">Today</SelectItem>
                    <SelectItem value="week" className="text-white/85 focus:bg-white/10 focus:text-white">Last 7 Days</SelectItem>
                    <SelectItem value="month" className="text-white/85 focus:bg-white/10 focus:text-white">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Appointments Table */}
        <GlassCard>
          <GlassCardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="text-left p-4 font-medium text-white/55 text-sm">Name</th>
                    <th className="text-left p-4 font-medium text-white/55 text-sm">Type</th>
                    <th className="text-left p-4 font-medium text-white/55 text-sm">Contact</th>
                    <th className="text-left p-4 font-medium text-white/55 text-sm">Preferred Time</th>
                    <th className="text-left p-4 font-medium text-white/55 text-sm">Status</th>
                    <th className="text-left p-4 font-medium text-white/55 text-sm">Created</th>
                    <th className="text-left p-4 font-medium text-white/55 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={7} className="text-center p-8">
                        <div className="flex items-center justify-center gap-3 text-white/55">
                          <Sparkles className="h-5 w-5 animate-pulse text-cyan-400" />
                          <span>Loading appointments...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!isLoading && data?.appointments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-white/40">
                        No appointments found
                      </td>
                    </tr>
                  )}
                  {data?.appointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition-colors"
                      onClick={() => handleOpenDetail(appointment)}
                      data-testid={`row-appointment-${appointment.id}`}
                    >
                      <td className="p-4">
                        <span className="font-medium text-white/85">{appointment.name}</span>
                      </td>
                      <td className="p-4">
                        <span className="capitalize text-sm text-white/70">
                          {appointment.appointmentType.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {appointment.contact && (
                            <a
                              href={`tel:${appointment.contact}`}
                              className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`link-phone-${appointment.id}`}
                            >
                              <Phone className="h-3 w-3" />
                              {appointment.contact}
                            </a>
                          )}
                          {appointment.email && (
                            <a
                              href={`mailto:${appointment.email}`}
                              className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`link-email-${appointment.id}`}
                            >
                              <Mail className="h-3 w-3" />
                              {appointment.email}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-white/70">{appointment.preferredTime}</td>
                      <td className="p-4">
                        <StatusBadge 
                          status={appointment.status}
                          data-testid={`badge-status-${appointment.status}`}
                        />
                      </td>
                      <td className="p-4 text-sm text-white/55">
                        {format(new Date(appointment.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(appointment);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                          data-testid={`button-view-${appointment.id}`}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-white/10">
                <div className="text-sm text-white/55">
                  Showing {currentPage * pageSize + 1} to{" "}
                  {Math.min((currentPage + 1) * pageSize, data?.total || 0)} of {data?.total} appointments
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex items-center px-3 text-sm text-white/70">
                    Page {currentPage + 1} of {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Appointment Detail Drawer */}
      <DrawerPanel
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        title="Appointment Details"
        subtitle="View and update appointment information"
        data-testid="drawer-appointment-detail"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            {/* Overview Section */}
            <DrawerSection title="Overview">
              <DrawerField label="Name" value={selectedAppointment.name} />
              <DrawerField 
                label="Type" 
                value={
                  <span className="capitalize">
                    {selectedAppointment.appointmentType.replace(/_/g, " ")}
                  </span>
                } 
              />
              <DrawerField 
                label="Status" 
                value={<StatusBadge status={selectedAppointment.status} />} 
              />
              <DrawerField 
                label="Created" 
                value={format(new Date(selectedAppointment.createdAt), "MMM d, yyyy 'at' h:mm a")} 
              />
            </DrawerSection>

            {/* Contact Section */}
            <DrawerSection title="Contact Information">
              <DrawerField 
                label="Phone" 
                value={
                  selectedAppointment.contact && (
                    <a 
                      href={`tel:${selectedAppointment.contact}`}
                      className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                      data-testid="link-phone-detail"
                    >
                      <Phone className="h-4 w-4" />
                      {selectedAppointment.contact}
                    </a>
                  )
                } 
              />
              {selectedAppointment.email && (
                <DrawerField 
                  label="Email" 
                  value={
                    <a 
                      href={`mailto:${selectedAppointment.email}`}
                      className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                      data-testid="link-email-detail"
                    >
                      <Mail className="h-4 w-4" />
                      {selectedAppointment.email}
                    </a>
                  } 
                />
              )}
              <DrawerField label="Preferred Time" value={selectedAppointment.preferredTime} />
              <DrawerField 
                label="Contact Preference" 
                value={<span className="capitalize">{selectedAppointment.contactPreference}</span>} 
              />
            </DrawerSection>

            {/* Pre-Intake Section */}
            {(selectedAppointment.lookingFor || selectedAppointment.sobrietyStatus || 
              selectedAppointment.hasSupport || selectedAppointment.timeline) && (
              <DrawerSection title="Pre-Intake Information">
                {selectedAppointment.lookingFor && (
                  <DrawerField 
                    label="Looking for" 
                    value={<span className="capitalize">{selectedAppointment.lookingFor}</span>} 
                  />
                )}
                {selectedAppointment.sobrietyStatus && (
                  <DrawerField label="Sobriety Status" value={selectedAppointment.sobrietyStatus} />
                )}
                {selectedAppointment.hasSupport && (
                  <DrawerField label="Financial Support" value={selectedAppointment.hasSupport} />
                )}
                {selectedAppointment.timeline && (
                  <DrawerField label="Timeline" value={selectedAppointment.timeline} />
                )}
              </DrawerSection>
            )}

            {/* AI Summary Section */}
            {selectedAppointment.conversationSummary && (
              <DrawerSection title="Conversation Summary">
                <p className="text-sm text-white/85 whitespace-pre-wrap leading-relaxed">
                  {selectedAppointment.conversationSummary}
                </p>
              </DrawerSection>
            )}

            {/* Status Update */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-white/55 uppercase tracking-wider">
                Update Status
              </label>
              <Select value={editedStatus} onValueChange={setEditedStatus}>
                <SelectTrigger 
                  className="bg-white/5 border-white/10 text-white/85 hover:bg-white/10"
                  data-testid="select-status-edit"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d24] border-white/10">
                  <SelectItem value="new" className="text-white/85 focus:bg-white/10 focus:text-white">New</SelectItem>
                  <SelectItem value="contacted" className="text-white/85 focus:bg-white/10 focus:text-white">Contacted</SelectItem>
                  <SelectItem value="scheduled" className="text-white/85 focus:bg-white/10 focus:text-white">Scheduled</SelectItem>
                  <SelectItem value="completed" className="text-white/85 focus:bg-white/10 focus:text-white">Completed</SelectItem>
                  <SelectItem value="cancelled" className="text-white/85 focus:bg-white/10 focus:text-white">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-white/55 uppercase tracking-wider">
                Internal Notes
              </label>
              <textarea
                placeholder="Add notes about this appointment..."
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl glass-input resize-none"
                data-testid="textarea-notes"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button
                onClick={handleSaveChanges}
                disabled={updateMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                data-testid="button-save-changes"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                data-testid="button-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </DrawerPanel>
    </AdminLayout>
  );
}
