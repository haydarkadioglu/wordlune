
"use client";
import { useSettings, SUPPORTED_LANGUAGES } from '@/hooks/useSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Cog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsForm() {
  const { sourceLanguage, targetLanguage, setSourceLanguage, setTargetLanguage } = useSettings();
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your language preferences have been updated.',
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

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Cog className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="font-headline text-2xl text-primary">Language Settings</CardTitle>
            <CardDescription>Choose the languages for learning and translation.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <div className="space-y-2">
          <Label htmlFor="source-language" className="font-semibold">Language I'm Learning</Label>
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
          <p className="text-xs text-muted-foreground">This is the language of the words you are adding.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="target-language" className="font-semibold">My Native Language</Label>
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
          <p className="text-xs text-muted-foreground">Words will be translated into this language.</p>
        </div>
      </CardContent>
    </Card>
  );
}
