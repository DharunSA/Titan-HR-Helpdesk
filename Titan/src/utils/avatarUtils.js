import { API_BASE_URL } from '../config';

const SERVER_BASE_URL = API_BASE_URL;

const buildInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  return initials || 'U';
};

const createPlaceholderAvatar = (name) => {
  const initials = buildInitials(name);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#155e75" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="64" fill="url(#bg)" />
      <text x="64" y="74" font-family="Arial, sans-serif" font-size="44" font-weight="700" text-anchor="middle" fill="#ffffff">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const getAvatarSrc = (avatar, name) => {
  if (!avatar) {
    return createPlaceholderAvatar(name);
  }

  if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:')) {
    return avatar;
  }

  if (avatar.startsWith('/')) {
    return `${SERVER_BASE_URL}${avatar}`;
  }

  return `${SERVER_BASE_URL}/${avatar.replace(/^\/+/, '')}`;
};
