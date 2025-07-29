
import StoryEditorClient from "@/components/stories/StoryEditorClient";
import { Suspense } from "react";

interface StoryEditorPageProps {
    params: {
        storyId: string;
    };
}

// Wrap in Suspense to handle search params for language
export default function StoryEditorPage({ params }: StoryEditorPageProps) {
    return (
        <Suspense>
            <StoryEditorClient storyId={params.storyId} />
        </Suspense>
    );
}
