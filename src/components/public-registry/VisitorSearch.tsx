import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, User } from 'lucide-react';

export interface Visitor {
  id: string;
  public_id: string;
  name: string;
  nic: string;
  mobile: string;
  email?: string;
  photo_url?: string;
  last_visit?: string;
  department_name?: string;
  division_name?: string;
}

interface VisitorSearchProps {
  onSelectVisitor: (visitor: Visitor) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearch: () => void;
  selectedVisitorId?: string;
  isLoading: boolean;
  searchResults: Visitor[];
}

export const VisitorSearch: React.FC<VisitorSearchProps> = ({
  onSelectVisitor,
  searchTerm,
  onSearchChange,
  onSearch,
  selectedVisitorId,
  isLoading,
  searchResults,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name, NIC, or ID..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
        </div>
        <Button 
          type="button" 
          onClick={onSearch} 
          disabled={isLoading || !searchTerm.trim()}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Search'
          )}
        </Button>
      </div>

      {searchResults.length > 0 && (
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          {searchResults.map((visitor) => (
            <Card 
              key={visitor.id}
              className={`cursor-pointer transition-colors ${
                selectedVisitorId === visitor.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onSelectVisitor(visitor)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {visitor.photo_url ? (
                      <img 
                        src={visitor.photo_url} 
                        alt={visitor.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {visitor.name}
                      {visitor.public_id && (
                        <span className="ml-2 text-xs text-gray-500">
                          ID: {visitor.public_id}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-sm text-gray-500">
                      NIC: {visitor.nic}
                    </p>
                    <p className="truncate text-sm text-gray-500">
                      {visitor.mobile}
                      {visitor.email && ` • ${visitor.email}`}
                    </p>
                    {visitor.department_name && (
                      <p className="mt-1 truncate text-xs text-gray-500">
                        {visitor.department_name}
                        {visitor.division_name && ` • ${visitor.division_name}`}
                      </p>
                    )}
                    {visitor.last_visit && (
                      <p className="mt-1 text-xs text-gray-400">
                        Last visit: {new Date(visitor.last_visit).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {selectedVisitorId === visitor.id && (
                    <div className="flex-shrink-0">
                      <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searchResults.length === 0 && searchTerm && !isLoading && (
        <div className="mt-4 rounded-md bg-gray-50 p-4 text-center text-sm text-gray-500">
          No visitors found matching your search.
        </div>
      )}
    </div>
  );
};
