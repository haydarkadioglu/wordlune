
import ListDetailClient from "@/components/lists/ListDetailClient";

interface ListDetailPageProps {
    params: {
        listId: string;
    };
}

// Generate static params for static export
export async function generateStaticParams() {
    // Return empty array for now - pages will be generated on-demand
    return [];
}

export default function ListDetailPage({ params }: ListDetailPageProps) {
    return <ListDetailClient listId={params.listId} />;
}
