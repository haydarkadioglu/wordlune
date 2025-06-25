
import ListDetailClient from "@/components/lists/ListDetailClient";

interface ListDetailPageProps {
    params: {
        listId: string;
    };
}

export default function ListDetailPage({ params }: ListDetailPageProps) {
    return <ListDetailClient listId={params.listId} />;
}
