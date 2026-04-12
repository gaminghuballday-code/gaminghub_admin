import { useCallback, useState } from 'react';
import { AxiosError } from 'axios';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { selectIsAuthenticated } from '@store/slices/authSlice';
import { addToast } from '@store/slices/toastSlice';
import { useAdminPrivileges } from '@services/api/hooks/useAdminQueries';
import { useBlockUsers, useDeleteUser, useUnblockUsers } from '@services/api/hooks/useUsersQueries';

export type AccountDeleteContext = 'host' | 'org' | 'influencer';

export const useHostCreationPrivilegedActions = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const privQuery = useAdminPrivileges(isAuthenticated);
  const privilegedAccountActions =
    privQuery.status === 'success' && Boolean(privQuery.data?.privilegedAccountActions);

  const deleteUserMutation = useDeleteUser();
  const blockMutation = useBlockUsers();
  const unblockMutation = useUnblockUsers();

  const [hostSelectedIds, setHostSelectedIds] = useState<Set<string>>(new Set());
  const [orgSelectedIds, setOrgSelectedIds] = useState<Set<string>>(new Set());
  const [influencerSelectedIds, setInfluencerSelectedIds] = useState<Set<string>>(new Set());

  const [deletePending, setDeletePending] = useState<{
    context: AccountDeleteContext;
    ids: string[];
  } | null>(null);

  const [blockPending, setBlockPending] = useState<{ ids: string[]; unblock: boolean } | null>(
    null
  );

  const parseErr = useCallback((err: unknown): string => {
    if (err instanceof AxiosError) {
      const data = err.response?.data;
      if (
        data &&
        typeof data === 'object' &&
        'message' in data &&
        typeof (data as { message: string }).message === 'string'
      ) {
        return (data as { message: string }).message;
      }
    }
    if (err instanceof Error) {
      return err.message;
    }
    return 'Something went wrong';
  }, []);

  const actionPending =
    deleteUserMutation.isPending || blockMutation.isPending || unblockMutation.isPending;

  const confirmDelete = useCallback(async () => {
    if (!deletePending) {
      return;
    }
    try {
      for (const id of deletePending.ids) {
        await deleteUserMutation.mutateAsync(id);
      }
      dispatch(
        addToast({
          message:
            deletePending.ids.length > 1
              ? `Deleted ${deletePending.ids.length} users`
              : 'User deleted',
          type: 'success',
          duration: 5000,
        })
      );
      if (deletePending.context === 'host') {
        setHostSelectedIds(new Set());
      }
      if (deletePending.context === 'org') {
        setOrgSelectedIds(new Set());
      }
      if (deletePending.context === 'influencer') {
        setInfluencerSelectedIds(new Set());
      }
    } catch (e) {
      dispatch(addToast({ message: parseErr(e), type: 'error', duration: 6000 }));
    } finally {
      setDeletePending(null);
    }
  }, [deletePending, deleteUserMutation, dispatch, parseErr]);

  const confirmBlock = useCallback(async () => {
    if (!blockPending) {
      return;
    }
    try {
      if (blockPending.unblock) {
        await unblockMutation.mutateAsync({ userIds: blockPending.ids });
      } else {
        await blockMutation.mutateAsync({ userIds: blockPending.ids });
      }
      dispatch(
        addToast({
          message: blockPending.unblock ? 'User unblocked' : 'User blocked',
          type: 'success',
          duration: 5000,
        })
      );
    } catch (e) {
      dispatch(addToast({ message: parseErr(e), type: 'error', duration: 6000 }));
    } finally {
      setBlockPending(null);
    }
  }, [blockPending, blockMutation, unblockMutation, dispatch, parseErr]);

  const toggleHostSelect = useCallback((userId: string, selected: boolean) => {
    setHostSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  }, []);

  const toggleOrgSelect = useCallback((userId: string, selected: boolean) => {
    setOrgSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  }, []);

  const toggleInfluencerSelect = useCallback((userId: string, selected: boolean) => {
    setInfluencerSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  }, []);

  const clearInfluencerSelection = useCallback(() => {
    setInfluencerSelectedIds(new Set());
  }, []);

  return {
    privilegedAccountActions,
    privilegesLoading: privQuery.isLoading,
    hostSelectedIds,
    orgSelectedIds,
    influencerSelectedIds,
    setHostSelectedIds,
    setOrgSelectedIds,
    setInfluencerSelectedIds,
    toggleHostSelect,
    toggleOrgSelect,
    toggleInfluencerSelect,
    clearInfluencerSelection,
    setDeletePending,
    setBlockPending,
    deletePending,
    blockPending,
    confirmDelete,
    confirmBlock,
    actionPending,
  };
};
