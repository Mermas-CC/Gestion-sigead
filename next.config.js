/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurar webpack para manejar paquetes externos
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Marcar jsonwebtoken y supabase como externos para el servidor
      config.externals = [...(config.externals || []), 'jsonwebtoken', '@supabase/supabase-js'];
    }
    return config;
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
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;

