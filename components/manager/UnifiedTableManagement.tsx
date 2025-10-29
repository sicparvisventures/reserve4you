'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid3x3, Table as TableIcon } from 'lucide-react';
import { FloorPlanEditor } from '@/components/floor-plan/FloorPlanEditor';
import { EnhancedTablesManager } from '@/components/manager/EnhancedTablesManager';

interface UnifiedTableManagementProps {
  locationId: string;
  locationName: string;
}

export function UnifiedTableManagement({ locationId, locationName }: UnifiedTableManagementProps) {
  const [activeSubTab, setActiveSubTab] = useState<string>('list');

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground mb-1">Tafelbeheer</h2>
        <p className="text-sm text-muted-foreground">
          Beheer tafels en configureer de plattegrond voor {locationName}
        </p>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="list" className="gap-2">
            <TableIcon className="h-4 w-4" />
            Tafellijst
          </TabsTrigger>
          <TabsTrigger value="floorplan" className="gap-2">
            <Grid3x3 className="h-4 w-4" />
            Plattegrond
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6 mt-6">
          <EnhancedTablesManager
            locationId={locationId}
            locationName={locationName}
          />
        </TabsContent>

        <TabsContent value="floorplan" className="space-y-6 mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground mb-1">Plattegrond Editor</h3>
            <p className="text-sm text-muted-foreground">
              Sleep tafels naar de gewenste positie op de plattegrond
            </p>
          </div>
          <FloorPlanEditor
            locationId={locationId}
            locationName={locationName}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
}

