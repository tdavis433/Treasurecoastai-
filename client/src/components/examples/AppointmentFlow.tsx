import AppointmentFlow from '../AppointmentFlow';

export default function AppointmentFlowExample() {
  return (
    <div className="p-8 max-w-md mx-auto">
      <AppointmentFlow
        onComplete={(data) => console.log('Appointment submitted:', data)}
        onCancel={() => console.log('Appointment cancelled')}
        language="en"
      />
    </div>
  );
}
