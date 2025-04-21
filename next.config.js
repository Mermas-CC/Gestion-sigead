/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurar opciones para las rutas API
  experimental: {
    // Asegurar que las rutas API no se generen estáticamente
    serverComponentsExternalPackages: ['jsonwebtoken', '@supabase/supabase-js'],
  },
  // Configurar el runtime para Node.js
  serverRuntimeConfig: {
    // Runtime config for Node.js
    PROJECT_ROOT: __dirname,
  },
  // Configuración para manejar correctamente las rutas API durante el build
  async headers() {
    return [
      {
        // Aplicar a todas las rutas API
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Asegurarse de que las rutas API se manejen como dinámicas
        {
          source: '/api/:path*',
          has: [
            {
              type: 'header',
              key: 'x-middleware-skip',
              value: 'true',
            },
          ],
          destination: '/api/:path*',
        },
      ],
    };
  },
  // Controlar la generación estática
  output: 'standalone',
  poweredByHeader: false,
};

module.exports = nextConfig;

