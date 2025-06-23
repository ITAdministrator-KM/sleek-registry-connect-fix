
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Edit, File, FolderOpen } from 'lucide-react';
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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading documents...</p>
        </div>
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
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center space-x-4">
          <FolderOpen className="h-8 w-8" />
          <div>
            <h2 className="text-3xl font-bold mb-2">Document Management</h2>
            <p className="text-blue-100 text-lg">
              Access and manage documents for <span className="font-semibold">{subjectStaffData?.division_name}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Word Documents Card */}
        <Card className="bg-white shadow-sm border-0 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              Word Documents
            </CardTitle>
            <CardDescription className="text-gray-600">
              Downloadable Word documents ({wordDocuments.length} available)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {wordDocuments.length > 0 ? (
                wordDocuments.map((doc) => (
                  <div key={doc.id} className="group flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-md group-hover:bg-blue-200 transition-colors">
                        <File className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-blue-900">{doc.document_name}</p>
                        {doc.description && (
                          <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No Word documents available</p>
                  <p className="text-gray-400 text-sm mt-2">Documents will appear here once uploaded</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Excel Documents Card */}
        <Card className="bg-white shadow-sm border-0 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Edit className="h-6 w-6 text-teal-600" />
              </div>
              Excel Documents
            </CardTitle>
            <CardDescription className="text-gray-600">
              Editable Excel spreadsheets ({excelDocuments.length} available)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {excelDocuments.length > 0 ? (
                excelDocuments.map((doc) => (
                  <div key={doc.id} className="group flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-teal-50 transition-colors duration-200">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-teal-100 rounded-md group-hover:bg-teal-200 transition-colors">
                        <File className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-teal-900">{doc.document_name}</p>
                        {doc.description && (
                          <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(doc)}
                        className="border-teal-200 text-teal-700 hover:bg-teal-50"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        className="bg-teal-600 hover:bg-teal-700 shadow-sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Edit className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No Excel documents available</p>
                  <p className="text-gray-400 text-sm mt-2">Documents will appear here once uploaded</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentManager;
