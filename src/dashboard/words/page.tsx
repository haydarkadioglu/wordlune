
import AllWordsClient from '@/components/words/AllWordsClient';
import { Suspense } from 'react';

// Wrap the client component in Suspense to handle search parameters
export default function AllWordsPage() {
  return (
    <Suspense>
      <AllWordsClient />
    </Suspense>
  );
}
