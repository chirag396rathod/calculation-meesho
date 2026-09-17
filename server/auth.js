/**
 * auth.js — Authentication Utilities
 * Handles OTP generation/delivery (WhatsApp + Email), JWT signing/verification,
 * and Express-compatible auth middleware.
 *
 * OTP Channels:
 *   1. WhatsApp  — via Gupshup / Meta WhatsApp Cloud API (from +91 93285 93359)
 *   2. Email     — via Gmail SMTP (from houseofgurukrupa97@gmail.com)
 *   3. Mock      — logs to console (for development)
 */

import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local'), override: true });

const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ── Config ──
const JWT_SECRET = process.env.JWT_SECRET || 'fc_analytics_dev_secret_change_in_production_2026';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const BCRYPT_ROUNDS = 10;

// ── Business sender config ──
const WHATSAPP_SENDER = process.env.WHATSAPP_SENDER || '+919328593359'; // +91 93285 93359
const GMAIL_FROM     = process.env.GMAIL_FROM     || 'houseofgurukrupa97@gmail.com';

// ────────────────────────────────────────────────
//  OTP GENERATION
// ────────────────────────────────────────────────

export function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

export async function hashOtp(otp) {
  return bcrypt.hash(String(otp), BCRYPT_ROUNDS);
}

export async function compareOtp(otp, hash) {
  return bcrypt.compare(String(otp), hash);
}

// ────────────────────────────────────────────────
//  OTP DELIVERY
// ────────────────────────────────────────────────

/**
 * Send OTP via WhatsApp (Gupshup or Meta Cloud API)
 * Sender number: +91 93285 93359
 *
 * @param {string} mobile  E.164 format e.g. "+919876543210"
 * @param {string} otp
 */
export async function sendOtpViaWhatsApp(mobile, otp) {
  const provider = process.env.WHATSAPP_PROVIDER || 'mock';

  if (provider === 'mock') {
    _mockLog('WhatsApp', mobile, otp);
    return { success: true, provider: 'mock-whatsapp' };
  }

  if (provider === 'gupshup') {
    // ── Gupshup WhatsApp API ──
    // Register +91 93285 93359 as your Gupshup WhatsApp Business number first
    const apiKey  = process.env.GUPSHUP_API_KEY;
    const appName = process.env.GUPSHUP_APP_NAME || 'FCAnalyticsOTP';
    const dest    = mobile.replace('+', ''); // Gupshup wants digits only

    const body = new URLSearchParams({
      channel: 'whatsapp',
      source: WHATSAPP_SENDER.replace('+', ''),
      destination: dest,
      'src.name': appName,
      message: JSON.stringify({
        type: 'text',
        text: `Your FC Analytics verification code is: *${otp}*\n\nThis code expires in ${OTP_TTL_MINUTES} minutes. Do not share it with anyone.`
      })
    });

    const res = await fetch('https://api.gupshup.io/sm/api/v1/msg', {
      method: 'POST',
      headers: { apikey: apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });

    const data = await res.json();
    console.log('[WhatsApp OTP] Gupshup response:', JSON.stringify(data));
    return { success: res.ok, provider: 'gupshup' };
  }

  if (provider === 'meta') {
    // ── Meta WhatsApp Cloud API ──
    // Register +91 93285 93359 in Meta Business Manager → WhatsApp Business
    const token    = process.env.WHATSAPP_TOKEN;  // Meta System User Access Token
    const phoneId  = process.env.WHATSAPP_PHONE_ID; // Phone Number ID from Meta dashboard
    const dest     = mobile.replace('+', '');

    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: dest,
        type: 'text',
        text: {
          body: `Your FC Analytics OTP is: *${otp}*\n\nValid for ${OTP_TTL_MINUTES} minutes. Never share this code.`
        }
      })
    });

    const data = await res.json();
    console.log('[WhatsApp OTP] Meta response:', JSON.stringify(data));
    return { success: res.ok, provider: 'meta-whatsapp' };
  }

  _mockLog('WhatsApp', mobile, otp);
  return { success: true, provider: 'mock-whatsapp' };
}

/**
 * Send OTP via Email using Gmail SMTP
 * Sender: houseofgurukrupa97@gmail.com
 *
 * Setup: Generate a Gmail App Password (not your Google password):
 *   Google Account → Security → 2-Step Verification → App passwords
 *   Then set GMAIL_APP_PASSWORD in .env
 *
 * @param {string} email
 * @param {string} otp
 */
