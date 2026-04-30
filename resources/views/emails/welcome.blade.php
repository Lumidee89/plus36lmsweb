<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6; color: #273c66; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background-color: #1ab69d; padding: 40px; text-align: center; color: white; }
        .content { padding: 40px; line-height: 1.6; }
        .button { display: inline-block; padding: 14px 30px; background-color: #273c66; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #999; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Plus36 Academy</h1>
        </div>
        <div class="content">
            <h2>Hi, {{ $user->name }}!</h2>
            <p>Welcome to Plus36 Academy. We're thrilled to have you join our community as a <strong>{{ ucfirst($user->role) }}</strong>.</p>
            <p>Your journey to mastering high-income digital skills starts right now. Log in to your dashboard to explore your courses and start learning.</p>
            
            <div style="text-align: center;">
                <a href="{{ url('/dashboard') }}" class="button">Go to My Dashboard</a>
            </div>

            <p style="margin-top: 30px;">If you have any questions, simply reply to this email. We're here to help!</p>
            <p>Best regards,<br>The Plus36 Team</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Plus36 Academy. All rights reserved.
        </div>
    </div>
</body>
</html>