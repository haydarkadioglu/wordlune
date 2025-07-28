
"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button, buttonVariants } from '@/components/ui/button';
import { LogOut, Sun, Moon, Cog, Languages, Menu, BookOpen, LayoutDashboard, List, Shield } from 'lucide-react';
import Logo from '@/components/common/Logo';
import { useSettings, SUPPORTED_UI_LANGUAGES } from '@/hooks/useSettings';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from '@/lib/utils';
import { isAdmin as checkIsAdmin } from '@/lib/admin-service';

const NavLink = ({ href, children, onLinkClick }: { href: string; children: React.ReactNode, onLinkClick?: () => void }) => {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);
  return (
    <Link 
      href={href} 
      className={cn(
        buttonVariants({ variant: 'ghost' }),
        "text-muted-foreground hover:text-primary justify-start",
        isActive && "text-primary bg-primary/10"
      )}
      onClick={onLinkClick}
    >
      {children}
    </Link>
  );
};

export default function Header() {
  const { user, signOut } = useAuth();
  const { uiLanguage, setUiLanguage, theme, toggleTheme } = useSettings();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname(); // Moved hook to top level

  useEffect(() => {
    if (user) {
      checkIsAdmin(user).then(setIsAdmin);
    } else {
      setIsAdmin(false);
    }
  }, [user]);
  
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="mr-2 h-4 w-4" /> },
    { href: "/dashboard/words", label: "All Words", icon: <List className="mr-2 h-4 w-4" /> },
    { href: "/dashboard/lists", label: "My Lists", icon: <List className="mr-2 h-4 w-4" /> },
    { href: "/dashboard/stories", label: "Stories", icon: <BookOpen className="mr-2 h-4 w-4" /> },
  ];

  const adminNavItem = { href: "/admin", label: "Admin Panel", icon: <Shield className="mr-2 h-4 w-4" /> };
  
  const allNavItems = isAdmin ? [...navItems, adminNavItem] : navItems;

  return (
    <header className="bg-card/80 backdrop-blur-sm shadow-md sticky top-0 z-40 border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-xs p-4">
               <SheetHeader className="mb-6 text-left">
                  <Logo />
                  <SheetTitle className="sr-only">Main Menu</SheetTitle>
               </SheetHeader>
               <nav className="flex flex-col gap-2">
                 {allNavItems.map(item => (
                    <NavLink key={item.href} href={item.href} onLinkClick={handleLinkClick}>
                        {item.icon} {item.label}
                    </NavLink>
                 ))}
               </nav>
            </SheetContent>
          </Sheet>
          <Logo />
          <nav className="hidden md:flex items-center gap-1">
             {allNavItems.map(item => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    "text-muted-foreground hover:text-primary",
                    pathname.startsWith(item.href) && "text-primary bg-primary/10"
                  )}
                >
                  {item.label}
                </Link>
             ))}
          </nav>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
           {user && (
            <p className="text-sm text-foreground hidden lg:block mr-4">
              Welcome, <span className="font-semibold text-primary">{user.username}</span>
            </p>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Change language">
                <Languages className="h-5 w-5 text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {SUPPORTED_UI_LANGUAGES.map(lang => (
                <DropdownMenuItem key={lang.code} onSelect={() => setUiLanguage(lang.code)} className={uiLanguage === lang.code ? "bg-accent" : ""}>
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/dashboard/settings" aria-label="Settings" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'text-primary')}>
              <Cog className="h-5 w-5" />
          </Link>

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="text-primary">
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Logout" className="text-primary">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
