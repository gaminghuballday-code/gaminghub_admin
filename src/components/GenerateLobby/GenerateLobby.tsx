import React, { useState, useEffect } from 'react';
import { useGenerateLobbyLogic } from './GenerateLobby.logic';
import { Modal } from '@components/common/Modal';
import './GenerateLobby.scss';

interface GenerateLobbyProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const GenerateLobby: React.FC<GenerateLobbyProps> = ({ isOpen, onClose, onSuccess }) => {
  const {
    isSubmitting,
    error,
    fieldErrors,
    getFieldError,
    success,
    formData,
    setFormData,
    handleTimeSlotAdd,
    handleTimeSlotRemove,
    handleSubModeToggle,
    handleSubmit,
    closeModal,
    handleDateChange,
    isTimePassed,
  } = useGenerateLobbyLogic();

  const handleClose = () => {
    closeModal();
    onClose();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    await handleSubmit(e);
  };

  // Close modal immediately on success (toast shows API message)
  useEffect(() => {
    if (success) {
      if (onSuccess) {
        onSuccess();
      }
      closeModal();
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  const [selectedHour, setSelectedHour] = useState('12');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [isAM, setIsAM] = useState(true);

  const handleAddTimeSlot = () => {
    const hour = selectedHour.trim();
    const minute = selectedMinute.trim();
    if (!hour || !minute) {
      return;
    }
    const timeSlot = `${hour}:${minute} ${isAM ? 'AM' : 'PM'}`;
    handleTimeSlotAdd(timeSlot);
  };

  const handleStandardTimeClick = (timeSlot: string) => {
    // Directly add the quick time slot without touching inputs
    handleTimeSlotAdd(timeSlot);
  };

  const gameModes = [
    { value: 'BR', label: 'BR (Battle Royale)' },
    { value: 'LW', label: 'LW (Lone Wolf)' },
    { value: 'CS', label: 'CS (Clash Squad)' },
  ];
  const allSubModes = ['solo', 'duo', 'squad'];
  // Filter out 'squad' when Lone Wolf is selected
  const subModes = formData.mode === 'LW' 
    ? allSubModes.filter(mode => mode !== 'squad')
    : allSubModes;
  const regions = ['Asia', 'Europe', 'North America', 'South America', 'Africa', 'Oceania'];
  const timeHours = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const timeMinutes = ['00', '15', '30', '45'];

  const standardTimes = [
    { label: '12pm', value: '12:00 PM' },
    { label: '3pm', value: '3:00 PM' },
    { label: '6pm', value: '6:00 PM' },
    { label: '9pm', value: '9:00 PM' },
    { label: '12am', value: '12:00 AM' },
  ];
  const priceOptions = [25, 50, 75, 100, 150, 200, 300];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="modal-medium"
      title="Generate Lobby"
      showCloseButton={true}
      closeOnOverlayClick={!isSubmitting}
          >
        <form className="generate-lobby-form" onSubmit={handleFormSubmit}>
          <div className="generate-lobby-modal-body">
            {/* Date Selection */}
            <div className="form-group">
              <label className="form-label">Select Date</label>
              <input
                type="date"
                className={`form-input form-date-input ${getFieldError('dateType').length > 0 ? 'form-input-error' : ''}`}
                value={formData.dateType}
                onChange={(e) => handleDateChange(e.target.value)}
                disabled={isSubmitting}
                min={new Date().toISOString().split('T')[0]}
              />
              {getFieldError('dateType').length > 0 && (
                <div className="field-error">
                  {getFieldError('dateType').map((err, idx) => (
                    <div key={idx} className="field-error-message">{err}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Time Slots */}
            <div className="form-group">
              <label className="form-label">Time Slots</label>
              <div className="time-slots-container">
                <div className="time-slots-input-group">
                  <select
                    className={`form-select time-hour-select ${
                      getFieldError('timeSlots').length > 0 ? 'form-input-error' : ''
                    }`}
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(e.target.value)}
                    disabled={isSubmitting}
                  >
                    {timeHours.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <select
                    className={`form-select time-minute-select ${
                      getFieldError('timeSlots').length > 0 ? 'form-input-error' : ''
                    }`}
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(e.target.value)}
                    disabled={isSubmitting}
                  >
                    {timeMinutes.map((minute) => (
                      <option key={minute} value={minute}>
                        {minute}
                      </option>
                    ))}
                  </select>
                  <div className="am-pm-toggle">
                    <button
                      type="button"
                      className={`am-pm-button ${isAM ? 'active' : ''}`}
                      onClick={() => setIsAM(true)}
                      disabled={isSubmitting}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      className={`am-pm-button ${!isAM ? 'active' : ''}`}
                      onClick={() => setIsAM(false)}
                      disabled={isSubmitting}
                    >
                      PM
                    </button>
                  </div>
                  <button
                    type="button"
                    className="add-time-slot-button"
                    onClick={handleAddTimeSlot}
                    disabled={isSubmitting}
                  >
                    Add
                  </button>
                </div>
                <div className="standard-times-group">
                  <span className="standard-times-label">Quick Add:</span>
                  <div className="standard-times-buttons">
                    {standardTimes.map((stdTime) => (
                      <button
                        key={stdTime.value}
                        type="button"
                        className="standard-time-button"
                        onClick={() => handleStandardTimeClick(stdTime.value)}
                        disabled={
                          isSubmitting ||
                          !formData.dateType ||
                          isTimePassed(formData.dateType, stdTime.value)
                        }
                        title={
                          !formData.dateType
                            ? 'Select a date first'
                            : isTimePassed(formData.dateType, stdTime.value)
                            ? `Cannot select ${stdTime.value} — this time has already passed for the selected date`
                            : undefined
                        }
                      >
                        {stdTime.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {formData.timeSlots.length > 0 && (
                <div className="time-slots-list">
                  {formData.timeSlots.map((slot, index) => {
                    const slotErrors = getFieldError('timeSlots', index);
                    return (
                      <div key={index} className={`time-slot-tag ${slotErrors.length > 0 ? 'time-slot-tag-error' : ''}`}>
                        <span>{slot}</span>
                        <button
                          type="button"
                          className="remove-time-slot-button"
                          onClick={() => handleTimeSlotRemove(slot)}
                          disabled={isSubmitting}
                          aria-label={`Remove ${slot}`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Display general timeSlots errors (not specific to an index) */}
              {getFieldError('timeSlots').length > 0 && (
                <div className="field-error">
                  {getFieldError('timeSlots').map((err, idx) => (
                    <div key={idx} className="field-error-message">{err}</div>
                  ))}
                </div>
              )}
              {/* Display errors for specific time slot indices */}
              {formData.timeSlots.map((slot, index) => {
                const slotErrors = getFieldError('timeSlots', index);
                if (slotErrors.length === 0) return null;
                return (
                  <div key={`error-${index}`} className="field-error">
                    {slotErrors.map((err, idx) => (
                      <div key={idx} className="field-error-message">
                        {slot}: {err}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Game Mode */}
            <div className="form-group">
              <label className="form-label">Game Mode</label>
              <select
                className={`form-select ${getFieldError('mode').length > 0 ? 'form-input-error' : ''}`}
                value={formData.mode}
                onChange={(e) => {
                  const newMode = e.target.value;
                  // Remove 'squad' from subModes if switching to Lone Wolf
                  const updatedSubModes = newMode === 'LW' 
                    ? formData.subModes.filter(sm => sm !== 'squad')
                    : formData.subModes;
                  setFormData({ ...formData, mode: newMode, subModes: updatedSubModes });
                }}
                disabled={isSubmitting}
              >
                {gameModes.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
              {getFieldError('mode').length > 0 && (
                <div className="field-error">
                  {getFieldError('mode').map((err, idx) => (
                    <div key={idx} className="field-error-message">{err}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Sub Modes */}
            <div className="form-group">
              <label className="form-label">Sub Modes</label>
              <div className="sub-modes-checkboxes">
                {subModes.map((subMode) => (
                  <label key={subMode} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.subModes.includes(subMode)}
                      onChange={() => handleSubModeToggle(subMode)}
                      disabled={isSubmitting}
                    />
                    <span className="checkbox-text">{subMode}</span>
                  </label>
                ))}
              </div>
              {getFieldError('subModes').length > 0 && (
                <div className="field-error">
                  {getFieldError('subModes').map((err, idx) => (
                    <div key={idx} className="field-error-message">{err}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Region */}
            <div className="form-group">
              <label className="form-label">Region</label>
              <select
                className={`form-select ${getFieldError('region').length > 0 ? 'form-input-error' : ''}`}
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                disabled={isSubmitting}
              >
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
              {getFieldError('region').length > 0 && (
                <div className="field-error">
                  {getFieldError('region').map((err, idx) => (
                    <div key={idx} className="field-error-message">{err}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="form-group">
              <label className="form-label">Price</label>
              <select
                className={`form-select ${getFieldError('price').length > 0 ? 'form-input-error' : ''}`}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                disabled={isSubmitting}
              >
                {priceOptions.map((price) => (
                  <option key={price} value={price}>
                    ₹{price}
                  </option>
                ))}
              </select>
              {getFieldError('price').length > 0 && (
                <div className="field-error">
                  {getFieldError('price').map((err, idx) => (
                    <div key={idx} className="field-error-message">{err}</div>
                  ))}
                </div>
              )}
            </div>

            {/* General Error Message (only if no field-specific errors) */}
            {error && Object.keys(fieldErrors).length === 0 && (
              <div className="form-message form-error">
                <span className="message-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="generate-lobby-modal-footer">
            <button
              type="button"
              className="form-button form-button-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="form-button form-button-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Generating...' : 'Generate Lobbies'}
            </button>
          </div>
        </form>
    </Modal>
  );
};

export default GenerateLobby;

