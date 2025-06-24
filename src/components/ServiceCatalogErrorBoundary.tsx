
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from 'lucide-react';

interface ServiceCatalogErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ServiceCatalogErrorBoundaryProps {
  children: React.ReactNode;
}

export class ServiceCatalogErrorBoundary extends React.Component<
  ServiceCatalogErrorBoundaryProps,
  ServiceCatalogErrorBoundaryState
> {
  constructor(props: ServiceCatalogErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ServiceCatalogErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ServiceCatalog Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="m-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Service Catalog Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Something went wrong while loading the service catalog.
            </p>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              {this.state.error?.message || 'Unknown error occurred'}
            </div>
            <Button 
              onClick={() => this.setState({ hasError: false, error: null })}
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
