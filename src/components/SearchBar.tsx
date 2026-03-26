import { useState, useEffect, useRef } from "react";
import { Search, MapPin, X } from "lucide-react";
import { searchLocations, LocationData } from "../services/weatherService";
import { motion, AnimatePresence } from "motion/react";

interface SearchBarProps {
  onSelectLocation: (location: LocationData) => void;
}

export function SearchBar({ onSelectLocation }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        const data = await searchLocations(query);
        setResults(data);
        setIsLoading(false);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div ref={searchRef} className="relative w-full max-w-md mx-auto z-50">
      <div className="relative flex items-center">
        <Search className="absolute left-4 text-white/50 w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city..."
          className="w-full bg-white/10 border border-white/20 rounded-full py-3 pl-12 pr-12 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-md transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (results.length > 0 || isLoading) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 glass rounded-2xl overflow-hidden"
          >
            {isLoading ? (
              <div className="p-4 text-center text-white/60">Searching...</div>
            ) : (
              <ul>
                {results.map((loc, idx) => (
                  <li key={`${loc.latitude}-${loc.longitude}-${idx}`}>
                    <button
                      onClick={() => {
                        onSelectLocation(loc);
                        setQuery("");
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                    >
                      <MapPin className="w-4 h-4 text-white/40" />
                      <div>
                        <div className="text-white font-medium">{loc.name}</div>
                        <div className="text-white/40 text-xs">
                          {loc.admin1 ? `${loc.admin1}, ` : ""}{loc.country}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
