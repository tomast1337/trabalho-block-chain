import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Home, Info, Menu, Ticket, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ModeToggle } from "./mode-toggle";

export const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navLinks = [
    { path: "/", label: "All Events", icon: <Home className="h-5 w-5" /> },
    {
      path: "/tickets",
      label: "My Tickets",
      icon: <Ticket className="h-5 w-5" />,
    },
    { path: "/profile", label: "Profile", icon: <User className="h-5 w-5" /> },
    { path: "/about", label: "About", icon: <Info className="h-5 w-5" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-accent text-primary shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo/Brand */}
          <Link to="/" className="text-xl font-bold ">
            <Calendar className="inline-block mr-2 h-6 w-6 " />
            EventTicketing
          </Link>

          {/* Desktop Navigation (hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 transition-colors ${
                  pathname === link.path
                    ? " text-sidebar-primary"
                    : "text-primary hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
            <div className="ml-4">
              <ModeToggle />
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-primary hover:text-indigo-400 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu (Animated) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: "easeInOut" }}
            className="fixed inset-y-0 right-0 w-64 bg-accent z-50 md:hidden shadow-xl"
          >
            <div className="flex flex-col h-full p-4">
              <div className="flex justify-end mb-8">
                <button
                  className="p-2 text-accents hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-grow flex-col flex items-start justify-start">
                <nav className="flex flex-col gap-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                        pathname === link.path
                          ? "bg-sidebar-primary-foreground text-sidebar-primary"
                          : "text-primary hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {link.icon}
                      <span className="text-lg">{link.label}</span>
                    </Link>
                  ))}
                </nav>
                <div className="mx-auto mt-6">
                  <ModeToggle />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay when mobile menu is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </header>
  );
};
