
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Edit, File } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { subjectService } from '@/services/subjectService';
import ExcelEditor from './ExcelEditor';

interface DocumentManagerProps {
  subjectStaffData: any;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ subjectStaffData }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDocument, setEditingDocument] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (subjectStaffData) {
      fetchDocuments();
    }
  }, [subjectStaffData]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await subjectService.getDocuments(
        subjectStaffData.assigned_department_id,
        subjectStaffData.assigned_division_id
      );
      setDocuments(response.data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document) => {
    try {
      await subjectService.downloadDocument(document.id);
      toast({
        title: "Success",
        description: "Document downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (document) => {
    if (document.document_type === 'excel') {
      setEditingDocument(document);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading documents...</p>
      </div>
    );
  }

  if (editingDocument) {
    return (
      <ExcelEditor
        document={editingDocument}
        onClose={() => setEditingDocument(null)}
        onSave={fetchDocuments}
      />
    );
  }

  const wordDocuments = documents.filter(doc => doc.document_type === 'word');
  const excelDocuments = documents.filter(doc => doc.document_type === 'excel');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Document Management</h2>
        <p className="text-blue-100">
          Access and manage documents for {subjectStaffData?.division_name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Word Documents
            </CardTitle>
            <CardDescription>
              Downloadable Word documents ({wordDocuments.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {wordDocuments.length > 0 ? (
                wordDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <File className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium">{doc.document_name}</p>
                        <p className="text-sm text-gray-500">{doc.description}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No Word documents available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Excel Documents
            </CardTitle>
            <CardDescription>
              Editable Excel spreadsheets ({excelDocuments.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {excelDocuments.length > 0 ? (
                excelDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <File className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">{doc.document_name}</p>
                        <p className="text-sm text-gray-500">{doc.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(doc)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No Excel documents available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentManager;
