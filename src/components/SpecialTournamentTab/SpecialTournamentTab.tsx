import React from 'react';
import { Button } from '@components/common/Button';
import { Modal } from '@components/common/Modal';
import { useSpecialTournamentTabLogic } from './SpecialTournamentTab.logic';
import type { CreateSpecialTournamentRequest } from '@services/api';
import './SpecialTournamentTab.scss';

const SpecialTournamentTab: React.FC = () => {
  const {
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
    openCreateModal,
    closeCreateModal,
    handleCreate,
    isCreating,
    createError,
    tournaments,
    isListLoading,
    listError,
  } = useSpecialTournamentTabLogic();

  const listTitle =
    filter === 'upcoming'
      ? 'Upcoming tournaments'
      : filter === 'live'
        ? 'Live tournaments'
        : 'Completed tournaments';

  return (
    <div className="special-tournament-tab">
      <div className="generate-lobby-page-card">
        <h2 className="card-title">Create special tournament</h2>
        <p className="card-description">
          Open the form to set title, mode, prize pool, slots, and rounds. Special events stay separate from daily lobby
          generation.
        </p>
        <Button variant="primary" onClick={openCreateModal} icon={<span>➕</span>} aria-label="Create special tournament">
          Create Tournament
        </Button>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        className="modal-medium"
        title="Create Special Tournament"
        showCloseButton={true}
        closeOnOverlayClick={!isCreating}
      >
        <form
          className="special-tournament-form"
          onSubmit={async (e) => {
            e.preventDefault();
            await handleCreate();
          }}
        >
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                className="form-input"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                disabled={isCreating}
                placeholder="Tournament title"
              />
            </div>
          </div>

          <div className="form-row form-row-3">
            <div className="form-group">
              <label className="form-label">Mode</label>
              <select
                className="form-select"
                value={form.mode}
                onChange={(e) =>
                  setForm((p) => ({ ...p, mode: e.target.value as CreateSpecialTournamentRequest['mode'] }))
                }
                disabled={isCreating}
              >
                <option value="BR">BR</option>
                <option value="CS">CS</option>
                <option value="LW">LW</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Sub Mode</label>
              <select
                className="form-select"
                value={form.subMode}
                onChange={(e) =>
                  setForm((p) => ({ ...p, subMode: e.target.value as CreateSpecialTournamentRequest['subMode'] }))
                }
                disabled={isCreating}
              >
                <option value="solo">solo</option>
                <option value="duo">duo</option>
                <option value="squad">squad</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Total Rounds</label>
              <input
                className="form-input"
                type="number"
                min={1}
                value={form.totalRounds}
                onChange={(e) => setForm((p) => ({ ...p, totalRounds: Number(e.target.value) }))}
                disabled={isCreating}
              />
            </div>
          </div>

          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">Prize Pool</label>
              <input
                className="form-input"
                type="number"
                min={0}
                value={form.prizePool}
                onChange={(e) => setForm((p) => ({ ...p, prizePool: Number(e.target.value) }))}
                disabled={isCreating}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Slots</label>
              <input
                className="form-input"
                type="number"
                min={2}
                value={form.maxSlots}
                onChange={(e) => setForm((p) => ({ ...p, maxSlots: Number(e.target.value) }))}
                disabled={isCreating}
              />
            </div>
          </div>

          {createError && <div className="form-error">{createError}</div>}

          <div className="form-actions form-actions-split">
            <Button variant="secondary" onClick={closeCreateModal} disabled={isCreating}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isCreating || !form.title.trim()} loading={isCreating}>
              Create Tournament
            </Button>
          </div>
        </form>
      </Modal>

      <div className="tournaments-list-card">
        <div className="tournaments-header">
          <h2 className="card-title">{listTitle}</h2>
          <div className="tournament-status-tabs">
            <button
              className={`status-tab ${filter === 'upcoming' ? 'active' : ''}`}
              onClick={() => setFilterValue('upcoming')}
              disabled={isListLoading}
              type="button"
            >
              Upcoming
            </button>
            <button
              className={`status-tab ${filter === 'live' ? 'active' : ''}`}
              onClick={() => setFilterValue('live')}
              disabled={isListLoading}
              type="button"
            >
              Live
            </button>
            <button
              className={`status-tab ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilterValue('completed')}
              disabled={isListLoading}
              type="button"
            >
              Completed
            </button>
          </div>
        </div>

        {isListLoading ? (
          <div className="tournaments-loading">
            <p>Loading tournaments...</p>
          </div>
        ) : listError ? (
          <div className="tournaments-error">
            <p>{listError}</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="tournaments-empty">
            <p>No tournaments found.</p>
          </div>
        ) : (
          <>
            <div className="special-tournament-list">
              {tournaments.map((t) => (
                <div key={t._id || t.id} className="special-tournament-item">
                  <div className="item-main">
                    <div className="item-title">{t.title}</div>
                    <div className="item-meta">
                      <span className="item-chip">{t.mode}</span>
                      <span className="item-chip">{t.subMode}</span>
                      {t.status && <span className="item-chip item-chip-status">{t.status}</span>}
                    </div>
                  </div>
                  <div className="item-stats">
                    <div className="stat">
                      <div className="stat-label">Prize</div>
                      <div className="stat-value">₹{t.prizePool}</div>
                    </div>
                    <div className="stat">
                      <div className="stat-label">Slots</div>
                      <div className="stat-value">{t.maxSlots}</div>
                    </div>
                    <div className="stat">
                      <div className="stat-label">Rounds</div>
                      <div className="stat-value">{t.totalRounds}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="special-tournament-pagination">
              <div className="special-tournament-pagination__info">
                Page {currentPage} of {totalPages} ({total} total)
              </div>
              <div className="special-tournament-pagination__controls">
                <Button variant="secondary" size="sm" onClick={handlePrevPage} disabled={!hasPrevPage}>
                  Previous
                </Button>
                <Button variant="secondary" size="sm" onClick={handleNextPage} disabled={!hasNextPage}>
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SpecialTournamentTab;

