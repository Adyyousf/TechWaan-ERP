import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="text-center mb-8">
            <div className="bg-primary text-primary-foreground w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">SimplERP</h1>
            <p className="text-muted-foreground">Sign in to your account</p>
          </div>
          
          <div className="space-y-6">
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="w-full"
              data-testid="button-signin"
            >
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
