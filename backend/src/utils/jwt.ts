import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'edunexus_access_token_secret_key_2026_change_me';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'edunexus_refresh_token_secret_key_2026_change_me';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  schoolId: string | null;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
};
