import { ImageResponse } from 'next/og';

export const size = { width: 256, height: 256 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background:
            'radial-gradient(70% 60% at 50% 35%, #f0e5cc 0%, #e2d3b8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 200,
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
