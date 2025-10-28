/**
 * DYNAMIC DASHBOARD - COMPLETE MANAGER PORTAL EXAMPLE
 * 
 * Shows how to build a dashboard that adapts to any business sector
 * This demonstrates:
 * - Page titles
 * - Stats cards
 * - Table headers
 * - Empty states
 * - Navigation items
 */

'use client';

import { useTerminology } from '@/lib/hooks/useTerminology';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, Users, MapPin, TrendingUp } from 'lucide-react';

interface DashboardProps {
  locationName: string;
  stats: {
    todayBookings: number;
    todayCustomers: number;
    activeResources: number;
    revenue: number;
  };
  recentBookings: Array<{
    id: string;
    customer_name: string;
    time: string;
    resource_name: string;
  }>;
}

export function DynamicDashboard({
  locationName,
  stats,
  recentBookings,
}: DashboardProps) {
  const t = useTerminology();

  return (
    <div className="space-y-6">
      {/* Dynamic Page Title */}
      <div>
        <h1 className="text-3xl font-bold">
          {/* RESTAURANT: "Restaurant Dashboard" */}
          {/* HAIR_SALON: "Kapsalon Dashboard" */}
          {/* MEDICAL_PRACTICE: "Praktijk Dashboard" */}
          {t.location.singular} Dashboard
        </h1>
        <p className="text-gray-600">{locationName}</p>
      </div>

      {/* Dynamic Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bookings Today */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {/* DYNAMIC: "Reserveringen" / "Afspraken" / "Sessies" */}
                {t.booking.plural} Vandaag
              </p>
              <p className="text-3xl font-bold mt-1">{stats.todayBookings}</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-500" />
          </div>
        </Card>

        {/* Customers Today */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {/* DYNAMIC: "Gasten" / "Klanten" / "Patiënten" */}
                {t.customer.plural} Vandaag
              </p>
              <p className="text-3xl font-bold mt-1">{stats.todayCustomers}</p>
            </div>
            <Users className="w-10 h-10 text-green-500" />
          </div>
        </Card>

        {/* Active Resources */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {/* DYNAMIC: "Tafels" / "Behandelkamers" / "Spreekkamers" */}
                Actieve {t.resource.plural}
              </p>
              <p className="text-3xl font-bold mt-1">{stats.activeResources}</p>
            </div>
            <MapPin className="w-10 h-10 text-purple-500" />
          </div>
        </Card>

        {/* Revenue */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Omzet Vandaag</p>
              <p className="text-3xl font-bold mt-1">
                €{(stats.revenue / 100).toFixed(2)}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Recent Bookings Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {/* DYNAMIC: "Recente Reserveringen" / "Recente Afspraken" */}
            Recente {t.booking.plural}
          </h2>
          <Button size="sm">
            {/* DYNAMIC: "Alle Reserveringen" / "Alle Afspraken" */}
            Alle {t.booking.plural}
          </Button>
        </div>

        {recentBookings.length === 0 ? (
          // Dynamic Empty State
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">
              {/* DYNAMIC: "Geen reserveringen" / "Geen afspraken" */}
              Geen {t.booking.plural.toLowerCase()} vandaag
            </p>
            <p className="text-sm">
              {/* DYNAMIC: "Nieuwe reserveringen" / "Nieuwe afspraken" */}
              Nieuwe {t.booking.plural.toLowerCase()} verschijnen hier automatisch
            </p>
            <Button className="mt-4">
              {/* DYNAMIC: "Reservering Toevoegen" / "Afspraak Toevoegen" */}
              {t.booking.singular} Toevoegen
            </Button>
          </div>
        ) : (
          <Table>
            {/* Dynamic Table Headers */}
            <TableHeader>
              <TableRow>
                <TableHead>Tijd</TableHead>
                <TableHead>
                  {/* DYNAMIC: "Gast" / "Klant" / "Patiënt" */}
                  {t.customer.singular}
                </TableHead>
                <TableHead>
                  {/* DYNAMIC: "Tafel" / "Behandelkamer" / "Spreekkamer" */}
                  {t.resource.singular}
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.time}</TableCell>
                  <TableCell className="font-medium">
                    {booking.customer_name}
                  </TableCell>
                  <TableCell>{booking.resource_name}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                      Bevestigd
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Snelle Acties</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button variant="outline" className="w-full">
            {/* DYNAMIC: "Nieuwe Reservering" / "Nieuwe Afspraak" */}
            Nieuwe {t.booking.singular}
          </Button>
          <Button variant="outline" className="w-full">
            {/* DYNAMIC: "Tafels Beheren" / "Behandelkamers Beheren" */}
            {t.resource.plural} Beheren
          </Button>
          <Button variant="outline" className="w-full">
            {/* DYNAMIC: "Gasten Overzicht" / "Klanten Overzicht" */}
            {t.customer.plural} Overzicht
          </Button>
        </div>
      </Card>
    </div>
  );
}

/**
 * USAGE IN PAGE:
 * 
 * ```tsx
 * // app/manager/[tenantId]/location/[locationId]/page.tsx
 * 
 * import { BusinessSectorProvider } from '@/lib/contexts/business-sector-context';
 * import { DynamicDashboard } from '@/components/examples/DynamicDashboard';
 * 
 * export default async function LocationDashboardPage({ params }) {
 *   const location = await getLocation(params.locationId);
 *   const stats = await getLocationStats(params.locationId);
 *   const bookings = await getRecentBookings(params.locationId);
 *   
 *   return (
 *     <BusinessSectorProvider sector={location.business_sector}>
 *       <DynamicDashboard
 *         locationName={location.name}
 *         stats={stats}
 *         recentBookings={bookings}
 *       />
 *     </BusinessSectorProvider>
 *   );
 * }
 * ```
 * 
 * RESULTS BY SECTOR:
 * 
 * RESTAURANT:
 * - "Restaurant Dashboard"
 * - "Reserveringen Vandaag: 12"
 * - "Gasten Vandaag: 45"
 * - "Actieve Tafels: 8"
 * - Table headers: "Tijd | Gast | Tafel | Status"
 * 
 * HAIR_SALON:
 * - "Kapsalon Dashboard"
 * - "Afspraken Vandaag: 18"
 * - "Klanten Vandaag: 18"
 * - "Actieve Stoelen: 5"
 * - Table headers: "Tijd | Klant | Stoel | Status"
 * 
 * MEDICAL_PRACTICE:
 * - "Praktijk Dashboard"
 * - "Afspraken Vandaag: 32"
 * - "Patiënten Vandaag: 32"
 * - "Actieve Spreekkamers: 6"
 * - Table headers: "Tijd | Patiënt | Spreekkamer | Status"
 * 
 * GYM:
 * - "Sportschool Dashboard"
 * - "Sessies Vandaag: 24"
 * - "Leden Vandaag: 68"
 * - "Actieve Ruimtes: 4"
 * - Table headers: "Tijd | Lid | Ruimte | Status"
 */

