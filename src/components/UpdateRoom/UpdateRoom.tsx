import React, { useState, useEffect } from 'react';
import { type Tournament, type UpdateRoomRequest } from '@services/api';
import { Modal } from '@components/common/Modal';
import './UpdateRoom.scss';

interface UpdateRoomProps {
  isOpen: boolean;
  tournament: Tournament | null;
  onClose: () => void;
  onUpdate: (data: UpdateRoomRequest) => Promise<void>;
  isUpdating: boolean;
}

const UpdateRoom: React.FC<UpdateRoomProps> = ({
  isOpen,
  tournament,
  onClose,
  onUpdate,
  isUpdating,
}) => {
  const [formData, setFormData] = useState<UpdateRoomRequest>({
    roomId: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tournament) {
      setFormData({
        roomId: tournament.room?.roomId || '',
        password: tournament.room?.password || '',
      });
      setError(null);
    }
  }, [tournament]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.roomId || !formData.password) {
      setError('Please fill all required fields');
      return;
    }

    try {
      await onUpdate(formData);
    } catch (err: any) {
      setError(err?.message || 'Failed to update room information');
    }
  };

  if (!tournament) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="modal-small"
      title="Update Room Information"
      showCloseButton={true}
      closeOnOverlayClick={!isUpdating}
          >
        <form className="update-room-form" onSubmit={handleSubmit}>
          <div className="update-room-modal-body">
            <div className="form-group">
              <label className="form-label">Room ID</label>
              <input
                type="text"
                className="form-input"
                value={formData.roomId}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                placeholder="Enter room ID"
                disabled={isUpdating}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="text"
                className="form-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter room password"
                disabled={isUpdating}
                required
              />
            </div>

            {error && (
              <div className="form-error-message">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="update-room-modal-footer">
            <button
              type="button"
              className="form-button form-button-secondary"
              onClick={onClose}
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="form-button form-button-primary"
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Room'}
            </button>
          </div>
        </form>
    </Modal>
  );
};

export default UpdateRoom;

