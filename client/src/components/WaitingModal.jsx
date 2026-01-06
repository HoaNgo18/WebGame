import React from 'react';

const WaitingModal = ({ friendName, friendTag, mode, onCancel, isDeclined }) => {
    return (
        <>
            <div className="modal-overlay" onClick={!isDeclined ? onCancel : undefined}></div>
            <div className="waiting-modal">
                <h3 className="waiting-modal-title">
                    {isDeclined ? 'Invite Declined' : `Waiting for ${friendName}#${friendTag}...`}
                </h3>

                {!isDeclined && (
                    <p className="waiting-modal-subtitle">Invited to {mode}</p>
                )}

                <div className="waiting-modal-content">
                    {isDeclined ? (
                        <div className="waiting-modal-declined">
                            <span className="decline-icon">✕</span>
                            <p>{friendName} declined your invite</p>
                        </div>
                    ) : (
                        <div className="waiting-modal-spinner"></div>
                    )}
                </div>

                {!isDeclined && (
                    <div className="modal-btns">
                        <button className="modal-btn-cancel" onClick={onCancel}>Cancel Invite</button>
                    </div>
                )}
            </div>
        </>
    );
};

export default WaitingModal;
