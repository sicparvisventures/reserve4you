'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  UtensilsCrossed, 
  Scissors, 
  Stethoscope, 
  Dumbbell,
  Scale,
  GraduationCap,
  Car,
  Home,
  Sparkles
} from 'lucide-react';

const BUSINESS_CATEGORIES = [
  {
    id: 'horeca',
    name: 'Horeca',
    description: 'Restaurants, cafés en bars',
    icon: UtensilsCrossed,
    sectors: ['RESTAURANT', 'CAFE', 'BAR'],
    href: '/discover?category=horeca',
    gradient: 'from-primary/10 to-primary/5',
  },
  {
    id: 'beauty',
    name: 'Beauty & Wellness',
    description: 'Kapsalons, schoonheidssalons en spa',
    icon: Scissors,
    sectors: ['HAIR_SALON', 'BEAUTY_SALON', 'NAIL_STUDIO', 'SPA', 'MASSAGE_THERAPY', 'TANNING_SALON'],
    href: '/discover?category=beauty',
    gradient: 'from-primary/10 to-primary/5',
  },
  {
    id: 'health',
    name: 'Gezondheidszorg',
    description: 'Artsen, tandartsen en therapeuten',
    icon: Stethoscope,
    sectors: ['MEDICAL_PRACTICE', 'DENTIST', 'PHYSIOTHERAPY', 'PSYCHOLOGY', 'VETERINARY'],
    href: '/discover?category=health',
    gradient: 'from-primary/10 to-primary/5',
  },
  {
    id: 'fitness',
    name: 'Fitness & Sport',
    description: 'Sportscholen, yoga en personal training',
    icon: Dumbbell,
    sectors: ['GYM', 'YOGA_STUDIO', 'PERSONAL_TRAINING', 'DANCE_STUDIO', 'MARTIAL_ARTS'],
    href: '/discover?category=fitness',
    gradient: 'from-primary/10 to-primary/5',
  },
  {
    id: 'professional',
    name: 'Professionele Diensten',
    description: 'Advocaten, accountants en consultants',
    icon: Scale,
    sectors: ['LEGAL', 'ACCOUNTING', 'CONSULTING', 'FINANCIAL_ADVISORY'],
    href: '/discover?category=professional',
    gradient: 'from-primary/10 to-primary/5',
  },
  {
    id: 'education',
    name: 'Educatie',
    description: 'Bijles, muziek en rijlessen',
    icon: GraduationCap,
    sectors: ['TUTORING', 'MUSIC_LESSONS', 'LANGUAGE_SCHOOL', 'DRIVING_SCHOOL'],
    href: '/discover?category=education',
    gradient: 'from-primary/10 to-primary/5',
  },
  {
    id: 'automotive',
    name: 'Auto & Voertuigen',
    description: 'Garages, wasstraten en verhuur',
    icon: Car,
    sectors: ['CAR_REPAIR', 'CAR_WASH', 'CAR_RENTAL'],
    href: '/discover?category=automotive',
    gradient: 'from-primary/10 to-primary/5',
  },
  {
    id: 'home',
    name: 'Thuisdiensten',
    description: 'Schoonmaak, loodgieters en elektriciens',
    icon: Home,
    sectors: ['CLEANING', 'PLUMBING', 'ELECTRICIAN', 'GARDENING'],
    href: '/discover?category=home',
    gradient: 'from-primary/10 to-primary/5',
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    description: 'Hotels, foto studios en evenementen',
    icon: Sparkles,
    sectors: ['EVENT_VENUE', 'PHOTO_STUDIO', 'ESCAPE_ROOM', 'BOWLING', 'HOTEL', 'VACATION_RENTAL', 'COWORKING_SPACE', 'MEETING_ROOM'],
    href: '/discover?category=entertainment',
    gradient: 'from-primary/10 to-primary/5',
  },
];

interface BusinessCategoriesSectionProps {
  className?: string;
}

export function BusinessCategoriesSection({ className }: BusinessCategoriesSectionProps) {
  return (
    <section className={className}>
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
            Ontdek alle categorieën
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
            Reserveer bij professionele bedrijven in heel België
          </p>
        </div>
        <Link href="/discover" className="hidden md:block">
          <Button variant="ghost">
            Alles bekijken →
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {BUSINESS_CATEGORIES.map((category) => {
          const Icon = category.icon;
          
          return (
            <Link
              key={category.id}
              href={category.href}
              className="group"
            >
              <div className={`
                relative overflow-hidden rounded-2xl border-2 border-border
                bg-gradient-to-br ${category.gradient}
                hover:border-primary hover:shadow-lg
                transition-all duration-300 p-5 sm:p-6
                h-full min-h-[160px] sm:min-h-[180px]
              `}>
                {/* Icon */}
                <div className="
                  w-12 h-12 sm:w-14 sm:h-14 rounded-xl 
                  bg-background/80 backdrop-blur-sm
                  flex items-center justify-center mb-3 sm:mb-4
                  group-hover:scale-110 transition-transform duration-300
                ">
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
                  {category.description}
                </p>

                {/* CTA */}
                <div className="flex items-center text-xs sm:text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform">
                  Ontdek meer
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Mobile "View All" Button */}
      <div className="mt-8 flex justify-center md:hidden">
        <Link href="/discover">
          <Button variant="outline" size="lg" className="rounded-xl">
            Bekijk alle categorieën
          </Button>
        </Link>
      </div>
    </section>
  );
}

