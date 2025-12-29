import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, login, logout, isLoggingIn } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground transition-colors duration-300">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xl group-hover:scale-105 transition-transform">
              B
            </div>
            <span className="font-display font-semibold text-lg tracking-tight">Being & Time</span>
          </Link>
          
          <nav className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground hidden sm:inline-block">
                  {user.email}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => logout()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => login()} 
                disabled={isLoggingIn}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-6"
              >
                {isLoggingIn ? "Signing in..." : "Sign In"}
              </Button>
            )}
          </nav>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-4xl animate-in fade-in duration-500">
        {children}
      </main>
      
      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} Being & Time. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
