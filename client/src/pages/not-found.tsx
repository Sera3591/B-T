import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Layout>
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 shadow-xl border-border/50">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <h1 className="text-2xl font-display font-bold text-foreground">404 Page Not Found</h1>
            </div>

            <p className="mt-4 text-muted-foreground font-light">
              The page you are looking for does not exist. It may have been moved or deleted.
            </p>

            <div className="mt-8">
              <Link href="/">
                <Button className="w-full">Return Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
