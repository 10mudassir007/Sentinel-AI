import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { Meteors } from "@/components/ui/meteors";

const NotFound = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <AnimatedGridPattern
        numSquares={24}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className="[mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)] fill-primary/40 stroke-primary/30"
      />
      <Meteors number={10} className="opacity-40" />

      <div className="relative z-10 px-4 text-center">
        <AnimatedGradientText
          speed={1.2}
          colorFrom="hsl(199 89% 55%)"
          colorTo="hsl(199 89% 80%)"
          className="text-7xl font-bold sm:text-9xl"
        >
          404
        </AnimatedGradientText>
        <p className="mt-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <div className="mt-8">
          <Button asChild className="gap-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
