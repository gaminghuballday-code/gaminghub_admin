import { useState } from 'react';
import { AxiosError } from 'axios';
import { useAppDispatch } from '@store/hooks';
import { addToast } from '@store/slices/toastSlice';
import {
  useInquiryTemplates,
  useCreateInquiryTemplate,
  useUpdateInquiryTemplate,
  useDeleteInquiryTemplate,
} from '@services/api/hooks/useEnquiriesQueries';
import type { InquiryReplyTemplate } from '@services/types/api.types';

const getApiErrorMessage = (err: unknown): string => {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { message?: string } | undefined;
    if (data?.message && typeof data.message === 'string') {
      return data.message;
    }
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'An unexpected error occurred.';
};

export const useInquiryReplyTemplatesPanelLogic = (isAuthenticated: boolean) => {
  const dispatch = useAppDispatch();
  const [includeInactive, setIncludeInactive] = useState(false);
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateMessage, setTemplateMessage] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: templates = [], isLoading: templatesLoading } = useInquiryTemplates(
    includeInactive,
    isAuthenticated
  );

  const createMutation = useCreateInquiryTemplate();
  const updateMutation = useUpdateInquiryTemplate();
  const deleteMutation = useDeleteInquiryTemplate();

  const saving = createMutation.isPending || updateMutation.isPending;

  const loadTemplateIntoForm = (t: InquiryReplyTemplate) => {
    setEditingTemplateId(t.id);
    setTemplateTitle(t.title);
    setTemplateMessage(t.message);
    document.getElementById('inquiry-template-title')?.focus();
  };

  const clearForm = () => {
    setEditingTemplateId(null);
    setTemplateTitle('');
    setTemplateMessage('');
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateTitle.trim() || !templateMessage.trim()) {
      dispatch(
        addToast({
          message: 'Template title and message are required.',
          type: 'warning',
          duration: 5000,
        })
      );
      return;
    }

    const payload = { title: templateTitle.trim(), message: templateMessage.trim() };

    if (editingTemplateId) {
      updateMutation.mutate(
        { templateId: editingTemplateId, data: payload },
        {
          onSuccess: () => {
            dispatch(addToast({ message: 'Template updated.', type: 'success', duration: 5000 }));
            clearForm();
          },
          onError: (err) => {
            dispatch(
              addToast({ message: getApiErrorMessage(err), type: 'error', duration: 6000 })
            );
          },
        }
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        dispatch(addToast({ message: 'Template saved.', type: 'success', duration: 5000 }));
        clearForm();
      },
      onError: (err) => {
        dispatch(addToast({ message: getApiErrorMessage(err), type: 'error', duration: 6000 }));
      },
    });
  };

  const handleToggleActive = (t: InquiryReplyTemplate) => {
    updateMutation.mutate(
      { templateId: t.id, data: { isActive: !t.isActive } },
      {
        onSuccess: () => {
          dispatch(
            addToast({
              message: t.isActive ? 'Template deactivated.' : 'Template activated.',
              type: 'success',
              duration: 5000,
            })
          );
        },
        onError: (err) => {
          dispatch(addToast({ message: getApiErrorMessage(err), type: 'error', duration: 6000 }));
        },
      }
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmId) {
      return;
    }
    const id = deleteConfirmId;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        dispatch(addToast({ message: 'Template deleted.', type: 'success', duration: 5000 }));
        setDeleteConfirmId(null);
        if (editingTemplateId === id) {
          clearForm();
        }
      },
      onError: (err) => {
        dispatch(addToast({ message: getApiErrorMessage(err), type: 'error', duration: 6000 }));
      },
    });
  };

  return {
    includeInactive,
    setIncludeInactive,
    templates,
    templatesLoading,
    templateTitle,
    setTemplateTitle,
    templateMessage,
    setTemplateMessage,
    editingTemplateId,
    saving,
    handleSaveTemplate,
    loadTemplateIntoForm,
    clearForm,
    handleToggleActive,
    togglePending: updateMutation.isPending,
    deleteConfirmId,
    setDeleteConfirmId,
    handleConfirmDelete,
    deletePending: deleteMutation.isPending,
  };
};
