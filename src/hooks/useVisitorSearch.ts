import { useState, useEffect, useCallback } from 'react';
import { publicRegistryService, PublicVisitor } from '@/services/publicRegistryService';
import { useDebounce } from './useDebounce';

export const useVisitorSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PublicVisitor[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<PublicVisitor | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Search for visitors when debounced search term changes
  useEffect(() => {
    const searchVisitors = async () => {
      if (!debouncedSearchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const results = await publicRegistryService.searchVisitors(debouncedSearchTerm);
        setSearchResults(results);
      } catch (err) {
        console.error('Error searching visitors:', err);
        setError('Failed to search visitors. Please try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchVisitors();
  }, [debouncedSearchTerm]);

  // Handle search input change
  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
    
    // Clear selected visitor if search term changes
    if (term !== selectedVisitor?.name && term !== selectedVisitor?.nic) {
      setSelectedVisitor(null);
    }
  }, [selectedVisitor]);

  // Handle visitor selection
  const handleSelectVisitor = useCallback((visitor: PublicVisitor) => {
    setSelectedVisitor(visitor);
    setSearchTerm(visitor.name); // Update search term to show selected visitor's name
  }, []);

  // Clear search results and reset state
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
    setSelectedVisitor(null);
    setError(null);
  }, []);

  return {
    searchTerm,
    searchResults,
    isSearching,
    selectedVisitor,
    error,
    handleSearchChange,
    handleSelectVisitor,
    clearSearch,
  };
};
