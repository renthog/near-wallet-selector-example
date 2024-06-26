'use client'
import tw from 'twin.macro'

const spinnerSizes = {
  xxs: tw`h-4 w-4 border`,
  xs: tw`h-8 w-8 border-2`,
  sm: tw`h-12 w-12 border-2`,
  default: tw`h-16 w-16 border-4`,
  huge: tw`h-24 w-24 border-4`,
}

const Spinner: React.FC<{
  size?: keyof typeof spinnerSizes
}> = ({ size, ...props }) => {
  return (
    <div
      css={size ? spinnerSizes[size] : spinnerSizes.default}
      tw="rounded-full animate-spin border-black/10 border-t-black dark:(border-white/10 border-t-white)"
      {...props}
    />
  )
}

const Loading = {
  Spinner,
  Pulse: tw.div`animate-pulse bg-neutral-200 dark:bg-neutral-600`,
}

export default Loading
