'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@stackframe/stack';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Building2, Target, Users, MessageSquare, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';

interface OrganizationSettings {
  organizationName: string;
  industry: string;
  description: string;
  targetAudience: string;
  onboardingGoal: string;
  tone: string;
  maxQuestions: number;
  customInstructions: string;
}

export default function SettingsPage() {
  const user = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState<OrganizationSettings>({
    organizationName: '',
    industry: '',
    description: '',
    targetAudience: '',
    onboardingGoal: '',
    tone: 'Professional & Friendly',
    maxQuestions: 10,
    customInstructions: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/handler/sign-in');
      return;
    }

    const loadSettings = async () => {
      try {
        const response = await fetch(`/api/settings?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user, router]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...settings,
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">Organization Settings</h1>
          <p className="text-muted-foreground">
            Configure your organization details for AI-powered client intelligence
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Organization Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <CardTitle>Organization Details</CardTitle>
            </div>
            <CardDescription>
              Basic information about your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="organizationName">Organization Name *</Label>
              <Input
                id="organizationName"
                placeholder="e.g., Acme Marketing Agency"
                value={settings.organizationName}
                onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="e.g., Digital Marketing, SaaS, E-commerce"
                value={settings.industry}
                onChange={(e) => setSettings({ ...settings, industry: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what your organization does..."
                rows={3}
                value={settings.description}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This helps the AI understand your business context
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Target Audience */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle>Target Audience</CardTitle>
            </div>
            <CardDescription>
              Define who your ideal clients are
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="targetAudience">Ideal Client Profile</Label>
              <Input
                id="targetAudience"
                placeholder="e.g., E-commerce brands with $50k+ monthly revenue"
                value={settings.targetAudience}
                onChange={(e) => setSettings({ ...settings, targetAudience: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Helps AI personalize questions for your target market
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Onboarding Goals */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <CardTitle>Onboarding Goals</CardTitle>
            </div>
            <CardDescription>
              What information do you need from clients?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="onboardingGoal">Information to Gather</Label>
              <Textarea
                id="onboardingGoal"
                placeholder="e.g., Current revenue, marketing budget, pain points, tech stack"
                rows={3}
                value={settings.onboardingGoal}
                onChange={(e) => setSettings({ ...settings, onboardingGoal: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                The AI will ensure these topics are covered during calls
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Conversation Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <CardTitle>Conversation Settings</CardTitle>
            </div>
            <CardDescription>
              Configure how the AI suggests questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tone">Tone of Voice</Label>
              <Select
                value={settings.tone}
                onValueChange={(value) => setSettings({ ...settings, tone: value })}
              >
                <SelectTrigger id="tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professional & Formal">Professional & Formal</SelectItem>
                  <SelectItem value="Professional & Friendly">Professional & Friendly</SelectItem>
                  <SelectItem value="Casual & Conversational">Casual & Conversational</SelectItem>
                  <SelectItem value="Direct & Concise">Direct & Concise</SelectItem>
                  <SelectItem value="Consultative & Expert">Consultative & Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="maxQuestions">Max Question Suggestions</Label>
              <Input
                id="maxQuestions"
                type="number"
                min={5}
                max={20}
                value={settings.maxQuestions}
                onChange={(e) => setSettings({ ...settings, maxQuestions: parseInt(e.target.value) || 10 })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum number of questions AI will suggest per call (5-20)
              </p>
            </div>

            <div>
              <Label htmlFor="customInstructions">Custom Instructions (Optional)</Label>
              <Textarea
                id="customInstructions"
                placeholder="Any specific guidelines for the AI..."
                rows={3}
                value={settings.customInstructions}
                onChange={(e) => setSettings({ ...settings, customInstructions: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Additional context or rules for question generation
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            * Required fields
          </p>
          <Button
            size="lg"
            onClick={handleSave}
            disabled={saving || !settings.organizationName}
            className="min-w-[140px]"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>

        {/* Info Box */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <SettingsIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium">How this works</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Your organization settings power the AI assistant in the Chrome extension</li>
                  <li>• The AI uses this info to generate relevant questions during calls</li>
                  <li>• Checklist items are automatically created based on your onboarding goals</li>
                  <li>• All settings can be updated anytime and take effect immediately</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
