// templates/emails/welcome.ts
export const welcomeEmail = (firstName: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #0F0F0F 0%, #1A1A1A 100%);
            color: #7CFF00;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #7CFF00;
            color: #0F0F0F;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to Careon Gym! 💪</h1>
    </div>
    <div class="content">
        <h2>Hi ${firstName}! 👋</h2>
        <p>We're excited to have you join the Careon Gym family!</p>
        
        <p>Your fitness journey starts now. Here's what you can do:</p>
        <ul>
            <li>📱 Complete your profile</li>
            <li>🤖 Chat with your AI trainer</li>
            <li>💪 Start tracking your workouts</li>
            <li>📊 Monitor your progress</li>
        </ul>
        
        <center>
            <a href="${process.env.APP_URL}/verify?token={verification_token}" class="button">
                Verify Your Email
            </a>
        </center>
        
        <p>Need help getting started? Our AI trainer is ready to assist you 24/7!</p>
        
        <p>Best regards,<br>The Careon Gym Team</p>
    </div>
    <div class="footer">
        <p>© 2026 Careon Gym. All rights reserved.</p>
        <p>If you didn't create this account, please ignore this email.</p>
    </div>
</body>
</html>
`;
