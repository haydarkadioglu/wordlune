
import type { WordCategory } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CategoryLabelProps {
  category: WordCategory;
}

export default function CategoryLabel({ category }: CategoryLabelProps) {
  const categoryStyles: Record<WordCategory, string> = {
    'Very Good': 'bg-green-500 hover:bg-green-600 text-white',
    'Good': 'bg-sky-500 hover:bg-sky-600 text-white',
    'Bad': 'bg-red-500 hover:bg-red-600 text-white',
    'Repeat': 'bg-orange-500 hover:bg-orange-600 text-white',
    'Uncategorized': 'bg-gray-400 hover:bg-gray-500 text-white',
  };

  return (
    <Badge className={cn("px-2.5 py-1 text-xs font-semibold rounded-full", categoryStyles[category] || categoryStyles['Uncategorized'])}>
      {category}
    </Badge>
  );
}
