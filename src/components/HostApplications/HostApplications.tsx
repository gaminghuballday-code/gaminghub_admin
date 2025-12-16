import React, { useState, useMemo } from 'react';
import { 
  // type HostApplication, 
  type HostWithAssignments,
  type HostAssignment,
  type Tournament 
} from '@services/api';
import {
  useHostApplications,
  useAllHostsWithAssignments,
  useApproveApplication,
  useRejectApplication,
  useAssignHost,
} from '@services/api/hooks';
import { Modal } from '@components/common/Modal';
import ConfirmationModal from '@components/common/ConfirmationModal';
import './HostApplications.scss';

interface HostApplicationsProps {
  isOpen: boolean;
  tournamentId: string;
  tournament: Tournament;
  onClose: () => void;
  onApplicationProcessed: () => void;
}

// Utility function to check if two time slots conflict
const checkTimeConflict = (time1: string, date1: string, time2: string, date2: string): boolean => {
  // If dates are different, no conflict
  if (date1 !== date2) {
    return false;
  }

  // Parse time strings like "12:00 AM" or "3:00 PM"
  const parseTime = (timeStr: string): number => {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return -1;
    
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + minutes; // Convert to minutes for comparison
  };

  const time1Minutes = parseTime(time1);
  const time2Minutes = parseTime(time2);

  if (time1Minutes === -1 || time2Minutes === -1) {
    // If parsing fails, do exact string match
    return time1 === time2;
  }

  // Check if times are the same (exact match)
  return time1Minutes === time2Minutes;
};

