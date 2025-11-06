# 🔔 Notification Service

Notification Service cho Dorm Booking System với hỗ trợ gửi email qua Nodemailer và WebSocket real-time notifications.

## 🏗️ Kiến trúc SOLID

Service được thiết kế theo nguyên tắc SOLID:

### **Single Responsibility Principle (SRP)**
- `EmailService`: Chỉ xử lý gửi email
- `WebSocketService`: Chỉ xử lý WebSocket connections
- `TemplateService`: Chỉ xử lý email templates
- `NotificationService`: Orchestrate các services khác

### **Open/Closed Principle (OCP)**
- Có thể extend thêm channels mới (SMS, Push) mà không modify code hiện tại
- Interface-based design cho easy extension

### **Liskov Substitution Principle (LSP)**
- Tất cả services implement interfaces có thể thay thế lẫn nhau

### **Interface Segregation Principle (ISP)**
- Interfaces được chia nhỏ theo chức năng cụ thể

### **Dependency Inversion Principle (DIP)**
- Depend on abstractions, not concretions

## 🚀 Tính năng

### **Email Notifications**
- ✅ Gửi email với Nodemailer
- ✅ Template engine với Handlebars
- ✅ Bulk email sending
- ✅ Error handling và retry logic

### **WebSocket Notifications**
- ✅ Real-time notifications
- ✅ User authentication
- ✅ Room-based messaging
- ✅ Connection management

### **Template System**
- ✅ Handlebars templates
- ✅ Custom helpers (formatCurrency, formatDate, etc.)
- ✅ Template caching
- ✅ Dynamic content rendering

## 📁 Cấu trúc thư mục

```
src/
├── notification/
│   ├── interfaces/           # SOLID interfaces
│   ├── services/            # Service implementations
│   ├── gateways/            # WebSocket gateway
│   ├── dto/                 # Data Transfer Objects
│   ├── notification.service.ts
│   ├── notification.controller.ts
│   └── notification.module.ts
├── common/
│   └── mail/
│       └── templates/       # Email templates
└── app.module.ts
```

## ⚙️ Cấu hình

### **Environment Variables**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/notification_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# WebSocket
FRONTEND_URL=http://localhost:3000

# Application
PORT=3001
```

## 🎯 API Endpoints

### **Basic CRUD**
```typescript
POST   /notifications              # Tạo notification
GET    /notifications              # Lấy tất cả notifications
GET    /notifications/:id          # Lấy notification theo ID
PATCH  /notifications/:id          # Cập nhật notification
DELETE /notifications/:id          # Xóa notification
```

### **User-specific**
```typescript
GET    /notifications/user/:userId           # Lấy notifications của user
GET    /notifications/user/:userId/pending   # Lấy pending notifications
POST   /notifications/mark-read/:id/:userId  # Đánh dấu đã đọc
POST   /notifications/dismiss/:id/:userId    # Dismiss notification
```

### **Convenience Methods**
```typescript
POST   /notifications/booking-confirmation   # Gửi booking confirmation
POST   /notifications/payment-success       # Gửi payment success
POST   /notifications/welcome               # Gửi welcome email
POST   /notifications/test                  # Test notification
```

## 🔌 WebSocket Events

### **Client → Server**
```typescript
// Authenticate
socket.emit('authenticate', { token: 'jwt-token' });

// Mark as read
socket.emit('mark_as_read', { notificationId: 'notif-id' });

// Dismiss notification
socket.emit('dismiss_notification', { notificationId: 'notif-id' });

// Get notifications
socket.emit('get_notifications');
```

### **Server → Client**
```typescript
// New notification
socket.on('new_notification', (notification) => {
  console.log('New notification:', notification);
});

// Pending notifications
socket.on('pending_notifications', (notifications) => {
  console.log('Pending notifications:', notifications);
});

// Notification read confirmation
socket.on('notification_read', (data) => {
  console.log('Notification marked as read:', data);
});
```

## 📧 Email Templates

### **Available Templates**
- `notification.hbs` - General notification template
- `welcome.hbs` - Welcome email template
- `register.hbs` - Registration confirmation
- `ticket.hbs` - Support ticket template

### **Template Variables**
```typescript
{
  title: string,
  content: string,
  type: NotificationType,
  userId: string,
  data: Record<string, any>,
  currentYear: number,
  appName: string,
  supportEmail: string
}
```

### **Custom Helpers**
```handlebars
{{formatCurrency amount "VND"}}     <!-- Format currency -->
{{formatDate date "dd/MM/yyyy"}}   <!-- Format date -->
{{formatPhone phone}}               <!-- Format phone -->
{{if_eq a b}}                       <!-- Conditional -->
{{truncate text 100}}               <!-- Truncate text -->
```

## 🚀 Sử dụng

### **1. Gửi notification đơn giản**
```typescript
const results = await notificationService.create({
  userId: 'user-123',
  type: NotificationType.BOOKING_CONFIRMED,
  title: 'Đặt phòng thành công',
  content: 'Đặt phòng của bạn đã được xác nhận.',
  channels: [
    { type: ChannelType.EMAIL, recipient: 'user@example.com', template: 'notification' },
    { type: ChannelType.WEBSOCKET, recipient: 'user-123' },
  ],
});
```

### **2. Gửi booking confirmation**
```typescript
const results = await notificationService.sendBookingConfirmation('user-123', {
  bookingId: 'booking-456',
  email: 'user@example.com',
  amount: 500000,
  roomName: 'Phòng 101',
  startDate: new Date(),
  endDate: new Date(),
});
```

### **3. Gửi payment success**
```typescript
const results = await notificationService.sendPaymentSuccess('user-123', {
  paymentId: 'payment-789',
  email: 'user@example.com',
  amount: 500000,
  bookingId: 'booking-456',
});
```

## 🧪 Testing

### **Test notification**
```bash
curl -X POST http://localhost:3001/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "email": "test@example.com"
  }'
```

### **WebSocket test**
```javascript
const socket = io('ws://localhost:3001/notifications', {
  auth: { token: 'your-jwt-token' }
});

socket.on('new_notification', (notification) => {
  console.log('Received:', notification);
});
```

## 🔧 Development

### **Start development server**
```bash
npm run start:dev
```

### **Build for production**
```bash
npm run build
npm run start:prod
```

### **Run tests**
```bash
npm run test
npm run test:e2e
```

## 📝 Logs

Service sử dụng Winston logger với các levels:
- `LOG` - General information
- `WARN` - Warning messages
- `ERROR` - Error messages

## 🚨 Error Handling

- Email failures được log và return error result
- WebSocket connection failures được handle gracefully
- Template rendering errors được catch và log
- Database connection errors được handle

## 🔄 Integration

### **Với các services khác**
- Nhận events từ Kafka
- Gửi notifications qua RabbitMQ
- Tích hợp với Auth Service cho JWT validation

### **Với Frontend**
- WebSocket connection cho real-time
- REST API cho CRUD operations
- Template rendering cho email content