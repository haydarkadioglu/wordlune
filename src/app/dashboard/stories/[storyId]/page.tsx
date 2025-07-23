
import StoryReaderClient from "@/components/stories/StoryReaderClient";

interface StoryReaderPageProps {
    params: {
        storyId: string;
    };
}

// Generate static params for static export
export async function generateStaticParams() {
    // Return empty array for now - pages will be generated on-demand
    return [];
}

export default function StoryReaderPage({ params }: StoryReaderPageProps) {
    return <StoryReaderClient storyId={params.storyId} />;
}
