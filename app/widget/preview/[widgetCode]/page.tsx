/**
 * Widget Preview Page
 * 
 * Shows a live preview of the widget
 */

import { PreviewClient } from './PreviewClient';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

interface PreviewPageProps {
  params: Promise<{
    widgetCode: string;
  }>;
}

export default async function WidgetPreviewPage({ params }: PreviewPageProps) {
  const { widgetCode } = await params;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Widget Preview
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Live preview van je widget configuratie
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {widgetCode}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card border rounded-lg p-8">
          <PreviewClient widgetCode={widgetCode} />
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Wijzigingen worden direct zichtbaar na opslaan in de widget configuratie</p>
        </div>
      </div>
    </div>
  );
}

