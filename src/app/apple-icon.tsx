import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#f7f3e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 140,
          fontFamily: 'Georgia, serif',
          fontWeight: 400,
          color: '#a75c4c',
        }}
      >
        Q
      </div>
    ),
    { ...size },
  );
}