export async function sendOtpViaEmail(email, otp) {
  const appPassword = process.env.GMAIL_APP_PASSWORD;

  if (!appPassword || appPassword === 'your_gmail_app_password_here') {
    _mockLog('Email', email, otp);
    return { success: true, provider: 'mock-email' };
  }

  try {
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_FROM,
        pass: appPassword
      }
    });

    await transporter.sendMail({
      from: `"FC Analytics" <${GMAIL_FROM}>`,
      to: email,
      subject: `Your FC Analytics OTP: ${otp}`,
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden;">
          <div style="background: #8B1874; padding: 28px 32px;">
            <div style="font-size: 22px; font-weight: 700; color: #fff; letter-spacing: -0.5px;">📊 FC Analytics</div>
            <div style="font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 4px;">Business Dashboard for Meesho Sellers</div>
          </div>
          <div style="padding: 32px;">
            <h2 style="margin: 0 0 8px; font-size: 20px; color: #111827;">Verify your identity</h2>
            <p style="margin: 0 0 24px; color: #6B7280; font-size: 14px; line-height: 1.6;">
              Use this one-time password to log into your FC Analytics account.
            </p>
            <div style="background: #F9FAFB; border: 1.5px dashed #D1D5DB; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <div style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #8B1874; font-family: monospace;">${otp}</div>
              <div style="font-size: 12px; color: #9CA3AF; margin-top: 8px;">Valid for ${OTP_TTL_MINUTES} minutes</div>
            </div>
            <p style="margin: 0; font-size: 12px; color: #9CA3AF; line-height: 1.6;">
              If you didn't request this code, you can safely ignore this email.<br>
              Never share this OTP with anyone.
            </p>
          </div>
          <div style="background: #F9FAFB; padding: 16px 32px; border-top: 1px solid #E5E7EB;">
            <div style="font-size: 11px; color: #9CA3AF;">FC Analytics · Gurukrupa Enterprise · Sent from houseofgurukrupa97@gmail.com</div>
          </div>
        </div>
      `,
      text: `Your FC Analytics OTP is: ${otp}\n\nValid for ${OTP_TTL_MINUTES} minutes. Never share this code with anyone.`
    });

    console.log(`[Email OTP] Sent to ${email} successfully`);
    return { success: true, provider: 'gmail' };

  } catch (err) {
    console.error('[Email OTP] Failed:', err.message);
    // Fallback mock
    _mockLog('Email', email, otp);
    return { success: true, provider: 'mock-email-fallback' };
  }
}

/**
 * Unified OTP sender — tries WhatsApp first, then Email, logs if both mocked.
 * @param {{ mobile?: string, email?: string }} contact
 * @param {string} otp
 */
export async function sendOtp(contact, otp) {
  if (contact.mobile) {
    return sendOtpViaWhatsApp(contact.mobile, otp);
  }
  if (contact.email) {
    return sendOtpViaEmail(contact.email, otp);
  }
  throw new Error('No contact method (mobile or email) provided for OTP delivery.');
}

function _mockLog(channel, destination, otp) {
  console.log('\n' + '═'.repeat(54));
  console.log(`  🔑 [OTP MOCK — ${channel}]`);
  console.log(`  📬 To:   ${destination}`);
  console.log(`  🔢 Code: ${otp}`);
  console.log(`  ⏰ TTL:  ${OTP_TTL_MINUTES} minutes`);
  console.log('═'.repeat(54) + '\n');
}

// ────────────────────────────────────────────────
//  JWT TOKEN MANAGEMENT
// ────────────────────────────────────────────────

export function generateJwt(userId, identifier) {
  return jwt.sign(
    { userId, identifier, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

export function verifyJwt(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// ────────────────────────────────────────────────
//  AUTH MIDDLEWARE
// ────────────────────────────────────────────────

export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: false, error: 'Authentication required. Please log in.' }));
  }

  const payload = verifyJwt(token);
  if (!payload) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: false, error: 'Session expired. Please log in again.' }));
  }

  req.userId = payload.userId;
  req.userIdentifier = payload.identifier; // mobile or email
  next();
}

// ────────────────────────────────────────────────
//  INPUT NORMALIZATION
// ────────────────────────────────────────────────

/**
 * Normalize Indian mobile number to +91XXXXXXXXXX format
 * @returns {string|null}
 */
export function normalizeMobile(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith('091')) return `+${digits.slice(1)}`;
  return null;
}

/**
 * Validate email address format
 * @returns {string|null} lowercase normalized email or null
 */
export function normalizeEmail(raw) {
  if (!raw) return null;
  const email = String(raw).trim().toLowerCase();
  // Basic RFC 5322 check
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return email;
  return null;
}

/**
 * Parse input as either mobile or email.
 * @param {string} input
 * @returns {{ mobile?: string, email?: string, type: 'mobile'|'email' }|null}
 */
export function parseLoginInput(input) {
  if (!input) return null;
  const trimmed = String(input).trim();

  // If contains @, treat as email
  if (trimmed.includes('@')) {
    const email = normalizeEmail(trimmed);
    return email ? { email, type: 'email' } : null;
  }

  // Otherwise try mobile
  const mobile = normalizeMobile(trimmed);
  return mobile ? { mobile, type: 'mobile' } : null;
}

// ────────────────────────────────────────────────
//  RATE LIMITING (in-memory — use Redis for 10K+ users)
// ────────────────────────────────────────────────

const otpRateLimitMap = new Map();

export function checkOtpRateLimit(key) {
  const now = Date.now();
  const entry = otpRateLimitMap.get(key);
  const WINDOW_MS = 60 * 60 * 1000; // 1 hour
  const MAX_OTP_PER_HOUR = 5;

  if (!entry || now > entry.resetAt) {
    otpRateLimitMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_OTP_PER_HOUR - 1 };
  }

  if (entry.count >= MAX_OTP_PER_HOUR) {
    const minutesLeft = Math.ceil((entry.resetAt - now) / 60000);
    return { allowed: false, minutesLeft };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_OTP_PER_HOUR - entry.count };
}

export { OTP_TTL_MINUTES, OTP_MAX_ATTEMPTS };
