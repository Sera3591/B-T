import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useEntries, useCreateEntry } from "@/hooks/use-entries";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Send, Clock, BookOpen, PenLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { user, login } = useAuth();
  const { data: entries, isLoading } = useEntries();
  const createEntry = useCreateEntry();
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    // For this MVP, we are using a dummy user ID since auth is handled by Firebase
    // In a real app, we would sync the Firebase UID with our backend ID
    createEntry.mutate({
      content,
      userId: 1, // Placeholder
    }, {
      onSuccess: () => setContent("")
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4 max-w-2xl"
          >
            <h1 className="text-5xl md:text-7xl font-display font-medium leading-tight text-primary">
              Capture your<br/><span className="italic text-muted-foreground">existence.</span>
            </h1>
            <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-lg mx-auto">
              A minimalist space to record your thoughts, moments, and the passage of time. Simple, distraction-free, and yours.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button size="lg" onClick={() => login()} className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all">
              Start Writing
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-full border-2">
              Learn More
            </Button>
          </motion.div>

          {/* Abstract visual element */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl opacity-50" />
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <FeatureCard 
            icon={<PenLine className="w-6 h-6" />}
            title="Reflect"
            description="Write without distraction in a clean, minimal interface designed for thought."
          />
          <FeatureCard 
            icon={<Clock className="w-6 h-6" />}
            title="Time"
            description="Track your journey through moments, captured and preserved forever."
          />
          <FeatureCard 
            icon={<BookOpen className="w-6 h-6" />}
            title="Archive"
            description="Your personal history, searchable and accessible whenever you need it."
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-12">
        <section className="space-y-4">
          <h2 className="text-3xl font-display font-medium text-primary">New Entry</h2>
          <Card className="p-6 border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What is on your mind?"
                className="min-h-[120px] resize-none border-none bg-transparent text-lg placeholder:text-muted-foreground/50 focus-visible:ring-0 p-0"
              />
              <div className="flex justify-end pt-4 border-t border-border/30">
                <Button 
                  type="submit" 
                  disabled={createEntry.isPending || !content.trim()}
                  className="rounded-full px-6 transition-all hover:scale-105 active:scale-95"
                >
                  {createEntry.isPending ? (
                    "Saving..."
                  ) : (
                    <>
                      Post Entry <Send className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </section>

        <section className="space-y-6">
          <h2 className="text-3xl font-display font-medium text-primary">Your Timeline</h2>
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {entries?.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-muted-foreground font-light"
                >
                  <p className="text-lg">No entries yet. Start writing your story.</p>
                </motion.div>
              ) : (
                entries?.slice().reverse().map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group"
                  >
                    <Card className="p-6 hover:shadow-md transition-shadow duration-300 border-border/40 bg-card/80 backdrop-blur-sm">
                      <p className="text-lg leading-relaxed whitespace-pre-wrap text-foreground/90 font-light">
                        {entry.content}
                      </p>
                      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground uppercase tracking-widest font-medium">
                        <span>
                          {entry.createdAt && formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                        </span>
                        <div className="h-px flex-1 bg-border mx-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <span>Entry #{entry.id}</span>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center text-primary mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-display font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground font-light leading-relaxed">
        {description}
      </p>
    </div>
  );
}
