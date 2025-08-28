export interface NotificationOptions {
  id?: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  icon?: string;
  sound?: boolean;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface SystemNotification extends NotificationOptions {
  id: string;
  timestamp: number;
  dismissed: boolean;
}

export class NotificationSystem {
  private notifications: Map<string, SystemNotification>;
  private container: HTMLElement | null;
  private maxNotifications: number = 5;
  private defaultDuration: number = 5000;

  constructor() {
    this.notifications = new Map();
    this.container = null;
    this.initializeContainer();
    this.requestNotificationPermission();
  }

  private initializeContainer(): void {
    // Create notification container if it doesn't exist
    this.container = document.getElementById('notification-container');
    
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notification-container';
      this.container.className = 'notification-container';
      
      // Add styles
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
        max-width: 400px;
      `;
      
      document.body.appendChild(this.container);
    }
  }

  private async requestNotificationPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.warn('Failed to request notification permission:', error);
      }
    }
  }

  show(options: NotificationOptions): string {
    const id = options.id || this.generateId();
    const notification: SystemNotification = {
      ...options,
      id,
      timestamp: Date.now(),
      dismissed: false,
      duration: options.duration ?? this.defaultDuration
    };

    // Store notification
    this.notifications.set(id, notification);

    // Show in-app notification
    this.showInAppNotification(notification);

    // Show system notification if supported and permitted
    if (this.canShowSystemNotification()) {
      this.showSystemNotification(notification);
    }

    // Auto-dismiss if not persistent
    if (!notification.persistent && notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, notification.duration);
    }

    // Limit number of notifications
    this.enforceNotificationLimit();

    return id;
  }

  private showInAppNotification(notification: SystemNotification): void {
    if (!this.container) return;

    const element = this.createNotificationElement(notification);
    this.container.appendChild(element);

    // Animate in
    requestAnimationFrame(() => {
      element.style.transform = 'translateX(0)';
      element.style.opacity = '1';
    });
  }

  private createNotificationElement(notification: SystemNotification): HTMLElement {
    const element = document.createElement('div');
    element.className = `notification notification-${notification.type}`;
    element.setAttribute('data-notification-id', notification.id);
    
    // Base styles
    element.style.cssText = `
      background: ${this.getBackgroundColor(notification.type)};
      border: 1px solid ${this.getBorderColor(notification.type)};
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      pointer-events: auto;
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    `;

    // Create content
    const content = document.createElement('div');
    content.className = 'notification-content';
    
    if (notification.icon) {
      const icon = document.createElement('div');
      icon.className = 'notification-icon';
      icon.innerHTML = notification.icon;
      icon.style.cssText = `
        float: left;
        margin-right: 12px;
        font-size: 20px;
        color: ${this.getIconColor(notification.type)};
      `;
      content.appendChild(icon);
    }

    const textContent = document.createElement('div');
    textContent.innerHTML = `
      <strong style="display: block; margin-bottom: 4px; color: ${this.getTitleColor(notification.type)};">
        ${notification.title}
      </strong>
      <div style="color: ${this.getMessageColor(notification.type)};">
        ${notification.message}
      </div>
    `;
    content.appendChild(textContent);

    element.appendChild(content);

    // Add actions if provided
    if (notification.actions && notification.actions.length > 0) {
      const actionsContainer = document.createElement('div');
      actionsContainer.className = 'notification-actions';
      actionsContainer.style.cssText = `
        margin-top: 12px;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      `;

      for (const action of notification.actions) {
        const button = document.createElement('button');
        button.textContent = action.label;
        button.className = `notification-action notification-action-${action.style || 'secondary'}`;
        button.style.cssText = `
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          background: ${this.getActionButtonColor(action.style || 'secondary')};
          color: ${this.getActionButtonTextColor(action.style || 'secondary')};
          transition: opacity 0.2s ease;
        `;

        button.addEventListener('click', () => {
          action.action();
          this.dismiss(notification.id);
        });

        button.addEventListener('mouseenter', () => {
          button.style.opacity = '0.8';
        });

        button.addEventListener('mouseleave', () => {
          button.style.opacity = '1';
        });

        actionsContainer.appendChild(button);
      }

      element.appendChild(actionsContainer);
    }

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.className = 'notification-close';
    closeButton.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      font-size: 20px;
      font-weight: bold;
      cursor: pointer;
      color: ${this.getCloseButtonColor(notification.type)};
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    `;

    closeButton.addEventListener('click', () => {
      this.dismiss(notification.id);
    });

    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.backgroundColor = 'rgba(0,0,0,0.1)';
    });

    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.backgroundColor = 'transparent';
    });

    element.appendChild(closeButton);

    // Add progress bar for timed notifications
    if (!notification.persistent && notification.duration > 0) {
      const progressBar = document.createElement('div');
      progressBar.className = 'notification-progress';
      progressBar.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: ${this.getProgressBarColor(notification.type)};
        transition: width ${notification.duration}ms linear;
        width: 100%;
      `;

      element.appendChild(progressBar);

      // Animate progress bar
      requestAnimationFrame(() => {
        progressBar.style.width = '0%';
      });
    }

    return element;
  }

  private showSystemNotification(notification: SystemNotification): void {
    if (!this.canShowSystemNotification()) return;

    try {
      const systemNotification = new Notification(notification.title, {
        body: notification.message,
        icon: notification.icon || this.getDefaultIcon(notification.type),
        tag: notification.id,
        requireInteraction: notification.persistent
      });

      systemNotification.addEventListener('click', () => {
        window.focus();
        systemNotification.close();
        
        // Execute first action if available
        if (notification.actions && notification.actions.length > 0) {
          notification.actions[0].action();
        }
      });

      // Auto-close system notification
      if (!notification.persistent && notification.duration > 0) {
        setTimeout(() => {
          systemNotification.close();
        }, notification.duration);
      }
    } catch (error) {
      console.warn('Failed to show system notification:', error);
    }
  }

  dismiss(id: string): void {
    const notification = this.notifications.get(id);
    if (!notification || notification.dismissed) return;

    // Mark as dismissed
    notification.dismissed = true;
    this.notifications.set(id, notification);

    // Remove from DOM
    const element = this.container?.querySelector(`[data-notification-id="${id}"]`);
    if (element) {
      element.style.transform = 'translateX(100%)';
      element.style.opacity = '0';
      
      setTimeout(() => {
        element.remove();
      }, 300);
    }

    // Close system notification
    if (this.canShowSystemNotification()) {
      // System notifications are automatically closed by tag
    }
  }

  dismissAll(): void {
    for (const [id] of this.notifications) {
      this.dismiss(id);
    }
  }

  update(id: string, updates: Partial<NotificationOptions>): void {
    const notification = this.notifications.get(id);
    if (!notification) return;

    // Update notification data
    Object.assign(notification, updates);
    this.notifications.set(id, notification);

    // Update DOM element
    const element = this.container?.querySelector(`[data-notification-id="${id}"]`);
    if (element) {
      // Remove old element and create new one
      element.remove();
      this.showInAppNotification(notification);
    }
  }

  getNotification(id: string): SystemNotification | undefined {
    return this.notifications.get(id);
  }

  getAllNotifications(): SystemNotification[] {
    return Array.from(this.notifications.values());
  }

  getActiveNotifications(): SystemNotification[] {
    return Array.from(this.notifications.values()).filter(n => !n.dismissed);
  }

  private canShowSystemNotification(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  private enforceNotificationLimit(): void {
    const activeNotifications = this.getActiveNotifications();
    if (activeNotifications.length > this.maxNotifications) {
      // Dismiss oldest notifications
      const sortedNotifications = activeNotifications.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = sortedNotifications.slice(0, activeNotifications.length - this.maxNotifications);
      
      for (const notification of toRemove) {
        this.dismiss(notification.id);
      }
    }
  }

  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Color scheme methods
  private getBackgroundColor(type: string): string {
    const colors = {
      success: '#f0f9ff',
      error: '#fef2f2',
      warning: '#fefbf2',
      info: '#f0f9ff'
    };
    return colors[type as keyof typeof colors] || colors.info;
  }

  private getBorderColor(type: string): string {
    const colors = {
      success: '#bbf7d0',
      error: '#fecaca',
      warning: '#fed7aa',
      info: '#bde0ff'
    };
    return colors[type as keyof typeof colors] || colors.info;
  }

  private getTitleColor(type: string): string {
    const colors = {
      success: '#065f46',
      error: '#991b1b',
      warning: '#92400e',
      info: '#1e40af'
    };
    return colors[type as keyof typeof colors] || colors.info;
  }

  private getMessageColor(type: string): string {
    const colors = {
      success: '#047857',
      error: '#dc2626',
      warning: '#d97706',
      info: '#2563eb'
    };
    return colors[type as keyof typeof colors] || colors.info;
  }

  private getIconColor(type: string): string {
    return this.getTitleColor(type);
  }

  private getCloseButtonColor(type: string): string {
    return this.getMessageColor(type);
  }

  private getProgressBarColor(type: string): string {
    return this.getBorderColor(type);
  }

  private getActionButtonColor(style: string): string {
    const colors = {
      primary: '#3b82f6',
      secondary: '#6b7280',
      danger: '#ef4444'
    };
    return colors[style as keyof typeof colors] || colors.secondary;
  }

  private getActionButtonTextColor(style: string): string {
    return style === 'secondary' ? '#374151' : '#ffffff';
  }

  private getDefaultIcon(type: string): string {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type as keyof typeof icons] || icons.info;
  }

  // Convenience methods for common notification types
  success(title: string, message: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      title,
      message,
      type: 'success',
      icon: '✓',
      ...options
    });
  }

  error(title: string, message: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      title,
      message,
      type: 'error',
      icon: '✕',
      persistent: true,
      ...options
    });
  }

  warning(title: string, message: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      title,
      message,
      type: 'warning',
      icon: '⚠',
      ...options
    });
  }

  info(title: string, message: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      title,
      message,
      type: 'info',
      icon: 'ℹ',
      ...options
    });
  }
}