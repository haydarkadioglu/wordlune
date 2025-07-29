
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { isAdmin as checkIsAdmin } from '@/lib/admin-service';
import { Loader2, ShieldX, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminClient from './AdminClient';
import ModerationClient from './ModerationClient';

export default function AdminTabs() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.replace('/admin/login');
            } else {
                checkIsAdmin(user).then(adminStatus => {
                    setIsAdmin(adminStatus);
                    setLoading(false);
                });
            }
        }
    }, [user, authLoading, router]);

    if (loading || authLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex flex-col justify-center items-center h-screen text-center">
                <ShieldX className="h-24 w-24 text-destructive mb-4" />
                <h1 className="text-4xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground mt-2">You do not have permission to view this page.</p>
                <Button onClick={() => router.push('/dashboard')} className="mt-6">Go to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <ShieldCheck className="h-10 w-10 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Admin Panel</h1>
                    <p className="text-muted-foreground">Manage application content and moderate users.</p>
                </div>
            </div>
            <Tabs defaultValue="story-management" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="story-management">Story Management</TabsTrigger>
                    <TabsTrigger value="user-moderation">User Moderation</TabsTrigger>
                </TabsList>
                <TabsContent value="story-management" className="mt-6">
                    <AdminClient />
                </TabsContent>
                <TabsContent value="user-moderation" className="mt-6">
                    <ModerationClient />
                </TabsContent>
            </Tabs>
        </div>
    );
}
