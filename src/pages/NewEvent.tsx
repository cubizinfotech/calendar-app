
import React from 'react';
import EventFormContainer from "@/components/event-form/EventForm";
import AppLayout from "@/components/layout/AppLayout";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from 'sonner';

const NewEvent = () => {
  return (
    <AppLayout>
      <EventFormContainer />
      <Toaster />
      <SonnerToaster position="top-right" richColors closeButton />
    </AppLayout>
  );
};

export default NewEvent;
