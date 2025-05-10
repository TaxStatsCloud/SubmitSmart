import { Helmet } from "react-helmet-async";
import FileUpload from "@/components/filings/FileUpload";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useDocuments } from "@/hooks/use-documents";

const Upload = () => {
  const { recentDocuments, isLoading } = useDocuments();
  const [uploadedIds, setUploadedIds] = useState<number[]>([]);

  const handleUploadComplete = (docIds: number[]) => {
    setUploadedIds(docIds);
  };

  return (
    <>
      <Helmet>
        <title>Upload Documents | Submitra</title>
        <meta name="description" content="Upload your financial documents for AI-powered processing and filing preparation." />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">Upload Documents</h1>
          <p className="text-neutral-600 max-w-3xl">
            Upload your financial documents such as trial balances, source documents, and accounting exports for automated processing and filing preparation.
          </p>
        </div>

        <FileUpload onUploadComplete={handleUploadComplete} />

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-neutral-800 mb-3">Recent Uploads</h2>
          <Card className="shadow-sm border-neutral-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Document Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Uploaded
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-center text-sm text-neutral-500">
                          Loading recent uploads...
                        </td>
                      </tr>
                    ) : recentDocuments && recentDocuments.length > 0 ? (
                      recentDocuments.map((doc) => (
                        <tr key={doc.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="material-icons mr-2 text-neutral-400">description</span>
                              <span className="text-sm font-medium text-neutral-700">{doc.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs rounded-full bg-neutral-100 text-neutral-700">
                              {doc.type.replace('_', ' ').charAt(0).toUpperCase() + doc.type.replace('_', ' ').slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {new Date(doc.uploadedAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              doc.processingStatus === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : doc.processingStatus === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : doc.processingStatus === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {doc.processingStatus.charAt(0).toUpperCase() + doc.processingStatus.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-[hsl(var(--primary-600))] hover:text-[hsl(var(--primary-700))] mr-3">
                              View
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-center text-sm text-neutral-500">
                          No documents uploaded yet. Upload your first document to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Upload;
