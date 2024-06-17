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
})
