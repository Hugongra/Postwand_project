from flask import request, jsonify
from datetime import datetime, timezone, timedelta
import random
import string
import os
import requests
from functools import wraps
from database import get_supabase_client

# Get Supabase client
supabase = get_supabase_client()

# Mailgun configuration
MAILGUN_API_KEY = os.getenv('MAILGUN_API_KEY')
MAILGUN_DOMAIN = os.getenv('MAILGUN_DOMAIN')
MAILGUN_API_URL = f"https://api.eu.mailgun.net/v3/{MAILGUN_DOMAIN}/messages"
FROM_EMAIL = os.getenv('FROM_EMAIL', 'noreply@mail.postwand.io')

def generate_verification_code():
    """Generate a 6-digit numeric verification code"""
    return ''.join(random.choices(string.digits, k=6))

def send_verification_email(email, code):
    """Send verification email using Mailgun API"""
    if not MAILGUN_API_KEY or not MAILGUN_DOMAIN:
        # Mock email sending if credentials not available
        print(f"MOCK EMAIL: Sending verification code {code} to {email}")
        return True
    
    try:
        response = requests.post(
            MAILGUN_API_URL,
            auth=("api", MAILGUN_API_KEY),
            data={
                "from": f"Postwand <{FROM_EMAIL}>",
                "to": email,
                "subject": "Your Postwand Verification Code",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8f5fa; padding: 40px; text-align: center;">
                        
                        <h1 style="color: #333; margin-bottom: 20px;">Verify Your Email</h1>
                        <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
                            Please use the verification code below to complete your registration:
                        </p>
                        <div style="background-color: #fff; border: 2px solid #ec4899; border-radius: 10px; padding: 20px; display: inline-block;">
                            <h2 style="color: #ec4899; font-size: 36px; letter-spacing: 10px; margin: 0;">{code}</h2>
                        </div>
                        <p style="color: #999; font-size: 14px; margin-top: 30px;">
                            This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
                        </p>
                    </div>
                    <div style="background-color: #fff; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 12px; margin: 0;">
                            © 2024 Postwand. All rights reserved.
                        </p>
                    </div>
                </div>
                """,
                "text": f"Your Postwand verification code is: {code}\n\nThis code will expire in 10 minutes."
            }
        )
        
        if response.status_code == 200:
            print(f"Verification email sent successfully to {email}")
            return True
        else:
            print(f"Failed to send email: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False

def send_verification_code():
    """Send verification code endpoint"""
    try:
        data = request.json
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
            
        # Get user_id from email
        user_result = supabase.table('users').select('id').eq('email', email).execute()
        if not user_result.data:
            return jsonify({'error': 'User not found'}), 404
            
        user_id = user_result.data[0]['id']
        
        # Generate code
        code = generate_verification_code()
        
        # Store code with expiration (10 minutes from now)
        expiration = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
        
        # Delete any existing verification codes for this user
        supabase.table('verification_codes').delete(returning='minimal', count='exact').eq('user_id', user_id).execute()
        
        # Insert new verification code
        supabase.table('verification_codes').insert({
            'user_id': user_id,
            'email': email,
            'code': code,
            'expires_at': expiration,
            'attempts': 0
        }).execute()
        
        # Send email
        email_sent = send_verification_email(email, code)
        
        if email_sent:
            return jsonify({
                'success': True,
                'message': 'Verification code sent successfully'
            }), 200
        else:
            return jsonify({
                'error': 'Failed to send verification email'
            }), 500
            
    except Exception as e:
        print(f"Error in send_verification_code: {str(e)}")
        return jsonify({'error': str(e)}), 500

def verify_code():
    """Verify code endpoint"""
    try:
        data = request.json
        email = data.get('email')
        code = data.get('code')
        
        if not email or not code:
            return jsonify({'error': 'Email and code are required'}), 400
            
        # Get verification code from database
        verification_result = supabase.table('verification_codes').select('*').eq('email', email).execute()
        
        if not verification_result.data:
            return jsonify({'error': 'No verification code found for this email'}), 404
            
        stored_data = verification_result.data[0]
        
        # Check if code has expired
        expires_at = datetime.fromisoformat(stored_data['expires_at'].replace('Z', '+00:00'))
        if datetime.now(timezone.utc) > expires_at:
            # Clean up expired code
            supabase.table('verification_codes').delete(returning='minimal', count='exact').eq('id', stored_data['id']).execute()
            return jsonify({'error': 'Verification code has expired'}), 400
            
        # Increment attempts
        new_attempts = stored_data['attempts'] + 1
        
        # Check if too many failed attempts (max 5)
        if new_attempts > 5:
            supabase.table('verification_codes').delete(returning='minimal', count='exact').eq('id', stored_data['id']).execute()
            return jsonify({'error': 'Too many failed attempts. Please request a new code'}), 400
            
        # Verify code
        if stored_data['code'] != code:
            # Update attempts count
            supabase.table('verification_codes').update({
                'attempts': new_attempts
            }, returning='minimal', count='exact').eq('id', stored_data['id']).execute()
            
            return jsonify({
                'error': 'Invalid verification code',
                'attempts_remaining': 5 - new_attempts
            }), 400
            
        # Code is correct - mark user as verified in users table
        supabase.table('users').update({
            'email_verified': True
        }, returning='minimal', count='exact').eq('id', stored_data['user_id']).execute()
        
        # Clean up used verification code
        supabase.table('verification_codes').delete(returning='minimal', count='exact').eq('id', stored_data['id']).execute()
        
        return jsonify({
            'success': True,
            'message': 'Email verified successfully'
        }), 200
        
    except Exception as e:
        print(f"Error in verify_code: {str(e)}")
        return jsonify({'error': str(e)}), 500

def check_verification_status(email):
    """Check if an email is verified"""
    try:
        user_result = supabase.table('users').select('email_verified').eq('email', email).execute()
        if user_result.data:
            return user_result.data[0].get('email_verified', False)
        return False
    except:
        return False

def require_verified_email(f):
    """Decorator to require verified email for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get email from session or request
        from flask import session
        email = session.get('email')
        
        if not email or not check_verification_status(email):
            return jsonify({'error': 'Email verification required'}), 403
            
        return f(*args, **kwargs)
    return decorated_function 