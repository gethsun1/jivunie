import { SwaggerUIComponent } from '@/components/ui/swagger-ui';

export default function APIDocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Jivunie SACCO API Documentation
          </h1>
          <p className="text-gray-600">
            Comprehensive API documentation for the Jivunie SACCO platform
          </p>
        </div>
        <SwaggerUIComponent />
      </div>
    </div>
  );
}