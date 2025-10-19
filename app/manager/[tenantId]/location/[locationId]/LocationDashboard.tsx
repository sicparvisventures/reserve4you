'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Settings,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Store,
  Table as TableIcon,
  Eye,
  EyeOff,
  Edit,
  MoreVertical,
} from 'lucide-react';
import Link from 'next/link';

interface LocationDashboardProps {
  tenant: any;
  role: string;
  location: any;
  tables: any[];
  shifts: any[];
  bookings: any[];
  billing: any;
  monthlyBookings: number;
}

export function LocationDashboard({
  tenant,
  role,
  location,
  tables,
  shifts,
  bookings,
  billing,
  monthlyBookings,
}: LocationDashboardProps) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'bookings' | 'tables' | 'shifts'>('bookings');

  const upcomingBookings = bookings.filter(b => new Date(b.start_ts) > new Date());
  const todayBookings = bookings.filter(b => {
    const bookingDate = new Date(b.start_ts);
    const today = new Date();
    return bookingDate.toDateString() === today.toDateString();
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'default';
      case 'CANCELLED':
        return 'destructive';
      case 'PENDING':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <div className="border-b bg-card sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Back Button & Location Info */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/manager/${tenant.id}/dashboard`)}
                className="rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Terug
              </Button>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                  style={{ backgroundColor: tenant.brand_color || '#FF5A5F' }}
                >
                  {location.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">{location.name}</h1>
                  <p className="text-xs text-muted-foreground">
                    {tenant.name} • {billing?.plan || 'No Plan'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="rounded-xl"
              >
                <Link href={`/p/${location.slug}`} target="_blank">
                  <Eye className="h-4 w-4 mr-2" />
                  Bekijk live
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="rounded-xl"
              >
                <Link href={`/manager/${tenant.id}/settings?locationId=${location.id}`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Instellingen
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Today's Bookings */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Vandaag</p>
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{todayBookings.length}</p>
            <p className="text-xs text-muted-foreground mt-1">reserveringen</p>
          </Card>

          {/* Upcoming Bookings */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Aankomend</p>
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{upcomingBookings.length}</p>
            <p className="text-xs text-muted-foreground mt-1">reserveringen</p>
          </Card>

          {/* Tables */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Tafels</p>
              <TableIcon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{tables.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {tables.filter(t => t.is_active).length} actief
            </p>
          </Card>

          {/* Monthly Stats */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Deze maand</p>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{monthlyBookings}</p>
            <p className="text-xs text-muted-foreground mt-1">reserveringen</p>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedTab('bookings')}
              className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'bookings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="h-4 w-4 inline mr-2" />
              Reserveringen ({upcomingBookings.length})
            </button>
            <button
              onClick={() => setSelectedTab('tables')}
              className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'tables'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <TableIcon className="h-4 w-4 inline mr-2" />
              Tafels ({tables.length})
            </button>
            <button
              onClick={() => setSelectedTab('shifts')}
              className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'shifts'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clock className="h-4 w-4 inline mr-2" />
              Diensten ({shifts.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {selectedTab === 'bookings' && (
          <div className="space-y-3">
            {upcomingBookings.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Geen aankomende reserveringen</h3>
                <p className="text-muted-foreground">
                  Nieuwe reserveringen verschijnen hier automatisch
                </p>
              </Card>
            ) : (
              upcomingBookings.map((booking) => (
                <Card key={booking.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <span className="text-sm text-muted-foreground">
                          {new Date(booking.start_ts).toLocaleDateString('nl-NL', { weekday: 'short' }).toUpperCase()}
                        </span>
                        <span className="text-2xl font-bold">
                          {new Date(booking.start_ts).getDate()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(booking.start_ts).toLocaleDateString('nl-NL', { month: 'short' })}
                        </span>
                      </div>
                      <div className="h-12 w-px bg-border" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{booking.guest_name}</p>
                          <Badge variant={getStatusColor(booking.status) as any}>
                            {getStatusIcon(booking.status)}
                            <span className="ml-1">{booking.status}</span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(booking.start_ts).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {booking.party_size} personen
                          </span>
                          {booking.table && (
                            <span className="flex items-center gap-1">
                              <TableIcon className="h-3 w-3" />
                              {booking.table.name}
                            </span>
                          )}
                        </div>
                        {booking.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {booking.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {selectedTab === 'tables' && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map((table) => (
              <Card key={table.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{table.name}</p>
                  {table.is_active ? (
                    <Badge variant="default" className="text-xs">Actief</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Inactief</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {table.min_capacity}-{table.max_capacity} personen
                  </span>
                </div>
              </Card>
            ))}
            {tables.length === 0 && (
              <Card className="p-12 text-center col-span-full">
                <TableIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Geen tafels</h3>
                <p className="text-muted-foreground mb-4">
                  Voeg tafels toe in de instellingen
                </p>
                <Button variant="outline" asChild>
                  <Link href={`/manager/${tenant.id}/settings?locationId=${location.id}`}>
                    Tafels toevoegen
                  </Link>
                </Button>
              </Card>
            )}
          </div>
        )}

        {selectedTab === 'shifts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shifts.map((shift) => (
              <Card key={shift.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">
                    {['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'][shift.day_of_week]}
                  </p>
                  {shift.is_active ? (
                    <Badge variant="default" className="text-xs">Actief</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Inactief</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {shift.start_time} - {shift.end_time}
                </p>
              </Card>
            ))}
            {shifts.length === 0 && (
              <Card className="p-12 text-center col-span-full">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Geen diensten</h3>
                <p className="text-muted-foreground mb-4">
                  Voeg openingstijden toe in de instellingen
                </p>
                <Button variant="outline" asChild>
                  <Link href={`/manager/${tenant.id}/settings?locationId=${location.id}`}>
                    Diensten toevoegen
                  </Link>
                </Button>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

