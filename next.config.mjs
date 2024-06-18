import withTwin from './withTwin.mjs'

/**
 * @type {import('next').NextConfig}
 */
export default withTwin({
  output: 'export',
  reactStrictMode: true,
  // ...
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // https://github.com/ref-finance/ref-sdk/issues/10
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^fs$/, '../package.json'),
      ) // resolve to any file, relative to the node_module directory
    }

    return config
  },
})
