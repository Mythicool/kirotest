import { NotificationSystem } from '@/services/NotificationSystem';

// Mock DOM methods
const mockAppendChild = jest.fn();
const mockRemove = jest.fn();
const mockQuerySelector = jest.fn();

const mockElement = {
  id: '',
  className: '',
  innerHTML: '',
  style: { cssText: '', transform: '', opacity: '' },
  setAttribute: jest.fn(),
  appendChild: mockAppendChild,
  remove: mockRemove,
  addEventListener: jest.fn()
};

Object.defineProperty(document, 'getElementById', {
  value: jest.fn().mockReturnValue(null)
});

Object.defineProperty(document, 'createElement', {
  value: jest.fn().mockReturnValue(mockElement)
});

Object.defineProperty(document, 'body', {
  value: { appendChild: mockAppendChild }
});

// Mock Notification API
const mockNotification = {
  addEventListener: jest.fn(),
  close: jest.fn()
};

Object.defineProperty(window, 'Notification', {
  value: jest.fn().mockImplementation(() => mockNotification),
  writable: true
});

Object.defineProperty(Notification, 'permission', {
  value: 'granted',
  writable: true
});

Object.defineProperty(Notification, 'requestPermission', {
  value: jest.fn().mockResolvedValue('granted')
});

// Mock requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
  value: jest.fn().mockImplementation((callback) => {
    callback();
    return 1;
  })
});

