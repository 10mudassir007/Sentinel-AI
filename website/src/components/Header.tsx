import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Shield, Menu, X, ChevronDown, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import ScrollProgressBar from "@/components/ScrollProgressBar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DOWNLOAD_URL = "https://github.com/10mudassir007/Sentinel-AI/releases/tag/v1.0";

// The expand-from-center intro only plays once per page load (or manual reload).
// It is intentionally reset by a hard refresh because module scope is discarded.
let headerIntroPlayed = false;

const mainNavLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/use-cases", label: "Use Cases" },
  { href: "/demo", label: "Demo" },
];

const moreNavLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/detection-capabilities", label: "Detection Capabilities" },
  { href: "/tech-stack", label: "Tech Stack" },
  { href: "/privacy-policy", label: "Privacy" },
];

const allNavLinks = [...mainNavLinks, ...moreNavLinks];

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const { pathname } = useLocation();
  const reduceMotion = useReducedMotion();
  const animateIntro = !reduceMotion && !headerIntroPlayed;

  useEffect(() => {
    headerIntroPlayed = true;
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <ScrollProgressBar />
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="px-3 pt-3 sm:px-4">
          <motion.div
            initial={animateIntro ? { width: 56, opacity: 0.5 } : false}
            animate={{ width: "100%", opacity: 1 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "container mx-auto flex h-14 items-center overflow-hidden rounded-full border px-2 transition-[background-color,border-color,box-shadow] duration-300",
              scrolled
                ? "border-border/70 bg-background/70 shadow-lg shadow-black/30 backdrop-blur-xl"
                : "border-white/5 bg-background/40 backdrop-blur-md",
            )}
          >
            <motion.div
              className="flex w-full items-center justify-between gap-2"
              initial={animateIntro ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.6 }}
            >
            {/* Logo */}
            <a href="/" className="group flex items-center gap-2 pl-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">
                Sentinel{" "}
                <AnimatedGradientText
                  speed={1.4}
                  colorFrom="hsl(199 89% 55%)"
                  colorTo="hsl(199 89% 80%)"
                >
                  AI
                </AnimatedGradientText>
              </span>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
              {mainNavLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onMouseEnter={() => setHovered(link.href)}
                    className={cn(
                      "relative rounded-full px-3.5 py-1.5 text-sm transition-colors",
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {hovered === link.href && (
                      <motion.span
                        layoutId="nav-hover-pill"
                        className="absolute inset-0 rounded-full border border-primary/20 bg-primary/10"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{link.label}</span>
                  </a>
                );
              })}

              {/* More dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  onMouseEnter={() => setHovered("more")}
                  className="relative flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground data-[state=open]:text-foreground"
                >
                  {hovered === "more" && (
                    <motion.span
                      layoutId="nav-hover-pill"
                      className="absolute inset-0 rounded-full border border-primary/20 bg-primary/10"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1">
                    More
                    <ChevronDown className="h-3.5 w-3.5" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 border-border bg-background/95 backdrop-blur-xl"
                >
                  {moreNavLinks.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <a
                        href={link.href}
                        className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden items-center gap-2 pr-1 md:flex">
              <a href={DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="glow-primary gap-2 rounded-full">
                  <Smartphone className="h-4 w-4" />
                  Download
                </Button>
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground md:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="mx-3 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-border/70 bg-background/90 p-3 shadow-xl backdrop-blur-xl md:hidden"
            >
              <div className="flex flex-col">
                {allNavLinks.map((link, index) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "rounded-xl px-3 py-2.5 text-sm transition-colors",
                      pathname === link.href
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                    )}
                  >
                    {link.label}
                  </motion.a>
                ))}
              </div>
              <div className="mt-3 border-t border-border/50 pt-3">
                <a
                  href={DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button size="sm" className="glow-primary w-full gap-2 rounded-full">
                    <Smartphone className="h-4 w-4" />
                    Download App
                  </Button>
                </a>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};

export default Header;
