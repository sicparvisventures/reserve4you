/**
 * Email Processor Hook - Reserve4You
 * Automatically processes pending emails in the background
 */

import { useEffect, useRef } from 'react';

export function useEmailProcessor() {
  const processingRef = useRef(false);

  useEffect(() => {
    const processEmails = async () => {
      // Prevent concurrent processing
      if (processingRef.current) return;
      
      processingRef.current = true;

      try {
        const response = await fetch('/api/email/process', {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.processed > 0) {
            console.log(`✅ Processed ${data.processed} pending emails`);
          }
        }
      } catch (error) {
        console.error('Error processing emails:', error);
      } finally {
        processingRef.current = false;
      }
    };

    // Process immediately on mount
    processEmails();

    // Then process every 30 seconds
    const interval = setInterval(processEmails, 30000);

    return () => clearInterval(interval);
  }, []);
}

