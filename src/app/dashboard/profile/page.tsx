
import SafeProfileClient from "@/components/profile/SafeProfileClient";
import { Suspense } from "react";

export default function ProfilePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SafeProfileClient />
        </Suspense>
    );
}
