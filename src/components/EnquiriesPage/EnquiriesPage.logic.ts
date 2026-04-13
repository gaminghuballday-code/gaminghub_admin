import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@utils/constants';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { addToast } from '@store/slices/toastSlice';
import { selectUser, selectIsAuthenticated } from '@store/slices/authSlice';
import { useProfile } from '@services/api/hooks';
import {
  useEnquiries,
  useReplyToEnquiry,
  useInquiryTemplates,
  useReplyToEnquiryFromTemplate,
} from '@services/api/hooks/useEnquiriesQueries';
import type { Enquiry } from '@services/api';
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

export const useEnquiriesPageLogic = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  // Filter states
  const [repliedFilter, setRepliedFilter] = useState<'all' | 'replied' | 'unreplied'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageLimit] = useState<number>(10);
  
  // Reply modal states
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState<string>('');
  
  const user = useAppSelector(selectUser);
  
  // TanStack Query hooks
  useProfile(isAuthenticated && !user);
  
  // Build query params
  const queryParams = {
    page: currentPage,
    limit: pageLimit,
    replied: repliedFilter === 'all' ? undefined : repliedFilter === 'replied',
    subject: subjectFilter || undefined,
  };
  
  const { 
    data: enquiriesData, 
    isLoading: enquiriesLoading, 
    error: enquiriesError,
    refetch: refetchEnquiries 
  } = useEnquiries(queryParams, isAuthenticated);
  
  const enquiries = enquiriesData?.enquiries || [];
  // Use pagination from API if available, otherwise calculate
  const pagination = enquiriesData?.pagination;
  const totalEnquiries = pagination?.totalItems || enquiriesData?.total || 0;
  const totalPages = pagination?.totalPages || Math.ceil(totalEnquiries / pageLimit);
  const hasNextPage = pagination?.hasNextPage ?? (currentPage < totalPages);
  const hasPrevPage = pagination?.hasPrevPage ?? (currentPage > 1);
  
  const replyMutation = useReplyToEnquiry();
  const replyFromTemplateMutation = useReplyToEnquiryFromTemplate();

  const { data: replyTemplates = [], isLoading: replyTemplatesLoading } = useInquiryTemplates(
    false,
    isAuthenticated
  );
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
  }, [navigate, isAuthenticated]);

  
  const handleRepliedFilterChange = (filter: 'all' | 'replied' | 'unreplied') => {
    setRepliedFilter(filter);
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  const handleSubjectFilterChange = (subject: string) => {
    setSubjectFilter(subject);
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };
  
  const handleOpenReplyModal = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setReplyMessage('');
    setShowReplyModal(true);
  };
  
  const handleCloseReplyModal = () => {
    setShowReplyModal(false);
    setSelectedEnquiry(null);
    setReplyMessage('');
  };
  
  const handleReplySubmit = async () => {
    if (!selectedEnquiry || !replyMessage.trim()) {
      return;
    }

    try {
      await replyMutation.mutateAsync({
        enquiryId: selectedEnquiry._id || selectedEnquiry.id || '',
        replyMessage: replyMessage.trim(),
      });
      dispatch(
        addToast({
          message: 'Reply sent successfully.',
          type: 'success',
          duration: 5000,
        })
      );
      handleCloseReplyModal();
      refetchEnquiries();
    } catch (error) {
      dispatch(
        addToast({
          message: getApiErrorMessage(error),
          type: 'error',
          duration: 6000,
        })
      );
    }
  };

  const applyTemplateToReply = (t: InquiryReplyTemplate) => {
    setReplyMessage(t.message);
    document.getElementById('enquiry-reply-textarea')?.focus();
  };

  const handleReplyFromTemplate = (templateId: string) => {
    if (!selectedEnquiry) {
      return;
    }
    const inquiryId = selectedEnquiry._id || selectedEnquiry.id || '';
    replyFromTemplateMutation.mutate(
      { inquiryId, body: { templateId } },
      {
        onSuccess: () => {
          dispatch(
            addToast({
              message: 'Reply sent from template.',
              type: 'success',
              duration: 5000,
            })
          );
          handleCloseReplyModal();
          refetchEnquiries();
        },
        onError: (err) => {
          dispatch(
            addToast({
              message: getApiErrorMessage(err),
              type: 'error',
              duration: 6000,
            })
          );
        },
      }
    );
  };
  
  return {
    isAuthenticated,
    enquiries,
    enquiriesLoading,
    enquiriesError: enquiriesError ? (enquiriesError as Error).message : null,
    totalEnquiries,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    pageLimit,
    repliedFilter,
    subjectFilter,
    handleRepliedFilterChange,
    handleSubjectFilterChange,
    handlePreviousPage,
    handleNextPage,
    selectedEnquiry,
    showReplyModal,
    replyMessage,
    setReplyMessage,
    handleOpenReplyModal,
    handleCloseReplyModal,
    handleReplySubmit,
    isReplying: replyMutation.isPending,
    replyError: replyMutation.error ? (replyMutation.error as Error).message : null,

    replyTemplates,
    replyTemplatesLoading,
    applyTemplateToReply,
    handleReplyFromTemplate,
    replyFromTemplatePendingTemplateId: replyFromTemplateMutation.isPending
      ? replyFromTemplateMutation.variables?.body.templateId
      : undefined,
    isReplyFromTemplateSending: replyFromTemplateMutation.isPending,
  };
};
