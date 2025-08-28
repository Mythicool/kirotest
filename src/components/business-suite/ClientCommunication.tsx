import React, { useState } from 'react';
import { Client, VideoConference, Participant, ChatMessage, SharedFile, BusinessSettings } from '@/types/business-suite';
import Button from '@/components/ui/Button';

interface ClientCommunicationProps {
  clients: Client[];
  settings: BusinessSettings;
  onClientUpdate: (clients: Client[]) => void;
}

export const ClientCommunication: React.FC<ClientCommunicationProps> = ({
  clients,
  settings,
  onClientUpdate
}) => {
  const [activeView, setActiveView] = useState<'clients' | 'meetings' | 'create-meeting' | 'active-meeting'>('clients');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [meetings, setMeetings] = useState<VideoConference[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<VideoConference | null>(null);
  const [newMeeting, setNewMeeting] = useState<Partial<VideoConference>>({
    title: '',
    participants: [],
    startTime: new Date(),
    duration: 60
  });
  const [chatMessage, setChatMessage] = useState('');
  const [isInMeeting, setIsInMeeting] = useState(false);

  const generateMeetingRoom = () => {
    const roomPrefix = settings.integrationSettings.videoConferencing.roomPrefix || 'business';
    const roomId = `${roomPrefix}-${Date.now()}`;
    return roomId;
  };

  const handleCreateMeeting = () => {
    const meeting: VideoConference = {
      id: `meeting-${Date.now()}`,
      title: newMeeting.title || 'Business Meeting',
      participants: newMeeting.participants || [],
      startTime: newMeeting.startTime || new Date(),
      duration: newMeeting.duration || 60,
      chatMessages: [],
      sharedFiles: []
    };

    setMeetings(prev => [...prev, meeting]);
    setNewMeeting({ title: '', participants: [], startTime: new Date(), duration: 60 });
    setActiveView('meetings');
  };

  const handleJoinMeeting = (meeting: VideoConference) => {
    setActiveMeeting(meeting);
    setIsInMeeting(true);
    setActiveView('active-meeting');
    
    // Integration with video conferencing services
    const provider = settings.integrationSettings.videoConferencing.provider;
    let meetingUrl = '';
    
    switch (provider) {
      case 'jitsi':
        meetingUrl = `https://meet.jit.si/${generateMeetingRoom()}`;
        break;
      case 'whereby':
        meetingUrl = `https://whereby.com/${generateMeetingRoom()}`;
        break;
      case 'meet':
        meetingUrl = `https://meet.google.com/new`;
        break;
      default:
        meetingUrl = `https://meet.jit.si/${generateMeetingRoom()}`;
    }
    
    // Open meeting in new window/tab
    window.open(meetingUrl, '_blank', 'width=1200,height=800');
  };

  const handleSendChatMessage = () => {
    if (!activeMeeting || !chatMessage.trim()) return;
    
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'current-user',
      message: chatMessage,
      timestamp: new Date(),
      type: 'text'
    };
    
    const updatedMeeting = {
      ...activeMeeting,
      chatMessages: [...activeMeeting.chatMessages, message]
    };
    
    setActiveMeeting(updatedMeeting);
    setMeetings(prev => prev.map(m => m.id === activeMeeting.id ? updatedMeeting : m));
    setChatMessage('');
  };

  const handleFileShare = (file: File) => {
    if (!activeMeeting) return;
    
    const sharedFile: SharedFile = {
      id: `file-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      sharedBy: 'current-user',
      sharedAt: new Date()
    };
    
    const updatedMeeting = {
      ...activeMeeting,
      sharedFiles: [...activeMeeting.sharedFiles, sharedFile]
    };
    
    setActiveMeeting(updatedMeeting);
    setMeetings(prev => prev.map(m => m.id === activeMeeting.id ? updatedMeeting : m));
  };

  const renderClientList = () => (
    <div className="client-list">
      <div className="list-header">
        <h3>Clients</h3>
        <Button onClick={() => setActiveView('create-meeting')} className="primary">
          Schedule Meeting
        </Button>
      </div>
      
      <div className="client-grid">
        {clients.map(client => (
          <div key={client.id} className="client-card">
            <div className="client-header">
              <h4>{client.name}</h4>
              {client.company && <span className="company">{client.company}</span>}
            </div>
            
            <div className="client-contact">
              <div className="contact-item">
                <span className="label">Email:</span>
                <span>{client.email}</span>
              </div>
              {client.phone && (
                <div className="contact-item">
                  <span className="label">Phone:</span>
                  <span>{client.phone}</span>
                </div>
              )}
            </div>
            
            {client.address && (
              <div className="client-address">
                <span className="label">Address:</span>
                <div className="address">
                  {client.address.street}<br />
                  {client.address.city}, {client.address.state} {client.address.zipCode}
                </div>
              </div>
            )}
            
            <div className="client-stats">
              <span>Projects: {client.projects.length}</span>
            </div>
            
            <div className="client-actions">
              <Button 
                onClick={() => {
                  setSelectedClient(client);
                  setNewMeeting(prev => ({
                    ...prev,
                    participants: [{
                      id: client.id,
                      name: client.name,
                      email: client.email,
                      role: 'participant',
                      joinTime: new Date(),
                      micMuted: false,
                      videoEnabled: true
                    }]
                  }));
                  setActiveView('create-meeting');
                }}
                className="small primary"
              >
                Schedule Meeting
              </Button>
              <Button 
                onClick={() => window.open(`mailto:${client.email}`, '_blank')}
                className="small secondary"
              >
                Send Email
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMeetingList = () => (
    <div className="meeting-list">
      <div className="list-header">
        <h3>Meetings</h3>
        <Button onClick={() => setActiveView('create-meeting')} className="primary">
          Schedule New Meeting
        </Button>
      </div>
      
      <div className="meeting-filters">
        <select>
          <option value="">All Meetings</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      
      <div className="meeting-table">
        <div className="table-header">
          <div>Title</div>
          <div>Participants</div>
          <div>Date & Time</div>
          <div>Duration</div>
          <div>Status</div>
          <div>Actions</div>
        </div>
        
        {meetings.map(meeting => {
          const isUpcoming = meeting.startTime > new Date();
          const isActive = isUpcoming && meeting.startTime.getTime() - Date.now() < 15 * 60 * 1000; // 15 minutes before
          
          return (
            <div key={meeting.id} className="table-row">
              <div>{meeting.title}</div>
              <div>{meeting.participants.length} participants</div>
              <div>
                {meeting.startTime.toLocaleDateString()} at {meeting.startTime.toLocaleTimeString()}
              </div>
              <div>{meeting.duration} minutes</div>
              <div>
                <span className={`status-badge ${isActive ? 'active' : isUpcoming ? 'upcoming' : 'completed'}`}>
                  {isActive ? 'Ready to Join' : isUpcoming ? 'Upcoming' : 'Completed'}
                </span>
              </div>
              <div className="action-buttons">
                {isActive && (
                  <Button 
                    onClick={() => handleJoinMeeting(meeting)}
                    className="small primary"
                  >
                    Join Meeting
                  </Button>
                )}
                <Button 
                  onClick={() => {
                    setActiveMeeting(meeting);
                    setActiveView('active-meeting');
                  }}
                  className="small"
                >
                  View Details
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCreateMeeting = () => (
    <div className="create-meeting">
      <div className="form-header">
        <h3>Schedule New Meeting</h3>
        <Button onClick={() => setActiveView('meetings')} className="secondary">
          Back to Meetings
        </Button>
      </div>
      
      <div className="meeting-form">
        <div className="form-section">
          <h4>Meeting Details</h4>
          <div className="form-field">
            <label>Meeting Title</label>
            <input 
              type="text"
              value={newMeeting.title || ''}
              onChange={(e) => setNewMeeting(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter meeting title"
            />
          </div>
          
          <div className="form-row">
            <div className="form-field">
              <label>Date</label>
              <input 
                type="date"
                value={newMeeting.startTime?.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  const currentTime = newMeeting.startTime || new Date();
                  const newDate = new Date(e.target.value);
                  newDate.setHours(currentTime.getHours(), currentTime.getMinutes());
                  setNewMeeting(prev => ({ ...prev, startTime: newDate }));
                }}
              />
            </div>
            
            <div className="form-field">
              <label>Time</label>
              <input 
                type="time"
                value={newMeeting.startTime?.toTimeString().slice(0, 5) || ''}
                onChange={(e) => {
                  const currentDate = newMeeting.startTime || new Date();
                  const [hours, minutes] = e.target.value.split(':');
                  const newDateTime = new Date(currentDate);
                  newDateTime.setHours(parseInt(hours), parseInt(minutes));
                  setNewMeeting(prev => ({ ...prev, startTime: newDateTime }));
                }}
              />
            </div>
            
            <div className="form-field">
              <label>Duration (minutes)</label>
              <select 
                value={newMeeting.duration || 60}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, duration: Number(e.target.value) }))}
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h4>Participants</h4>
          <div className="participant-selection">
            {clients.map(client => (
              <div key={client.id} className="participant-option">
                <input 
                  type="checkbox"
                  id={`client-${client.id}`}
                  checked={newMeeting.participants?.some(p => p.id === client.id) || false}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const participant: Participant = {
                        id: client.id,
                        name: client.name,
                        email: client.email,
                        role: 'participant',
                        joinTime: new Date(),
                        micMuted: false,
                        videoEnabled: true
                      };
                      setNewMeeting(prev => ({
                        ...prev,
                        participants: [...(prev.participants || []), participant]
                      }));
                    } else {
                      setNewMeeting(prev => ({
                        ...prev,
                        participants: prev.participants?.filter(p => p.id !== client.id) || []
                      }));
                    }
                  }}
                />
                <label htmlFor={`client-${client.id}`}>
                  {client.name} ({client.email})
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-section">
          <h4>Video Conferencing Settings</h4>
          <div className="form-field">
            <label>Platform</label>
            <select value={settings.integrationSettings.videoConferencing.provider}>
              <option value="jitsi">Jitsi Meet (Free)</option>
              <option value="whereby">Whereby</option>
              <option value="meet">Google Meet</option>
            </select>
          </div>
        </div>
        
        <div className="form-actions">
          <Button onClick={handleCreateMeeting} className="primary">
            Schedule Meeting
          </Button>
          <Button onClick={() => setActiveView('meetings')} className="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );

  const renderActiveMeeting = () => {
    if (!activeMeeting) return null;
    
    return (
      <div className="active-meeting">
        <div className="meeting-header">
          <h3>{activeMeeting.title}</h3>
          <div className="meeting-controls">
            <Button 
              onClick={() => handleJoinMeeting(activeMeeting)}
              className="primary"
            >
              Join Video Call
            </Button>
            <Button 
              onClick={() => setActiveView('meetings')}
              className="secondary"
            >
              Back to Meetings
            </Button>
          </div>
        </div>
        
        <div className="meeting-content">
          <div className="meeting-info">
            <div className="info-section">
              <h4>Meeting Details</h4>
              <div className="detail-item">
                <span>Start Time:</span>
                <span>{activeMeeting.startTime.toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span>Duration:</span>
                <span>{activeMeeting.duration} minutes</span>
              </div>
              <div className="detail-item">
                <span>Participants:</span>
                <span>{activeMeeting.participants.length}</span>
              </div>
            </div>
            
            <div className="participants-section">
              <h4>Participants</h4>
              <div className="participants-list">
                {activeMeeting.participants.map(participant => (
                  <div key={participant.id} className="participant-item">
                    <span className="participant-name">{participant.name}</span>
                    <span className="participant-role">{participant.role}</span>
                    <div className="participant-status">
                      <span className={`status-indicator ${participant.micMuted ? 'muted' : 'unmuted'}`}>
                        🎤
                      </span>
                      <span className={`status-indicator ${participant.videoEnabled ? 'video-on' : 'video-off'}`}>
                        📹
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="meeting-sidebar">
            <div className="chat-section">
              <h4>Chat</h4>
              <div className="chat-messages">
                {activeMeeting.chatMessages.map(message => (
                  <div key={message.id} className="chat-message">
                    <div className="message-header">
                      <span className="sender">
                        {activeMeeting.participants.find(p => p.id === message.senderId)?.name || 'Unknown'}
                      </span>
                      <span className="timestamp">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="message-content">{message.message}</div>
                  </div>
                ))}
              </div>
              
              <div className="chat-input">
                <input 
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                />
                <Button onClick={handleSendChatMessage} className="small">
                  Send
                </Button>
              </div>
            </div>
            
            <div className="files-section">
              <h4>Shared Files</h4>
              <div className="file-upload">
                <input 
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileShare(file);
                  }}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <Button 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="small secondary"
                >
                  Share File
                </Button>
              </div>
              
              <div className="shared-files">
                {activeMeeting.sharedFiles.map(file => (
                  <div key={file.id} className="shared-file">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                    <Button 
                      onClick={() => window.open(file.url, '_blank')}
                      className="small"
                    >
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="client-communication">
      <div className="communication-tabs">
        <Button 
          onClick={() => setActiveView('clients')}
          className={`tab-button ${activeView === 'clients' ? 'active' : ''}`}
        >
          Clients
        </Button>
        <Button 
          onClick={() => setActiveView('meetings')}
          className={`tab-button ${activeView === 'meetings' ? 'active' : ''}`}
        >
          Meetings
        </Button>
      </div>
      
      <div className="communication-content">
        {activeView === 'clients' && renderClientList()}
        {activeView === 'meetings' && renderMeetingList()}
        {activeView === 'create-meeting' && renderCreateMeeting()}
        {activeView === 'active-meeting' && renderActiveMeeting()}
      </div>
    </div>
  );
};