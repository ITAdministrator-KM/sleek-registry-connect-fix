
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Download, ArrowLeft, Clock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { subjectService } from '@/services/subjectService';

interface ExcelEditorProps {
  document: any;
  onClose: () => void;
  onSave: () => void;
}

const ExcelEditor: React.FC<ExcelEditorProps> = ({ document, onClose, onSave }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const editorRef = useRef(null);
  const autoSaveIntervalRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDocument();
    setupAutoSave();
    
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, []);

  const loadDocument = async () => {
    try {
      setIsLoading(true);
      // Here you would load the Excel document content
      // For now, we'll simulate loading
      setTimeout(() => {
        setIsLoading(false);
        createSpreadsheet();
      }, 1000);
    } catch (error) {
      console.error('Error loading document:', error);
      toast({
        title: "Error",
        description: "Failed to load document",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const createSpreadsheet = () => {
    // This is a simplified Excel-like interface
    // In a real implementation, you'd use a library like Luckysheet, OnlyOffice, or EtherCalc
    const container = editorRef.current;
    if (container) {
      container.innerHTML = `
        <div class="excel-container bg-white border rounded-lg overflow-hidden">
          <div class="excel-toolbar bg-gray-50 p-2 border-b flex items-center gap-2">
            <div class="text-sm font-medium">Sheet1</div>
          </div>
          <div class="excel-grid relative overflow-auto" style="height: 500px;">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-gray-100">
                  <th class="border border-gray-300 w-12 h-8"></th>
                  ${Array.from({length: 10}, (_, i) => `<th class="border border-gray-300 w-24 h-8 text-xs font-medium">${String.fromCharCode(65 + i)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${Array.from({length: 20}, (_, rowIndex) => `
                  <tr>
                    <td class="border border-gray-300 bg-gray-100 text-center text-xs font-medium">${rowIndex + 1}</td>
                    ${Array.from({length: 10}, (_, colIndex) => `
                      <td class="border border-gray-300 h-8">
                        <input 
                          type="text" 
                          class="w-full h-full px-1 text-xs border-none outline-none focus:bg-blue-50" 
                          data-row="${rowIndex}" 
                          data-col="${colIndex}"
                        />
                      </td>
                    `).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  };

  const setupAutoSave = () => {
    autoSaveIntervalRef.current = setInterval(() => {
      saveDocument(true);
    }, 30000); // Auto-save every 30 seconds
  };

  const saveDocument = async (isAutoSave = false) => {
    try {
      if (!isAutoSave) setIsSaving(true);
      
      // Collect data from the spreadsheet
      const data = collectSpreadsheetData();
      
      await subjectService.saveExcelDocument(document.id, data);
      
      setLastSaved(new Date());
      
      if (!isAutoSave) {
        toast({
          title: "Success",
          description: "Document saved successfully",
        });
        onSave();
      }
    } catch (error) {
      console.error('Error saving document:', error);
      if (!isAutoSave) {
        toast({
          title: "Error",
          description: "Failed to save document",
          variant: "destructive",
        });
      }
    } finally {
      if (!isAutoSave) setIsSaving(false);
    }
  };

  const collectSpreadsheetData = () => {
    const inputs = editorRef.current?.querySelectorAll('input[data-row][data-col]');
    const data = {};
    
    inputs?.forEach(input => {
      const row = input.getAttribute('data-row');
      const col = input.getAttribute('data-col');
      if (input.value.trim()) {
        data[`${row}_${col}`] = input.value;
      }
    });
    
    return data;
  };

  const handleDownload = async () => {
    try {
      await subjectService.downloadExcelDocument(document.id);
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

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading Excel editor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={onClose}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div>
                <CardTitle>{document.document_name}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <Clock className="h-3 w-3" />
                  {lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : 'Not saved yet'}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => saveDocument(false)}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={editorRef} className="w-full">
            {/* Excel editor will be inserted here */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExcelEditor;
