'use client';

/**
 * Calendar Settings - Reserve4You
 * 
 * Main calendar settings page combining Calendar, Timeline,
 * and Floor Plan views
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, LayoutGrid, BarChart3 } from 'lucide-react';
import { CalendarView } from './CalendarView';
import { TimelineView } from './TimelineView';

interface CalendarSettingsProps {
  locationId: string;
  tenantId: string;
}

export function CalendarSettings({ locationId, tenantId }: CalendarSettingsProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Calendar & Planning</h2>
        <p className="text-muted-foreground">
          Beheer je reserveringen met drag & drop calendar, timeline view en plattegrond integratie
        </p>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <CalendarView locationId={locationId} tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <TimelineView locationId={locationId} date={selectedDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

