
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cookie } from 'lucide-react';
import { initializeAnalytics } from '@/lib/firebase';
import { useSettings } from '@/hooks/useSettings';

const translations = {
    en: {
        title: "We Value Your Privacy",
        description: "We use cookies to enhance your experience and analyze our traffic. By clicking “Accept All”, you consent to our use of cookies for analytics purposes. This helps us understand how you use our app and improve it.",
        accept: "Accept All",
        decline: "Decline",
    },
    tr: {
        title: "Gizliliğinize Değer Veriyoruz",
        description: "Deneyiminizi geliştirmek ve trafiğimizi analiz etmek için çerezleri kullanıyoruz. “Tümünü Kabul Et”e tıklayarak, analiz amacıyla çerez kullanmamızı kabul etmiş olursunuz. Bu, uygulamamızı nasıl kullandığınızı anlamamıza ve geliştirmemize yardımcı olur.",
        accept: "Tümünü Kabul Et",
        decline: "Reddet",
    }
};

const COOKIE_CONSENT_KEY = 'wordlune_cookie_consent';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const { uiLanguage } = useSettings();
    const t = translations[uiLanguage as 'en' | 'tr' || 'tr'];

    useEffect(() => {
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (consent === null) {
            // No decision made yet
            setIsVisible(true);
        } else if (consent === 'granted') {
            // Consent already given
            initializeAnalytics();
        }
        // If 'denied', do nothing
    }, []);

    const handleConsent = (consent: 'granted' | 'denied') => {
        localStorage.setItem(COOKIE_CONSENT_KEY, consent);
        setIsVisible(false);
        if (consent === 'granted') {
            initializeAnalytics();
        }
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50">
             <Card className="max-w-xl mx-auto shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Cookie className="h-8 w-8 text-primary"/>
                        <div>
                            <CardTitle>{t.title}</CardTitle>
                            <CardDescription className="mt-1">{t.description}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex justify-end gap-4">
                    <Button variant="outline" onClick={() => handleConsent('denied')}>{t.decline}</Button>
                    <Button onClick={() => handleConsent('granted')}>{t.accept}</Button>
                </CardContent>
            </Card>
        </div>
    );
}