const HostApplications: React.FC<HostApplicationsProps> = ({
  isOpen,
  tournamentId,
  tournament,
  onClose,
  onApplicationProcessed,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [hostToAssign, setHostToAssign] = useState<HostWithAssignments | null>(null);
  const [viewMode, setViewMode] = useState<'applications' | 'all-hosts'>('applications');

  // TanStack Query hooks
  const { data: applications = [], isLoading: applicationsLoading, refetch: refetchApplications } = useHostApplications(
    tournamentId,
    isOpen && viewMode === 'applications'
  );
  
  const { data: allHostsData = [], isLoading: hostsLoading, error: hostsError, refetch: refetchAllHosts } = useAllHostsWithAssignments(
    tournamentId,
    isOpen && viewMode === 'all-hosts'
  );
  
  const loading = viewMode === 'applications' ? applicationsLoading : hostsLoading;
  const error = hostsError ? (hostsError as Error).message : null;

  // Deduplicate applications - show only one application per host (prefer pending, then most recent)
  const uniqueApplications = useMemo(() => {
    if (!applications || applications.length === 0) return [];
    
    // Group applications by hostId (normalize hostId to string)
    const applicationsByHost = new Map<string, typeof applications>();
    
    applications.forEach((app) => {
      // Get hostId - can be string or object, normalize to string
      let hostId: string = '';
      if (typeof app.hostId === 'string') {
        hostId = app.hostId;
      } else if (app.hostId && typeof app.hostId === 'object') {
        hostId = app.hostId._id || app.hostId.hostId || '';
      }
      
      // Fallback to userId if hostId is not available
      if (!hostId) {
        hostId = app.userId || '';
      }
      
      if (!hostId) return;
      
      if (!applicationsByHost.has(hostId)) {
        applicationsByHost.set(hostId, []);
      }
      applicationsByHost.get(hostId)!.push(app);
    });
    
    // For each host, select the best application:
    // 1. Prefer pending applications
    // 2. If multiple pending, take the most recent
    // 3. If no pending, take the most recent
    const unique: typeof applications = [];
    
    applicationsByHost.forEach((hostApps) => {
      // Sort by: pending first, then by createdAt (most recent first)
      const sorted = [...hostApps].sort((a, b) => {
        // Pending applications first
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        
        // Then by createdAt (most recent first)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      // Take the first one (best application for this host)
      if (sorted.length > 0) {
        unique.push(sorted[0]);
      }
    });
    
    return unique;
  }, [applications]);
  
  // Process hosts - use backend conflict data if available, otherwise calculate
  const allHosts = useMemo(() => {
    return allHostsData.map(host => {
      // Safety check: ensure assignedLobbies is an array
      const assignedLobbies = Array.isArray(host.assignedLobbies) ? host.assignedLobbies : [];
      
      // Use backend conflict data if available, otherwise calculate conflicts
      const hasConflict = host.hasTimeConflict !== undefined 
        ? host.hasTimeConflict 
        : assignedLobbies.some(assignment => 
            assignment &&
            assignment.tournamentStartTime &&
            assignment.tournamentDate &&
            checkTimeConflict(
              tournament.startTime,
              tournament.date,
              assignment.tournamentStartTime,
              assignment.tournamentDate
            )
          );
      
      const conflictingAssignments = host.timeConflictDetails && Array.isArray(host.timeConflictDetails)
        ? host.timeConflictDetails
        : assignedLobbies.filter(assignment => 
            assignment &&
            assignment.tournamentStartTime &&
            assignment.tournamentDate &&
            checkTimeConflict(
              tournament.startTime,
              tournament.date,
              assignment.tournamentStartTime,
              assignment.tournamentDate
            )
          );
      
      return {
        ...host,
        assignedLobbies: assignedLobbies,
        totalLobbies: host.totalLobbies || assignedLobbies.length,
        hasTimeConflict: hasConflict,
        conflictingTournaments: conflictingAssignments,
      };
    });
  }, [allHostsData, tournament]);
  
  const approveMutation = useApproveApplication();
  const rejectMutation = useRejectApplication();
  const assignHostMutation = useAssignHost();

  const handleApprove = (applicationId: string) => {
    setProcessingId(applicationId);
    approveMutation.mutate(applicationId, {
      onSuccess: () => {
        setProcessingId(null);
        refetchApplications();
        refetchAllHosts();
        onApplicationProcessed();
        onClose(); // Close modal after successful approval
      },
      onError: (err: any) => {
        console.error('Failed to approve application:', err);
        setProcessingId(null);
      },
    });
  };

  const handleReject = (applicationId: string) => {
    setProcessingId(applicationId);
    rejectMutation.mutate(applicationId, {
      onSuccess: () => {
        setProcessingId(null);
        refetchApplications();
        refetchAllHosts();
        onApplicationProcessed();
      },
      onError: (err: any) => {
        console.error('Failed to reject application:', err);
        setProcessingId(null);
      },
    });
  };

  const handleAssignHost = (host: HostWithAssignments) => {
    if (host.hasTimeConflict) {
      setHostToAssign(host);
      setShowConflictModal(true);
    } else {
      assignHostDirectly(host);
    }
  };

  const assignHostDirectly = (host?: HostWithAssignments) => {
    // Use passed host or hostToAssign from state (for conflict modal)
    const hostToUse = host || hostToAssign;
    if (!hostToUse) return;

    setProcessingId(hostToUse.hostId);
    assignHostMutation.mutate(
      {
        tournamentId,
        hostId: hostToUse.hostId,
      },
      {
        onSuccess: () => {
          setProcessingId(null);
          refetchAllHosts();
          refetchApplications();
          onApplicationProcessed();
          setShowConflictModal(false);
          setHostToAssign(null);
        },
        onError: (err: any) => {
          console.error('Failed to assign host:', err);
          setProcessingId(null);
        },
      }
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className="modal-large"
        title="Assign Host to Tournament"
        showCloseButton={true}
        closeOnOverlayClick={!loading}
            >

          {/* View Mode Toggle */}
          <div className="host-applications-view-toggle">
            <button
              className={`view-toggle-button ${viewMode === 'applications' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('applications');
                if (applications.length === 0) {
                  // loadApplications();
                }
              }}
              disabled={loading}
            >
              Applications ({uniqueApplications.length})
            </button>
            <button
              className={`view-toggle-button ${viewMode === 'all-hosts' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('all-hosts');
                if (allHosts.length === 0) {
                  // loadAllHosts();
                }
              }}
              disabled={loading}
            >
              All Hosts ({allHosts.length})
            </button>
          </div>

          <div className="host-applications-modal-body">
            {loading ? (
              <div className="host-applications-loading">
                <p>Loading...</p>
              </div>
            ) : error ? (
              <div className="host-applications-error">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            ) : viewMode === 'applications' ? (
              uniqueApplications.length === 0 ? (
                <div className="host-applications-empty">
                  <p>No host applications found for this tournament.</p>
                </div>
              ) : (
                <div className="host-applications-list">
                  {uniqueApplications.map((application) => (
                    <div key={application._id || application.id} className="host-application-card">
                      <div className="application-info">
                        <div className="application-user">
                          <span className="application-label">User:</span>
                          <span className="application-value">
                            {application.user?.name || application.user?.email || application.userId || 'N/A'}
                          </span>
                        </div>
                        {application.user?.email && (
                          <div className="application-email">
                            <span className="application-label">Email:</span>
                            <span className="application-value">{application.user.email}</span>
                          </div>
                        )}
                        <div className="application-status">
                          <span className="application-label">Status:</span>
                          <span className={`application-value status-badge status-${application.status}`}>
                            {application.status}
                          </span>
                        </div>
                        {application.createdAt && (
                          <div className="application-date">
                            <span className="application-label">Applied:</span>
                            <span className="application-value">
                              {new Date(application.createdAt).toLocaleString('en-IN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      {application.status === 'pending' && (
                        <div className="application-actions">
                          <button
                            className="application-button application-button-approve"
                            onClick={() => handleApprove(application._id || application.id || '')}
                            disabled={processingId === (application._id || application.id)}
                          >
                            {processingId === (application._id || application.id) ? 'Processing...' : 'Accept'}
                          </button>
                          <button
                            className="application-button application-button-reject"
                            onClick={() => handleReject(application._id || application.id || '')}
                            disabled={processingId === (application._id || application.id)}
                          >
                            {processingId === (application._id || application.id) ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              allHosts.length === 0 ? (
                <div className="host-applications-empty">
                  <p>No hosts found.</p>
                </div>
              ) : (
                <div className="host-applications-list">
                  {allHosts.map((host) => (
                    <div 
                      key={host.hostId} 
                      className={`host-card ${host.hasTimeConflict ? 'host-card-conflict' : ''}`}
                    >
                      <div className="host-info">
                        <div className="host-user">
                          <span className="host-label">Host:</span>
                          <span className="host-value">
                            {host.name || host.email || host.hostId || 'N/A'}
                          </span>
                        </div>
                        {host.email && (
                          <div className="host-email">
                            <span className="host-label">Email:</span>
                            <span className="host-value">{host.email}</span>
                          </div>
                        )}
                        <div className="host-assignments-count">
                          <span className="host-label">Total Lobbies:</span>
                          <span className="host-value">{host.totalLobbies}</span>
                        </div>
                        {host.hasTimeConflict && (
                          <div className="host-conflict-warning">
                            <span className="warning-icon">⚠️</span>
                            <span className="warning-text">
                              Time conflict detected! This host already has a lobby at {tournament.startTime} on {formatDate(tournament.date)}
                            </span>
                          </div>
                        )}
                        {host.assignedLobbies.length > 0 && (
                          <div className="host-previous-assignments">
                            <span className="host-label">Previous Assignments:</span>
                            <div className="assignments-list">
                              {host.assignedLobbies.map((assignment, idx) => {
                                const isConflict = checkTimeConflict(
                                  tournament.startTime,
                                  tournament.date,
                                  assignment.tournamentStartTime,
                                  assignment.tournamentDate
                                );
                                return (
                                  <div 
                                    key={idx} 
                                    className={`assignment-item ${isConflict ? 'assignment-conflict' : ''}`}
                                  >
                                    <span className="assignment-details">
                                      {assignment.tournamentGame || 'N/A'} - {assignment.tournamentMode || 'N/A'} ({assignment.tournamentSubMode || 'N/A'})
                                    </span>
                                    <span className="assignment-time">
                                      {formatDate(assignment.tournamentDate)} at {assignment.tournamentStartTime}
                                    </span>
                                    {isConflict && (
                                      <span className="assignment-conflict-badge">⚠️ Conflict</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="host-actions">
                        <button
                          className={`host-button host-button-assign ${host.hasTimeConflict ? 'host-button-warning' : ''}`}
                          onClick={() => handleAssignHost(host)}
                          disabled={processingId === host.hostId}
                        >
                          {processingId === host.hostId ? 'Assigning...' : 'Assign Host'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          <div className="host-applications-modal-footer">
            <button
              type="button"
              className="host-applications-button host-applications-button-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Close
            </button>
          </div>
      </Modal>

      {/* Conflict Confirmation Modal */}
      {showConflictModal && hostToAssign && (
        <ConfirmationModal
          isOpen={showConflictModal}
          title="Time Conflict Warning"
          message={
            <div>
              <p>
                <strong>Warning:</strong> This host already has a lobby assignment at the same time!
              </p>
              <p>
                <strong>Tournament Time:</strong> {tournament.startTime} on {formatDate(tournament.date)}
              </p>
              {hostToAssign.timeConflictDetails && hostToAssign.timeConflictDetails.length > 0 && (
                <div>
                  <p><strong>Conflicting Assignments:</strong></p>
                  <ul>
                    {hostToAssign.timeConflictDetails.map((conflict: HostAssignment, idx: number) => (
                      <li key={idx}>
                        {conflict.tournamentGame || 'N/A'} - {conflict.tournamentMode || 'N/A'} ({conflict.tournamentSubMode || 'N/A'}) 
                        at {conflict.tournamentStartTime} on {formatDate(conflict.tournamentDate)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p>Are you sure you want to assign this host despite the time conflict?</p>
            </div>
          }
          confirmText="Yes, Assign Anyway"
          cancelText="Cancel"
          onConfirm={assignHostDirectly}
          onCancel={() => {
            setShowConflictModal(false);
            setHostToAssign(null);
          }}
        />
      )}
    </>
  );
};

export default HostApplications;
