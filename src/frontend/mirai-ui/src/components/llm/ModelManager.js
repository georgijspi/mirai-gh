import React, { useState, useEffect } from "react";
import {
  fetchAvailableModels,
  pullModel,
  deleteModel,
} from "../../services/llmService";

const ModelManager = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [newModelName, setNewModelName] = useState("");
  const [isPulling, setIsPulling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAvailableModels();
      setModels(data);
    } catch (err) {
      setError("Failed to load models");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePullModel = async () => {
    if (!newModelName.trim()) {
      setError("Please enter a model name");
      return;
    }

    try {
      setIsPulling(true);
      setError(null);
      await pullModel(newModelName);
      setMessage(`Model "${newModelName}" pulled successfully`);
      setNewModelName("");
      await loadModels();
    } catch (err) {
      setError(`Failed to pull model: ${err.message}`);
      console.error(err);
    } finally {
      setIsPulling(false);
    }
  };

  const handleDeleteModel = async (modelName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the model "${modelName}"?`
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      await deleteModel(modelName);
      setMessage(`Model "${modelName}" deleted successfully`);
      await loadModels();
    } catch (err) {
      setError(`Failed to delete model: ${err.message}`);
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-xl font-bold mb-4 text-white">Model Management</h4>

      {message && (
        <div className="mb-4 p-4 bg-green-500 text-white rounded-md">
          {message}
          <button
            onClick={() => setMessage(null)}
            className="ml-4 text-white hover:text-gray-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-500 text-white rounded-md">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-white hover:text-gray-200"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mb-6">
        <h5 className="text-lg font-semibold text-white mb-2">
          Pull New Model
        </h5>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newModelName}
            onChange={(e) => setNewModelName(e.target.value)}
            placeholder="Enter model name (e.g., llama2)"
            className="flex-grow p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handlePullModel}
            disabled={isPulling}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition disabled:opacity-50"
          >
            {isPulling ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Pulling...
              </span>
            ) : (
              "Pull Model"
            )}
          </button>
        </div>
      </div>

      <div>
        <h5 className="text-lg font-semibold text-white mb-2">
          Available Models
        </h5>
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Size
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Modified At
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {models.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-4 text-center text-gray-400"
                  >
                    No models available
                  </td>
                </tr>
              ) : (
                models.map((model) => (
                  <tr key={model.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {model.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatSize(model.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(model.modified_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteModel(model.name)}
                        disabled={isDeleting}
                        className="text-red-500 hover:text-red-400 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Helper function to format file size
const formatSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (e) {
    return dateString;
  }
};

export default ModelManager;
