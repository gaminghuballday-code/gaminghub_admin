import { useMemo, useState } from 'react';
import { useAppSelector } from '@store/hooks';
import { selectIsAuthenticated } from '@store/slices/authSlice';
import {
  useCreateSpecialTournament,
  useSpecialTournamentsList,
  type CreateSpecialTournamentRequest,
  type SpecialTournamentListParams,
} from '@services/api';

type SpecialTournamentFilter = 'upcoming' | 'live' | 'completed';

const DEFAULT_LIMIT = 10;

export const useSpecialTournamentTabLogic = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [filter, setFilter] = useState<SpecialTournamentFilter>('upcoming');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit] = useState<number>(DEFAULT_LIMIT);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [form, setForm] = useState<CreateSpecialTournamentRequest>({
    title: 'BooyahX Special Tournament S1',
    mode: 'BR',
    subMode: 'squad',
    prizePool: 5000,
    maxSlots: 180,
    totalRounds: 4,
  });

  const listParams: SpecialTournamentListParams = useMemo(
    () => ({
      filter,
      page: currentPage,
      limit,
    }),
    [filter, currentPage, limit]
  );

  const {
    data: listData,
    isLoading: isListLoading,
    error: listError,
  } = useSpecialTournamentsList(listParams, isAuthenticated);

  const tournaments = listData?.tournaments || [];
  const pagination = listData?.pagination;
  const total = pagination?.totalItems || listData?.total || tournaments.length;
  const totalPages = pagination?.totalPages || Math.max(1, Math.ceil(total / limit));
  const hasNextPage = pagination?.hasNextPage ?? currentPage < totalPages;
  const hasPrevPage = pagination?.hasPrevPage ?? currentPage > 1;

  const createMutation = useCreateSpecialTournament();

  const setFilterValue = (next: SpecialTournamentFilter) => {
    setFilter(next);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (hasPrevPage) setCurrentPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    if (hasNextPage) setCurrentPage((p) => p + 1);
  };

  const handleCreate = async () => {
    await createMutation.mutateAsync(form);
    setIsCreateModalOpen(false);
  };

  return {
    filter,
    setFilterValue,
    currentPage,
    totalPages,
    total,
    hasNextPage,
    hasPrevPage,
    handlePrevPage,
    handleNextPage,
    form,
    setForm,
    isCreateModalOpen,
    openCreateModal: () => setIsCreateModalOpen(true),
    closeCreateModal: () => setIsCreateModalOpen(false),
    handleCreate,
    isCreating: createMutation.isPending,
    createError: createMutation.error ? (createMutation.error as Error).message : null,
    tournaments,
    isListLoading,
    listError: listError ? (listError as Error).message : null,
  };
};