describe('NotificationSystem', () => {
  let notificationSystem: NotificationSystem;

  beforeEach(() => {
    jest.clearAllMocks();
    mockElement.style = { cssText: '', transform: '', opacity: '' };
    mockQuerySelector.mockReturnValue(mockElement);
    
    // Mock container querySelector
    const mockContainer = {
      appendChild: mockAppendChild,
      querySelector: mockQuerySelector
    };
    
    Object.defineProperty(document, 'getElementById', {
      value: jest.fn().mockReturnValue(mockContainer)
    });

    notificationSystem = new NotificationSystem();
  });

  describe('initialization', () => {
    it('should create notification container if it does not exist', () => {
      Object.defineProperty(document, 'getElementById', {
        value: jest.fn().mockReturnValue(null)
      });

      new NotificationSystem();

      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(mockElement.id).toBe('notification-container');
      expect(mockElement.className).toBe('notification-container');
    });

    it('should request notification permission', () => {
      expect(Notification.requestPermission).toHaveBeenCalled();
    });
  });

  describe('show notifications', () => {
    it('should show in-app notification', () => {
      const id = notificationSystem.show({
        title: 'Test Title',
        message: 'Test message',
        type: 'info'
      });

      expect(id).toBeDefined();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-notification-id', id);
    });

    it('should show system notification when supported', () => {
      notificationSystem.show({
        title: 'Test Title',
        message: 'Test message',
        type: 'info'
      });

      expect(window.Notification).toHaveBeenCalledWith('Test Title', {
        body: 'Test message',
        icon: 'ℹ',
        tag: expect.any(String),
        requireInteraction: undefined
      });
    });

    it('should auto-dismiss non-persistent notifications', (done) => {
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any, delay) => {
        expect(delay).toBe(3000);
        callback();
        done();
        return 0 as any;
      });

      notificationSystem.show({
        title: 'Test Title',
        message: 'Test message',
        type: 'info',
        duration: 3000
      });
    });

    it('should not auto-dismiss persistent notifications', () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      notificationSystem.show({
        title: 'Test Title',
        message: 'Test message',
        type: 'info',
        persistent: true
      });

      expect(setTimeoutSpy).not.toHaveBeenCalled();
    });

    it('should limit number of notifications', () => {
      // Show 6 notifications (more than the limit of 5)
      for (let i = 0; i < 6; i++) {
        notificationSystem.show({
          title: `Title ${i}`,
          message: `Message ${i}`,
          type: 'info'
        });
      }

      const activeNotifications = notificationSystem.getActiveNotifications();
      expect(activeNotifications).toHaveLength(5);
    });

    it('should use custom ID when provided', () => {
      const customId = 'custom-notification-id';
      const id = notificationSystem.show({
        id: customId,
        title: 'Test Title',
        message: 'Test message',
        type: 'info'
      });

      expect(id).toBe(customId);
    });
  });

  describe('notification actions', () => {
    it('should add action buttons to notifications', () => {
      const actionCallback = jest.fn();

      notificationSystem.show({
        title: 'Test Title',
        message: 'Test message',
        type: 'info',
        actions: [
          {
            id: 'test-action',
            label: 'Test Action',
            action: actionCallback
          }
        ]
      });

      expect(mockElement.innerHTML).toContain('Test Action');
    });

    it('should execute action callback when button is clicked', () => {
      const actionCallback = jest.fn();
      const mockButton = {
        addEventListener: jest.fn(),
        textContent: '',
        className: '',
        style: { cssText: '' }
      };

      Object.defineProperty(document, 'createElement', {
        value: jest.fn().mockImplementation((tagName) => {
          if (tagName === 'button') {
            return mockButton;
          }
          return mockElement;
        })
      });

      notificationSystem.show({
        title: 'Test Title',
        message: 'Test message',
        type: 'info',
        actions: [
          {
            id: 'test-action',
            label: 'Test Action',
            action: actionCallback
          }
        ]
      });

      // Simulate button click
      const clickHandler = mockButton.addEventListener.mock.calls.find(
        call => call[0] === 'click'
      )?.[1];

      if (clickHandler) {
        clickHandler();
        expect(actionCallback).toHaveBeenCalled();
      }
    });
  });

  describe('dismiss notifications', () => {
    it('should dismiss notification by ID', () => {
      const id = notificationSystem.show({
        title: 'Test Title',
        message: 'Test message',
        type: 'info'
      });

      notificationSystem.dismiss(id);

      const notification = notificationSystem.getNotification(id);
      expect(notification?.dismissed).toBe(true);
    });

    it('should remove notification element from DOM', () => {
      const id = notificationSystem.show({
        title: 'Test Title',
        message: 'Test message',
        type: 'info'
      });

      notificationSystem.dismiss(id);

      expect(mockElement.style.transform).toBe('translateX(100%)');
      expect(mockElement.style.opacity).toBe('0');
    });

    it('should dismiss all notifications', () => {
      const id1 = notificationSystem.show({
        title: 'Title 1',
        message: 'Message 1',
        type: 'info'
      });

      const id2 = notificationSystem.show({
        title: 'Title 2',
        message: 'Message 2',
        type: 'info'
      });

      notificationSystem.dismissAll();

      expect(notificationSystem.getNotification(id1)?.dismissed).toBe(true);
      expect(notificationSystem.getNotification(id2)?.dismissed).toBe(true);
    });

    it('should not dismiss already dismissed notification', () => {
      const id = notificationSystem.show({
        title: 'Test Title',
        message: 'Test message',
        type: 'info'
      });

      notificationSystem.dismiss(id);
      const dismissCount = mockQuerySelector.mock.calls.length;

      notificationSystem.dismiss(id); // Try to dismiss again

      // Should not query DOM again
      expect(mockQuerySelector.mock.calls.length).toBe(dismissCount);
    });
  });

  describe('update notifications', () => {
    it('should update notification content', () => {
      const id = notificationSystem.show({
        title: 'Original Title',
        message: 'Original message',
        type: 'info'
      });

      notificationSystem.update(id, {
        title: 'Updated Title',
        message: 'Updated message'
      });

      const notification = notificationSystem.getNotification(id);
      expect(notification?.title).toBe('Updated Title');
      expect(notification?.message).toBe('Updated message');
    });

    it('should not update non-existent notification', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      notificationSystem.update('non-existent-id', {
        title: 'Updated Title'
      });

      // Should not throw error or log warnings
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('convenience methods', () => {
    it('should show success notification', () => {
      const id = notificationSystem.success('Success!', 'Operation completed');

      const notification = notificationSystem.getNotification(id);
      expect(notification?.type).toBe('success');
      expect(notification?.icon).toBe('✓');
    });

    it('should show error notification', () => {
      const id = notificationSystem.error('Error!', 'Something went wrong');

      const notification = notificationSystem.getNotification(id);
      expect(notification?.type).toBe('error');
      expect(notification?.icon).toBe('✕');
      expect(notification?.persistent).toBe(true);
    });

    it('should show warning notification', () => {
      const id = notificationSystem.warning('Warning!', 'Please be careful');

      const notification = notificationSystem.getNotification(id);
      expect(notification?.type).toBe('warning');
      expect(notification?.icon).toBe('⚠');
    });

    it('should show info notification', () => {
      const id = notificationSystem.info('Info', 'Just so you know');

      const notification = notificationSystem.getNotification(id);
      expect(notification?.type).toBe('info');
      expect(notification?.icon).toBe('ℹ');
    });
  });

  describe('notification queries', () => {
    it('should get all notifications', () => {
      notificationSystem.show({
        title: 'Title 1',
        message: 'Message 1',
        type: 'info'
      });

      notificationSystem.show({
        title: 'Title 2',
        message: 'Message 2',
        type: 'error'
      });

      const allNotifications = notificationSystem.getAllNotifications();
      expect(allNotifications).toHaveLength(2);
    });

    it('should get only active notifications', () => {
      const id1 = notificationSystem.show({
        title: 'Title 1',
        message: 'Message 1',
        type: 'info'
      });

      const id2 = notificationSystem.show({
        title: 'Title 2',
        message: 'Message 2',
        type: 'error'
      });

      notificationSystem.dismiss(id1);

      const activeNotifications = notificationSystem.getActiveNotifications();
      expect(activeNotifications).toHaveLength(1);
      expect(activeNotifications[0].id).toBe(id2);
    });

    it('should get specific notification by ID', () => {
      const id = notificationSystem.show({
        title: 'Test Title',
        message: 'Test message',
        type: 'info'
      });

      const notification = notificationSystem.getNotification(id);
      expect(notification?.id).toBe(id);
      expect(notification?.title).toBe('Test Title');
    });

    it('should return undefined for non-existent notification', () => {
      const notification = notificationSystem.getNotification('non-existent-id');
      expect(notification).toBeUndefined();
    });
  });

  describe('system notification handling', () => {
    it('should not show system notification when permission is denied', () => {
      Object.defineProperty(Notification, 'permission', {
        value: 'denied',
        writable: true
      });

      const ns = new NotificationSystem();
      ns.show({
        title: 'Test Title',
        message: 'Test message',
        type: 'info'
      });

      expect(window.Notification).not.toHaveBeenCalled();
    });

    it('should handle system notification click', () => {
      const actionCallback = jest.fn();

      notificationSystem.show({
        title: 'Test Title',
        message: 'Test message',
        type: 'info',
        actions: [
          {
            id: 'test-action',
            label: 'Test Action',
            action: actionCallback
          }
        ]
      });

      // Simulate system notification click
      const clickHandler = mockNotification.addEventListener.mock.calls.find(
        call => call[0] === 'click'
      )?.[1];

      if (clickHandler) {
        clickHandler();
        expect(actionCallback).toHaveBeenCalled();
        expect(mockNotification.close).toHaveBeenCalled();
      }
    });

    it('should auto-close system notification', (done) => {
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any, delay) => {
        expect(delay).toBe(3000);
        callback();
        expect(mockNotification.close).toHaveBeenCalled();
        done();
        return 0 as any;
      });

      notificationSystem.show({
        title: 'Test Title',
        message: 'Test message',
        type: 'info',
        duration: 3000
      });
    });

    it('should not auto-close persistent system notification', () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      notificationSystem.show({
        title: 'Test Title',
        message: 'Test message',
        type: 'info',
        persistent: true
      });

      // Should still set timeout for in-app notification removal, but not for system notification
      expect(mockNotification.close).not.toHaveBeenCalled();
    });
  });
});