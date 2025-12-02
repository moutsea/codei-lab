import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteConfirmModalProps {
  keyName: string;
  onConfirm: () => void;
  onCancel: () => void;
  apiKeysT: (key: string, params?: any) => string;
}

export function DeleteConfirmModal({
  keyName,
  onConfirm,
  onCancel,
  apiKeysT
}: DeleteConfirmModalProps) {
  return (
    <>
      {/* Click outside to close */}
      <div
        className="fixed inset-0 z-40"
        onClick={onCancel}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-md border border-border animate-in zoom-in duration-200">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {apiKeysT("deleteConfirmTitle")}
                  </h3>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </Button>
            </div>
          </div>

          <div className="p-6">
            <p className="text-muted-foreground mb-4">
              {apiKeysT("deleteConfirmMessage", { name: keyName })}
            </p>

            <p className="text-sm text-red-600 dark:text-red-400 mb-6 font-medium">
              {apiKeysT("deleteConfirmWarning")}
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={onCancel}
                className="hover:bg-gray-50 transition-colors"
              >
                {apiKeysT("cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={onConfirm}
                className="bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {apiKeysT("delete")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
