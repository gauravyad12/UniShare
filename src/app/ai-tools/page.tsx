export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { Bot, Brain, FileText, Sparkles, Upload, MessageSquare, Mic, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "UniShare | AI Tools",
  description:
    "AI-powered tools to enhance your learning experience on UniShare",
};

export default function AIToolsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">AI Tools</h1>
          <p className="text-muted-foreground mb-8">
            Enhance your learning experience with our suite of AI-powered tools
            designed specifically for university students.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* AI Essay Writer - Completed */}
            <Card className="border border-border flex flex-col">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI Essay Writer</CardTitle>
                <CardDescription>
                  Get AI assistance with essay writing, from brainstorming to final draft
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground mb-4">
                  Complete essay writing assistance with customizable prompts, rubrics, and intelligent feedback. 
                  Perfect for academic writing at any level.
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Custom prompt and rubric options</li>
                  <li>Academic level writing style adaptation</li>
                  <li>AI-powered content generation and analysis</li>
                  <li>Draft management and auto-save</li>
                  <li>Comprehensive feedback and suggestions</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/dashboard/tools/ai-essay-writer">Launch Tool</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* AI Document Chat - Coming Soon */}
            <Card className="border border-border flex flex-col">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI Document Chat</CardTitle>
                <CardDescription>
                  Upload documents and chat with AI about the content
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground mb-4">
                  Upload PDFs, notes, text files, or YouTube videos and have intelligent conversations 
                  with AI about the content. Extract insights and get help understanding complex materials.
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Upload PDF, notes, text, or YouTube content</li>
                  <li>Interactive chat with document content</li>
                  <li>AI-powered summarization</li>
                  <li>Automatic note generation</li>
                  <li>Flashcard creation from content</li>
                  <li>Practice quiz generation</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardFooter>
            </Card>

            {/* AI Lecture Note Taker - Coming Soon */}
            <Card className="border border-border flex flex-col">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI Lecture Note Taker</CardTitle>
                <CardDescription>
                  Record lectures and get AI-generated study materials
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground mb-4">
                  Record lectures in real-time and let AI automatically generate comprehensive study materials. 
                  Never miss important information again with intelligent audio processing.
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Real-time lecture recording and transcription</li>
                  <li>Re-listen to recordings with timestamps</li>
                  <li>Chat with AI about lecture content</li>
                  <li>Automatic summary generation</li>
                  <li>Smart note extraction and formatting</li>
                  <li>Flashcard creation from lectures</li>
                  <li>Practice quiz generation</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardFooter>
            </Card>

            {/* Study Assistant - Future Tool */}
            <Card className="border border-border opacity-75 flex flex-col">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI Study Assistant</CardTitle>
                <CardDescription>
                  Your personal AI study companion
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground mb-4">
                  Get instant answers to your questions, explanations for
                  complex concepts, and help with problem-solving. Our AI study
                  assistant will be trained on academic content across various
                  disciplines.
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>24/7 homework help</li>
                  <li>Concept explanations</li>
                  <li>Practice problem generation</li>
                  <li>Study plan creation</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled variant="outline">
                  Future Release
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="bg-secondary/20 p-6 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4">Premium AI Features</h2>
            <p className="text-muted-foreground mb-6">
              Unlock the full potential of our AI tools with a premium
              subscription. Get unlimited access to all features and priority
              processing for your requests.
            </p>
            <Button asChild>
              <Link href="/pricing">View Pricing Plans</Link>
            </Button>
          </div>

          <div className="mt-12 flex justify-center">
            <Button asChild variant="outline">
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
