/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 90],
    // Cho phép ?v=mtime trên ảnh local, để chép đè file trùng tên không bị kẹt bản tối ưu cũ
    localPatterns: [{ pathname: '/gallery/**' }, { pathname: '/qrcode/**' }],
    // Bộ nhớ đệm ảnh chỉ dựa vào đường dẫn: khi dev, chép đè ảnh trùng tên sẽ hiện ảnh mới sau tối đa 60 giây
    ...(process.env.NODE_ENV === 'development' && { minimumCacheTTL: 60 }),
  },
  // Trang cũ gộp vào /quan-ly
  async redirects() {
    return [
      { source: '/quan-ly-loi-chuc', destination: '/quan-ly?tab=loi-chuc', permanent: false },
      { source: '/tao-link', destination: '/quan-ly?tab=khach-moi', permanent: false },
    ]
  },
}

export default nextConfig
