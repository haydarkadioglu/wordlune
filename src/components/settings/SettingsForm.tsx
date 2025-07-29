
"use client";
import { useSettings, SUPPORTED_LANGUAGES, SUPPORTED_UI_LANGUAGES } from '@/hooks/useSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Languages as LanguageIcon, BookOpenCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PasswordChangeForm from './PasswordChangeForm'; 
import UsernameChangeForm from './UsernameChangeForm';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';
import type { UserList } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { getLists } from '@/lib/list-service';

export default function SettingsForm() {
  const { 
    sourceLanguage, targetLanguage, setSourceLanguage, setTargetLanguage, 
    uiLanguage, setUiLanguage, storyListId, setStoryListId
  } = useSettings();
  const { toast } = useToast();
  const { user } = useAuth();
  const [lists, setLists] = useState<UserList[]>([]);
  
  const t = uiLanguage === 'en' ? {
    settingsSaved: 'Settings Saved',
    preferencesUpdated: 'Your preferences have been updated.',
    languageSettings: 'Language Settings',
    chooseLanguages: 'Choose the languages for learning and translation.',
    interfaceLanguage: 'Interface Language',
    selectInterfaceLanguage: 'This is the language of the application UI.',
    learningLanguage: "Language I'm Learning",
    selectLearningLanguage: 'This is the language of the words you are adding.',
    nativeLanguage: 'My Native Language',
    selectNativeLanguage: 'Words will be translated into this language.',
    storySettings: 'Story Settings',
    storyList: 'Story Words List',
    storyListDescription: 'Choose which list to save words to when reading stories.',
    selectList: 'Select a list',
  } : {
    settingsSaved: 'Ayarlar Kaydedildi',
    preferencesUpdated: 'Tercihleriniz güncellendi.',
    languageSettings: 'Dil Ayarları',
    chooseLanguages: 'Öğrenme ve çeviri için dilleri seçin.',
    interfaceLanguage: 'Arayüz Dili',
    selectInterfaceLanguage: 'Bu, uygulamanın kullanıcı arayüzü dilidir.',
    learningLanguage: "Öğrendiğim Dil",
    selectLearningLanguage: 'Bu, eklediğiniz kelimelerin dilidir.',
    nativeLanguage: 'Ana Dilim',
    selectNativeLanguage: 'Kelimeler bu dile çevrilecektir.',
    storySettings: 'Hikaye Ayarları',
    storyList: 'Hikaye Kelimeleri Listesi',
    storyListDescription: 'Hikayeleri okurken kelimeleri hangi listeye kaydedeceğinizi seçin.',
    selectList: 'Bir liste seçin',
  };

  useEffect(() => {
    if (user && sourceLanguage) {
      const unsubscribe = getLists(user.uid, sourceLanguage, setLists);
      return () => unsubscribe();
    }
  }, [user, sourceLanguage]);

  const handleSave = () => {
    toast({
      title: t.settingsSaved,
      description: t.preferencesUpdated,
    });
  };

  const handleSourceChange = (value: string) => {
    setSourceLanguage(value);
    handleSave();
  };
  
  const handleTargetChange = (value: string) => {
    setTargetLanguage(value);
    handleSave();
  };

  const handleUiLanguageChange = (value: string) => {
    setUiLanguage(value);
  };
  
  const handleStoryListChange = (value: string) => {
    setStoryListId(value);
    handleSave();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <UsernameChangeForm />

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <LanguageIcon className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="font-headline text-2xl text-primary">{t.languageSettings}</CardTitle>
              <CardDescription>{t.chooseLanguages}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          
          <div className="space-y-2">
            <Label htmlFor="ui-language" className="font-semibold">{t.interfaceLanguage}</Label>
            <Select value={uiLanguage} onValueChange={handleUiLanguageChange}>
              <SelectTrigger id="ui-language" className="w-full">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_UI_LANGUAGES.map(lang => (
                  <SelectItem key={`ui-${lang.code}`} value={lang.code}>{lang.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t.selectInterfaceLanguage}</p>
          </div>
          
          <Separator />

          <div className="space-y-2">
            <Label htmlFor="source-language" className="font-semibold">{t.learningLanguage}</Label>
            <Select value={sourceLanguage} onValueChange={handleSourceChange}>
              <SelectTrigger id="source-language" className="w-full">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map(lang => (
                  <SelectItem key={`source-${lang}`} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t.selectLearningLanguage}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="target-language" className="font-semibold">{t.nativeLanguage}</Label>
            <Select value={targetLanguage} onValueChange={handleTargetChange}>
              <SelectTrigger id="target-language" className="w-full">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map(lang => (
                  <SelectItem key={`target-${lang}`} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t.selectNativeLanguage}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <BookOpenCheck className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="font-headline text-2xl text-primary">{t.storySettings}</CardTitle>
              <CardDescription>{t.storyListDescription}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="story-list" className="font-semibold">{t.storyList}</Label>
             <Select value={storyListId} onValueChange={handleStoryListChange} disabled={!user || lists.length === 0}>
              <SelectTrigger id="story-list" className="w-full">
                <SelectValue placeholder={t.selectList} />
              </SelectTrigger>
              <SelectContent>
                {lists.map(list => (
                  <SelectItem key={list.id} value={list.id}>{list.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>


      <PasswordChangeForm />
    </div>
  );
}
