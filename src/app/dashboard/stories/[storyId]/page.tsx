
import StoryReaderClient from "@/components/stories/StoryReaderClient";

interface StoryReaderPageProps {
    params: {
        storyId: string;
    };
}

export default function StoryReaderPage({ params }: StoryReaderPageProps) {
    return <StoryReaderClient storyId={params.storyId} />;
}
