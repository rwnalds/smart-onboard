'use client';

import ClientChat from '@/components/ClientChat';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@stackframe/stack';
import { ArrowLeft, Briefcase, Linkedin, Mail, MessageSquare, Phone } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Client {
  id: string;
  name: string;
  email?: string;
  company?: string;
  role?: string;
  phone?: string;
  linkedinUrl?: string;
  notes?: string;
  tags?: string[];
  lastContactedAt?: string;
  createdAt: string;
  callSessions?: Array<{
    id: string;
    startedAt: string;
    endedAt?: string;
    summary?: string;
    duration?: number;
  }>;
  insights?: Array<{
    category: string;
    key: string;
    value: string;
    confidence: number;
  }>;
}

export default function ClientDetailPage() {
  const params = useParams();
  const user = useUser();
  const clientId = params.clientId as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;

    const fetchClient = async () => {
      try {
        const response = await fetch(`/api/clients/${clientId}`);
        if (response.ok) {
          const data = await response.json();
          setClient(data.client);
        }
      } catch (error) {
        console.error('Failed to fetch client:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading client...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Client not found</h3>
            <Link href="/clients">
              <Button variant="outline">Back to Clients</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupedInsights = client.insights?.reduce((acc, insight) => {
    if (!acc[insight.category]) {
      acc[insight.category] = [];
    }
    acc[insight.category].push(insight);
    return acc;
  }, {} as Record<string, typeof client.insights>);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/clients">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Button>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{client.name}</h1>
            {client.company && (
              <p className="text-xl text-muted-foreground">{client.company}</p>
            )}
          </div>
          <Button>Edit Client</Button>
        </div>
      </div>

      {/* Contact Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${client.email}`} className="text-sm hover:underline">
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <a href={`tel:${client.phone}`} className="text-sm hover:underline">
                  {client.phone}
                </a>
              </div>
            )}
            {client.role && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{client.role}</span>
              </div>
            )}
            {client.linkedinUrl && (
              <div className="flex items-center gap-2">
                <Linkedin className="w-4 h-4 text-muted-foreground" />
                <a
                  href={client.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline"
                >
                  LinkedIn Profile
                </a>
              </div>
            )}
          </div>
          
          {client.tags && client.tags.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {client.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat">AI Chat</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="history">Conversation History</TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <ClientChat clientId={clientId} userId={user?.id || ''} clientName={client.name} />
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {groupedInsights && Object.keys(groupedInsights).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(groupedInsights).map(([category, insights]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="capitalize">
                      {category.replace(/_/g, ' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2">
                      {insights.map((insight, idx) => (
                        <div key={idx}>
                          <dt className="text-sm font-medium text-muted-foreground capitalize">
                            {insight.key.replace(/_/g, ' ')}
                          </dt>
                          <dd className="text-sm mt-1">{insight.value}</dd>
                          {idx < insights.length - 1 && <Separator className="my-2" />}
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No insights extracted yet. Insights will appear after conversations.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {client.callSessions && client.callSessions.length > 0 ? (
            <div className="space-y-4">
              {client.callSessions.map((session) => (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {new Date(session.startedAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </CardTitle>
                      <Badge variant="outline">
                        {session.duration
                          ? `${Math.floor(session.duration / 60)}m ${session.duration % 60}s`
                          : 'In Progress'}
                      </Badge>
                    </div>
                    <CardDescription>
                      {new Date(session.startedAt).toLocaleTimeString()}
                    </CardDescription>
                  </CardHeader>
                  {session.summary && (
                    <CardContent>
                      <p className="text-sm">{session.summary}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No conversation history yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
