import React, { useState } from 'react';
import { BusinessSettings, SocialMediaPost, MediaAttachment, PostEngagement } from '@/types/business-suite';
import Button from '@/components/ui/Button';

interface SocialMediaSchedulingProps {
  settings: BusinessSettings;
}

export const SocialMediaScheduling: React.FC<SocialMediaSchedulingProps> = ({ settings }) => {
  const [activeView, setActiveView] = useState<'calendar' | 'create' | 'analytics' | 'tools'>('calendar');
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [newPost, setNewPost] = useState<Partial<SocialMediaPost>>({
    platform: 'facebook',
    content: '',
    media: [],
    scheduledTime: new Date(),
    status: 'draft'
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isScheduling, setIsScheduling] = useState(false);

  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: '📘', color: '#1877f2' },
    { id: 'twitter', name: 'Twitter', icon: '🐦', color: '#1da1f2' },
    { id: 'instagram', name: 'Instagram', icon: '📷', color: '#e4405f' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0077b5' },
    { id: 'youtube', name: 'YouTube', icon: '📺', color: '#ff0000' }
  ];

  const handleCreatePost = async () => {
    if (!newPost.content?.trim()) return;

    setIsScheduling(true);

    try {
      const post: SocialMediaPost = {
        id: `post-${Date.now()}`,
        platform: newPost.platform || 'facebook',
        content: newPost.content,
        media: newPost.media || [],
        scheduledTime: newPost.scheduledTime || new Date(),
        status: 'scheduled'
      };

      setPosts(prev => [...prev, post]);
      setNewPost({
        platform: 'facebook',
        content: '',
        media: [],
        scheduledTime: new Date(),
        status: 'draft'
      });
      setActiveView('calendar');
    } catch (error) {
      console.error('Failed to schedule post:', error);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleMediaUpload = (file: File) => {
    const mediaAttachment: MediaAttachment = {
      id: `media-${Date.now()}`,
      type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'image',
      url: URL.createObjectURL(file),
      dimensions: { width: 1080, height: 1080 }, // Default dimensions
      altText: file.name
    };

    setNewPost(prev => ({
      ...prev,
      media: [...(prev.media || []), mediaAttachment]
    }));
  };

  const getPostsForDate = (date: Date) => {
    return posts.filter(post => 
      post.scheduledTime.toDateString() === date.toDateString()
    );
  };

  const renderCalendarView = () => {
    const today = new Date();
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayPosts = getPostsForDate(date);
      const isToday = date.toDateString() === today.toDateString();
      
      calendarDays.push(
        <div key={day} className={`calendar-day ${isToday ? 'today' : ''}`}>
          <div className="day-number">{day}</div>
          <div className="day-posts">
            {dayPosts.slice(0, 3).map(post => (
              <div key={post.id} className={`post-indicator ${post.platform}`}>
                {platforms.find(p => p.id === post.platform)?.icon}
              </div>
            ))}
            {dayPosts.length > 3 && (
              <div className="more-posts">+{dayPosts.length - 3}</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="calendar-view">
        <div className="calendar-header">
          <div className="calendar-nav">
            <Button 
              onClick={() => setSelectedDate(new Date(currentYear, currentMonth - 1, 1))}
              className="nav-button"
            >
              ‹
            </Button>
            <h3>{selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
            <Button 
              onClick={() => setSelectedDate(new Date(currentYear, currentMonth + 1, 1))}
              className="nav-button"
            >
              ›
            </Button>
          </div>
          <Button onClick={() => setActiveView('create')} className="primary">
            Create Post
          </Button>
        </div>
        
        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>
          <div className="calendar-days">
            {calendarDays}
          </div>
        </div>
        
        <div className="scheduled-posts">
          <h4>Upcoming Posts</h4>
          <div className="posts-list">
            {posts
              .filter(post => post.scheduledTime > new Date())
              .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
              .slice(0, 5)
              .map(post => (
                <div key={post.id} className="post-item">
                  <div className="post-platform">
                    <span className="platform-icon">
                      {platforms.find(p => p.id === post.platform)?.icon}
                    </span>
                    <span className="platform-name">
                      {platforms.find(p => p.id === post.platform)?.name}
                    </span>
                  </div>
                  <div className="post-content">
                    <p>{post.content.substring(0, 100)}...</p>
                    <div className="post-time">
                      {post.scheduledTime.toLocaleDateString()} at {post.scheduledTime.toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="post-status">
                    <span className={`status-badge ${post.status}`}>
                      {post.status}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCreatePost = () => (
    <div className="create-post">
      <div className="create-header">
        <h3>Create Social Media Post</h3>
        <Button onClick={() => setActiveView('calendar')} className="secondary">
          Back to Calendar
        </Button>
      </div>
      
      <div className="post-form">
        <div className="form-section">
          <h4>Platform Selection</h4>
          <div className="platform-selector">
            {platforms.map(platform => (
              <div 
                key={platform.id}
                className={`platform-option ${newPost.platform === platform.id ? 'selected' : ''}`}
                onClick={() => setNewPost(prev => ({ ...prev, platform: platform.id as any }))}
                style={{ borderColor: platform.color }}
              >
                <span className="platform-icon">{platform.icon}</span>
                <span className="platform-name">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-section">
          <h4>Post Content</h4>
          <textarea 
            value={newPost.content || ''}
            onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
            placeholder="What would you like to share?"
            className="content-textarea"
            rows={6}
          />
          <div className="character-count">
            {(newPost.content || '').length}/280 characters
          </div>
        </div>
        
        <div className="form-section">
          <h4>Media Attachments</h4>
          <div className="media-upload">
            <input 
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleMediaUpload(file);
              }}
              style={{ display: 'none' }}
              id="media-upload"
            />
            <Button 
              onClick={() => document.getElementById('media-upload')?.click()}
              className="upload-button"
            >
              📎 Add Media
            </Button>
          </div>
          
          {newPost.media && newPost.media.length > 0 && (
            <div className="media-preview">
              {newPost.media.map(media => (
                <div key={media.id} className="media-item">
                  {media.type === 'image' ? (
                    <img src={media.url} alt={media.altText} />
                  ) : (
                    <video src={media.url} controls />
                  )}
                  <Button 
                    onClick={() => setNewPost(prev => ({
                      ...prev,
                      media: prev.media?.filter(m => m.id !== media.id) || []
                    }))}
                    className="remove-media"
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="form-section">
          <h4>Scheduling</h4>
          <div className="scheduling-options">
            <div className="schedule-option">
              <input 
                type="radio"
                id="post-now"
                name="schedule"
                onChange={() => setNewPost(prev => ({ ...prev, scheduledTime: new Date() }))}
              />
              <label htmlFor="post-now">Post Now</label>
            </div>
            <div className="schedule-option">
              <input 
                type="radio"
                id="schedule-later"
                name="schedule"
                defaultChecked
              />
              <label htmlFor="schedule-later">Schedule for Later</label>
            </div>
          </div>
          
          <div className="datetime-inputs">
            <input 
              type="date"
              value={newPost.scheduledTime?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                const currentTime = newPost.scheduledTime || new Date();
                const newDate = new Date(e.target.value);
                newDate.setHours(currentTime.getHours(), currentTime.getMinutes());
                setNewPost(prev => ({ ...prev, scheduledTime: newDate }));
              }}
            />
            <input 
              type="time"
              value={newPost.scheduledTime?.toTimeString().slice(0, 5) || ''}
              onChange={(e) => {
                const currentDate = newPost.scheduledTime || new Date();
                const [hours, minutes] = e.target.value.split(':');
                const newDateTime = new Date(currentDate);
                newDateTime.setHours(parseInt(hours), parseInt(minutes));
                setNewPost(prev => ({ ...prev, scheduledTime: newDateTime }));
              }}
            />
          </div>
        </div>
        
        <div className="form-actions">
          <Button 
            onClick={handleCreatePost}
            disabled={isScheduling || !newPost.content?.trim()}
            className="primary"
          >
            {isScheduling ? 'Scheduling...' : 'Schedule Post'}
          </Button>
          <Button onClick={() => setActiveView('calendar')} className="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="social-analytics">
      <h3>Social Media Analytics</h3>
      
      <div className="analytics-overview">
        <div className="metric-card">
          <h4>Total Posts</h4>
          <div className="metric-value">{posts.length}</div>
          <div className="metric-change">+12% this month</div>
        </div>
        <div className="metric-card">
          <h4>Scheduled Posts</h4>
          <div className="metric-value">
            {posts.filter(p => p.status === 'scheduled').length}
          </div>
          <div className="metric-detail">Ready to publish</div>
        </div>
        <div className="metric-card">
          <h4>Published Posts</h4>
          <div className="metric-value">
            {posts.filter(p => p.status === 'published').length}
          </div>
          <div className="metric-detail">This month</div>
        </div>
      </div>
      
      <div className="platform-breakdown">
        <h4>Posts by Platform</h4>
        <div className="platform-stats">
          {platforms.map(platform => {
            const platformPosts = posts.filter(p => p.platform === platform.id);
            return (
              <div key={platform.id} className="platform-stat">
                <span className="platform-icon">{platform.icon}</span>
                <span className="platform-name">{platform.name}</span>
                <span className="post-count">{platformPosts.length}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="engagement-metrics">
        <h4>Engagement Overview</h4>
        <p>Connect your social media accounts to see detailed engagement metrics</p>
        <div className="connect-accounts">
          {platforms.map(platform => (
            <Button 
              key={platform.id}
              className="connect-button"
              style={{ borderColor: platform.color }}
            >
              Connect {platform.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSocialTools = () => (
    <div className="social-tools">
      <h3>Social Media Tools</h3>
      
      <div className="tools-grid">
        <div className="tool-category">
          <h4>Content Creation</h4>
          <div className="tool-list">
            <div className="tool-item">
              <h5>Canva</h5>
              <p>Create stunning social media graphics and posts</p>
              <Button 
                onClick={() => window.open('https://www.canva.com/create/social-media-graphics/', '_blank')}
                className="tool-button"
              >
                Open Canva
              </Button>
            </div>
            <div className="tool-item">
              <h5>Pablo by Buffer</h5>
              <p>Quick and easy social media image creation</p>
              <Button 
                onClick={() => window.open('https://pablo.buffer.com/', '_blank')}
                className="tool-button"
              >
                Open Pablo
              </Button>
            </div>
            <div className="tool-item">
              <h5>Unsplash</h5>
              <p>Free high-quality stock photos for social media</p>
              <Button 
                onClick={() => window.open('https://unsplash.com/', '_blank')}
                className="tool-button"
              >
                Browse Photos
              </Button>
            </div>
          </div>
        </div>

        <div className="tool-category">
          <h4>Scheduling & Management</h4>
          <div className="tool-list">
            <div className="tool-item">
              <h5>Buffer</h5>
              <p>Schedule and manage social media posts</p>
              <Button 
                onClick={() => window.open('https://buffer.com/', '_blank')}
                className="tool-button"
              >
                Open Buffer
              </Button>
            </div>
            <div className="tool-item">
              <h5>Hootsuite</h5>
              <p>Comprehensive social media management platform</p>
              <Button 
                onClick={() => window.open('https://hootsuite.com/', '_blank')}
                className="tool-button"
              >
                Open Hootsuite
              </Button>
            </div>
            <div className="tool-item">
              <h5>Later</h5>
              <p>Visual social media scheduler</p>
              <Button 
                onClick={() => window.open('https://later.com/', '_blank')}
                className="tool-button"
              >
                Open Later
              </Button>
            </div>
          </div>
        </div>

        <div className="tool-category">
          <h4>Analytics & Insights</h4>
          <div className="tool-list">
            <div className="tool-item">
              <h5>Google Analytics</h5>
              <p>Track social media traffic and conversions</p>
              <Button 
                onClick={() => window.open('https://analytics.google.com/', '_blank')}
                className="tool-button"
              >
                Open Analytics
              </Button>
            </div>
            <div className="tool-item">
              <h5>Facebook Insights</h5>
              <p>Detailed Facebook page and post analytics</p>
              <Button 
                onClick={() => window.open('https://www.facebook.com/business/insights', '_blank')}
                className="tool-button"
              >
                Open Insights
              </Button>
            </div>
            <div className="tool-item">
              <h5>Twitter Analytics</h5>
              <p>Track Twitter engagement and audience insights</p>
              <Button 
                onClick={() => window.open('https://analytics.twitter.com/', '_blank')}
                className="tool-button"
              >
                Open Twitter Analytics
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="social-media-scheduling">
      <div className="social-tabs">
        <Button 
          onClick={() => setActiveView('calendar')}
          className={`tab-button ${activeView === 'calendar' ? 'active' : ''}`}
        >
          📅 Calendar
        </Button>
        <Button 
          onClick={() => setActiveView('create')}
          className={`tab-button ${activeView === 'create' ? 'active' : ''}`}
        >
          ✏️ Create Post
        </Button>
        <Button 
          onClick={() => setActiveView('analytics')}
          className={`tab-button ${activeView === 'analytics' ? 'active' : ''}`}
        >
          📊 Analytics
        </Button>
        <Button 
          onClick={() => setActiveView('tools')}
          className={`tab-button ${activeView === 'tools' ? 'active' : ''}`}
        >
          🛠️ Tools
        </Button>
      </div>

      <div className="social-content">
        {activeView === 'calendar' && renderCalendarView()}
        {activeView === 'create' && renderCreatePost()}
        {activeView === 'analytics' && renderAnalytics()}
        {activeView === 'tools' && renderSocialTools()}
      </div>
    </div>
  );
};