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
import { Bot, Brain, FileText, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Tools - UniShare",
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
            <Card className="border border-border">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Study Assistant</CardTitle>
                <CardDescription>
                  Your personal AI study companion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get instant answers to your questions, explanations for
                  complex concepts, and help with problem-solving. Our AI study
                  assistant is trained on academic content across various
                  disciplines.
                </p>
                <ul className="list-disc pl-6 mt-4 text-muted-foreground">
                  <li>24/7 homework help</li>
                  <li>Concept explanations</li>
                  <li>Practice problem generation</li>
                  <li>Study plan creation</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Note Summarizer</CardTitle>
                <CardDescription>
                  Transform lengthy content into concise summaries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Upload your lecture notes, textbook chapters, or research
                  papers and get AI-generated summaries that highlight the key
                  points. Save time and improve your understanding.
                </p>
                <ul className="list-disc pl-6 mt-4 text-muted-foreground">
                  <li>Lecture note condensation</li>
                  <li>Textbook chapter summaries</li>
                  <li>Research paper abstracts</li>
                  <li>Custom summary length options</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Flashcard Generator</CardTitle>
                <CardDescription>
                  Create study flashcards automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Turn your notes or textbook content into effective study
                  flashcards. Our AI identifies key concepts and creates
                  question-answer pairs to help you memorize and understand the
                  material.
                </p>
                <ul className="list-disc pl-6 mt-4 text-muted-foreground">
                  <li>Automatic flashcard creation</li>
                  <li>Spaced repetition system</li>
                  <li>Custom difficulty levels</li>
                  <li>Progress tracking</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Essay Assistant</CardTitle>
                <CardDescription>
                  Improve your writing with AI feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get instant feedback on your essays and papers. Our AI
                  analyzes your writing for clarity, structure, grammar, and
                  style, providing suggestions to enhance your academic writing.
                </p>
                <ul className="list-disc pl-6 mt-4 text-muted-foreground">
                  <li>Grammar and style checking</li>
                  <li>Structure and flow analysis</li>
                  <li>Citation formatting assistance</li>
                  <li>Plagiarism prevention tips</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled>
                  Coming Soon
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
